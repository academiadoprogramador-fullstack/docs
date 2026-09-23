---
draft: false
slug: /conteudo/seeding-roles-abstracao-usuarios
tags:
  - trilha-arquitetura-software
  - trilha-seguranca-web
  - tech-aspnet-core-mvc
  - tech-entity-framework-core
  - conceito-seeding
  - conceito-migrations
  - conceito-interfaces
  - conceito-inversao-dependencia
  - projeto-delivery-app
  - material-aula-pratica
---

# Seeding de Roles e Abstração de Usuários

## O problema de criar a Role durante o cadastro

Na versão anterior do Delivery App, o cadastro de um cliente precisava verificar se a Role `Cliente` existia.

Caso ela não existisse, o próprio Controller criava a Role:

```csharp
var resultadoPapel = await roleManager
    .FindByNameAsync("Cliente");

if (resultadoPapel is null)
{
    await roleManager.CreateAsync(new IdentityRole<Guid>
    {
        Id = Guid.NewGuid(),
        Name = "Cliente",
        NormalizedName = "CLIENTE"
    });
}
```

Esse código funciona, mas mistura duas responsabilidades:

- preparar a estrutura inicial do sistema;
- cadastrar um cliente.

A Role `Cliente` não deveria depender da primeira pessoa tentar se cadastrar.

Ela é uma configuração inicial da aplicação.

Também existe um problema de previsibilidade.

Se dois cadastros acontecerem ao mesmo tempo, ambos podem verificar a ausência da Role e tentar criá-la.

Na `v3` do [Delivery App](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v3), a role é semeada no `DbContext` e o cadastro do usuário é acessado por uma abstração própria.

---

## O que é seeding?

**Seeding** é o preenchimento inicial de dados necessários para a aplicação funcionar.

Esses dados não são criados por um usuário em uma tela comum.

Eles fazem parte da preparação do sistema.

Exemplos de dados que podem ser semeados:

- roles padrão;
- permissões iniciais;
- status fixos;
- categorias padrão;
- configurações básicas;
- dados mínimos para o primeiro uso.

No Delivery App, a role `Cliente` é um dado inicial do Identity.

```text
aplicação
  -> precisa da role Cliente
    -> DbContext declara a role
      -> migration insere a role no banco
```

> A role deve existir antes do primeiro cadastro. O cadastro apenas associa o novo usuário a uma role já conhecida.

---

## Declarando a Role no DbContext

O `DeliveryAppDbContext` herda de `IdentityDbContext`:

```csharp
public sealed class DeliveryAppDbContext(
    DbContextOptions<DeliveryAppDbContext> options,
    IProvedorDeUsuario? provedorDeUsuario = null
) : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>(options)
```

Por causa dessa herança, o modelo do Entity Framework conhece a entidade `IdentityRole<Guid>` e a tabela `AspNetRoles`.

Na `v3`, o contexto define um identificador estável para a role:

```csharp
private static readonly Guid TipoUsuarioClienteId = new(
    "01a058f4-a048-79a3-b1a6-0f01d629a126"
);
```

Em seguida, utiliza `HasData` dentro do `OnModelCreating`:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfigurationsFromAssembly(
        typeof(DeliveryAppDbContext).Assembly
    );

    modelBuilder.Entity<IdentityRole<Guid>>().HasData(
        new IdentityRole<Guid>
        {
            Id = TipoUsuarioClienteId,
            Name = TipoUsuario.Cliente.ToString(),
            NormalizedName = TipoUsuario.Cliente
                .ToString()
                .ToUpperInvariant(),
            ConcurrencyStamp = "01a058f7-9492-73bc-8e4b-934c53594ed6"
        }
    );
}
```

O `HasData` informa ao Entity Framework que essa role faz parte do modelo inicial.

### Por que usar um ID fixo?

O Entity Framework precisa comparar o estado atual do seeding com o estado registrado nas migrations.

Por isso, os dados semeados devem ser determinísticos.

Um `Guid.NewGuid()` produziria um valor diferente a cada execução do código.

Com um ID fixo:

- a migration sabe qual registro deve inserir;
- o banco recebe sempre a mesma role;
- o vínculo do usuário com a role utiliza um identificador conhecido;
- o modelo não muda apenas porque a aplicação foi iniciada novamente.

O mesmo cuidado se aplica ao `ConcurrencyStamp`.

### Os campos da Role

O `IdentityRole<Guid>` possui vários campos, mas os principais neste exemplo são:

- `Id`: identificador da role;
- `Name`: nome utilizado pela aplicação;
- `NormalizedName`: nome normalizado usado para comparações pelo Identity;
- `ConcurrencyStamp`: valor usado pelo Identity para controle de concorrência.

O enum do domínio fornece o nome da role:

```csharp
public enum TipoUsuario
{
    Cliente
}
```

Assim, evitamos espalhar a string literal `"Cliente"` por vários arquivos.

O cadastro utiliza a mesma origem:

```csharp
TipoUsuario.Cliente.ToString()
```

---

## Transformando o seeding em migration

Alterar o `DbContext` não altera o banco automaticamente.

O Entity Framework compara o modelo atual com o modelo da última migration e cria uma nova migration com a diferença.

Para gerar a migration:

```bash
dotnet ef migrations add Seed_ClienteRole \
  --project src/Infraestrutura \
  --startup-project src/Api
```

Na branch `v3`, o arquivo gerado possui o nome:

```text
src/Infraestrutura/Orm/Migrations/
  20260902171220_Seed_ClienteRole.cs
```

A migration possui dois métodos principais:

- `Up`: aplica a mudança;
- `Down`: desfaz a mudança.

### O método `Up`

O `Up` insere a role na tabela `AspNetRoles`:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.InsertData(
        table: "AspNetRoles",
        columns: new[]
        {
            "Id",
            "ConcurrencyStamp",
            "Name",
            "NormalizedName"
        },
        values: new object[]
        {
            new Guid("01a058f4-a048-79a3-b1a6-0f01d629a126"),
            "01a058f7-9492-73bc-8e4b-934c53594ed6",
            "Cliente",
            "CLIENTE"
        }
    );
}
```

A migration não executa `RoleManager`.

Ela executa uma operação de banco para inserir o dado definido pelo modelo.

### O método `Down`

O `Down` remove a mesma role pelo ID:

```csharp
protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DeleteData(
        table: "AspNetRoles",
        keyColumn: "Id",
        keyValue: new Guid(
            "01a058f4-a048-79a3-b1a6-0f01d629a126"
        )
    );
}
```

Esse método permite reverter a migration em um ambiente de desenvolvimento.

> **Atenção:** remover uma role que já possui usuários pode quebrar referências ou remover relacionamentos. Revise o `Down` antes de reverter uma migration em um banco com dados importantes.

### Aplicando a migration

Para aplicar todas as migrations pendentes:

```bash
dotnet ef database update \
  --project src/Infraestrutura \
  --startup-project src/Api
```

Na `v3`, a aplicação também executa `Database.Migrate()` ao iniciar no ambiente `Development`.

Isso faz com que a migration seja aplicada quando a API é iniciada localmente.

O banco registra migrations aplicadas na tabela:

```text
__EFMigrationsHistory
```

Uma migration aplicada não deve ser editada para corrigir o histórico.

Crie uma nova migration para representar a próxima mudança.

### Verificando a Role no PostgreSQL

Depois de aplicar a migration, podemos consultar a tabela do Identity:

```sql
SELECT "Id", "Name", "NormalizedName"
FROM "AspNetRoles";
```

O resultado deve conter a role:

```text
Name: Cliente
NormalizedName: CLIENTE
```

O primeiro cadastro já pode usar essa role sem precisar criá-la durante a requisição.

---

## O problema de depender diretamente do Identity no Handler

Depois do seeding, ainda precisamos cadastrar usuários.

Uma primeira solução seria injetar `UserManager<IdentityUser<Guid>>` diretamente no Handler:

```csharp
public sealed class CadastrarClienteCommandHandler(
    IRepositorioCliente repositorioCliente,
    UserManager<IdentityUser<Guid>> userManager,
    RoleManager<IdentityRole<Guid>> roleManager
)
```

Essa solução funcionaria, mas criaria um acoplamento entre a camada de Aplicação e a implementação do ASP.NET Core Identity.

O Handler passaria a conhecer:

- `IdentityUser`;
- `UserManager`;
- `RoleManager`;
- `IdentityResult`;
- códigos de erro específicos do Identity.

Isso dificulta:

- testar o Handler sem montar o Identity;
- trocar a implementação de usuários;
- reutilizar o caso de uso em outro tipo de interface;
- manter o domínio independente do framework web.

Na `v3`, o cadastro é representado por um contrato no domínio:

```text
Aplicação
  -> IGerenciadorDeIdentidade
      <- GerenciadorDeIdentidade na Infraestrutura
```

Esse é o princípio da inversão de dependência aplicado ao cadastro de usuários.

---

## Criando a interface `IGerenciadorDeIdentidade`

O contrato fica no projeto `DeliveryApp.Dominio`:

```csharp
namespace DeliveryApp.Dominio.Compartilhado.Auth;

public sealed class ValidacaoDeIdentidadeException(
    string campo,
    string mensagem
) : Exception(mensagem)
{
    public string Campo { get; } = campo;
}

public sealed class ConflitoDeIdentidadeException(
    string mensagem
) : Exception(mensagem);

public sealed record UsuarioCadastrado(
    Guid Id,
    string Email
);

public interface IGerenciadorDeIdentidade
{
    Task<UsuarioCadastrado> CadastrarAsync(
        Guid usuarioId,
        string email,
        string senha,
        TipoUsuario tipo
    );

    Task ExcluirAsync(Guid usuarioId);
}
```

A interface descreve o que a aplicação precisa fazer.

Ela não descreve como o Identity funciona internamente.

### Por que o contrato recebe `TipoUsuario`?

O cadastro precisa associar o usuário a uma role.

Em vez de receber uma string qualquer:

```csharp
Task<UsuarioCadastrado> CadastrarAsync(
    Guid usuarioId,
    string email,
    string senha,
    string nomeDaRole
);
```

o contrato recebe um enum do domínio:

```csharp
TipoUsuario tipo
```

Isso restringe os valores possíveis aos tipos de usuário conhecidos pela aplicação.

Também centraliza o nome utilizado para localizar a role:

```csharp
tipo.ToString()
```

### Por que o contrato possui `ExcluirAsync`?

O cadastro do usuário e o cadastro do perfil `Cliente` são duas operações relacionadas.

Se o usuário for criado, mas a gravação do cliente falhar, precisamos desfazer o usuário criado.

Por isso, a abstração também oferece:

```csharp
Task ExcluirAsync(Guid usuarioId);
```

Esse método participa da compensação do fluxo de cadastro.

---

## Implementando a interface na Infraestrutura

A implementação concreta fica em:

```text
src/Infraestrutura/Auth/GerenciadorDeIdentidade.cs
```

Ela pode conhecer o ASP.NET Core Identity porque está na camada externa:

```csharp
public sealed class GerenciadorDeIdentidade(
    UserManager<IdentityUser<Guid>> userManager
) : IGerenciadorDeIdentidade
```

O método de cadastro cria o `IdentityUser`:

```csharp
public async Task<UsuarioCadastrado> CadastrarAsync(
    Guid usuarioId,
    string email,
    string senha,
    TipoUsuario tipo
)
{
    var usuario = new IdentityUser<Guid>
    {
        Id = usuarioId,
        Email = email.Trim(),
        UserName = email.Trim()
    };

    var resultadoUsuario = await userManager
        .CreateAsync(usuario, senha);

    if (!resultadoUsuario.Succeeded)
        throw CriarErro(resultadoUsuario);

    var resultadoPapel = await userManager
        .AddToRoleAsync(usuario, tipo.ToString());

    if (!resultadoPapel.Succeeded)
    {
        await userManager.DeleteAsync(usuario);
        throw CriarErro(resultadoPapel);
    }

    return new UsuarioCadastrado(
        usuario.Id,
        usuario.Email
    );
}
```

Vamos observar as etapas.

### Criando o usuário

O ID é recebido como parâmetro:

```csharp
Id = usuarioId
```

No Delivery App, o ID do usuário do Identity é o mesmo ID do perfil `Cliente`.

Isso permite representar a relação 1:1 entre:

- `IdentityUser<Guid>`;
- `Cliente`.

O `UserManager` recebe a senha e aplica as regras configuradas no Identity.

A senha não é armazenada diretamente.

### Associando a Role

Depois que o usuário é criado, a implementação associa a role:

```csharp
await userManager.AddToRoleAsync(
    usuario,
    tipo.ToString()
);
```

Como a role `Cliente` foi semeada pelo `DbContext`, o `UserManager` apenas cria o relacionamento em `AspNetUserRoles`.

Ele não precisa criar a definição da role nesse momento.

### Convertendo erros do Identity

O Identity retorna `IdentityResult`.

A camada de aplicação não precisa receber esse tipo específico.

O `GerenciadorDeIdentidade` transforma o resultado em exceções do domínio:

```csharp
private static Exception CriarErro(IdentityResult resultado)
{
    if (resultado.Errors.Any(
        erro => erro.Code is "DuplicateEmail" or "DuplicateUserName"
    ))
    {
        return new ConflitoDeIdentidadeException(
            "Já existe um usuário cadastrado com este email."
        );
    }

    var erro = resultado.Errors.First();

    string campo = erro.Code.StartsWith(
        "Password",
        StringComparison.Ordinal
    )
        ? "Senha"
        : "Email";

    return new ValidacaoDeIdentidadeException(
        campo,
        erro.Description
    );
}
```

Esse mapeamento protege a camada de aplicação dos códigos do Identity.

Ela trabalha com conceitos do sistema:

- validação de identidade;
- conflito de identidade;
- campo que precisa ser corrigido.

### Excluindo um usuário

O método de compensação procura o usuário pelo ID:

```csharp
public async Task ExcluirAsync(Guid usuarioId)
{
    var usuario = await userManager
        .FindByIdAsync(usuarioId.ToString());

    if (usuario is not null)
        await userManager.DeleteAsync(usuario);
}
```

O Handler pode chamar esse método quando a persistência do perfil falhar.

---

## Registrando a implementação no container

A Infraestrutura registra a interface e sua implementação:

```csharp
services.AddScoped<
    IGerenciadorDeIdentidade,
    GerenciadorDeIdentidade
>();
```

O restante da aplicação depende da interface:

```csharp
IGerenciadorDeIdentidade gerenciadorDeIdentidade
```

O container fornece `GerenciadorDeIdentidade` quando essa dependência é solicitada.

Esse registro também facilita testes.

Em um teste, podemos fornecer uma implementação falsa:

```csharp
public sealed class GerenciadorDeIdentidadeFake
    : IGerenciadorDeIdentidade
{
    public List<Guid> UsuariosCadastrados { get; } = [];

    public Task<UsuarioCadastrado> CadastrarAsync(
        Guid usuarioId,
        string email,
        string senha,
        TipoUsuario tipo
    )
    {
        UsuariosCadastrados.Add(usuarioId);

        return Task.FromResult(
            new UsuarioCadastrado(usuarioId, email)
        );
    }

    public Task ExcluirAsync(Guid usuarioId)
    {
        UsuariosCadastrados.Remove(usuarioId);

        return Task.CompletedTask;
    }
}
```

O teste não precisa iniciar o `UserManager` nem o PostgreSQL.

---

## Usando a abstração no Command Handler

Na `v2`, o Handler recebia dados do cliente e o Controller criava o usuário do Identity.

Na `v3`, o Command já recebe os dados necessários para o cadastro completo:

```csharp
public sealed record CadastrarClienteCommand(
    string Nome,
    string Cpf,
    string Email,
    string Senha
) : IRequest<Result<Guid>>;
```

O Handler depende de:

```csharp
public sealed class CadastrarClienteCommandHandler(
    IRepositorioCliente repositorioCliente,
    IGerenciadorDeIdentidade gerenciadorDeIdentidade
) : IRequestHandler<CadastrarClienteCommand, Result<Guid>>
```

Depois de validar o cliente e verificar CPF duplicado, ele chama a abstração:

```csharp
UsuarioCadastrado usuario = await gerenciadorDeIdentidade
    .CadastrarAsync(
        cliente.Id,
        command.Email,
        command.Senha,
        TipoUsuario.Cliente
    );

await repositorioCliente
    .CadastrarAsync(cliente, cancellationToken);

return Result.Ok(cliente.Id);
```

O Handler sabe que precisa cadastrar um usuário.

Ele não sabe se isso será feito por:

- ASP.NET Core Identity;
- outro provedor de identidade;
- uma implementação fake em teste;
- um serviço externo no futuro.

Essa decisão fica na Infraestrutura.

---

## Tratando falhas entre Identity e domínio

O cadastro envolve duas persistências relacionadas:

```text
1. usuário e role no Identity
2. perfil Cliente no banco da aplicação
```

O Handler trata erros do gerenciador:

```csharp
try
{
    await gerenciadorDeIdentidade.CadastrarAsync(
        cliente.Id,
        command.Email,
        command.Senha,
        TipoUsuario.Cliente
    );

    await repositorioCliente
        .CadastrarAsync(cliente, cancellationToken);

    return Result.Ok(cliente.Id);
}
catch (ValidacaoDeIdentidadeException excecao)
{
    return Result.Fail(
        ErrosDeCliente.ValidacaoDeIdentidade(
            excecao.Campo,
            excecao.Message
        )
    );
}
catch (ConflitoDeIdentidadeException excecao)
{
    return Result.Fail(
        ErrosDeCliente.ConflitoDeIdentidade(excecao.Message)
    );
}
catch (DbException)
{
    await gerenciadorDeIdentidade.ExcluirAsync(cliente.Id);

    return Result.Fail(
        ErrosDeCliente.CadastroDuplicado()
    );
}
```

Se a gravação do perfil falhar depois que o usuário foi criado, o Handler remove o usuário criado.

Essa ação é chamada de **compensação**.

Ela desfaz a primeira parte da operação para evitar um usuário sem perfil correspondente.

Esse código não transforma automaticamente as duas operações em uma transação única.

Ele implementa uma estratégia explícita para tratar a falha entre as etapas.

> Quando uma operação atravessa mais de uma abstração de persistência, precisamos decidir como tratar o cenário em que apenas uma parte foi concluída.

---

## Simplificando o Controller

Na versão anterior, o Controller precisava conhecer serviços do Identity para cadastrar o cliente:

```csharp
public sealed class ClientesController(
    UserManager<IdentityUser<Guid>> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IMediator mediator
)
```

Na `v3`, o cadastro é enviado ao Command Handler:

```csharp
[AllowAnonymous]
[HttpPost("cadastro")]
public async Task<ActionResult<CadastrarClienteResponse>> Cadastrar(
    CadastrarClienteRequest request,
    CancellationToken cancellationToken
)
{
    var resultado = await mediator.Send(
        new CadastrarClienteCommand(
            request.Nome,
            request.Cpf,
            request.Email,
            request.Senha
        ),
        cancellationToken
    );

    if (!resultado.IsSuccess)
        return this.ProblemDetails(resultado);

    return CreatedAtAction(
        nameof(ObterPorId),
        new { clienteId = resultado.Value },
        new CadastrarClienteResponse(
            resultado.Value,
            request.Nome
        )
    );
}
```

O Controller agora trabalha com conceitos HTTP:

- request;
- rota;
- status code;
- resposta;
- `ProblemDetails`.

O Handler trabalha com conceitos do caso de uso:

- entidade `Cliente`;
- validação;
- CPF duplicado;
- cadastro de usuário;
- compensação;
- resultado da aplicação.

Essa separação deixa a API mais fácil de ler.

### O login continua usando o Identity

A abstração criada na `v3` concentra o cadastro e a exclusão de usuários.

O login ainda utiliza `UserManager` e `SignInManager` diretamente no Controller:

```csharp
var usuario = await userManager
    .FindByEmailAsync(request.Email.Trim());

var resultadoAutenticacao = await signInManager
    .CheckPasswordSignInAsync(
        usuario,
        request.Senha,
        lockoutOnFailure: true
    );
```

Isso é uma decisão do estado atual do projeto.

Não precisamos criar uma abstração para cada uso do Identity antes de existir uma necessidade concreta.

Mais tarde, o login também poderá ser extraído para uma interface caso o fluxo cresça ou precise ser reutilizado.

---

## Fluxo completo do cadastro

O cadastro da `v3` pode ser representado assim:

```text
POST /api/clientes/cadastro
  -> ClientesController
    -> CadastrarClienteCommand
      -> CadastrarClienteCommandHandler
        -> valida Cliente
        -> verifica CPF duplicado
        -> IGerenciadorDeIdentidade
          -> GerenciadorDeIdentidade
            -> UserManager.CreateAsync
            -> UserManager.AddToRoleAsync("Cliente")
        -> IRepositorioCliente.CadastrarAsync
          -> Cliente salvo
        -> Result<Guid>
  -> 201 Created ou ProblemDetails
```

A role já existe porque foi criada pela migration:

```text
DbContext.HasData
  -> migration Seed_ClienteRole
    -> AspNetRoles: Cliente
```

O cadastro associa o usuário ao registro existente:

```text
IdentityUser
  + AspNetUserRoles
      -> IdentityRole Cliente
```

---

## Benefícios da solução

### Seeding da Role

- a role existe antes do primeiro cadastro;
- o valor inicial é versionado junto com o código;
- a criação é repetível entre ambientes;
- a migration registra a alteração do banco;
- o Controller não precisa criar roles;
- o nome e o ID da role são previsíveis.

### Abstração do cadastro

- a Aplicação não depende de `UserManager`;
- a Infraestrutura concentra detalhes do Identity;
- os erros do framework são convertidos para erros do domínio;
- o Handler pode ser testado com uma implementação falsa;
- a API fica focada em HTTP;
- o fluxo de cadastro fica em um único caso de uso.

### Separação de responsabilidades

```text
Domínio
  -> define IGerenciadorDeIdentidade e os tipos de erro

Aplicação
  -> coordena o caso de uso de cadastro

Infraestrutura
  -> implementa o contrato com UserManager

Web API
  -> recebe a requisição e devolve a resposta HTTP
```

---

## Exercício: semear uma nova Role

Utilize a branch `v3` do Delivery App como referência.

1. Leia o enum `TipoUsuario`.
2. Adicione temporariamente uma nova role ao enum, como `Estabelecimento`.
3. Defina um `Guid` fixo para a nova role.
4. Adicione um segundo `HasData` no `DeliveryAppDbContext`.
5. Crie uma migration chamada `Seed_EstabelecimentoRole`.
6. Abra o arquivo da migration e localize `InsertData`.
7. Aplique a migration no banco local.
8. Consulte a tabela `AspNetRoles`.
9. Confirme o valor de `Name` e `NormalizedName`.
10. Remova a role do enum e crie uma nova migration para estudar o comportamento de alteração.

Depois, responda:

- por que o ID da role precisa ser estável?
- qual é a diferença entre `Name` e `NormalizedName`?
- por que `HasData` não executa `RoleManager.CreateAsync`?
- onde a migration registra a inserção da role?
- por que a role não deve ser criada durante o primeiro cadastro?

---

## Exercício: testar a abstração de identidade

Crie um teste para o cadastro de cliente sem iniciar o ASP.NET Core Identity.

1. Crie uma implementação fake de `IGerenciadorDeIdentidade`.
2. Crie um repositório fake para `IRepositorioCliente`.
3. Instancie `CadastrarClienteCommandHandler` com essas dependências.
4. Envie um Command com nome, CPF, email e senha válidos.
5. Confirme que `CadastrarAsync` foi chamado com `TipoUsuario.Cliente`.
6. Confirme que o cliente foi enviado ao repositório.
7. Configure o fake para lançar `ConflitoDeIdentidadeException`.
8. Confirme que o Handler retorna um erro do tipo `TipoErro.Conflito`.
9. Configure o repositório para falhar depois do cadastro do usuário.
10. Confirme que `ExcluirAsync` foi chamado para compensar a operação.

O teste deve verificar o comportamento do caso de uso.

Ele não precisa verificar se o `UserManager` cria corretamente uma linha em `AspNetUsers`.

Essa responsabilidade pertence aos testes da implementação de infraestrutura.

---

## Conclusão

O seeding transforma a role `Cliente` em parte declarada do modelo do banco.

O `DbContext` utiliza `HasData`.

O Entity Framework transforma essa configuração em uma migration.

A migration insere a role em `AspNetRoles` antes que o primeiro cadastro aconteça.

O cadastro de usuários também foi separado por camadas:

- `IGerenciadorDeIdentidade` define o contrato no domínio;
- `GerenciadorDeIdentidade` implementa o contrato com `UserManager`;
- `CadastrarClienteCommandHandler` coordena o caso de uso;
- `ClientesController` cuida do HTTP;
- exceptions de infraestrutura são convertidas para erros da aplicação.

Essa organização mantém o ASP.NET Core Identity na borda da aplicação.

O núcleo trabalha com interfaces e conceitos próprios do sistema.

Referências:

- [Introdução ao ASP.NET Core Identity](/conteudo/autenticacao-aspnet-core-identity);
- [CQRS e Mediator com MediatR](/conteudo/cqrs-mediator-mediatr-delivery-app);
- [Projeto Delivery App na branch `v3`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v3);
- [`DeliveryAppDbContext.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Infraestrutura/Orm/DeliveryAppDbContext.cs);
- [`Seed_ClienteRole.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Infraestrutura/Orm/Migrations/20260902171220_Seed_ClienteRole.cs);
- [`IGerenciadorDeIdentidade.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Dominio/Compartilhado/Auth/IGerenciadorDeIdentidade.cs);
- [`GerenciadorDeIdentidade.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Infraestrutura/Auth/GerenciadorDeIdentidade.cs);
- [`CadastrarClienteCommandHandler.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Aplicacao/Modulos/Clientes/CadastrarClienteCommandHandler.cs);
- [`ClientesController.cs`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v3/src/Api/Modulos/Clientes/ClientesController.cs);
- [Documentação do seeding no Entity Framework Core](https://learn.microsoft.com/ef/core/modeling/data-seeding);
- [Documentação do ASP.NET Core Identity](https://learn.microsoft.com/aspnet/core/security/authentication/identity).
