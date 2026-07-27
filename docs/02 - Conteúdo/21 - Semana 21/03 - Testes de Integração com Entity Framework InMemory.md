---
draft: false
slug: /conteudo/testes-integracao-entity-framework-inmemory
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - tech-entity-framework-core
  - material-aula-pratica
---

# Testes de Integração com Entity Framework InMemory

## O que vimos até agora

Nas aulas anteriores, aprendemos:

- testes unitários com MSTest;
- o padrão Arrange, Act e Assert;
- TDD com o ciclo Red-Green-Refactor.

Testamos entidades do domínio como `Disciplina`, `Materia`, `Questao` e `Prova`.

Esses testes são rápidos e não dependem de banco de dados.

Porém, eles não verificam se os dados realmente persistem.

Não verificam se os relacionamentos entre entidades são carregados corretamente por um repositório.

---

## O problema de testar apenas o domínio

O domínio contém as regras de negócio.

Mas a aplicação também depende de uma camada de infraestrutura.

No projeto Gerador de Provas, essa camada inclui:

- o `GeradorDeProvasDbContext`;
- as configurações de entidade (`ProvaConfiguration`);
- os repositórios (`RepositorioProvaEmOrm`);
- as migrations do Entity Framework.

Testes unitários não cobrem esses elementos.

Por exemplo, o repositório `RepositorioProvaEmOrm` faz isso ao selecionar uma prova:

```csharp
public override Prova? SelecionarPorId(Guid idSelecionado)
{
    return registros
        .Include(p => p.Disciplina)
        .Include(p => p.Materia)
        .Include(p => p.Questoes)
            .ThenInclude(q => q.Alternativas)
        .SingleOrDefault(p => p.Id == idSelecionado);
}
```

Esse método carrega vários relacionamentos.

Se um `Include` for removido por engano, a consulta não trará os dados esperados.

Um teste unitário da entidade `Prova` não detectaria esse problema.

---

## O que é um teste de integração?

Um teste de integração verifica a comunicação entre duas ou mais camadas do sistema.

Enquanto o teste unitário isola uma única unidade, o teste de integração aproxima o cenário real.

No nosso caso, vamos testar o repositório conectado a um banco de dados em memória.

O teste vai:

1. criar entidades de domínio;
2. chamar o repositório para cadastrar;
3. consultar os dados novamente;
4. verificar se os relacionamentos foram preservados.

> um teste de integração não substitui o teste unitário. Cada tipo cobre uma camada diferente.

---

## Teste unitário vs teste de integração

| Característica | Unitário | Integração |
|---|---|---|
| O que testa | Uma unidade isolada | Comunicação entre partes |
| Banco de dados | Não | Sim (em memória ou real) |
| Velocidade | Muito rápida | Rápida (em memória) |
| Dependências | Nenhuma | ORM, provedor de usuário |
| Exemplo | `Disciplina.Validar()` | `RepositorioProvaEmOrm.SelecionarPorId()` |

Os dois tipos são complementares.

Testes unitários protegem as regras.

Testes de integração protegem o funcionamento da infraestrutura.

---

## O projeto de testes de integração

No repositório de referência, os testes de integração ficam em um projeto separado:

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
    Identity/
      ProvedorDeUsuarioFake.cs
    ModuloProva/
      RepositorioProvaEmOrmTests.cs
    MSTestSettings.cs
```

O projeto `GeradorDeProvas.Testes.Integracao` referencia o projeto de infraestrutura:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.9" />
    <PackageReference Include="MSTest" Version="4.0.2" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../../src/GeradorDeProvas.Infra/GeradorDeProvas.Infra.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Microsoft.VisualStudio.TestTools.UnitTesting" />
  </ItemGroup>
</Project>
```

O pacote `Microsoft.EntityFrameworkCore.InMemory` fornece o banco de dados em memória.

A referência para `GeradorDeProvas.Infra` permite acessar o `DbContext` e os repositórios.

---

## O ProvedorDeUsuarioFake

O `GeradorDeProvasDbContext` depende de um provedor de usuário.

Nas aulas anteriores (semana 20), vimos que o Identity adiciona esse provedor automaticamente na aplicação real.

Para testes, precisamos de uma implementação falsa.

O repositório de referência utiliza esta classe:

```csharp
using GeradorDeProvas.Dominio.Compartilhado.Identity;

namespace GeradorDeProvas.Testes.Integracao.Identity;

public sealed class ProvedorDeUsuarioFake(Guid userId) : IProvedorDeUsuario
{
    public Guid? Id => userId;

    public bool EstaAutenticado => true;
}
```

Ela implementa a interface `IProvedorDeUsuario`.

No construtor, recebe um `userId` e o retorna sempre.

`EstaAutenticado` retorna `true` para que o `DbContext` permita salvar entidades.

Isso é suficiente para os testes.

---

## Preparando o banco em memória

Cada teste precisa de um banco de dados novo e isolado.

O método `CriarDbContext` do repositório de referência faz isso:

```csharp
private GeradorDeProvasDbContext CriarDbContext(Guid userId)
{
    DbContextOptions<GeradorDeProvasDbContext> options =
        new DbContextOptionsBuilder<GeradorDeProvasDbContext>()
            .UseInMemoryDatabase("GeradorDeProvasTestDB_Memory")
            .Options;

    return new GeradorDeProvasDbContext(options, new ProvedorDeUsuarioFake(userId));
}
```

O `UseInMemoryDatabase` configura o Entity Framework para usar um banco em memória.

O nome `"GeradorDeProvasTestDB_Memory"` é o identificador desse banco.

> **Atenção:** bancos em memória com o mesmo nome compartilham os dados. Por isso, cada teste deve usar um `userId` diferente.

---

## Ciclo de vida do teste

A classe de teste utiliza `[TestInitialize]` para preparar o ambiente antes de cada método:

```csharp
private GeradorDeProvasDbContext dbContext = null!;
private RepositorioProvaEmOrm repositorio = null!;

[TestInitialize]
public void InicializarRepositorio()
{
    dbContext = CriarDbContext(Guid.NewGuid());

    repositorio = new RepositorioProvaEmOrm(dbContext);
}
```

`Guid.NewGuid()` gera um identificador único para cada execução.

Isso garante que um teste não interfere nos dados do outro.

O `repositorio` utiliza o `dbContext` recém-criado.

Ao final de cada teste, o banco em memória é descartado junto com o `dbContext`.

---

## Teste: cadastrar e selecionar por ID

O primeiro teste verifica se o cadastro e a consulta preservam os relacionamentos.

```csharp
[TestMethod]
public void CadastrarESelecionarPorId_CarregaRelacionamentosDaProva()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova("Prova de Álgebra", disciplina, materia, 8, 5, false);

    List<Questao> questoesDisponiveis = Enumerable.Range(1, 5)
        .Select(indice => new Questao(
            $"Questão {indice}",
            materia,
            [new Alternativa("4", false), new Alternativa("7", true)]
        ))
        .ToList();

    prova.SortearQuestoes(questoesDisponiveis, new Random(70));

    // Ação
    repositorio.Cadastrar(prova);
    dbContext.ChangeTracker.Clear();

    Prova? provaSelecionada = repositorio.SelecionarPorId(prova.Id);

    // Asserção
    Assert.IsNotNull(provaSelecionada);
    Assert.AreEqual("Prova de Álgebra", provaSelecionada.Titulo);
    Assert.AreEqual(disciplina.Id, provaSelecionada.Disciplina.Id);
    Assert.AreEqual(materia.Id, provaSelecionada.Materia!.Id);
    Assert.HasCount(5, provaSelecionada.Questoes);
    Assert.HasCount(2, provaSelecionada.Questoes[0].Alternativas);
}
```

Vamos entender cada parte.

### Arranjo

Criamos as entidades de domínio normalmente:

- `Disciplina`;
- `Materia` vinculada à disciplina;
- `Prova` vinculada à disciplina e à matéria;
- cinco `Questao` com duas alternativas cada.

O `SortearQuestoes` seleciona aleatoriamente as questões que farão parte da prova.

### Ação

`Cadastrar` persiste a prova no banco em memória.

`dbContext.ChangeTracker.Clear()` limpa o rastreamento de entidades do Entity Framework.

Sem essa limpeza, o `SelecionarPorId` poderia retornar a instância em cache, sem realmente consultar o banco.

### Asserção

Verificamos que:

- a prova foi encontrada;
- o título foi preservado;
- a disciplina carregada é a mesma;
- a matéria carregada é a mesma;
- as cinco questões foram carregadas;
- cada questão carregou suas alternativas.

Se qualquer `Include` do repositório for removido, uma dessas asserções falha.

---

## Teste: editar

O teste de edição verifica se o repositório consegue alterar uma prova existente.

```csharp
[TestMethod]
public void Editar_AtualizaProvaExistente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova("Prova de Álgebra", disciplina, materia, 8, 5, false);

    List<Questao> questoesDisponiveis = Enumerable.Range(1, 5)
        .Select(indice => new Questao(
            $"Questão {indice}",
            materia,
            [new Alternativa("4", false), new Alternativa("7", true)]
        ))
        .ToList();

    prova.SortearQuestoes(questoesDisponiveis, new Random(70));

    repositorio.Cadastrar(prova);

    Prova provaAtualizada = new Prova("Prova Final", disciplina, null!, 8, 5, true);

    // Ação
    bool conseguiuEditar = repositorio.Editar(prova.Id, provaAtualizada);
    dbContext.ChangeTracker.Clear();

    // Asserção
    Assert.IsTrue(conseguiuEditar);
    Assert.AreEqual(
        "Prova Final",
        repositorio.SelecionarPorId(prova.Id)!.Titulo
    );
}
```

O `Editar` recebe o ID da prova original e uma nova instância com os dados atualizados.

Internamente, o repositório chama `Atualizar` na entidade original e persiste a mudança.

A asserção verifica que o retorno foi `true` e que o título mudou.

Observe que `provaAtualizada` possui `Materia` como `null` e `ProvaRecuperacao` como `true`.

Isso representa a transformação em uma prova de recuperação.

---

## Teste: excluir

O teste de exclusão segue o mesmo padrão:

```csharp
[TestMethod]
public void Excluir_RemoveProvaExistente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova("Prova de Álgebra", disciplina, materia, 8, 5, false);

    List<Questao> questoesDisponiveis = Enumerable.Range(1, 5)
        .Select(indice => new Questao(
            $"Questão {indice}",
            materia,
            [new Alternativa("4", false), new Alternativa("7", true)]
        ))
        .ToList();

    prova.SortearQuestoes(questoesDisponiveis, new Random(70));

    repositorio.Cadastrar(prova);

    // Ação
    bool conseguiuExcluir = repositorio.Excluir(prova.Id);
    dbContext.ChangeTracker.Clear();

    // Asserção
    Assert.IsTrue(conseguiuExcluir);
    Assert.IsNull(repositorio.SelecionarPorId(prova.Id));
}
```

Depois de excluir, o `SelecionarPorId` deve retornar `null`.

O `ChangeTracker.Clear()` garante que a consulta vá até o banco e não use o cache.

---

## Teste: selecionar todos

O teste de listagem verifica se `SelecionarTodos` carrega os relacionamentos.

```csharp
[TestMethod]
public void SelecionarTodos_RetornaProvasComRelacionamentos()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova("Prova de Álgebra", disciplina, materia, 8, 5, false);

    List<Questao> questoesDisponiveis = Enumerable.Range(1, 5)
        .Select(indice => new Questao(
            $"Questão {indice}",
            materia,
            [new Alternativa("4", false), new Alternativa("7", true)]
        ))
        .ToList();

    prova.SortearQuestoes(questoesDisponiveis, new Random(70));

    repositorio.Cadastrar(prova);
    dbContext.ChangeTracker.Clear();

    // Ação
    List<Prova> provas = repositorio.SelecionarTodos();

    // Asserção
    Assert.HasCount(1, provas);
    Assert.AreEqual("Matemática", provas.First().Disciplina.Nome);
    Assert.AreEqual("Álgebra", provas.First().Materia!.Nome);
    Assert.HasCount(5, provas.First().Questoes);
}
```

O `SelecionarTodos` usa `Include` para carregar `Disciplina`, `Materia`, `Questoes` e `Alternativas`.

Se algum `Include` faltar, a navegação `provas.First().Disciplina.Nome` lançaria uma exceção ou retornaria `null`.

---

## Observações importantes

### Banco InMemory não é um banco relacional

O `UseInMemoryDatabase` não executa SQL real.

Ele simula um banco usando dicionários em memória.

Isso significa que:

- constraints do banco (como chaves únicas) não são validadas;
- migrações não são executadas;
- comportamentos específicos do SQL Server ou PostgreSQL não são reproduzidos.

O banco em memória é útil para testar a lógica do repositório.

Para testar migrações ou comportamentos específicos do banco, seriam necessários testes com um banco real.

### ChangeTracker.Clear

O `ChangeTracker` do Entity Framework mantém em cache as entidades já consultadas.

Ao chamar `Clear()`, limpamos esse cache.

Isso força o repositório a buscar os dados novamente.

Sem essa chamada, os testes poderiam passar mesmo com Includes ausentes.

### Independência entre testes

Cada método de teste deve criar seu próprio banco ou usar `Guid.NewGuid()` no provedor de usuário.

Se dois testes compartilharem o mesmo banco, um pode interferir no resultado do outro.

O `[TestInitialize]` garante que cada execução comece com um ambiente limpo.

### Organização dos arquivos

Os testes de integração seguem a mesma organização dos módulos:

```text
GeradorDeProvas.Testes.Integracao/
  ModuloProva/
    RepositorioProvaEmOrmTests.cs
```

Isso facilita localizar o teste correspondente a cada repositório.

---

## Exercício: criar testes de integração para `RepositorioDisciplinaEmOrm`

Crie ou revise a classe `RepositorioDisciplinaEmOrmTests.cs` no projeto de testes de integração.

Implemente testes para os seguintes comportamentos:

- cadastrar uma disciplina e selecionar por ID;
- editar o nome de uma disciplina existente;
- excluir uma disciplina e confirmar que foi removida;
- selecionar todas as disciplinas cadastradas.

Para cada teste:

1. crie as entidades no Arrange;
2. execute o método do repositório no Act;
3. use `dbContext.ChangeTracker.Clear()`;
4. verifique o resultado com Assert;
5. execute `dotnet test` e confirme que todos passam.

Lembre-se de:

- utilizar `[TestInitialize]` para criar o `DbContext` e o repositório;
- usar `Guid.NewGuid()` para isolar cada execução;
- testar que os dados persistiram corretamente após a operação.

O repositório de disciplinas não possui `Include`, mas ainda assim precisa ser testado.

---

## Conclusão

Testes de integração verificam se as camadas do sistema se comunicam corretamente.

Com o Entity Framework InMemory, podemos testar repositórios sem configurar um banco de dados real.

Nesta aula, vimos como:

- configurar um projeto de testes com `Microsoft.EntityFrameworkCore.InMemory`;
- criar um `ProvedorDeUsuarioFake` para simular autenticação;
- isolar testes com `Guid.NewGuid()` e `[TestInitialize]`;
- testar cadastro, edição, exclusão e listagem de provas;
- utilizar `ChangeTracker.Clear()` para forçar consultas ao banco.

Os testes de integração complementam os testes unitários vistos nas aulas anteriores.

Enquanto os testes unitários protegem as regras do domínio, os testes de integração protegem o comportamento dos repositórios.

Referência utilizada nos exemplos:

[Branch `v2` no GitHub](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v2)
