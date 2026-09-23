---
draft: false
slug: /conteudo/identity-autenticacao-jwt-web-api
tags:
  - trilha-seguranca-web
  - tech-dotnet
  - conceito-autenticacao
  - conceito-autorizacao
  - conceito-jwt
  - material-aula-pratica
---

# Identity, Autenticação e JWT na Web API

## O problema de uma API pública

Até agora, os endpoints da Web API podiam ser chamados sem que a aplicação soubesse quem estava fazendo a requisição.

Isso cria problemas importantes:

- qualquer pessoa pode consultar dados;
- qualquer pessoa pode criar ou excluir registros;
- a aplicação não consegue separar os dados de usuários diferentes;
- o Swagger e outros clientes não têm credenciais para acessar rotas protegidas.

Na branch [`v4` do e-Agenda](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v4), a API passa a utilizar o ASP.NET Core Identity para gerenciar usuários e JWTs para autenticar as requisições seguintes.

O fluxo completo é:

```text
cadastro
  -> usuário armazenado pelo Identity
    -> login
      -> token JWT
        -> requisições com Authorization: Bearer {token}
```

---

## Configurando o domínio para conhecer o usuário atual

O domínio precisa representar que alguns dados pertencem a um usuário.

Porém, o domínio não deve depender de `HttpContext`, JWT ou classes do ASP.NET Core.

Para manter essa separação, a `v4` cria contratos simples no projeto `eAgenda.Dominio`.

### A interface da entidade de usuário

`IEntidadeDeUsuario` indica que uma entidade possui um proprietário:

```csharp
namespace eAgenda.Dominio.Compartilhado.Identity;

public interface IEntidadeDeUsuario
{
    Guid UsuarioId { get; set; }
}
```

A entidade `Contato`, por exemplo, implementa essa interface:

```csharp
public class Contato : EntidadeBase<Contato>, IEntidadeDeUsuario
{
    public Guid UsuarioId { get; set; }

    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // outras propriedades...
}
```

O mesmo conceito é aplicado a contatos, compromissos, categorias, despesas e tarefas.

> `UsuarioId` representa a quem o registro pertence. Ele não é o mesmo que o `Id` do próprio registro.

### O contrato do provedor de usuário

O domínio também define uma abstração para consultar o usuário autenticado:

```csharp
public interface IProvedorDeUsuario
{
    Guid? Id { get; }
    bool EstaAutenticado { get; }
}
```

Esse contrato não informa de onde o ID veio.

Para o domínio, basta saber se existe um usuário autenticado e qual é seu identificador.

Essa decisão mantém a regra de negócio independente da forma de autenticação utilizada pela Web API.

---

## Integrando o Identity à infraestrutura

O ASP.NET Core Identity fornece os recursos para:

- criar usuários;
- armazenar senhas com hash;
- verificar credenciais;
- controlar bloqueios após tentativas inválidas;
- armazenar roles e claims.

Na `v4`, a infraestrutura registra o Identity no método `AddInfraRepositories`:

```csharp
services.AddIdentityCore<IdentityUser<Guid>>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<EAgendaDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();
```

O projeto utiliza `Guid` como tipo do identificador do usuário.

`AddEntityFrameworkStores` conecta o Identity ao Entity Framework Core.

### O DbContext com Identity

O `EAgendaDbContext` deixa de herdar apenas de `DbContext` e passa a herdar de:

```csharp
IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
```

Por isso, o banco passa a conter as tabelas do Identity, como:

- `AspNetUsers`;
- `AspNetRoles`;
- `AspNetUserRoles`;
- `AspNetUserClaims`;
- `AspNetUserLogins`;
- `AspNetUserTokens`.

O mesmo `DbContext` também continua contendo os `DbSet` da aplicação:

```csharp
public DbSet<Contato> Contatos => Set<Contato>();
public DbSet<Compromisso> Compromissos => Set<Compromisso>();
```

Assim, o banco armazena tanto os usuários quanto os dados da aplicação.

---

## Isolando os dados por usuário

Adicionar `UsuarioId` às entidades não é suficiente.

Também precisamos garantir que um usuário não leia nem altere dados pertencentes a outro.

### Filtros globais de consulta

No `OnModelCreating`, a `v4` adiciona filtros globais:

```csharp
modelBuilder.Entity<Contato>()
    .HasQueryFilter(c => c.UsuarioId == provedorDeUsuario.Id);

modelBuilder.Entity<Compromisso>()
    .HasQueryFilter(c => c.UsuarioId == provedorDeUsuario.Id);
```

O projeto aplica a mesma ideia às outras entidades que pertencem ao usuário.

Com isso, uma consulta comum como esta:

```csharp
List<Contato> contatos = repositorioContato.SelecionarTodos();
```

considera somente os registros cujo `UsuarioId` corresponde ao usuário autenticado.

O filtro é aplicado pelo Entity Framework sem que cada repositório precise repetir a condição.

### Proteção no `SaveChanges`

O filtro de consulta protege a leitura.

Para proteger a escrita, `EAgendaDbContext.SaveChanges()` verifica as entidades que implementam `IEntidadeDeUsuario`.

Em uma inclusão:

- se `UsuarioId` estiver vazio, ele recebe o ID do usuário atual;
- se já tiver outro ID, a operação é rejeitada.

Em uma alteração ou exclusão, o contexto verifica se o registro pertence ao usuário autenticado.

```csharp
foreach (var entry in ChangeTracker.Entries<IEntidadeDeUsuario>())
{
    if (entry.State == EntityState.Added &&
        entry.Entity.UsuarioId == Guid.Empty)
    {
        entry.Property(nameof(IEntidadeDeUsuario.UsuarioId))
            .CurrentValue = usuarioId.Value;
    }
}
```

O código completo também protege alterações e exclusões.

> O isolamento possui duas barreiras: filtros globais protegem a leitura e `SaveChanges` protege a escrita.

---

## Descobrindo o usuário a partir do JWT

O domínio conhece `IProvedorDeUsuario`, mas a implementação concreta fica na Web API:

```csharp
public sealed class UserProvider(
    IHttpContextAccessor httpContextAccessor
) : IProvedorDeUsuario
{
    public Guid? Id
    {
        get
        {
            ClaimsPrincipal? user =
                httpContextAccessor.HttpContext?.User;

            if (user?.Identity is null || !user.Identity.IsAuthenticated)
                return null;

            string? claim = user.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (claim is null || !Guid.TryParse(claim, out Guid id))
                return null;

            return id;
        }
    }

    public bool EstaAutenticado => Id.HasValue;
}
```

O `UserProvider` lê o `ClaimTypes.NameIdentifier` do `ClaimsPrincipal` criado pelo middleware de autenticação.

Esse claim contém o ID do usuário que foi incluído no JWT durante o login.

No `Program.cs`, a implementação é registrada como dependência:

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IProvedorDeUsuario, UserProvider>();
```

O `EAgendaDbContext` recebe esse provedor pelo construtor e utiliza o usuário atual nos filtros e no `SaveChanges`.

---

## Criando as rotas de autenticação

As rotas de autenticação precisam ser acessíveis antes do usuário possuir um token.

Por isso, `AuthController` utiliza `[AllowAnonymous]`:

```csharp
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public sealed class AuthController(
    UserManager<IdentityUser<Guid>> userManager,
    SignInManager<IdentityUser<Guid>> signInManager,
    JwtProvider jwtProvider
) : ControllerBase
```

O Controller recebe três serviços:

- `UserManager`: cria e consulta usuários;
- `SignInManager`: verifica a senha e aplica as regras de login;
- `JwtProvider`: cria o token que será usado nas próximas requisições.

### Rota de registro

O request de registro utiliza DataAnnotations:

```csharp
public sealed record RegistrarRequest(
    [Required]
    [EmailAddress]
    string Email,

    [Required]
    [MinLength(8)]
    string Senha
);
```

O endpoint fica disponível em:

```text
POST /api/auth/registrar
```

Exemplo de corpo:

```json
{
  "email": "ana@exemplo.com",
  "senha": "Senha123!"
}
```

O `UserManager` valida a senha conforme as regras configuradas na Infraestrutura e armazena o usuário com hash da senha.

```csharp
var resultado = await userManager.CreateAsync(usuario, request.Senha);

if (!resultado.Succeeded)
{
    foreach (IdentityError erro in resultado.Errors)
        ModelState.AddModelError(string.Empty, erro.Description);

    return ValidationProblem(ModelState);
}
```

A API não armazena a senha em texto puro.

### Rota de login

O endpoint de login é:

```text
POST /api/auth/entrar
```

Exemplo:

```json
{
  "email": "ana@exemplo.com",
  "senha": "Senha123!"
}
```

O Controller localiza o usuário, verifica a senha e cria o token:

```csharp
var usuario = await userManager.FindByEmailAsync(request.Email.Trim());

if (usuario is null)
    return Unauthorized();

var resultado = await signInManager
    .CheckPasswordSignInAsync(usuario, request.Senha, true);

if (!resultado.Succeeded)
    return Unauthorized();

var token = jwtProvider.CriarToken(usuario);

return Ok(token);
```

Uma resposta de sucesso possui esta forma:

```json
{
  "accessToken": "eyJ...",
  "dataExpiracaoEmUtc": "2026-09-23T18:00:00Z"
}
```

O valor real do token é maior e não deve ser publicado em documentação, commits ou mensagens.

---

## Gerando uma chave segura para JWT

O JWT da `v4` usa o algoritmo `HmacSha256`.

Nesse modelo, a mesma chave secreta é usada para assinar o token e validar sua assinatura.

Essa chave é a **chave mestra** da API.

```csharp
SymmetricSecurityKey securityKey = new(
    Encoding.UTF8.GetBytes(options.Key)
);

SigningCredentials credentials = new(
    securityKey,
    SecurityAlgorithms.HmacSha256
);
```

O objeto `JwtOptions` lê estes valores da seção `Jwt`:

```csharp
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; init; } = 60;
}
```

O `appsettings.json` da `v4` contém o emissor, o público e a duração, mas não contém `Jwt:Key`:

```json
"Jwt": {
  "Issuer": "e-agenda-api",
  "Audience": "e-agenda-client",
  "AccessTokenMinutes": 60
}
```

A chave deve ser gerada fora do código e armazenada em um segredo local ou em um serviço seguro de configuração.

### Gerando com OpenSSL

O comando abaixo cria 32 bytes aleatórios e os representa em Base64:

```bash
openssl rand -base64 32
```

Copie o resultado apenas para configurar o segredo local. Não o adicione ao repositório.

### Armazenando com User Secrets

Como o projeto possui um `UserSecretsId`, podemos salvar a chave com:

```bash
dotnet user-secrets set "Jwt:Key" "COLE_A_CHAVE_GERADA_AQUI" --project src/eAgenda.WebApi
```

O valor será lido pela configuração do ASP.NET Core durante o desenvolvimento.

Também é possível usar uma variável de ambiente:

```bash
export Jwt__Key="COLE_A_CHAVE_GERADA_AQUI"
```

No Windows PowerShell:

```powershell
$env:Jwt__Key = "COLE_A_CHAVE_GERADA_AQUI"
```

> **Atenção:** não use uma chave curta, previsível ou compartilhada em exemplos. Não coloque `Jwt:Key` no `appsettings.json` versionado.

### Assinar não é criptografar

Nesse fluxo, o JWT é **assinado**.

A assinatura permite verificar que o token foi produzido por quem possui a chave e que seu conteúdo não foi alterado.

Ela não transforma as claims em texto secreto. Portanto, não coloque senhas ou informações confidenciais dentro do token.

---

## Criando e validando o token

O `JwtProvider` monta claims, datas e assinatura:

```csharp
List<Claim> claims = [
    new(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new(ClaimTypes.Email, user.Email ?? string.Empty),
];

JwtSecurityToken token = new(
    issuer: options.Issuer,
    audience: options.Audience,
    claims: claims,
    notBefore: dataCriacao,
    expires: dataExpiracao,
    signingCredentials: credentials
);
```

O token possui:

- `issuer`: quem emitiu o token;
- `audience`: para qual aplicação ele foi emitido;
- claims: dados necessários para identificar o usuário;
- `notBefore`: momento a partir do qual ele é válido;
- `expires`: momento em que ele deixa de ser válido;
- assinatura: proteção contra alterações.

Na inicialização, a API configura as mesmas informações para validar tokens recebidos:

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = jwtOptions.Issuer,

    ValidateAudience = true,
    ValidAudience = jwtOptions.Audience,

    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(jwtOptions.Key)
    ),

    NameClaimType = ClaimTypes.NameIdentifier,
    ClockSkew = TimeSpan.FromSeconds(30)
};
```

A API rejeita tokens com emissor, público, validade ou assinatura incorretos.

---

## Protegendo as rotas e o Swagger

As rotas de contatos e compromissos da `v4` utilizam `[Authorize]`:

```csharp
[ApiController]
[Route("api/contatos")]
[Authorize]
public sealed class ContatosController : ControllerBase
```

Também há uma política global no `Program.cs`:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

Essa política exige autenticação por padrão. O `[AllowAnonymous]` do `AuthController` libera apenas as rotas de registrar e entrar.

O pipeline deve autenticar antes de autorizar:

```csharp
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
```

`UseAuthentication` lê e valida o token. `UseAuthorization` verifica se a requisição pode acessar o endpoint.

### O componente Authorize do Swagger

Para testar endpoints protegidos no Swagger UI, a `v4` registra uma definição de segurança:

```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o token JWT no formato: Bearer {token}"
    });
});
```

O requisito de segurança relaciona essa definição às rotas documentadas:

```csharp
options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
{
    [new OpenApiSecuritySchemeReference("Bearer", document, null)] = []
});
```

Com a aplicação em execução:

1. Abra `/swagger`.
2. Execute `POST /api/auth/registrar` se ainda não houver usuário.
3. Execute `POST /api/auth/entrar`.
4. Copie somente o valor de `accessToken` da resposta.
5. Clique em **Authorize**.
6. Informe `Bearer ` seguido do token.
7. Confirme e execute uma rota protegida, como `GET /api/contatos`.

O Swagger passará a enviar o cabeçalho:

```text
Authorization: Bearer eyJ...
```

> O botão **Authorize** não cria o token. Ele apenas configura o token para que o Swagger o envie nas requisições.

---

## Exercício: autenticar e verificar o isolamento

Execute a API `v4` com uma chave JWT configurada nos User Secrets.

1. Registre dois usuários usando `POST /api/auth/registrar`.
2. Faça login com o primeiro usuário.
3. Clique em **Authorize** no Swagger e informe o token recebido.
4. Cadastre um contato usando `POST /api/contatos`.
5. Faça login com o segundo usuário e substitua o token no Swagger.
6. Consulte `GET /api/contatos` e confirme que o contato do primeiro usuário não aparece.
7. Tente chamar uma rota protegida sem token e observe a resposta `401 Unauthorized`.
8. Verifique no corpo do erro o `type`, o `title`, o `detail` e o `traceId`.

O objetivo é observar as duas responsabilidades:

- o middleware verifica se o usuário possui um token válido;
- o `DbContext` restringe os dados ao `UsuarioId` do usuário autenticado.

---

## Conclusão

A `v4` combina Identity e JWT para proteger a Web API:

- o domínio define contratos para entidades pertencentes a usuários;
- a infraestrutura registra o Identity e integra suas tabelas ao `DbContext`;
- filtros globais e `SaveChanges` isolam os dados de cada usuário;
- `AuthController` oferece registro e login anônimos;
- `JwtProvider` gera tokens assinados;
- `AddJwtBearer` valida os tokens recebidos;
- `[Authorize]` e a política global protegem as rotas;
- a configuração do Swagger oferece o botão **Authorize** para testar a API.

A chave JWT deve ser aleatória, mantida em segredo e diferente entre ambientes quando necessário.

Referências:

- [Aplicações Multi-Usuário com ASP.NET Identity](/conteudo/aplicacoes-multi-usuario-identity);
- [Projeto e-Agenda API na branch `v4`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v4);
- [`EAgendaDbContext.cs`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v4/src/eAgenda.Infra/Compartilhado/Orm/EAgendaDbContext.cs);
- [`InjecaoDependencia.cs` da Infraestrutura](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v4/src/eAgenda.Infra/InjecaoDependencia.cs);
- [`AuthController.cs`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v4/src/eAgenda.WebApi/Features/Auth/AuthController.cs);
- [`JwtProvider.cs`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v4/src/eAgenda.WebApi/Compartilhado/Identity/JwtProvider.cs);
- [`Program.cs` da Web API](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v4/src/eAgenda.WebApi/Program.cs);
- [Documentação de autenticação JWT no ASP.NET Core](https://learn.microsoft.com/aspnet/core/security/authentication/configure-jwt-bearer-authentication).
