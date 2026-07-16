---
draft: false
slug: /conteudo/autenticacao-aspnet-core-identity
tags:
  - Aula 20
  - Autenticação
  - Autorização
  - Identity
  - ASP.NET Core
---

# Autenticação e Autorização com ASP.NET Core Identity

## O problema de um sistema sem proteção

Até agora, construímos aplicações com:

- Controllers;
- Views;
- Entity Framework;
- Repositórios e Services.

Qualquer pessoa que digitar a URL da aplicação consegue acessar todas as páginas.

Não há proteção:

- qualquer um pode listar, cadastrar, editar e excluir dados;
- não sabemos quem fez cada operação;
- não há diferença entre um visitante e um administrador.

> um sistema sem autenticação é como uma loja sem porta: qualquer um entra, mexe em tudo e vai embora sem deixar rastro.

Para resolver isso, o ASP.NET Core oferece uma ferramenta completa: o **ASP.NET Core Identity**.

---

## O que é o ASP.NET Core Identity

O Identity é o sistema de autenticação oficial do ASP.NET Core.

Ele gerencia:

- cadastro e login de usuários;
- hash e validação de senhas;
- bloqueio temporário após tentativas inválidas (lockout);
- cargos e permissões (roles e claims);
- cookies de sessão e autenticação.

O Identity se integra com o Entity Framework e armazena os dados dos usuários no banco de dados da aplicação.

---

## Pacotes necessários

Para usar o Identity com Entity Framework, precisamos do pacote:

```text
Microsoft.AspNetCore.Identity.EntityFrameworkCore
```

Ele fornece as classes base:

- `IdentityUser<TKey>`: representa um usuário;
- `IdentityRole<TKey>`: representa um cargo;
- `IdentityDbContext<TUser, TRole, TKey>`: DbContext com as tabelas de usuários e roles.

No projeto Infra, o pacote já está no `.csproj`:

```xml
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="10.0.9" />
```

---

## Configurando o DbContext para usar Identity

O DbContext da aplicação deve herdar de `IdentityDbContext` em vez de `DbContext`.

No projeto Escola de Cursos, a classe `EscolaDeCursosDbContext` herda de:

```csharp
IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
```

Vamos entender os parâmetros:

- `IdentityUser<Guid>`: tipo de usuário com chave `Guid`;
- `IdentityRole<Guid>`: tipo de cargo com chave `Guid`;
- `Guid`: tipo da chave usada nas tabelas de Identity.

```csharp
public sealed class EscolaDeCursosDbContext(
    DbContextOptions<EscolaDeCursosDbContext> options
) : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>(options)
{
    // DbSets da aplicação...

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configurações das entidades...
    }
}
```

Ao herdar de `IdentityDbContext`, o Entity Framework cria automaticamente as tabelas de Identity:

- `AspNetUsers`;
- `AspNetRoles`;
- `AspNetUserRoles`;
- `AspNetUserClaims`;
- `AspNetUserLogins`;
- `AspNetUserTokens`.

Essas tabelas armazenam usuários, cargos e dados de autenticação.

---

## Registrando os serviços do Identity

No método de extensão da Infraestrutura, registramos os serviços do Identity:

```csharp
services.AddIdentityCore<IdentityUser<Guid>>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<EscolaDeCursosDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();
```

Vamos entender cada parte:

- `AddIdentityCore`: registra os serviços base do Identity sem UI pré-definida;
- `AddRoles`: ativa o suporte a cargos (roles);
- `AddEntityFrameworkStores`: conecta o Identity ao DbContext que criamos;
- `AddSignInManager`: registra o `SignInManager` para login e logout;
- `AddDefaultTokenProviders`: ativa tokens para confirmação de e-mail e recuperação de senha.

As opções configuram:

- e-mail obrigatório e único;
- senha com mínimo de 8 caracteres, exigindo dígitos e caracteres especiais;
- bloqueio de 5 minutos após 5 tentativas inválidas.

---

## Middleware de Autenticação e Autorização

No `Program.cs`, o pipeline de request deve incluir os middlewares de autenticação e autorização:

```csharp
var app = builder.Build();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultControllerRoute();
```

A ordem é importante:

- `UseAuthentication`: identifica o usuário a partir do cookie ou token;
- `UseAuthorization`: verifica se o usuário tem permissão para acessar o recurso.

Ambos devem vir depois de `UseRouting` e antes de `MapDefaultControllerRoute`.

---

## Política de autorização global

No projeto, configuramos uma política padrão que exige usuário autenticado em todas as rotas:

```csharp
services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

Com isso, qualquer request que não tenha um usuário autenticado será redirecionado para a página de login.

Para permitir acesso sem autenticação em rotas específicas, usamos o atributo `[AllowAnonymous]`.

---

## Autenticação via Cookies

O ASP.NET Core Identity usa cookies por padrão para manter a sessão do usuário.

A configuração dos cookies é feita no método de extensão da Apresentação:

```csharp
services.AddAuthentication(options =>
{
    options.DefaultScheme = IdentityConstants.ApplicationScheme;
    options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
    options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
}).AddCookie(IdentityConstants.ApplicationScheme, cookieOptions =>
{
    cookieOptions.LoginPath = "/Autenticacao/Entrar";
    cookieOptions.AccessDeniedPath = "/Autenticacao/Entrar";
});
```

O `LoginPath` define para onde o usuário é redirecionado quando tenta acessar uma rota protegida.

O `AccessDeniedPath` define para onde o usuário é redirecionado quando não tem permissão.

---

## Criando o Controller de Autenticação

O `AutenticacaoController` é o único controller com `[AllowAnonymous]`.

Ele usa dois serviços principais do Identity:

- `UserManager<IdentityUser<Guid>>`: gerencia usuários (criar, editar, excluir);
- `SignInManager<IdentityUser<Guid>>`: gerencia sessão (login, logout).

```csharp
[AllowAnonymous]
public sealed class AutenticacaoController(
    UserManager<IdentityUser<Guid>> userManager,
    SignInManager<IdentityUser<Guid>> signInManager,
    EscolaDeCursosDbContext dbContext
) : Controller
```

### Action Registrar (GET)

Exibe o formulário de cadastro. Se o usuário já estiver logado, redireciona para o início:

```csharp
[HttpGet]
public ActionResult Registrar()
{
    if (signInManager.IsSignedIn(User))
        return RedirectToAction("Index", "Home");

    return View();
}
```

### Action Registrar (POST)

Recebe os dados do formulário e cria um novo usuário:

```csharp
[HttpPost]
public async Task<ActionResult> Registrar(RegistrarViewModel viewModel)
{
    if (signInManager.IsSignedIn(User))
        return RedirectToAction("Index", "Home");

    if (!ModelState.IsValid)
        return View(viewModel);

    IdentityUser<Guid> user = new IdentityUser<Guid>()
    {
        Id = Guid.CreateVersion7(),
        UserName = viewModel.Email,
        Email = viewModel.Email
    };

    IdentityResult resultado = await userManager.CreateAsync(user, viewModel.Senha);

    if (!resultado.Succeeded)
    {
        foreach (IdentityError erro in resultado.Errors)
            ModelState.AddModelError(string.Empty, erro.Description);

        return View(viewModel);
    }

    await signInManager.SignInAsync(user, isPersistent: false);

    return RedirectToAction("Index", "Home");
}
```

Observe alguns pontos:

- o `UserManager.CreateAsync` valida a senha segundo as regras configuradas;
- o retorno é um `IdentityResult` que contém a lista de erros;
- depois de criar, chamamos `SignInAsync` para fazer o login automático.

### Action Entrar (POST)

Recebe e-mail e senha e tenta autenticar:

```csharp
SignInResult resultado = await signInManager.PasswordSignInAsync(
    viewModel.Email,
    viewModel.Senha,
    viewModel.LembrarMe,
    lockoutOnFailure: true
);

if (resultado.Succeeded)
{
    if (Url.IsLocalUrl(viewModel.ReturnUrl))
        return Redirect(viewModel.ReturnUrl);

    return RedirectToAction("Index", "Home");
}

if (resultado.IsLockedOut)
{
    ModelState.AddModelError(string.Empty,
        "Conta bloqueada temporariamente. Tente novamente mais tarde.");
}
else
{
    ModelState.AddModelError(string.Empty,
        "E-mail ou senha inválidos.");
}
```

O `PasswordSignInAsync` retorna um `SignInResult` que informa:

- `Succeeded`: login bem-sucedido;
- `IsLockedOut`: usuário bloqueado por tentativas excessivas;
- `IsNotAllowed`: usuário não pode fazer login (ex: e-mail não confirmado).

### Action Sair (POST)

Encerra a sessão do usuário:

```csharp
[HttpPost]
public async Task<ActionResult> Sair()
{
    await signInManager.SignOutAsync();

    return RedirectToAction(nameof(Entrar));
}
```

---

## ViewModels de Autenticação

As ViewModels usam DataAnnotations para validação:

```csharp
public record RegistrarViewModel
{
    [Required(ErrorMessage = "O campo \"Nome\" deve ser preenchido.")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "O campo \"Nome\" deve conter entre 2 e 100 caracteres.")]
    public string Nome { get; init; } = string.Empty;

    [Required(ErrorMessage = "O campo \"E-mail\" deve ser preenchido.")]
    [EmailAddress(ErrorMessage = "O campo \"E-mail\" deve conter um endereço de e-mail válido.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "O campo \"Senha\" deve ser preenchido.")]
    [DataType(DataType.Password)]
    [StringLength(100, MinimumLength = 8,
        ErrorMessage = "O campo \"Senha\" deve conter no mínimo 8 caracteres.")]
    public string Senha { get; init; } = string.Empty;

    [Required(ErrorMessage = "O campo \"Confirmar Senha\" deve ser preenchido.")]
    [DataType(DataType.Password)]
    [Compare(nameof(Senha), ErrorMessage = "As senhas não conferem.")]
    public string ConfirmarSenha { get; init; } = string.Empty;
}
```

```csharp
public record EntrarViewModel
{
    [Required(ErrorMessage = "O campo \"E-mail\" deve ser preenchido.")]
    [EmailAddress(ErrorMessage = "O campo \"E-mail\" deve conter um endereço de e-mail válido.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "O campo \"Senha\" deve ser preenchido.")]
    [DataType(DataType.Password)]
    public string Senha { get; init; } = string.Empty;

    public bool LembrarMe { get; init; }

    public string? ReturnUrl { get; init; }
}
```

---

## Views de Autenticação

As Views usam Tag Helpers do ASP.NET Core para gerar os formulários.

### View Entrar

```html
@model EntrarViewModel

<form asp-action="Entrar" method="post">
    <div asp-validation-summary="ModelOnly" class="text-danger"></div>

    <input type="hidden" asp-for="ReturnUrl">

    <div class="mb-3">
        <label asp-for="Email" class="form-label">E-mail</label>
        <input asp-for="Email" class="form-control" autofocus>
        <span asp-validation-for="Email" class="text-danger"></span>
    </div>

    <div class="mb-3">
        <label asp-for="Senha" class="form-label">Senha</label>
        <input asp-for="Senha" type="password" class="form-control">
        <span asp-validation-for="Senha" class="text-danger"></span>
    </div>

    <div class="mb-3 form-check">
        <input asp-for="LembrarMe" class="form-check-input">
        <label asp-for="LembrarMe" class="form-check-label">Lembrar-me</label>
    </div>

    <button class="btn btn-primary" type="submit">Entrar</button>
</form>
```

### View Registrar

Segue o mesmo padrão, adicionando os campos de nome e confirmação de senha.

O `asp-validation-summary` exibe os erros de validação do formulário e também os erros retornados pelo Identity.

---

## Como a Layout lida com o usuário logado

O `_Layout.cshtml` verifica se o usuário está autenticado e adapta a navegação:

```html
@if (User.Identity?.IsAuthenticated == true)
{
    <div class="navbar-nav ms-auto">
        <a class="nav-link" asp-controller="Home" asp-action="Index">Início</a>
        <a class="nav-link" asp-controller="Categoria" asp-action="Listar">Categorias</a>
        <a class="nav-link" asp-controller="Curso" asp-action="Listar">Cursos</a>
        <!-- demais links -->
    </div>

    <div class="dropdown ms-3">
        <button class="btn btn-outline-primary dropdown-toggle" type="button">
            @User.FindFirst(ClaimTypes.Name)?.Value
        </button>
        <ul class="dropdown-menu">
            <li>
                <form asp-controller="Autenticacao" asp-action="Sair" method="post">
                    <button type="submit" class="dropdown-item text-danger">Sair</button>
                </form>
            </li>
        </ul>
    </div>
}
```

A propriedade `User.Identity?.IsAuthenticated` indica se há um usuário logado.

Quando está logado:

- exibe os links de navegação do sistema;
- mostra o nome do usuário (obtido de `User.FindFirst(ClaimTypes.Name)`);
- exibe o botão de Sair.

Quando não está logado, a navbar fica vazia e o FallbackPolicy redireciona para a página de login.

> o menu de navegação só aparece para usuários autenticados. Visitantes são redirecionados automaticamente para a tela de login.

---

## Benefícios do ASP.NET Core Identity

- **Segurança**: senhas armazenadas com hash, proteção contra ataques de força bruta com lockout;
- **Integração com EF**: tabelas de usuários no mesmo banco da aplicação;
- **Flexibilidade**: configuração de regras de senha, bloqueio e confirmação;
- **Extensibilidade**: suporte a cargos, claims, autenticação externa (Google, GitHub);
- **Manutenção**: não precisamos implementar criptografia, cookie handling ou gerenciamento de sessão manualmente.

---

## Conclusão

O ASP.NET Core Identity fornece tudo que precisamos para proteger uma aplicação.

Com ele:

- criamos um sistema de cadastro e login;
- configuramos regras de senha e bloqueio;
- definimos uma política global de autorização;
- permitimos acesso anônimo apenas onde faz sentido.

A partir de agora, nossa aplicação não é mais uma loja sem porta.

Cada usuário tem sua identidade e só acessa o que tem permissão.
