---
draft: false
slug: /conteudo/aplicacoes-multi-usuario-identity
tags:
  - Aula 20
  - Identity
  - Multi-Usuário
  - Segurança
  - ASP.NET Core
---

# Aplicações Multi-Usuário com ASP.NET Identity

## O problema dos dados compartilhados

Na aula anterior, configuramos o ASP.NET Core Identity.

Agora qualquer usuário precisa se autenticar para acessar o sistema.

Porém, todos os usuários autenticados enxergam os mesmos dados.

Se a Escola Exemplo cadastrar um curso, a Escola Modelo também verá esse curso na listagem.

Isso não faz sentido.

Cada escola (instituição) deve ter seus próprios dados isolados:

- categorias;
- cursos;
- aulas;
- instrutores;
- alunos;
- turmas;
- matrículas.

> um usuário não deve enxergar nem modificar dados de outro usuário.

---

## O que é uma aplicação multi-usuário

Uma aplicação multi-usuário é aquela em que cada usuário (ou grupo) possui dados próprios e isolados.

Não se trata de permissão (quem pode criar ou editar).

Trata-se de **propriedade dos dados** (a quem os dados pertencem).

Para implementar isso, cada registro no banco precisa identificar qual usuário é seu dono.

No projeto Escola de Cursos, cada usuário representa uma **instituição de ensino**.

A instituição é criada no momento do cadastro e vincula-se ao IdentityUser.

---

## A interface `IEntidadeUsuario`

A primeira peça é uma interface que define a propriedade `UserId`:

```csharp
namespace EscolaDeCursos.Dominio.Compartilhado.Identity;

public interface IEntidadeUsuario
{
    public Guid UserId { get; set; }
}
```

Toda entidade que pertence a um usuário deve implementar essa interface.

Ela informa ao sistema qual é o dono daquele registro.

---

## A classe base `EntidadeBase<T>`

No projeto, todas as entidades de domínio herdam de `EntidadeBase<T>`.

Essa classe já implementa `IEntidadeUsuario`:

```csharp
using EscolaDeCursos.Dominio.Compartilhado.Identity;

namespace EscolaDeCursos.Dominio.Compartilhado;

public abstract class EntidadeBase<T> : IEntidadeUsuario
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid UserId { get; set; } = Guid.Empty;
    public abstract List<string> Validar();
    public abstract void Atualizar(T entidadeAtualizada);
}
```

Observe que `UserId` começa como `Guid.Empty`.

O valor real será atribuído automaticamente no momento da persistência.

---

## O provedor de usuário atual

Para saber quem é o usuário logado, precisamos de um serviço que extraia o ID do Identity.

A interface `IUserProvider` define esse contrato:

```csharp
namespace EscolaDeCursos.Dominio.Compartilhado.Identity;

public interface IUserProvider
{
    Guid? Id { get; }
    bool EstaAutenticado { get; }
}
```

A implementação concreta fica na camada de Apresentação.

Ela lê o `ClaimTypes.NameIdentifier` do `HttpContext`:

```csharp
using System.Security.Claims;
using EscolaDeCursos.Dominio.Compartilhado.Identity;

namespace EscolaDeCursos.WebApp.Compartilhado.Identity;

public sealed class UserProvider(IHttpContextAccessor httpContextAccessor) : IUserProvider
{
    public Guid? Id
    {
        get
        {
            ClaimsPrincipal? user = httpContextAccessor.HttpContext?.User;

            if (user?.Identity is null || !user.Identity.IsAuthenticated)
                return null;

            string? claim = user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (claim is null || !Guid.TryParse(claim, out Guid id))
                return null;

            return id;
        }
    }

    public bool EstaAutenticado => Id != null;
}
```

Quando o usuário está autenticado, o ASP.NET Core Identity armazena o ID do usuário no cookie.

O `UserProvider` recupera esse ID a partir do `ClaimsPrincipal`.

---

## Isolamento no DbContext

O coração da solução está no DbContext.

Dois mecanismos trabalham juntos para garantir o isolamento.

### Query Filters

No `OnModelCreating`, configuramos filtros globais para cada entidade que implementa `IEntidadeUsuario`:

```csharp
if (userProvider != null)
{
    modelBuilder.Entity<Categoria>()
        .HasQueryFilter(c => c.UserId == userProvider.Id);

    modelBuilder.Entity<Curso>()
        .HasQueryFilter(c => c.UserId == userProvider.Id);

    modelBuilder.Entity<Aula>()
        .HasQueryFilter(a => a.UserId == userProvider.Id);

    modelBuilder.Entity<Instrutor>()
        .HasQueryFilter(i => i.UserId == userProvider.Id);

    modelBuilder.Entity<Aluno>()
        .HasQueryFilter(a => a.UserId == userProvider.Id);

    modelBuilder.Entity<Turma>()
        .HasQueryFilter(t => t.UserId == userProvider.Id);

    modelBuilder.Entity<Matricula>()
        .HasQueryFilter(m => m.UserId == userProvider.Id);
}
```

Com isso, qualquer consulta a essas tabelas já inclui automaticamente o filtro `WHERE UserId = @userId`.

> o programador não precisa lembrar de filtrar manualmente em cada consulta. O Entity Framework faz isso automaticamente.

### SaveChanges

No `SaveChanges`, validamos que:

- entidades novas recebem o `UserId` do usuário logado;
- entidades existentes só podem ser alteradas pelo seu dono;
- entidades só podem ser excluídas pelo seu dono.

```csharp
public override int SaveChanges()
{
    Guid? userId = userProvider?.Id;

    if (!userId.HasValue)
    {
        throw new UnauthorizedAccessException(
            "Não é possível salvar entidades da instituição sem estar autenticado."
        );
    }

    foreach (var entry in ChangeTracker.Entries<IEntidadeUsuario>())
    {
        switch (entry.State)
        {
            case EntityState.Added:
                if (entry.Entity.UserId == Guid.Empty)
                {
                    entry.Property(nameof(IEntidadeUsuario.UserId)).CurrentValue = userId.Value;
                }
                else if (entry.Entity.UserId != userId.Value)
                {
                    throw new UnauthorizedAccessException(
                        "Tentativa de criar entidade para outra instituição."
                    );
                }
                break;

            case EntityState.Modified:
                // Valida se o UserId não foi alterado e se pertence ao usuário atual
                // (código completo no repositório)
                break;

            case EntityState.Deleted:
                // Valida se a entidade pertence ao usuário atual
                // (código completo no repositório)
                break;
        }
    }

    return base.SaveChanges();
}
```

Esse método impede que:

- um usuário crie dados para outra instituição;
- um usuário altere dados de outra instituição;
- um usuário exclua dados de outra instituição.

> são duas camadas de proteção: o query filter isola a leitura, o SaveChanges isola a escrita.

---

## A entidade `Instituicao`

No momento do registro, o sistema cria uma `Instituicao` vinculada ao novo usuário.

```csharp
namespace EscolaDeCursos.Dominio.Modulos.ModuloInstituicao;

public sealed class Instituicao
{
    public Guid UserId { get; set; }
    public string Nome { get; set; } = string.Empty;
}
```

O `UserId` é a chave que liga a instituição ao `IdentityUser`.

O `Nome` é o nome da instituição informado no cadastro.

---

## Atualização no cadastro

O controller de autenticação agora cria o usuário **e** a instituição no mesmo fluxo:

```csharp
IdentityUser<Guid> user = new IdentityUser<Guid>()
{
    Id = Guid.CreateVersion7(),
    UserName = viewModel.Email,
    Email = viewModel.Email
};

IdentityResult resultado = await userManager.CreateAsync(user, viewModel.Senha);

if (!resultado.Succeeded)
{
    // exibe erros...
}

Instituicao instituicao = new Instituicao
{
    UserId = user.Id,
    Nome = viewModel.Nome
};

dbContext.Instituicoes.Add(instituicao);
await dbContext.SaveChangesAsync();

await signInManager.SignInAsync(user, isPersistent: false);
```

A partir desse momento, o `UserId` do `IdentityUser` é o mesmo `UserId` usado em todas as entidades daquela instituição.

---

## Registro de dependências

O `IUserProvider` precisa estar registrado no container de DI.

Na camada de Apresentação:

```csharp
services.AddHttpContextAccessor();
services.AddScoped<IUserProvider, UserProvider>();
```

O `HttpContextAccessor` é necessário porque o `UserProvider` precisa acessar o `HttpContext` fora de um controller.

O `UserProvider` é registrado como **Scoped** porque cada request tem um usuário diferente.

O DbContext também recebe o `IUserProvider` como dependência opcional.

---

## Benefícios

- **Isolamento automático**: nenhuma consulta ou comando precisa filtrar manualmente por usuário;
- **Segurança**: a validação no SaveChanges impede ataques ou falhas que tentem acessar dados de outra instituição;
- **Simplicidade**: os serviços e controllers não precisam conhecer o conceito de multi-usuário;
- **Manutenção**: se uma nova entidade for adicionada, basta implementar `IEntidadeUsuario` e configurar o query filter.

---

## Conclusão

Aplicações multi-usuário exigem que os dados de cada usuário fiquem isolados.

Com ASP.NET Identity, podemos implementar isso usando:

- a interface `IEntidadeUsuario` para marcar entidades com dono;
- o `IUserProvider` para obter o ID do usuário logado;
- query filters para isolar consultas;
- validação no SaveChanges para isolar escritas.

O resultado é um sistema onde cada instituição enxerga apenas seus próprios dados, sem esforço manual em cada operação.

Nas próximas aulas, veremos como adicionar cargos (roles) e permissões mais finas com claims.
