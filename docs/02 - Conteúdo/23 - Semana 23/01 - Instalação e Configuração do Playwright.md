---
draft: false
slug: /conteudo/instalacao-configuracao-playwright
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - tech-playwright
  - material-aula-pratica
---

# Instalação e Configuração do Playwright

## O objetivo desta configuração

Na aula anterior, os testes foram executados diretamente sobre:

- entidades;
- Services;
- repositórios.

Agora vamos preparar um projeto para controlar um navegador e acessar a aplicação web.

Ao final desta configuração, o projeto deverá conseguir:

- iniciar a aplicação ASP.NET Core durante o teste;
- usar um banco InMemory separado do banco de desenvolvimento;
- instalar e iniciar o Chromium;
- executar testes MSTest em modo headless;
- fornecer uma página do navegador para os testes.

O documento seguinte utiliza essa configuração para explicar os conceitos e implementar os testes E2E:

[Testes E2E com MSTest e Playwright](/conteudo/testes-e2e-mstest-playwright)

> Esta aula prepara o ambiente. O foco em fluxos, locators e asserções está no próximo documento.

---

## Pré-requisitos

Antes de iniciar, verifique se o ambiente possui:

- .NET SDK utilizado pela solução;
- um terminal;
- PowerShell (`pwsh`) para executar o script do Playwright;
- o código da aplicação web;
- dependências restauradas com `dotnet restore`.

Na branch `v6` do projeto de referência, a aplicação utiliza .NET 10.

Confirme a versão instalada com:

```bash
dotnet --version
```

O Playwright controla navegadores instalados por ele próprio.

Por isso, ter um navegador aberto no computador não substitui a instalação feita pelo Playwright.

---

## Criando o projeto de testes E2E

Os testes E2E devem ficar em um projeto separado dos testes unitários e de integração.

Uma organização possível é:

```text
GeradorDeProvas.slnx
src/
  GeradorDeProvas.Dominio/
  GeradorDeProvas.Aplicacao/
  GeradorDeProvas.Infra/
  GeradorDeProvas.WebApp/
tests/
  GeradorDeProvas.Testes.Unidade/
  GeradorDeProvas.Testes.Integracao/
  GeradorDeProvas.Testes.E2E/
```

A partir da pasta raiz da solução, crie o projeto:

```bash
dotnet new mstest \
  -n GeradorDeProvas.Testes.E2E \
  -o tests/GeradorDeProvas.Testes.E2E
```

Depois, adicione a referência para o projeto web:

```bash
dotnet add \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  reference \
  src/GeradorDeProvas.WebApp/GeradorDeProvas.WebApp.csproj
```

Essa referência será usada para criar uma `WebApplicationFactory<Program>`.

Ela permite iniciar a aplicação dentro do processo de teste.

---

## Adicionando os pacotes

O projeto E2E precisa de pacotes para três responsabilidades:

- iniciar a aplicação;
- substituir o banco durante o teste;
- integrar o Playwright ao MSTest.

Execute:

```bash
dotnet add \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  package Microsoft.AspNetCore.Mvc.Testing

dotnet add \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  package Microsoft.EntityFrameworkCore.InMemory

dotnet add \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  package Microsoft.Playwright.MSTest.v4
```

Na branch `v6`, o arquivo `.csproj` possui uma configuração semelhante a esta:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.9" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.9" />
    <PackageReference Include="Microsoft.Playwright.MSTest.v4" Version="1.61.0" />
    <PackageReference Include="MSTest" Version="4.0.1" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../../src/GeradorDeProvas.WebApp/GeradorDeProvas.WebApp.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Microsoft.VisualStudio.TestTools.UnitTesting" />
  </ItemGroup>
</Project>
```

As versões dos pacotes podem mudar.

Use as versões compatíveis com o SDK e com os demais projetos da solução.

As responsabilidades são:

- `Microsoft.AspNetCore.Mvc.Testing`: inicia a aplicação para o teste;
- `Microsoft.EntityFrameworkCore.InMemory`: fornece um banco em memória;
- `Microsoft.Playwright.MSTest.v4`: fornece `PageTest` e a integração com MSTest;
- `MSTest`: fornece o framework de testes.

---

## Preparando a aplicação para o teste

O navegador precisa acessar uma URL real.

Também não queremos iniciar manualmente a aplicação em uma porta fixa antes de cada execução.

Para resolver isso, criamos uma fábrica compartilhada:

```text
tests/GeradorDeProvas.Testes.E2E/
  Compartilhado/
    TestApplicationFactory.cs
```

A classe herda de `WebApplicationFactory<Program>`:

```csharp
using GeradorDeProvas.Infra.Compartilhado.Orm;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GeradorDeProvas.Testes.E2E.Compartilhado;

public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string nomeBanco;

    public string UrlBase { get; }

    public TestApplicationFactory()
    {
        nomeBanco = $"e2e-{Guid.NewGuid():N}";

        UseKestrel(0);
        StartServer();

        UrlBase = ObterUrlKestrel();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<GeradorDeProvasDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<GeradorDeProvasDbContext>>();

            services.AddDbContext<GeradorDeProvasDbContext>(options =>
            {
                options.UseInMemoryDatabase(nomeBanco);
            });
        });
    }

    private string ObterUrlKestrel()
    {
        IServer servidor = Services.GetRequiredService<IServer>();

        IServerAddressesFeature? enderecos = servidor.Features
            .Get<IServerAddressesFeature>();

        if (enderecos is null)
            throw new InvalidOperationException(
                "Não foi possível obter a URL do servidor"
            );

        return enderecos.Addresses.Single();
    }
}
```

### Usando Kestrel em uma porta aleatória

O método `UseKestrel(0)` configura o servidor para utilizar uma porta disponível:

```csharp
UseKestrel(0);
StartServer();
```

O valor `0` não representa uma porta específica.

Ele informa ao sistema operacional que uma porta livre deve ser escolhida.

Depois que o servidor inicia, `ObterUrlKestrel` consulta os endereços registrados:

```csharp
IServer servidor = Services.GetRequiredService<IServer>();

IServerAddressesFeature? enderecos = servidor.Features
    .Get<IServerAddressesFeature>();

return enderecos.Addresses.Single();
```

O resultado fica disponível em `UrlBase`.

Os testes poderão navegar usando:

```csharp
await Page.GotoAsync($"{UrlBase}/");
```

### Configurando o ambiente `Testing`

A fábrica seleciona um ambiente próprio para os testes:

```csharp
builder.UseEnvironment("Testing");
```

Assim, o ASP.NET Core pode carregar configurações de:

```text
src/GeradorDeProvas.WebApp/appsettings.Testing.json
```

Esse arquivo pode conter níveis de log ou outras opções específicas do ambiente de testes.

As configurações de teste não devem depender de segredos ou recursos de Produção.

---

## Substituindo o banco por InMemory

Um teste E2E pode criar dados pela própria interface.

Por isso, a aplicação precisa de um banco durante a execução.

Não devemos usar o banco de desenvolvimento ou um banco compartilhado pela equipe.

A fábrica remove a configuração original do `DbContext`:

```csharp
services.RemoveAll<DbContextOptions<GeradorDeProvasDbContext>>();
services.RemoveAll<IDbContextOptionsConfiguration<GeradorDeProvasDbContext>>();
```

Depois, registra o banco em memória:

```csharp
services.AddDbContext<GeradorDeProvasDbContext>(options =>
{
    options.UseInMemoryDatabase(nomeBanco);
});
```

O nome é criado com um `Guid`:

```csharp
nomeBanco = $"e2e-{Guid.NewGuid():N}";
```

Assim, cada instância da fábrica utiliza um banco separado.

O fluxo fica:

```text
Teste E2E
  -> TestApplicationFactory
    -> aplicação ASP.NET Core
      -> DbContext
        -> banco InMemory exclusivo
```

> O banco InMemory é útil para isolamento e velocidade. Ele não substitui testes com o banco relacional real quando o objetivo é verificar SQL, migrations ou constraints.

---

## Instalando os navegadores

O pacote do Playwright fornece o código de automação.

Os navegadores precisam ser instalados separadamente.

Primeiro, compile o projeto para gerar o script do Playwright:

```bash
dotnet build tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj
```

Depois, instale o Chromium:

```bash
pwsh tests/GeradorDeProvas.Testes.E2E/bin/Debug/net10.0/playwright.ps1 install chromium
```

Em um ambiente Linux que precise das dependências do sistema, use:

```bash
pwsh tests/GeradorDeProvas.Testes.E2E/bin/Debug/net10.0/playwright.ps1 install --with-deps chromium
```

O projeto pode utilizar outros navegadores:

```bash
pwsh tests/GeradorDeProvas.Testes.E2E/bin/Debug/net10.0/playwright.ps1 install firefox
pwsh tests/GeradorDeProvas.Testes.E2E/bin/Debug/net10.0/playwright.ps1 install webkit
```

Para a aula, o Chromium é suficiente.

Se o script não existir, execute novamente o `dotnet build` e confira o caminho correspondente ao `TargetFramework` do projeto.

---

## Configurando o navegador com `runsettings`

Crie o arquivo:

```text
tests/GeradorDeProvas.Testes.E2E/playwright.runsettings
```

Use a seguinte configuração:

```xml
<?xml version="1.0" encoding="utf-8"?>
<RunSettings>
  <Playwright>
    <BrowserName>chromium</BrowserName>
    <LaunchOptions>
      <Headless>true</Headless>
    </LaunchOptions>
  </Playwright>
</RunSettings>
```

Essa configuração informa que:

- o navegador será o Chromium;
- o navegador será iniciado sem uma janela visível.

O modo sem interface gráfica é chamado de **headless**.

Ele é adequado para servidores de integração contínua.

Durante uma investigação local, podemos alterar temporariamente:

```xml
<Headless>false</Headless>
```

Assim, será possível observar o navegador enquanto o teste é executado.

Depois da investigação, retorne para `true`.

---

## Configurando o paralelismo do MSTest

O arquivo `MSTestSettings.cs` pode configurar a execução paralela:

```csharp
[assembly: Parallelize(Workers = 4, Scope = ExecutionScope.MethodLevel)]
```

Isso permite executar métodos de teste em paralelo, utilizando até quatro workers.

O paralelismo exige que os testes não compartilhem estado mutável.

A fábrica ajuda nesse isolamento porque cada instância cria um banco InMemory com nome diferente.

Mesmo assim, os testes devem evitar:

- campos estáticos mutáveis;
- dependência da ordem de execução;
- usuários compartilhados sem necessidade;
- dados persistidos fora do banco de teste.

Se um teste precisar depender de outro, verifique se ele deveria ser E2E ou se o cenário pode ser isolado.

---

## Executando o projeto configurado

Depois de instalar o navegador, execute o projeto com o arquivo de configurações:

```bash
dotnet test \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  --settings tests/GeradorDeProvas.Testes.E2E/playwright.runsettings
```

Também podemos executar todos os testes da solução:

```bash
dotnet test \
  --settings tests/GeradorDeProvas.Testes.E2E/playwright.runsettings
```

Para filtrar uma classe específica:

```bash
dotnet test \
  tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj \
  --settings tests/GeradorDeProvas.Testes.E2E/playwright.runsettings \
  --filter "FullyQualifiedName~AutenticacaoE2ETests"
```

Uma execução bem-sucedida pode apresentar:

```text
Passed!  - Failed: 0, Passed: 2, Skipped: 0, Total: 2
```

O número de testes depende do estado atual do projeto.

---

## Problemas comuns na configuração

### `pwsh` não foi encontrado

O script de instalação precisa do PowerShell.

Instale o PowerShell na sua plataforma ou execute o comando usando a ferramenta equivalente disponível no ambiente.

### O navegador não foi encontrado

Compile o projeto e execute novamente o script:

```bash
dotnet build tests/GeradorDeProvas.Testes.E2E/GeradorDeProvas.Testes.E2E.csproj
pwsh tests/GeradorDeProvas.Testes.E2E/bin/Debug/net10.0/playwright.ps1 install chromium
```

### O servidor não inicia

Verifique:

- se a aplicação web compila sozinha;
- se a referência para `GeradorDeProvas.WebApp` está correta;
- se `Program` está acessível ao projeto de testes;
- se a configuração do ambiente `Testing` é válida;
- se o `DbContext` foi registrado com o tipo correto.

### A porta fixa está ocupada

Não altere o teste para depender de uma porta fixa.

Confira se a fábrica utiliza:

```csharp
UseKestrel(0);
```

Assim, a porta será escolhida automaticamente.

### O teste altera dados de desenvolvimento

Confira se a fábrica remove o registro original do `DbContext` e utiliza:

```csharp
options.UseInMemoryDatabase(nomeBanco);
```

O projeto E2E não deve apontar para o banco usado pela aplicação em desenvolvimento.

---

## Checklist de configuração

Antes de implementar o primeiro fluxo E2E, confirme:

- o projeto `GeradorDeProvas.Testes.E2E` existe;
- o projeto referencia `GeradorDeProvas.WebApp`;
- os pacotes necessários foram adicionados;
- o `TestApplicationFactory` utiliza Kestrel;
- a porta é escolhida com `UseKestrel(0)`;
- o ambiente `Testing` é configurado;
- o banco InMemory recebe um nome exclusivo;
- o projeto foi compilado;
- o Chromium foi instalado;
- o arquivo `playwright.runsettings` existe;
- a execução headless está configurada;
- `dotnet test` consegue descobrir o projeto.

Quando esses itens estiverem funcionando, o ambiente estará pronto para os testes.

---

## Conclusão

Para utilizar Playwright com MSTest em uma aplicação ASP.NET Core, configuramos:

- um projeto E2E separado;
- a referência para a aplicação web;
- `Microsoft.Playwright.MSTest.v4`;
- `WebApplicationFactory<Program>`;
- Kestrel em uma porta aleatória;
- um ambiente `Testing`;
- Entity Framework InMemory;
- a instalação do Chromium;
- o arquivo `playwright.runsettings`;
- a execução headless.

Com essa base, o próximo documento pode se concentrar nos testes:

- [Testes E2E com MSTest e Playwright](/conteudo/testes-e2e-mstest-playwright).

Referências utilizadas:

- [Projeto Gerador de Provas na branch `v6`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v6);
- [Projeto de testes E2E na branch `v6`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v6/tests/GeradorDeProvas.Testes.E2E);
- [Documentação do Playwright para .NET](https://playwright.dev/dotnet/docs/intro);
- [Documentação do MSTest](https://learn.microsoft.com/dotnet/core/testing/unit-testing-csharp-with-mstest).
