---
draft: false
slug: /conteudo/containerizacao-docker-inicio-delivery-app
tags:
  - trilha-devops
  - trilha-banco-dados
  - tech-dotnet
  - tech-docker
  - tech-entity-framework-core
  - conceito-containerizacao
  - conceito-banco-de-dados
  - projeto-delivery-app
  - material-aula-pratica
---

# Containerização com Docker e Início do Delivery App

## Preparando a infraestrutura do projeto

Nas últimas aulas, trabalhamos com Web APIs, Entity Framework Core, Identity e autenticação JWT.

Agora vamos iniciar um novo projeto: o **Delivery App**.

Uma aplicação de delivery precisa armazenar informações como:

- clientes;
- estabelecimentos;
- produtos;
- pedidos;
- usuários e credenciais.

O banco de dados será o PostgreSQL.

Surge então uma pergunta prática:

> como cada estudante pode executar o mesmo banco de dados sem instalar e configurar o PostgreSQL manualmente no sistema operacional?

Uma solução é utilizar o Docker para executar o banco em um container.

Nesta aula, vamos:

- entender o que são imagem, container, volume e porta;
- criar um PostgreSQL com Docker;
- conectar o banco à aplicação .NET;
- conhecer a estrutura inicial do Delivery App;
- executar as migrations já existentes;
- confirmar que a solução está pronta para receber os próximos módulos.

---

## O problema de depender de uma instalação local

Sem containerização, cada pessoa poderia instalar o PostgreSQL de uma forma diferente.

Isso pode gerar diferenças em:

- versão do PostgreSQL;
- usuário e senha do banco;
- porta utilizada;
- localização dos arquivos de dados;
- configurações de autenticação;
- ferramentas instaladas na máquina.

Um estudante poderia conseguir executar a aplicação enquanto outro receberia um erro de conexão.

Também seria necessário explicar como remover o banco, recriá-lo e limpar os dados quando surgisse algum problema.

O Docker ajuda a descrever essa infraestrutura por meio de arquivos e comandos.

> A aplicação continua sendo executada pelo .NET. Nesta etapa, somente o serviço externo do banco será executado em um container.

---

## O que é o Docker?

Docker é uma plataforma para executar processos isolados em ambientes chamados **containers**.

Um container compartilha o kernel do sistema operacional, mas possui seu próprio ambiente de execução, arquivos e rede.

Para o nosso exemplo, não precisamos instalar o PostgreSQL diretamente no sistema.

Vamos iniciar um container baseado em uma imagem do PostgreSQL.

### Imagem

Uma imagem é um pacote pronto para criar containers.

Ela contém os arquivos e as instruções necessárias para executar um software.

A imagem `postgres` contém o PostgreSQL configurado para iniciar como um serviço de banco de dados.

Podemos escolher uma versão explícita:

```text
postgres:17
```

O trecho antes dos dois-pontos é o nome da imagem.

O trecho depois dos dois-pontos é a tag da versão.

Usar uma tag explícita é melhor do que depender sempre da tag `latest`, pois a atualização automática da imagem pode mudar o comportamento do ambiente.

### Container

O container é uma instância em execução de uma imagem.

Uma mesma imagem pode criar vários containers, cada um com suas próprias configurações.

No nosso caso, o container será o processo do PostgreSQL executado localmente.

### Volume

O container pode ser removido e recriado.

Se os dados estiverem apenas dentro da camada temporária do container, eles serão perdidos quando essa camada for removida.

Um **volume** é um armazenamento gerenciado pelo Docker que pode ser conectado ao container.

O PostgreSQL armazena seus dados em:

```text
/var/lib/postgresql/data
```

Ao conectar um volume nesse caminho, o banco continua com os mesmos dados mesmo que o container seja recriado.

### Porta

O PostgreSQL escuta a porta `5432` dentro do container.

Para a aplicação executada diretamente pelo computador conseguir acessá-lo, precisamos publicar essa porta.

```text
5432:5432
```

O número da esquerda é a porta do computador.

O número da direita é a porta dentro do container.

---

## Criando o container do PostgreSQL

O Docker permite criar um container diretamente pelo comando `docker run`.

Para o Delivery App, precisamos configurar:

- a imagem do PostgreSQL;
- o nome do banco;
- o usuário e a senha locais;
- a porta publicada;
- o volume persistente;
- a verificação de saúde do banco.

Execute:

```bash
docker run \
  --name delivery-app-postgres \
  --restart unless-stopped \
  --env POSTGRES_DB=DeliveryAppDb \
  --env POSTGRES_USER=postgres \
  --env POSTGRES_PASSWORD=postgres \
  --publish 5432:5432 \
  --volume delivery-app-postgres-data:/var/lib/postgresql/data \
  --health-cmd="pg_isready -U postgres -d DeliveryAppDb" \
  --health-interval=5s \
  --health-timeout=5s \
  --health-retries=5 \
  --detach \
  postgres:17
```

O parâmetro `--detach` inicia o container em segundo plano.

As variáveis `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` são reconhecidas pela imagem oficial do PostgreSQL durante a inicialização.

Esses valores correspondem à connection string usada no projeto:

```text
Host=localhost;Port=5432;Database=DeliveryAppDb;Username=postgres;Password=postgres
```

O volume `delivery-app-postgres-data` é conectado ao diretório de dados do PostgreSQL:

```text
/var/lib/postgresql/data
```

O `healthcheck` verifica se o PostgreSQL está aceitando conexões:

```bash
docker inspect \
  --format='{{.State.Health.Status}}' \
  delivery-app-postgres
```

Ele não substitui a configuração da aplicação, mas ajuda a observar se o banco está pronto.

> **Atenção:** usuário e senha simples são aceitáveis apenas para este ambiente local de estudo. Em produção, use secrets e valores específicos do ambiente.

---

## Iniciando o PostgreSQL

Antes de iniciar o projeto, confirme que o Docker Desktop ou o Docker Engine está em execução.

Verifique a instalação:

```bash
docker --version
docker version
```

Baixe a imagem explicitamente, caso queira fazer essa etapa antes do `docker run`:

```bash
docker image pull postgres:17
```

Confira o container em execução:

```bash
docker ps
```

O container `delivery-app-postgres` deve aparecer na lista.

Para acompanhar os logs:

```bash
docker logs -f delivery-app-postgres
```

O parâmetro `-f` acompanha novas mensagens.

Para interromper o acompanhamento, pressione `Ctrl+C`. Isso não interrompe necessariamente o container; apenas encerra a exibição dos logs.

Também podemos verificar os logs sem acompanhar continuamente:

```bash
docker logs delivery-app-postgres
```

### Verificando o banco com `psql`

O próprio container possui o cliente `psql`.

Podemos abrir uma sessão dentro do serviço:

```bash
docker exec -it delivery-app-postgres psql -U postgres -d DeliveryAppDb
```

Dentro do `psql`, liste os bancos:

```sql
\l
```

Para sair:

```sql
\q
```

Nesse momento, o banco existe, mas as tabelas da aplicação ainda dependem da execução das migrations.

---

## Configurando a conexão do Delivery App

Na branch [`v0` do Delivery App](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v0), a conexão de desenvolvimento está em `src/Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "PostgresEF": "Host=localhost;Port=5432;Database=DeliveryAppDb;Username=postgres;Password=postgres"
  }
}
```

Essa configuração corresponde aos parâmetros usados na criação do container:

| Connection string | Configuração do container |
|---|---|
| `Host=localhost` | A API roda diretamente no computador |
| `Port=5432` | Porta publicada pelo container |
| `Database=DeliveryAppDb` | `POSTGRES_DB` |
| `Username=postgres` | `POSTGRES_USER` |
| `Password=postgres` | `POSTGRES_PASSWORD` |

A infraestrutura registra o `DeliveryAppDbContext` assim:

```csharp
services.AddDbContext<DeliveryAppDbContext>(options =>
{
    string? connectionString = configuration
        .GetConnectionString("PostgresEF");

    options.UseNpgsql(connectionString, opt =>
    {
        opt.EnableRetryOnFailure(3);
    });
});
```

`UseNpgsql` configura o Entity Framework Core para conversar com o PostgreSQL.

O pacote responsável por essa integração é:

```xml
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" />
```

### Por que o host é `localhost`?

Neste momento, existem dois ambientes diferentes:

```text
computador
  ├── API .NET executada com dotnet run
  └── container PostgreSQL publicado na porta 5432
```

A API está fora do Docker.

Por isso, ela acessa o banco pelo endereço publicado no computador: `localhost`.

Se futuramente a API também for colocada em um container, ela deverá compartilhar uma rede Docker com o banco e utilizar o nome ou alias do container como host.

Enquanto a API continuar sendo executada diretamente no computador, devemos manter `Host=localhost`.

---

## Executando as migrations

Uma migration descreve uma alteração na estrutura do banco.

Na branch `v0`, o projeto já possui a migration inicial:

```text
src/Infraestrutura/Orm/Migrations/
  20260831163441_InitialPostgreSql.cs
  20260831163441_InitialPostgreSql.Designer.cs
  DeliveryAppDbContextModelSnapshot.cs
```

Ela foi criada para o `DeliveryAppDbContext` utilizando o provedor PostgreSQL.

O `Program.cs` da API executa as migrations automaticamente no ambiente de desenvolvimento:

```csharp
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    var dbContext = scope.ServiceProvider
        .GetRequiredService<DeliveryAppDbContext>();

    dbContext.Database.Migrate();
}
```

Essa chamada:

- verifica as migrations já aplicadas;
- identifica migrations pendentes;
- cria ou atualiza o banco;
- registra a versão aplicada na tabela de histórico do Entity Framework.

Em um ambiente de produção, a aplicação automática de migrations durante a inicialização deve ser avaliada com cuidado. Nesta aula, ela facilita a preparação do ambiente de desenvolvimento.

---

## Conhecendo a solução do Delivery App

O arquivo `DeliveryApp.slnx` organiza quatro projetos:

```text
DeliveryApp.slnx
└── src
    ├── Api
    │   └── DeliveryApp.WebApi.csproj
    ├── Aplicacao
    │   └── DeliveryApp.Aplicacao.csproj
    ├── Dominio
    │   └── DeliveryApp.Dominio.csproj
    └── Infraestrutura
        └── DeliveryApp.Infraestrutura.csproj
```

Essa separação segue a ideia de que cada projeto possui uma responsabilidade principal.

### Projeto `Dominio`

O projeto de domínio contém contratos e conceitos que não dependem do ASP.NET Core.

Na versão inicial, encontramos tipos como:

- `EntidadeBase<T>`;
- `ErroValidacao`;
- `IRepositorio<T>`;
- `IEntidadeDeUsuario`;
- `IProvedorDeUsuario`;
- `TipoUsuario`.

`EntidadeBase<T>` fornece um identificador e contratos para validar e atualizar entidades:

```csharp
public abstract class EntidadeBase<T>
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public abstract IReadOnlyList<ErroValidacao> Validar();

    public abstract void Atualizar(T entidadeAtualizada);
}
```

O `Dominio` não sabe que a aplicação utilizará PostgreSQL.

Essa informação pertence à infraestrutura.

### Projeto `Aplicacao`

O projeto de aplicação é o lugar reservado para casos de uso e serviços que coordenam as operações do sistema.

Na `v0`, ele ainda possui apenas a configuração inicial e tipos compartilhados, como `TipoErro`.

Nos próximos passos, esse projeto receberá os casos de uso do delivery, como:

- registrar cliente;
- cadastrar estabelecimento;
- consultar produtos;
- criar pedido;
- acompanhar o estado do pedido.

### Projeto `Infraestrutura`

O projeto de infraestrutura contém as dependências externas:

- Entity Framework Core;
- provedor Npgsql para PostgreSQL;
- ASP.NET Core Identity;
- `DeliveryAppDbContext`;
- repositórios e migrations.

O `DeliveryAppDbContext` herda de:

```csharp
IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
```

Isso permite que o banco armazene as tabelas do Identity junto com os dados do Delivery App.

### Projeto `Api`

O projeto de API é o ponto de entrada da aplicação.

O `Program.cs` configura:

- opções do JWT;
- serviços de infraestrutura e aplicação;
- autenticação e autorização;
- Controllers;
- ProblemDetails;
- OpenAPI e Swagger;
- migrations em desenvolvimento;
- pipeline HTTP.

O projeto utiliza `net10.0` e possui um `UserSecretsId` para guardar configurações sensíveis fora dos arquivos versionados.

---

## Configurando o segredo do JWT

O `appsettings.json` define o emissor, o público e a duração do token, mas não deve armazenar a chave secreta:

```json
"Jwt": {
  "Issuer": "delivery-app-api",
  "Audience": "delivery-app-client",
  "AccessTokenMinutes": 60
}
```

Durante a inicialização, a aplicação exige que `Jwt:Key` esteja preenchida:

```csharp
.Validate(o => !string.IsNullOrWhiteSpace(o.Key))
.ValidateOnStart();
```

Gere uma chave aleatória:

```bash
openssl rand -base64 32
```

Depois, registre-a nos User Secrets da API:

```bash
dotnet user-secrets set "Jwt:Key" "COLE_A_CHAVE_GERADA_AQUI" --project src/Api/DeliveryApp.WebApi.csproj
```

Não publique a chave real no Markdown, em `appsettings.json` ou no Git.

O `appsettings.Development.json` também desativa o New Relic no ambiente local:

```json
"NewRelic": {
  "Enabled": false,
  "ApplicationName": "delivery-app-dev"
}
```

Assim, a API pode ser executada localmente sem configurar uma licença do serviço de observabilidade.

---

## Executando o Delivery App

Depois de clonar o repositório e selecionar a branch `v0`, siga esta sequência.

### Restaurando e compilando a solução

Na raiz do projeto:

```bash
dotnet restore DeliveryApp.slnx
```

Depois, compile todos os projetos:

```bash
dotnet build DeliveryApp.slnx
```

A solução possui referências entre os projetos:

```text
Api
  -> Aplicacao
  -> Infraestrutura
      -> Dominio
Aplicacao
  -> Dominio
Infraestrutura
  -> Dominio
```

O projeto de domínio permanece no centro das regras e contratos.

### Iniciando o banco

Crie o container do PostgreSQL com o comando apresentado anteriormente:

```bash
docker start delivery-app-postgres
```

Confira o container:

```bash
docker ps
```

### Iniciando a API

Com o banco disponível e o segredo configurado, execute:

```bash
dotnet run --project src/Api/DeliveryApp.WebApi.csproj
```

O perfil HTTPS da branch `v0` utiliza:

```text
https://localhost:7094
```

Como o ambiente de execução é `Development`, a API aplica a migration inicial ao iniciar.

O Swagger está disponível em:

```text
https://localhost:7094/swagger
```

O Swagger será ampliado conforme os Controllers dos módulos do delivery forem criados.

> A versão `v0` é a base estrutural do projeto. É esperado que ela ainda não ofereça todas as rotas de clientes, produtos e pedidos.

---

## Ciclo diário de desenvolvimento

Durante o desenvolvimento, um ciclo comum será:

1. Iniciar o PostgreSQL com `docker start delivery-app-postgres`.
2. Conferir o container com `docker ps`.
3. Executar a API com `dotnet run --project src/Api/DeliveryApp.WebApi.csproj`.
4. Testar a aplicação pelo Swagger.
5. Parar a API quando necessário.
6. Parar o container com `docker stop delivery-app-postgres` ao encerrar o trabalho.

O comando `docker stop` interrompe o container sem removê-lo.

Para iniciar novamente o container existente:

```bash
docker start delivery-app-postgres
```

Para remover o container:

```bash
docker rm delivery-app-postgres
```

O container precisa estar parado antes de ser removido. Se necessário, force a remoção:

```bash
docker rm -f delivery-app-postgres
```

O volume nomeado continua existindo quando removemos somente o container.

### Removendo o volume

Para conferir os volumes existentes:

```bash
docker volume ls
```

Para remover os dados do PostgreSQL:

```bash
docker volume rm delivery-app-postgres-data
```

Use-o somente quando quiser começar com um banco vazio.

> **Atenção:** `docker volume rm delivery-app-postgres-data` remove os dados persistidos do ambiente local. Não o utilize sem verificar se há dados que precisam ser preservados.

---

## Problemas comuns

### A porta 5432 já está em uso

Outro PostgreSQL ou outro container pode estar utilizando a porta.

Verifique os containers ativos:

```bash
docker ps
```

Se o PostgreSQL estiver instalado diretamente no computador, será necessário pará-lo ou publicar o container em outra porta.

Por exemplo:

```yaml
ports:
  - "5433:5432"
```

Nesse caso, atualize a connection string da API:

```text
Host=localhost;Port=5433;Database=DeliveryAppDb;Username=postgres;Password=postgres
```

O PostgreSQL continuará ouvindo `5432` dentro do container. Apenas a porta do computador mudará para `5433`.

### A API não consegue conectar ao banco

Confira:

- se o Docker está em execução;
- se `docker ps` mostra o container `delivery-app-postgres` iniciado;
- se a porta da connection string corresponde à porta publicada;
- se o nome do banco é `DeliveryAppDb`;
- se o usuário e a senha correspondem aos parâmetros usados no `docker run`;
- se a API está sendo executada fora do Docker e, por isso, usa `Host=localhost`.

Os logs do banco podem ajudar:

```bash
docker logs delivery-app-postgres
```

### O banco inicia, mas não possui as tabelas

Verifique se a API está no ambiente `Development`.

O `Program.cs` chama `Database.Migrate()` somente nesse ambiente.

Também confira se a migration está presente em:

```text
src/Infraestrutura/Orm/Migrations
```

### O segredo `Jwt:Key` não foi encontrado

Configure o User Secret no projeto correto:

```bash
dotnet user-secrets set "Jwt:Key" "COLE_A_CHAVE_GERADA_AQUI" --project src/Api/DeliveryApp.WebApi.csproj
```

O comando precisa ser executado na solução correta ou receber o caminho correto para o projeto da API.

---

## Exercício: preparar o ambiente inicial

Use a branch `v0` do Delivery App para executar o exercício.

1. Clone o repositório do Delivery App.
2. Acesse a pasta do projeto e selecione a branch `v0`.
3. Confirme que o SDK do .NET está instalado com `dotnet --version`.
4. Confirme que o Docker está disponível com `docker --version`.
5. Crie o container PostgreSQL com o comando `docker run` apresentado na aula.
6. Confirme o estado do container com `docker ps`.
7. Verifique a saúde do banco com `docker inspect`.
8. Teste o acesso ao banco com `docker exec` e o cliente `psql`.
9. Configure `Jwt:Key` usando User Secrets.
10. Restaure e compile `DeliveryApp.slnx`.
11. Execute a API com `dotnet run --project src/Api/DeliveryApp.WebApi.csproj`.
12. Abra `https://localhost:7094/swagger`.
13. Pare a API e reinicie-a sem remover o volume do banco.
14. Remova o container e o volume somente ao final, depois de confirmar que os dados podem ser apagados.

Ao final, responda:

- qual é a diferença entre uma imagem e um container?
- por que o volume foi conectado a `/var/lib/postgresql/data`?
- por que a API utiliza `Host=localhost` nesta etapa?
- qual seria a configuração de rede se a API também estivesse em um container?
- por que remover um container e remover um volume têm consequências diferentes?
- em qual projeto está o `DeliveryAppDbContext`?

---

## Conclusão

O Docker resolve o problema de preparar uma dependência externa de forma repetível.

Com os parâmetros do Docker, configuramos:

- qual imagem será usada;
- quais credenciais o PostgreSQL terá;
- qual porta será publicada;
- onde os dados serão persistidos;
- como verificar se o banco está saudável.

O Delivery App começa com uma solução dividida em quatro projetos:

- `Dominio`, com contratos e regras centrais;
- `Aplicacao`, com os casos de uso;
- `Infraestrutura`, com PostgreSQL, Identity, Entity Framework Core e migrations;
- `Api`, com o ponto de entrada HTTP e a configuração da aplicação.

A branch `v0` ainda é pequena de propósito.

Ela prepara a base para que os próximos módulos sejam adicionados sem misturar regras de negócio, acesso a dados e configuração HTTP.

Referências:

- [Projeto Delivery App na branch `v0`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v0);
- [`DeliveryApp.slnx`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/DeliveryApp.slnx);
- [`Program.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/src/Api/Program.cs);
- [`appsettings.Development.json`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/src/Api/appsettings.Development.json);
- [`DependencyInjection.cs` da Infraestrutura](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/src/Infraestrutura/DependencyInjection.cs);
- [`DeliveryAppDbContext.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/src/Infraestrutura/Orm/DeliveryAppDbContext.cs);
- [`InitialPostgreSql.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v0/src/Infraestrutura/Orm/Migrations/20260831163441_InitialPostgreSql.cs);
- [Documentação do comando `docker run`](https://docs.docker.com/reference/cli/docker/container/run/);
- [Imagem oficial do PostgreSQL](https://hub.docker.com/_/postgres);
- [Documentação do Entity Framework Core sobre migrations](https://learn.microsoft.com/ef/core/managing-schemas/migrations/).
