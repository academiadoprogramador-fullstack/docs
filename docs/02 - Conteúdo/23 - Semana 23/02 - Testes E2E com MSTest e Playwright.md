---
draft: false
slug: /conteudo/testes-e2e-mstest-playwright
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - tech-playwright
  - conceito-testes-e2e
  - material-aula-pratica
---

# Testes E2E com MSTest e Playwright

## O que vimos até agora

Nas aulas anteriores, aprendemos a:

- testar regras de domínio com testes unitários;
- aplicar o ciclo Red-Green-Refactor;
- testar repositórios com Entity Framework InMemory;
- isolar Services usando mocks com Moq.

Cada tipo de teste responde a uma pergunta diferente.

| Tipo | Pergunta principal | Exemplo |
|---|---|---|
| Unitário | Uma unidade produz o resultado esperado? | `Disciplina.Validar()` |
| Integração | Duas ou mais partes funcionam juntas? | Repositório com `DbContext` |
| E2E | O usuário consegue concluir um fluxo pela aplicação? | Criar uma conta pela tela |

Nesta aula, vamos testar a aplicação pelo mesmo caminho utilizado pelo usuário:

1. iniciar o servidor web;
2. abrir uma página no navegador;
3. preencher campos;
4. clicar em botões;
5. verificar a resposta exibida pela aplicação.

Esse tipo de teste é chamado de **teste end-to-end**, ou simplesmente **teste E2E**.

> **E2E** significa *end-to-end*, ou de ponta a ponta. O teste percorre um fluxo completo desde a entrada do usuário até a resposta da aplicação.

Antes de continuar, prepare o projeto conforme o documento:

[Instalação e Configuração do Playwright](/conteudo/instalacao-configuracao-playwright)

---

## O problema de testar apenas as camadas internas

Imagine que o cadastro de usuário esteja correto quando testado diretamente pelo Service.

Ainda assim, alguns problemas podem existir na aplicação web:

- a rota pode apontar para a Action errada;
- o formulário pode possuir um `label` incorreto;
- o botão pode não enviar o formulário;
- a View pode exibir uma mensagem diferente da esperada;
- a autenticação pode não redirecionar o usuário;
- um Controller pode não estar conectado à View correta.

Um teste unitário do Service não encontra esses problemas.

Um teste de integração do banco também não encontra todos eles.

Para verificar o fluxo completo, precisamos utilizar a aplicação como um usuário utilizaria.

### O fluxo manual

Sem testes E2E, poderíamos verificar o cadastro assim:

1. iniciar a aplicação manualmente;
2. abrir o navegador;
3. acessar a tela de registro;
4. preencher e-mail e senha;
5. clicar em **Criar Conta**;
6. verificar se a aplicação voltou para a página inicial.

Esse procedimento é importante durante o desenvolvimento.

Porém, repeti-lo manualmente depois de cada alteração é demorado.

Com um teste E2E, esse fluxo fica registrado em código e pode ser repetido pelo terminal.

---

## O que é o Playwright?

O Playwright é uma biblioteca de automação de navegadores.

Ele permite controlar navegadores como:

- Chromium;
- Firefox;
- WebKit.

Com o Playwright, o teste pode:

- navegar para uma URL;
- localizar elementos da página;
- preencher campos;
- clicar em botões;
- verificar textos, títulos e URLs;
- capturar screenshots quando necessário.

O Playwright não substitui o MSTest.

O MSTest continua organizando e executando os métodos de teste.

O Playwright fornece o navegador e as operações realizadas nele.

| Ferramenta | Responsabilidade |
|---|---|
| MSTest | Descobrir, executar e relatar os testes |
| Playwright | Controlar o navegador e a página |
| ASP.NET Core | Executar a aplicação web |
| Entity Framework InMemory | Isolar os dados durante o teste |

---

## A estrutura de um teste E2E

Depois da configuração, o projeto pode possuir esta estrutura:

```text
tests/GeradorDeProvas.Testes.E2E/
  Compartilhado/
    TestApplicationFactory.cs
  Modulos/
    AutenticacaoE2ETests.cs
  MSTestSettings.cs
  playwright.runsettings
```

A `TestApplicationFactory` inicia a aplicação e fornece a URL usada pelo navegador.

O arquivo `playwright.runsettings` informa qual navegador utilizar e se ele deve ser headless.

Esses arquivos são explicados no documento de instalação e configuração.

Nesta aula, vamos utilizar a fábrica e nos concentrar no código dos testes.

---

## O `PageTest` do Playwright

O pacote `Microsoft.Playwright.MSTest.v4` fornece a classe base `PageTest`.

Ao herdar dessa classe, o teste recebe uma propriedade `Page`:

```csharp
using Microsoft.Playwright.MSTest;

public sealed class ExemploE2ETests : PageTest
{
    [TestMethod]
    public async Task DeveAbrirAPaginaInicial()
    {
        await Page.GotoAsync("https://localhost:5001/");
    }
}
```

`Page` representa uma aba do navegador.

Os métodos do Playwright são assíncronos porque envolvem comunicação com o navegador.

Por isso, o método de teste deve retornar `Task` e utilizar `await`.

Não devemos bloquear a execução usando `.Wait()` ou `.Result`.

---

## Preparando a aplicação no teste

Cada classe de teste pode criar uma `TestApplicationFactory` no `[TestInitialize]`.

Depois, guarda a URL fornecida pela fábrica:

```csharp
private TestApplicationFactory aplicacao = null!;

private string UrlBase { get; set; } = string.Empty;

[TestInitialize]
public void InicializarAplicacao()
{
    aplicacao = new TestApplicationFactory();

    UrlBase = aplicacao.UrlBase;
}
```

O teste pode navegar sem conhecer a porta escolhida pelo servidor:

```csharp
await Page.GotoAsync($"{UrlBase}/");
```

Ao terminar, a aplicação deve ser encerrada:

```csharp
[TestCleanup]
public async Task EncerrarAplicacao()
{
    try
    {
        if (aplicacao is not null)
            await aplicacao.DisposeAsync();
    }
    finally
    {
        aplicacao = null!;
    }
}
```

O `[TestCleanup]` evita que servidores e recursos fiquem abertos entre execuções.

Como cada fábrica cria um banco InMemory com nome próprio, os testes também ficam mais isolados.

---

## Primeiro teste: tela de login

O primeiro cenário verifica o comportamento de um usuário anônimo.

Quando ele acessa a página inicial, a aplicação deve exibir a tela de login.

```csharp
using System.Text.RegularExpressions;
using GeradorDeProvas.Testes.E2E.Compartilhado;
using Microsoft.Playwright.MSTest;

namespace GeradorDeProvas.Testes.E2E.Modulos;

[TestClass]
public sealed class AutenticacaoE2ETests : PageTest
{
    private TestApplicationFactory aplicacao = null!;

    private string UrlBase { get; set; } = string.Empty;

    [TestInitialize]
    public void InicializarAplicacao()
    {
        aplicacao = new TestApplicationFactory();

        UrlBase = aplicacao.UrlBase;
    }

    [TestCleanup]
    public async Task EncerrarAplicacao()
    {
        try
        {
            if (aplicacao is not null)
                await aplicacao.DisposeAsync();
        }
        finally
        {
            aplicacao = null!;
        }
    }

    [TestMethod]
    public async Task Deve_Exibir_TelaDeLogin_ParaUsuarioAnonimo()
    {
        // Act
        await Page.GotoAsync($"{UrlBase}/");

        // Assert
        await Expect(Page).ToHaveTitleAsync(new Regex("Entrar"));
    }
}
```

O teste utiliza as etapas do MSTest:

- `[TestInitialize]` prepara a aplicação antes de cada método;
- `[TestMethod]` identifica o cenário que será executado;
- `[TestCleanup]` encerra a aplicação depois do cenário.

### Navegando com `GotoAsync`

O método `GotoAsync` acessa uma URL:

```csharp
await Page.GotoAsync($"{UrlBase}/");
```

O teste utiliza a porta escolhida pela `TestApplicationFactory`.

Ele não depende de uma aplicação iniciada manualmente em uma porta fixa.

### Verificando o título com `Expect`

O Playwright fornece asserções próprias para elementos e páginas:

```csharp
await Expect(Page).ToHaveTitleAsync(new Regex("Entrar"));
```

Estamos verificando que o título da página contém a palavra `Entrar`.

Essa verificação aguarda automaticamente até que o resultado esperado apareça ou até que o tempo limite seja atingido.

Isso é mais confiável do que consultar o título imediatamente após a navegação.

---

## Segundo teste: registrar um usuário

Agora vamos automatizar um fluxo completo de cadastro.

O cenário será:

1. acessar a tela de registro;
2. preencher o e-mail;
3. preencher a senha;
4. confirmar a senha;
5. clicar em **Criar Conta**;
6. conferir o redirecionamento para a página inicial.

```csharp
[TestMethod]
public async Task Deve_RegistrarEAutenticar_Usuario()
{
    // Arrange
    const string email = "novo.usuario@teste.local";
    const string senha = "Senha123!";

    await Page.GotoAsync($"{UrlBase}/Autenticacao/Registrar");

    // Act
    await Page.GetByLabel("E-mail").FillAsync(email);
    await Page.GetByLabel("Senha", new() { Exact = true }).FillAsync(senha);
    await Page.GetByLabel("Confirmar Senha").FillAsync(senha);

    await Page.GetByRole(
        AriaRole.Button,
        new() { Name = "Criar Conta" }
    ).ClickAsync();

    // Assert
    string rotaAbsoluta = new Uri(Page.Url).AbsolutePath;

    Assert.AreEqual("/", rotaAbsoluta);
}
```

Esse teste combina duas formas de verificação:

- o Playwright localiza e interage com os elementos da tela;
- o MSTest verifica a rota final com `Assert.AreEqual`.

O resultado esperado é que, depois do cadastro, o usuário esteja autenticado e seja redirecionado para `/`.

---

## Localizando elementos da página

Um teste E2E precisa encontrar os elementos com os quais irá interagir.

O Playwright possui vários locators.

### Localizando por label

Para preencher o e-mail, usamos:

```csharp
await Page.GetByLabel("E-mail").FillAsync(email);
```

Esse locator procura o campo associado ao texto do `label`.

Ele representa melhor a forma como um usuário identifica o campo.

Para que funcione, a View precisa possuir uma associação correta entre o `label` e o `input`:

```html
<label for="Email">E-mail</label>
<input id="Email" name="Email" type="email" />
```

### Usando `Exact`

Na tela de registro, há mais de um campo relacionado à senha.

Para selecionar somente o campo chamado `Senha`, usamos:

```csharp
await Page.GetByLabel(
    "Senha",
    new() { Exact = true }
).FillAsync(senha);
```

O `Exact = true` evita que o locator também corresponda a `Confirmar Senha`.

### Localizando por papel acessível

Para clicar no botão, usamos:

```csharp
await Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta" }
).ClickAsync();
```

O `AriaRole.Button` informa que procuramos um botão.

O `Name` informa o nome acessível do botão.

Essa abordagem é preferível a depender de uma classe CSS criada apenas para o teste:

```csharp
// Mais frágil quando a aparência da tela muda.
await Page.Locator(".btn-primary").ClickAsync();
```

Classes CSS descrevem principalmente aparência.

Labels e papéis acessíveis descrevem a função do elemento.

> Locators baseados no comportamento e na acessibilidade da tela costumam ser mais resistentes a mudanças visuais.

---

## Assert do Playwright e Assert do MSTest

O Playwright e o MSTest possuem asserções, mas elas têm usos diferentes.

### Assert do Playwright

Use `Expect` quando a verificação depende de uma página ou de um elemento:

```csharp
await Expect(Page).ToHaveTitleAsync(new Regex("Entrar"));
```

Outros exemplos:

```csharp
await Expect(Page.GetByText("Conta criada")).ToBeVisibleAsync();
await Expect(Page.GetByRole(AriaRole.Heading))
    .ToContainTextAsync("Bem-vindo");
await Expect(Page.Locator("input")).ToHaveCountAsync(3);
```

Essas asserções fazem esperas automáticas.

### Assert do MSTest

Use `Assert` para valores que o código do teste já possui:

```csharp
string rotaAbsoluta = new Uri(Page.Url).AbsolutePath;

Assert.AreEqual("/", rotaAbsoluta);
```

As duas formas podem aparecer no mesmo cenário.

Não precisamos escolher uma única ferramenta para todas as verificações.

---

## Arrange, Act e Assert em um teste E2E

O padrão Arrange, Act e Assert continua válido.

A diferença é que a ação agora atravessa a aplicação inteira.

### Arrange

Preparamos os dados e acessamos a tela inicial do fluxo:

```csharp
const string email = "novo.usuario@teste.local";
const string senha = "Senha123!";

await Page.GotoAsync($"{UrlBase}/Autenticacao/Registrar");
```

### Act

Executamos as ações do usuário:

```csharp
await Page.GetByLabel("E-mail").FillAsync(email);
await Page.GetByLabel("Senha", new() { Exact = true }).FillAsync(senha);
await Page.GetByLabel("Confirmar Senha").FillAsync(senha);

await Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta" }
).ClickAsync();
```

### Assert

Verificamos o resultado observado pelo usuário:

```csharp
string rotaAbsoluta = new Uri(Page.Url).AbsolutePath;

Assert.AreEqual("/", rotaAbsoluta);
```

O teste não chama diretamente o Service de autenticação.

Ele verifica o fluxo pela interface.

---

## Quando um teste E2E falha

Uma falha pode estar em várias partes do fluxo.

Devemos investigar a mensagem apresentada pelo teste e separar as possibilidades.

### O servidor não iniciou

Verifique:

- se o projeto web compila;
- se a `TestApplicationFactory` referencia o `Program` correto;
- se a porta escolhida está disponível;
- se a configuração do ambiente `Testing` está válida.

### O locator não encontrou o elemento

Verifique:

- o texto do `label`;
- o `id` associado ao `label`;
- o nome acessível do botão;
- se a página correta foi acessada;
- se o elemento aparece apenas depois de alguma operação assíncrona.

Um locator como este depende do texto real da View:

```csharp
Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta" }
);
```

Se o botão for alterado para `Registrar`, o teste deve ser atualizado ou a View deve preservar o contrato esperado.

### A rota final está diferente

Se a asserção esperava `/`, mas a aplicação permaneceu em `/Autenticacao/Registrar`, investigue:

- mensagens de validação;
- senha que não atende aos requisitos;
- e-mail já cadastrado;
- falha no Controller;
- falha na persistência;
- regra de redirecionamento.

O teste E2E pode revelar que a tela parece correta, mas o fluxo não foi concluído.

### Dados compartilhados entre testes

Se um teste encontrar um usuário criado por outro, verifique:

- se cada fábrica cria um nome de banco diferente;
- se os testes usam e-mails únicos;
- se o ambiente está realmente usando o banco InMemory;
- se algum estado estático foi compartilhado.

O banco de cada fábrica deve ser isolado sempre que possível.

Problemas de instalação do navegador devem ser investigados no documento de configuração:

[Problemas comuns na configuração do Playwright](/conteudo/instalacao-configuracao-playwright)

---

## O que testar em E2E

Testes E2E são mais lentos e mais sensíveis que testes unitários.

Por isso, não precisamos testar cada combinação de regra pela interface.

Devemos priorizar fluxos importantes para o usuário, como:

- acessar a tela de login sem autenticação;
- registrar uma conta;
- entrar com credenciais válidas;
- rejeitar credenciais inválidas;
- cadastrar uma disciplina pela tela;
- editar uma disciplina existente;
- impedir a exclusão de uma disciplina com matérias vinculadas;
- criar uma prova com os dados selecionados;
- visualizar os detalhes de uma prova.

As regras detalhadas continuam sendo protegidas pelos testes unitários e de integração.

Uma distribuição possível é:

| Camada | Quantidade esperada | Objetivo |
|---|---:|---|
| Unitária | Muitas | Proteger regras pequenas e rápidas |
| Integração | Algumas | Proteger comunicação com infraestrutura |
| E2E | Poucas | Proteger fluxos principais do usuário |

> Um teste E2E deve representar um fluxo importante. Ele não deve substituir todos os testes das camadas internas.

---

## Evitando testes E2E frágeis

Um teste frágil falha por uma mudança que não alterou o comportamento importante.

### Não use esperas fixas sem necessidade

Evite:

```csharp
await Task.Delay(3000);
```

Essa espera sempre consome três segundos.

Além disso, três segundos podem não ser suficientes em uma máquina mais lenta.

Prefira uma asserção que espere pelo comportamento:

```csharp
await Expect(Page.GetByText("Conta criada")).ToBeVisibleAsync();
```

### Prefira locators acessíveis

Prefira:

```csharp
Page.GetByLabel("E-mail");
Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta" }
);
```

Evite depender de seletores internos que não representam a função do elemento:

```csharp
Page.Locator("div.form-group:nth-child(2) input");
```

Esse seletor pode quebrar apenas porque uma `div` foi adicionada na View.

### Use dados que não colidam

Quando o cenário exige um dado único, podemos gerar um valor:

```csharp
string email = $"usuario-{Guid.NewGuid():N}@teste.local";
```

Isso evita que uma execução anterior impeça o cadastro.

### Verifique o comportamento relevante

O teste de cadastro não precisa conferir todas as classes CSS da página.

Ele precisa verificar que:

- os dados foram enviados;
- o usuário foi autenticado;
- o redirecionamento esperado ocorreu.

Quanto mais detalhes irrelevantes o teste verifica, maior será o custo de manutenção.

---

## Testes E2E e testes de autenticação

Autenticação é um bom exemplo de fluxo E2E.

O teste de registro percorre várias partes:

```text
Página de registro
  -> formulário HTML
    -> Controller
      -> Service de autenticação
        -> ASP.NET Core Identity
          -> banco de dados
            -> redirecionamento
```

Um teste unitário do Service não verifica todo esse caminho.

Um teste E2E confirma que as partes estão conectadas para o usuário.

No exemplo da aula, o teste acessa:

```text
/Autenticacao/Registrar
```

Preenche os campos:

```text
E-mail
Senha
Confirmar Senha
```

E clica em:

```text
Criar Conta
```

O nome desses elementos faz parte do contrato observado pelo teste.

Se a equipe decidir alterar esses nomes, deve avaliar o impacto no fluxo e nos testes.

---

## Organização dos arquivos de teste

Os testes E2E podem acompanhar os módulos da aplicação:

```text
tests/GeradorDeProvas.Testes.E2E/
  Compartilhado/
    TestApplicationFactory.cs
  Modulos/
    AutenticacaoE2ETests.cs
    DisciplinaE2ETests.cs
    MateriaE2ETests.cs
    QuestaoE2ETests.cs
    ProvaE2ETests.cs
```

`TestApplicationFactory` concentra a preparação da aplicação.

Cada classe de teste concentra os fluxos de um módulo.

O nome `AutenticacaoE2ETests` deixa claro:

- qual módulo está sendo testado;
- que o teste é de ponta a ponta.

Os nomes dos métodos também devem descrever o comportamento:

```text
Deve_Exibir_TelaDeLogin_ParaUsuarioAnonimo
Deve_RegistrarEAutenticar_Usuario
Deve_Rejeitar_CredenciaisInvalidas
```

Um nome como `Teste1` não ajuda a investigar uma falha.

---

## Paralelismo e isolamento

O projeto de referência configura a execução paralela do MSTest:

```csharp
[assembly: Parallelize(Workers = 4, Scope = ExecutionScope.MethodLevel)]
```

O paralelismo pode diminuir o tempo total de execução.

Porém, ele exige cuidado com estado compartilhado.

Os testes E2E devem:

- criar sua própria `TestApplicationFactory`;
- utilizar um banco InMemory isolado;
- evitar campos estáticos mutáveis;
- evitar depender da ordem de execução;
- gerar dados únicos quando necessário.

Se dois testes dependem do mesmo usuário ou do mesmo registro, a execução paralela pode produzir resultados imprevisíveis.

Nesse caso, devemos isolar os dados ou rever se o cenário realmente precisa ser E2E.

---

## O que não fazer em testes E2E

### Não chamar diretamente o método que queremos testar

Este não é um teste E2E:

```csharp
Result resultado = servicoAutenticacao.Registrar(dto);
```

Esse código pode ser um teste unitário do Service.

Em um teste E2E, o usuário interage com a interface:

```csharp
await Page.GetByLabel("E-mail").FillAsync(email);
await Page.GetByRole(
    AriaRole.Button,
    new() { Name = "Criar Conta" }
).ClickAsync();
```

### Não depender de um servidor externo

Evite que o teste dependa de:

- uma aplicação publicada na internet;
- um banco compartilhado pela equipe;
- dados criados manualmente;
- uma porta fixa ocupada por outro processo.

Essas dependências tornam o resultado difícil de reproduzir.

### Não criar dezenas de cenários iguais

Se uma regra de senha possui dez combinações inválidas, não é necessário testar todas pela interface.

As combinações detalhadas podem ser verificadas no Service ou no domínio.

O E2E deve cobrir alguns fluxos representativos.

### Não ignorar a limpeza

Se a aplicação for iniciada no `[TestInitialize]`, ela deve ser encerrada no `[TestCleanup]`.

Sem a limpeza, servidores e recursos podem continuar abertos entre execuções.

---

## Exercício: criar testes E2E de disciplinas

Crie uma classe `DisciplinaE2ETests` no projeto de testes E2E.

Implemente os seguintes cenários:

- usuário autenticado consegue acessar a listagem de disciplinas;
- usuário autenticado consegue cadastrar uma disciplina;
- a nova disciplina aparece na listagem;
- o sistema rejeita o cadastro de uma disciplina sem nome;
- usuário autenticado consegue acessar a edição de uma disciplina;
- usuário autenticado consegue excluir uma disciplina sem vínculos.

Para cada teste:

1. prepare a aplicação com `TestApplicationFactory`;
2. navegue até a tela necessária com `Page.GotoAsync`;
3. localize os campos por label ou papel acessível;
4. preencha os dados com `FillAsync`;
5. execute a ação com `ClickAsync`;
6. verifique a mensagem, a URL ou o elemento exibido;
7. encerre a aplicação no cleanup;
8. execute o projeto com `dotnet test`.

Antes de escrever os locators, leia as Views do módulo de disciplinas.

O texto usado em `GetByLabel` e `GetByRole` precisa corresponder aos elementos reais da aplicação.

Como extensão, crie um fluxo de autenticação reutilizável para os testes que exigem usuário autenticado.

Não copie uma senha ou um cookie de um ambiente externo.

O teste deve criar o usuário no ambiente isolado ou utilizar uma estratégia de autenticação própria para testes.

---

## Testes de diferentes camadas

Uma solução pode possuir projetos separados para cada objetivo:

```text
tests/
  GeradorDeProvas.Testes.Unidade/
  GeradorDeProvas.Testes.Integracao/
  GeradorDeProvas.Testes.E2E/
```

Essa separação ajuda a entender o motivo de uma falha.

Se um teste unitário falhar, investigamos uma unidade ou regra.

Se um teste de integração falhar, investigamos a comunicação com a infraestrutura.

Se um teste E2E falhar, investigamos o fluxo completo, incluindo a interface.

Um fluxo de cadastro pode ser protegido assim:

```text
Unitário:
  senha inválida produz erro

Integração:
  usuário válido é persistido

E2E:
  usuário consegue preencher o formulário e concluir o registro
```

As verificações se complementam.

Nenhuma delas torna as outras desnecessárias.

---

## Conclusão

Testes E2E verificam um fluxo completo da aplicação pela perspectiva do usuário.

Com MSTest e Playwright, aprendemos a:

- herdar de `PageTest`;
- iniciar a aplicação com a fábrica configurada;
- navegar com `GotoAsync`;
- preencher campos com `FillAsync`;
- clicar em botões com `ClickAsync`;
- localizar elementos por label e papel acessível;
- verificar páginas com `Expect`;
- combinar asserções do Playwright com `Assert` do MSTest;
- organizar testes por módulo;
- proteger fluxos principais sem duplicar todos os testes internos.

O exemplo da aula automatizou dois fluxos de autenticação:

- exibir a tela de login para um usuário anônimo;
- registrar e autenticar um novo usuário.

Testes E2E são mais próximos do uso real, mas também são mais lentos e dependem de mais componentes.

Por isso, devemos utilizá-los para proteger os fluxos principais da aplicação.

As regras menores continuam sendo verificadas pelos testes unitários.

Os repositórios e integrações continuam sendo protegidos pelos testes de integração.

Uma suíte equilibrada combina as três camadas.

Referências utilizadas nos exemplos:

- [Instalação e Configuração do Playwright](/conteudo/instalacao-configuracao-playwright);
- [Projeto Gerador de Provas na branch `v6`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v6);
- [Projeto de testes E2E na branch `v6`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v6/tests/GeradorDeProvas.Testes.E2E);
- [Implementação inicial de Playwright na branch `v6`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/commit/d7e216b07fee265a54320bc15a1250349c4914eb);
- [Documentação do Playwright para .NET](https://playwright.dev/dotnet/docs/intro);
- [Documentação do MSTest](https://learn.microsoft.com/dotnet/core/testing/unit-testing-csharp-with-mstest);
- [Testes Automatizados com MSTest](/conteudo/testes-automatizados-mstest);
- [Testes de Integração com Entity Framework InMemory](/conteudo/testes-integracao-entity-framework-inmemory);
- [Testes Unitários com Moq](/conteudo/testes-unitarios-moq).
