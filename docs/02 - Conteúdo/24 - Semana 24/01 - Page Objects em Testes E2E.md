---
draft: false
slug: /conteudo/page-objects-testes-e2e
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - tech-playwright
  - conceito-page-objects
  - material-aula-pratica
---

# Page Objects em Testes E2E

## O que vimos até agora

Na [aula de testes E2E](/conteudo/testes-e2e-mstest-playwright), usamos MSTest e Playwright para abrir a aplicação no navegador, preencher formulários e verificar resultados.

Um teste de registro, por exemplo, acessa `/Autenticacao/Registrar`, preenche os dados e clica em **Criar Conta**.

Quando temos poucos testes, escrever essas ações diretamente no método de teste parece simples. Mas o que acontece quando vários cenários usam a mesma tela?

Nesta aula, vamos organizar as interações com a interface usando **Page Objects**.

---

## O problema de repetir as ações da tela

Considere este trecho de um teste de registro:

```csharp
await Page.GotoAsync($"{UrlBase}/Autenticacao/Registrar");
await Page.GetByLabel("E-mail").FillAsync(email);
await Page.GetByLabel("Senha", new() { Exact = true }).FillAsync(senha);
await Page.GetByLabel("Confirmar Senha").FillAsync(senha);
await Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta", Exact = true }
).ClickAsync();
```

Esses comandos descrevem **como** usar a tela. O objetivo do teste, porém, é verificar **o que acontece** depois do registro.

Se vários testes repetirem os mesmos comandos, uma alteração no nome do botão exigirá mudanças em todos eles.

Precisamos de um lugar para reunir o conhecimento sobre essa tela.

---

## O que é um Page Object?

Um **Page Object** é uma classe que representa uma página ou parte da interface utilizada pelos testes.

Ela reúne:

- os elementos que o teste precisa localizar, chamados de *locators*;
- as ações que o usuário pode realizar naquela tela;
- a rota usada para abrir a tela, quando necessário.

> O Page Object descreve como interagir com a interface. O teste descreve o cenário e verifica o resultado esperado.

No projeto de referência, a classe `RegistrarPage` representa a tela de criação de conta.

O teste passa para ela a `Page` fornecida pelo `PageTest` e a URL da aplicação iniciada para aquele teste:

```csharp
RegistrarPage registrarPage = new(Page, UrlBase);
```

`IPage` representa a aba do navegador. `ILocator` representa uma forma de localizar um elemento nessa aba.

---

## Criando o Page Object da tela de registro

No projeto de testes E2E, podemos colocar o Page Object ao lado dos testes do mesmo módulo:

```text
tests/GeradorDeProvas.Testes.E2E/
  Compartilhado/
    E2ETestsBase.cs
    TestApplicationFactory.cs
  Modulos/
    ModuloAutenticacao/
      AutenticacaoE2ETests.cs
      RegistrarPage.cs
      EntrarPage.cs
```

Começamos guardando os elementos do formulário em propriedades:

```csharp
using Microsoft.Playwright;

namespace GeradorDeProvas.Testes.E2E.Modulos.ModuloAutenticacao;

public sealed class RegistrarPage(IPage page, string urlBase)
{
    public string Url => $"{urlBase}/Autenticacao/Registrar";

    public ILocator Email => page.GetByLabel("E-mail");
    public ILocator Senha => page.GetByLabel("Senha", new() { Exact = true });
    public ILocator ConfirmarSenha => page.GetByLabel("Confirmar Senha");
}
```

O `Exact = true` diferencia o campo **Senha** de **Confirmar Senha**.

Os locators usam os nomes exibidos na tela. Assim, os testes não precisam conhecer a estrutura interna do HTML para encontrar os campos.

Agora acrescentamos as ações que o usuário realiza. A classe completa fica assim:

```csharp
using Microsoft.Playwright;

namespace GeradorDeProvas.Testes.E2E.Modulos.ModuloAutenticacao;

public sealed class RegistrarPage(IPage page, string urlBase)
{
    public string Url => $"{urlBase}/Autenticacao/Registrar";

    public ILocator Email => page.GetByLabel("E-mail");
    public ILocator Senha => page.GetByLabel("Senha", new() { Exact = true });
    public ILocator ConfirmarSenha => page.GetByLabel("Confirmar Senha");

    public async Task IrParaAsync()
    {
        await page.GotoAsync(Url);
    }

    public async Task PreencherAsync(string email, string senha)
    {
        await Email.FillAsync(email);
        await Senha.FillAsync(senha);
        await ConfirmarSenha.FillAsync(senha);
    }

    public async Task ConfirmarAsync()
    {
        await page.GetByRole(
            AriaRole.Button,
            new() { Name = "Criar Conta", Exact = true }
        ).ClickAsync();
    }
}
```

Observe a sequência:

1. `IrParaAsync` abre a tela;
2. `PreencherAsync` informa os dados do formulário;
3. `ConfirmarAsync` envia o cadastro.

Como as operações do navegador são assíncronas, esses métodos retornam `Task` e usam `await`.

---

## Utilizando o Page Object no teste

Na branch `v7` do Gerador de Provas, `AutenticacaoE2ETests` herda de `E2ETestsBase`. Essa classe base herda de `PageTest`, prepara uma `TestApplicationFactory`, fornece `Page` e `UrlBase` e encerra a aplicação após cada teste.

Com essa preparação, o cenário de registro fica concentrado no comportamento que queremos verificar:

```csharp
using GeradorDeProvas.Testes.E2E.Compartilhado;

namespace GeradorDeProvas.Testes.E2E.Modulos.ModuloAutenticacao;

[TestClass]
public sealed class AutenticacaoE2ETests : E2ETestsBase
{
    [TestMethod]
    public async Task Deve_RegistrarEAutenticar_Usuario()
    {
        // Arrange
        const string email = "novo.usuario@teste.local";
        const string senha = "Senha123!";

        RegistrarPage registrarPage = new(Page, UrlBase);

        await registrarPage.IrParaAsync();

        // Act
        await registrarPage.PreencherAsync(email, senha);
        await registrarPage.ConfirmarAsync();

        // Assert
        await Expect(Page).ToHaveURLAsync($"{UrlBase}/");
    }
}
```

O teste ainda percorre a aplicação pelo navegador. Apenas movemos os detalhes de interação para `RegistrarPage`.

`Expect(Page).ToHaveURLAsync(...)` permanece no teste: é o cenário que define qual resultado deve ser observado.

> **Atenção:** criar um Page Object não substitui a `TestApplicationFactory`, o `PageTest` nem o isolamento dos dados entre testes.

---

## Reutilizando Page Objects em outros fluxos

A tela de login possui outro Page Object: `EntrarPage`.

Depois de criar um usuário no ambiente de teste, um cenário pode utilizar as ações dessa classe:

```csharp
EntrarPage entrarPage = new(Page, UrlBase);

await entrarPage.IrParaAsync();
await entrarPage.PreencherAsync(email, senha);
await entrarPage.ConfirmarAsync();

await Expect(entrarPage.UsuarioAutenticado(email)).ToBeVisibleAsync();
```

O locator `UsuarioAutenticado(email)` descreve o elemento exibido para o usuário após o login. O `Expect` continua no teste.

No módulo de disciplinas da branch `v7`, há uma organização semelhante:

- `DisciplinaListarPage` reúne elementos e ações da listagem;
- `DisciplinaFormPage` reúne as ações do formulário de cadastro e edição;
- `DisciplinaExcluirPage` representa a confirmação da exclusão.

Por exemplo, o teste de cadastro usa o formulário para agir e a listagem para conferir o resultado:

```csharp
DisciplinaFormPage formPage = new(Page, UrlBase);
DisciplinaListarPage listarPage = new(Page, UrlBase);

await formPage.IrParaCadastroAsync();
await formPage.PreencherNomeAsync("Matemática");
await formPage.ConfirmarAsync();

await Expect(Page).ToHaveURLAsync(listarPage.Url);
await Expect(listarPage.NomeDaDisciplina("Matemática")).ToBeVisibleAsync();
```

Assim, cada classe conhece apenas as interações da tela que representa. O teste continua ligando as etapas do fluxo.

---

## Quando usar Page Objects

Page Objects ajudam quando uma tela aparece em vários cenários ou quando seus elementos exigem locators mais específicos.

Eles permitem:

- reutilizar ações como preencher e confirmar um formulário;
- atualizar um locator em um só lugar quando a interface mudar;
- ler o teste como uma sequência de ações do usuário.

Não é necessário criar uma classe para cada pequeno elemento da página. Comece pelas telas e ações que os testes realmente utilizam.

Também evite esconder todas as verificações dentro dos Page Objects. Quando a expectativa fica no teste, é mais fácil identificar o comportamento que falhou.

---

## Exercício: ampliando os testes de login

Use `EntrarPage` para criar um cenário de login com credenciais inválidas.

1. Leia `EntrarPage.cs` e a View de login para identificar os campos e a mensagem exibida após uma tentativa inválida.
2. Crie um teste em `AutenticacaoE2ETests` usando `E2ETestsBase`.
3. Abra a tela com `IrParaAsync`, preencha os dados e clique em **Entrar**.
4. Verifique no teste que o usuário não foi autenticado e que a mensagem esperada apareceu.
5. Execute o projeto de testes E2E com `dotnet test`.

Se precisar de um novo locator para a mensagem, adicione-o a `EntrarPage`. Mantenha a asserção no método de teste.

---

## Conclusão

Page Objects organizam o código que interage com a interface nos testes E2E.

Nesta aula, retiramos do teste os locators e as ações do formulário de registro. O teste ficou responsável pelo cenário e pela verificação do redirecionamento.

Essa divisão facilita a leitura e a manutenção conforme novos fluxos são adicionados.

Referências:

- [Testes E2E com MSTest e Playwright](/conteudo/testes-e2e-mstest-playwright);
- [Projeto Gerador de Provas na branch `v7`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v7);
- [`RegistrarPage` na branch `v7`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/blob/v7/tests/GeradorDeProvas.Testes.E2E/Modulos/ModuloAutenticacao/RegistrarPage.cs);
- [`AutenticacaoE2ETests` na branch `v7`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/blob/v7/tests/GeradorDeProvas.Testes.E2E/Modulos/ModuloAutenticacao/AutenticacaoE2ETests.cs);
- [Page Object Models no Playwright para .NET](https://playwright.dev/dotnet/docs/pom).
