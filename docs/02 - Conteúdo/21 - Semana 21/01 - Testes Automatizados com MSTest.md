---
draft: false
slug: /conteudo/testes-automatizados-mstest
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - conceito-testes-unitarios
  - conceito-testes-dominio
  - material-aula-pratica
---

# Testes Automatizados com MSTest

## O problema de testar apenas pela aplicação

Até agora, construímos aplicações com:

- entidades de domínio;
- regras de validação;
- Services;
- repositórios;
- Controllers e Views.

Quando uma regra é criada, é comum testar acessando a tela da aplicação.

Por exemplo, para verificar se uma disciplina não aceita um nome vazio, podemos:

1. iniciar a aplicação;
2. abrir a tela de cadastro;
3. enviar o formulário sem preencher o nome;
4. verificar a mensagem exibida.

Esse teste pode ser útil.

Mas ele depende de várias partes ao mesmo tempo:

- servidor web;
- rota;
- Controller;
- View;
- validação do formulário;
- entidade de domínio.

Se o teste falhar, nem sempre será fácil descobrir qual parte causou o problema.

Além disso, repetir esse processo manualmente para todas as regras consome tempo.

> **Atenção:** testar manualmente continua sendo importante, mas não deve ser a única forma de verificar o comportamento do sistema.

Para testar regras menores de forma rápida e repetível, podemos criar **testes automatizados**.

---

## O que é um teste automatizado?

Um teste automatizado é um código que executa outro código e verifica se o resultado está de acordo com o esperado.

Em vez de uma pessoa conferir manualmente uma mensagem, o teste pode fazer isso:

```csharp
Assert.AreEqual(
    "O campo \"Nome\" deve ser preenchido.",
    erros.First()
);
```

Se a mensagem estiver correta, o teste passa.

Se a mensagem mudar ou a regra deixar de funcionar, o teste falha.

O teste passa a registrar uma expectativa sobre o comportamento do sistema.

Isso traz algumas vantagens:

- execução rápida;
- resultado objetivo;
- repetição sempre que o código mudar;
- identificação antecipada de regressões;
- documentação prática das regras do domínio.

Uma **regressão** acontece quando uma alteração quebra um comportamento que funcionava anteriormente.

---

## O que é um teste de unidade?

Um teste de unidade verifica uma pequena parte do sistema de forma isolada.

Essa unidade pode ser:

- um método;
- uma classe;
- uma entidade;
- uma regra de negócio.

Nesta aula, vamos testar principalmente as entidades do domínio.

Uma entidade de domínio é um bom alvo para testes unitários porque suas regras não precisam de:

- banco de dados;
- servidor web;
- Controller;
- View;
- navegador;
- serviço externo.

Por exemplo, a entidade `Disciplina` possui uma regra sobre o tamanho do seu nome.

Podemos criar a entidade, chamar `Validar` e conferir os erros diretamente.

```csharp
Disciplina disciplina = new Disciplina(string.Empty);

List<string> erros = disciplina.Validar();
```

Esse código testa a regra do domínio sem iniciar o restante da aplicação.

> Um teste unitário deve testar uma unidade pequena e controlar o máximo possível do que acontece ao redor dela.

---

## O que não vamos testar nesta aula

O foco desta aula é o domínio.

Por isso, não vamos testar ainda:

- Controllers;
- Views;
- rotas HTTP;
- banco de dados real;
- Entity Framework;
- autenticação;
- integração entre vários projetos.

Esses assuntos podem ser cobertos por testes de integração ou testes funcionais.

Por enquanto, a pergunta principal será:

> dado um conjunto de objetos e valores, a regra da entidade produz o resultado esperado?

Essa pergunta é pequena.

Por isso, o teste também pode ser pequeno.

---

## O projeto de testes separado

No projeto Gerador de Provas, os testes ficam em um projeto próprio:

```text
GeradorDeProvas.slnx
src/
  GeradorDeProvas.Dominio/
  GeradorDeProvas.Aplicacao/
  GeradorDeProvas.Infra/
  GeradorDeProvas.WebApp/
tests/
  GeradorDeProvas.Testes.Unidade/
```

O projeto `GeradorDeProvas.Testes.Unidade` referencia o projeto `GeradorDeProvas.Dominio`.

Isso permite que os testes usem as entidades reais do domínio.

Ao mesmo tempo, o projeto de testes não precisa referenciar a aplicação web ou a infraestrutura.

Essa separação deixa claro o que está sendo testado.

### Criando o projeto

A partir da pasta raiz da solução, podemos criar um projeto de testes com o comando:

```bash
dotnet new mstest -n GeradorDeProvas.Testes.Unidade -o tests/GeradorDeProvas.Testes.Unidade
```

Depois, adicionamos uma referência ao projeto de domínio:

```bash
dotnet add tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj \
  reference src/GeradorDeProvas.Dominio/GeradorDeProvas.Dominio.csproj
```

Também é possível criar essa referência editando o arquivo `.csproj`.

### Arquivo `.csproj` do projeto de testes

Na branch `tests/v1` do projeto de referência, o projeto de testes possui uma configuração semelhante a esta:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MSTest" Version="4.0.2" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../../src/GeradorDeProvas.Dominio/GeradorDeProvas.Dominio.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Microsoft.VisualStudio.TestTools.UnitTesting" />
  </ItemGroup>
</Project>
```

O pacote `MSTest` reúne os recursos necessários para escrever e executar os testes.

A referência para o domínio permite utilizar classes como `Disciplina` e `Materia`.

O `Using` global evita repetir o seguinte `using` em todos os arquivos:

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
```

> O projeto de testes deve depender do domínio. O domínio não deve depender do projeto de testes.

---

## O que é o MSTest?

O MSTest é o framework de testes da Microsoft para aplicações .NET.

Ele fornece:

- atributos para marcar classes e métodos de teste;
- métodos para comparar resultados;
- integração com `dotnet test`;
- execução pelo Visual Studio e pelo Visual Studio Code;
- informações sobre testes aprovados e testes com falha.

Os dois atributos mais básicos são:

- `[TestClass]`: identifica uma classe que contém testes;
- `[TestMethod]`: identifica um método que deve ser executado como teste.

Exemplo mínimo:

```csharp
[TestClass]
public sealed class ExemploTests
{
    [TestMethod]
    public void DeveSomarDoisNumeros()
    {
        int resultado = 2 + 3;

        Assert.AreEqual(5, resultado);
    }
}
```

O MSTest encontra a classe e o método por causa dos atributos.

O `Assert.AreEqual` compara o valor produzido com o valor esperado.

---

## O padrão Arrange, Act e Assert

Um teste geralmente pode ser dividido em três etapas.

### Arrange

É o arranjo do teste.

Nessa etapa, criamos os objetos e configuramos os dados necessários.

```csharp
Disciplina disciplina = new Disciplina(string.Empty);
```

### Act

É a ação sob teste.

Nessa etapa, chamamos o método ou comportamento que queremos verificar.

```csharp
List<string> erros = disciplina.Validar();
```

### Assert

É a asserção.

Nessa etapa, comparamos o resultado real com o resultado esperado.

```csharp
Assert.HasCount(1, erros);
Assert.AreEqual(
    "O campo \"Nome\" deve ser preenchido.",
    erros.First()
);
```

O fluxo completo fica assim:

```csharp
[TestMethod]
public void Validar_ComNomeVazio_DeveRetornarErro()
{
    // Arrange
    Disciplina disciplina = new Disciplina(string.Empty);

    // Act
    List<string> erros = disciplina.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Nome\" deve ser preenchido.",
        erros.First()
    );
}
```

Os comentários não são obrigatórios.

Eles ajudam a visualizar a estrutura enquanto estamos aprendendo.

No repositório de referência, as etapas aparecem como:

- `Arranjo`;
- `Ação`;
- `Asserção`.

Os nomes mudam, mas a ideia é a mesma.

---

## Primeiro exemplo: testando `Disciplina`

A entidade `Disciplina` possui uma propriedade `Nome`.

Sua validação define que:

- o nome deve ser preenchido;
- o nome deve ter no mínimo dois caracteres;
- o nome deve ter no máximo cem caracteres.

Um recorte da entidade é:

```csharp
public class Disciplina : EntidadeBase<Disciplina>
{
    public string Nome { get; set; } = string.Empty;

    public override List<string> Validar()
    {
        List<string> erros = [];

        if (string.IsNullOrWhiteSpace(Nome))
            erros.Add("O campo \"Nome\" deve ser preenchido.");

        else if (Nome.Length < 2)
            erros.Add("O campo \"Nome\" deve conter no mínimo 2 caracteres.");

        else if (Nome.Length > 100)
            erros.Add("O campo \"Nome\" deve conter no máximo 100 caracteres.");

        return erros;
    }
}
```

### Testando nome vazio

O teste deve criar uma disciplina com `string.Empty`.

Depois, deve verificar que existe exatamente um erro e que a mensagem é a esperada.

```csharp
using GeradorDeProvas.Dominio.Modulos.ModuloDisciplina;

namespace GeradorDeProvas.Testes.Unidade.Modulos.ModuloDisciplina;

[TestClass]
public sealed class DisciplinaTests
{
    [TestMethod]
    public void Validar_ComNomeVazio_DeveRetornarErro()
    {
        // Arrange
        Disciplina disciplina = new Disciplina(string.Empty);

        // Act
        List<string> erros = disciplina.Validar();

        // Assert
        Assert.HasCount(1, erros);
        Assert.AreEqual(
            "O campo \"Nome\" deve ser preenchido.",
            erros.First()
        );
    }
}
```

O teste não verifica como a mensagem foi construída.

Ele verifica o comportamento público de `Validar`.

### Testando nome curto

Para testar um nome com apenas um caractere, podemos utilizar `new string('A', 1)`.

```csharp
[TestMethod]
public void Validar_ComNomeCurto_DeveRetornarErro()
{
    // Arrange
    Disciplina disciplina = new Disciplina(new string('A', 1));

    // Act
    List<string> erros = disciplina.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Nome\" deve conter no mínimo 2 caracteres.",
        erros.First()
    );
}
```

O teste usa um valor no limite inválido.

Esse tipo de valor é importante porque erros costumam aparecer nas fronteiras das regras.

### Testando nome longo

Para testar o limite superior, criamos uma string com cento e um caracteres:

```csharp
[TestMethod]
public void Validar_ComNomeLongo_DeveRetornarErro()
{
    // Arrange
    Disciplina disciplina = new Disciplina(new string('A', 101));

    // Act
    List<string> erros = disciplina.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Nome\" deve conter no máximo 100 caracteres.",
        erros.First()
    );
}
```

Agora temos testes para os três comportamentos inválidos conhecidos da entidade.

Também seria importante adicionar testes para os limites válidos:

- nome com dois caracteres;
- nome com cem caracteres;
- nome preenchido dentro dos limites.

Esses testes são exercícios úteis porque mostram que os limites não devem ser confundidos com os valores inválidos.

---

## Segundo exemplo: testando `Materia`

A entidade `Materia` possui três dados importantes:

- `Nome`;
- `Serie`;
- `Disciplina`.

No projeto de referência, o construtor recebe esses valores:

```csharp
Disciplina disciplina = new Disciplina("Matemática");
Materia materia = new Materia("Quatro Operações", 5, disciplina);
```

A validação da matéria verifica:

- se o nome possui entre dois e cem caracteres;
- se a série foi preenchida;
- se a disciplina foi informada.

### Nome inválido

```csharp
[TestMethod]
public void Validar_SemNome_DeveRetornarErroCorrespondente()
{
    // Arrange
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia(string.Empty, 5, disciplina);

    // Act
    List<string> erros = materia.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Nome\" deve conter entre 2 e 100 caracteres.",
        erros.First()
    );
}
```

Mesmo que o nome esteja vazio, a regra pode utilizar uma única mensagem para todos os valores fora do intervalo.

O teste deve refletir o contrato atual da entidade.

### Série não preenchida

No domínio do projeto, a série `0` representa uma série não preenchida.

```csharp
[TestMethod]
public void Validar_SemSerie_DeveRetornarErroCorrespondente()
{
    // Arrange
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Quatro Operações", 0, disciplina);

    // Act
    List<string> erros = materia.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Série\" deve ser preenchido.",
        erros.First()
    );
}
```

### Disciplina não informada

Uma matéria também precisa estar associada a uma disciplina.

Como o teste quer verificar a ausência da disciplina, podemos passar `null!` para representar esse cenário inválido:

```csharp
[TestMethod]
public void Validar_SemDisciplina_DeveRetornarErroCorrespondente()
{
    // Arrange
    Materia materia = new Materia(
        "Quatro Operações",
        2,
        null!
    );

    // Act
    List<string> erros = materia.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Disciplina\" deve ser preenchido.",
        erros.First()
    );
}
```

O operador `null!` não transforma `null` em um objeto válido.

Ele apenas informa ao compilador que o teste está criando intencionalmente um cenário nulo.

O método `Validar` continua recebendo `null` e pode verificar a regra.

---

## Testando o método `Atualizar`

Testes unitários também podem verificar comportamentos que alteram o estado de um objeto.

A matéria possui um método `Atualizar`:

```csharp
public override void Atualizar(Materia entidadeAtualizada)
{
    Nome = entidadeAtualizada.Nome;
    Serie = entidadeAtualizada.Serie;
    Disciplina = entidadeAtualizada.Disciplina;
}
```

O teste deve criar uma matéria original e outra com os dados atualizados.

Depois, chama `Atualizar` e confere as propriedades da primeira matéria.

```csharp
using GeradorDeProvas.Dominio.Modulos.ModuloDisciplina;
using GeradorDeProvas.Dominio.Modulos.ModuloMateria;

[TestMethod]
public void Atualizar_DeveAtualizarNomeSerieEDisciplina()
{
    // Arrange
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Quatro Operações", 2, disciplina);

    Disciplina disciplinaAtualizada = new Disciplina("História");
    Materia materiaAtualizada = new Materia(
        "História do Brasil",
        5,
        disciplinaAtualizada
    );

    // Act
    materia.Atualizar(materiaAtualizada);

    // Assert
    Assert.AreEqual("História do Brasil", materia.Nome);
    Assert.AreEqual(5, materia.Serie);
    Assert.AreSame(disciplinaAtualizada, materia.Disciplina);
}
```

O `Assert.AreSame` verifica se as duas variáveis apontam para a mesma instância.

Nesse caso, o método deve atribuir a própria referência de `disciplinaAtualizada`.

Esse teste documenta o comportamento de atualização da entidade.

---

## Testando relacionamentos entre objetos

A entidade `Questao` possui uma lista de alternativas.

Seu construtor também vincula cada alternativa à questão criada:

```csharp
foreach (Alternativa alternativa in Alternativas)
    alternativa.Questao = this;
```

Esse comportamento é uma regra importante do domínio.

Sem ele, a alternativa teria uma lista na questão, mas não saberia a qual questão pertence.

Um teste para esse comportamento pode ser escrito assim:

```csharp
[TestMethod]
public void Construtor_DeveVincularCadaAlternativaAQuestao()
{
    // Arrange
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Frações", 5, disciplina);

    List<Alternativa> alternativas =
    [
        new Alternativa("1/2", true),
        new Alternativa("2/3", false)
    ];

    // Act
    Questao questao = new Questao(
        "Qual é o resultado de 2 dividido por 4?",
        materia,
        alternativas
    );

    // Assert
    Assert.HasCount(2, questao.Alternativas);
    Assert.AreSame(questao, alternativas[0].Questao);
    Assert.AreSame(questao, alternativas[1].Questao);
}
```

Esse teste verifica duas coisas relacionadas:

- a questão recebeu as alternativas;
- cada alternativa recebeu a referência para a questão.

O teste pode ter mais de uma asserção quando todas verificam o mesmo comportamento.

Não é necessário criar um teste separado para cada linha do método.

Devemos testar comportamentos importantes, e não linhas de código isoladas.

---

## Testando as regras de `Questao`

No projeto de referência, `Questao.Validar` possui regras como:

- enunciado obrigatório, com no máximo dois mil caracteres;
- matéria obrigatória;
- no mínimo duas alternativas;
- no máximo quatro alternativas;
- exatamente uma alternativa correta.

Um cenário sem alternativa correta pode ser testado com duas alternativas incorretas:

```csharp
[TestMethod]
public void Validar_SemAlternativaCorreta_DeveRetornarErroCorrespondente()
{
    // Arrange
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Frações", 5, disciplina);

    List<Alternativa> alternativas =
    [
        new Alternativa("1/2", false),
        new Alternativa("2/3", false)
    ];

    Questao questao = new Questao(
        "Qual é o resultado de 2 dividido por 4?",
        materia,
        alternativas
    );

    // Act
    List<string> erros = questao.Validar();

    // Assert
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "A questão deve possuir uma alternativa correta.",
        erros.First()
    );
}
```

Para testar mais de uma alternativa correta, basta marcar duas alternativas como corretas:

```csharp
List<Alternativa> alternativas =
[
    new Alternativa("1/2", true),
    new Alternativa("2/3", true)
];
```

O restante do teste pode permanecer igual.

Esse tipo de teste ajuda a proteger uma regra que não deve ser resolvida apenas pela tela.

Mesmo que a View esconda uma alternativa ou o formulário seja alterado, a entidade continua validando o domínio.

### Atenção aos erros combinados

Uma questão sem alternativas pode produzir mais de um erro:

- quantidade menor que o mínimo;
- ausência de alternativa correta.

Por isso, antes de escrever a asserção, devemos entender todas as regras executadas pelo método.

Não devemos assumir que todo cenário inválido produzirá exatamente um erro.

Podemos verificar a quantidade total:

```csharp
Assert.HasCount(2, erros);
```

Ou verificar mensagens específicas:

```csharp
CollectionAssert.Contains(
    erros,
    "A questão deve possuir no mínimo duas alternativas."
);
```

O importante é que a asserção corresponda ao comportamento esperado.

---

## Nomeando testes de forma clara

O nome de um teste deve explicar:

- o método ou comportamento testado;
- o cenário utilizado;
- o resultado esperado.

Um formato comum é:

```text
Metodo_Cenario_ResultadoEsperado
```

Exemplos:

```text
Validar_ComNomeVazio_DeveRetornarErro
Validar_SemSerie_DeveRetornarErroCorrespondente
Atualizar_DeveAtualizarNomeSerieEDisciplina
Construtor_DeveVincularCadaAlternativaAQuestao
```

Um nome como `Teste1` não explica o que está sendo protegido.

Um nome claro também ajuda quando o teste falha no terminal ou no Test Explorer.

---

## O que deve ser uma boa asserção?

Uma asserção deve verificar o resultado relevante para o comportamento.

Algumas asserções comuns do MSTest são:

```csharp
Assert.AreEqual(valorEsperado, valorAtual);
Assert.AreNotEqual(valorEsperado, valorAtual);
Assert.AreSame(objetoEsperado, objetoAtual);
Assert.IsTrue(condicao);
Assert.IsFalse(condicao);
Assert.IsNull(valor);
Assert.IsNotNull(valor);
Assert.HasCount(quantidadeEsperada, colecao);
```

No MSTest 4, `Assert.HasCount` permite verificar diretamente a quantidade de itens de uma coleção.

Quando o teste precisa verificar uma mensagem, podemos comparar o texto completo:

```csharp
Assert.AreEqual(
    "O campo \"Nome\" deve ser preenchido.",
    erros.First()
);
```

Isso é diferente de apenas verificar que existe algum erro:

```csharp
Assert.IsTrue(erros.Count > 0);
```

A segunda versão é mais fraca.

Ela pode passar mesmo que a mensagem esteja errada.

Devemos preferir asserções que protejam a regra que realmente importa.

---

## Executando os testes

Depois de restaurar as dependências, podemos executar todos os testes da solução:

```bash
dotnet test
```

Também podemos executar apenas o projeto de testes unitários:

```bash
dotnet test tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj
```

Uma saída resumida pode indicar:

```text
Passed!  - Failed: 0, Passed: 7, Skipped: 0, Total: 7
```

Quando um teste falha, o resultado normalmente informa:

- nome do teste;
- valor esperado;
- valor obtido;
- arquivo e linha aproximada.

Isso reduz o tempo necessário para localizar o problema.

### Executando um teste específico

Também podemos filtrar os testes pelo nome:

```bash
dotnet test --filter "FullyQualifiedName~DisciplinaTests"
```

Esse comando é útil enquanto estamos trabalhando em um único módulo.

### Execução pelo editor

Com a extensão de testes do .NET instalada, o Visual Studio Code pode exibir:

- classes de teste;
- métodos de teste;
- botões para executar um teste;
- resultado de cada execução;
- detalhes de falhas.

Mesmo usando uma interface gráfica, o teste continua sendo executado pelo projeto e pelo framework.

---

## Quando um teste falha

Um teste com falha não significa automaticamente que o teste está errado.

Existem duas possibilidades:

- a implementação não atende à regra;
- a expectativa do teste está incorreta.

Devemos investigar:

1. Qual era o valor esperado?
2. Qual valor foi produzido?
3. Qual regra deveria definir esse resultado?
4. O teste criou o cenário corretamente?
5. A implementação mudou de forma intencional?

Por exemplo, se o limite do nome mudar de cem para cento e cinquenta caracteres, o teste de nome longo pode falhar.

Nesse caso, precisamos decidir se:

- a nova regra está correta e o teste deve ser atualizado;
- a alteração quebrou uma regra existente e deve ser corrigida.

O teste serve como sinal de mudança.

Não devemos simplesmente apagar o teste para fazer a execução passar.

---

## O que não fazer em testes unitários

Alguns hábitos reduzem a qualidade dos testes.

### Não acessar banco de dados real

Um teste da entidade `Disciplina` não precisa abrir uma conexão SQL.

Se ele precisar, provavelmente está testando mais de uma camada ao mesmo tempo.

### Não iniciar a aplicação web

Para testar `Validar`, não precisamos chamar uma rota HTTP.

Isso deixa o teste mais lento e aumenta a quantidade de possíveis causas de falha.

### Não depender da ordem de execução

Cada teste deve preparar seus próprios dados.

Um teste não deve depender de outro teste ter sido executado antes.

### Não compartilhar estado mutável sem necessidade

Uma lista ou entidade alterada por um teste pode afetar outro teste.

Prefira criar os objetos dentro do próprio método.

### Não testar detalhes privados

O teste deve observar os métodos e propriedades que fazem parte do comportamento da classe.

Não devemos alterar o código apenas para expor campos privados ao teste.

### Não fazer testes frágeis

Um teste frágil falha por detalhes que não são importantes para a regra.

Por exemplo, conferir a ordem de uma coleção quando a ordem não faz parte do contrato torna o teste mais difícil de manter.

---

## Organização dos arquivos de teste

Os testes podem seguir a mesma organização dos módulos do domínio:

```text
tests/GeradorDeProvas.Testes.Unidade/
  MSTestSettings.cs
  Modulos/
    ModuloDisciplina/
      DisciplinaTests.cs
    ModuloMateria/
      MateriaTests.cs
    ModuloQuestao/
      QuestaoTests.cs
```

Essa organização facilita encontrar o teste correspondente à entidade.

O arquivo `MSTestSettings.cs` da referência contém a configuração de execução paralela:

```csharp
[assembly: Parallelize(Scope = ExecutionScope.MethodLevel)]
```

Isso permite que métodos de teste sejam executados em paralelo.

Para que essa execução seja segura, os testes não devem compartilhar estado mutável.

Como os exemplos criam suas próprias entidades e listas, eles podem ser executados de forma independente.

---

## Testes como documentação do domínio

Uma classe de domínio explica regras em código.

Os testes mostram exemplos concretos dessas regras.

Por exemplo, o nome do teste:

```text
Validar_ComNomeCurto_DeveRetornarErro
```

explica que nomes curtos são inválidos.

O corpo do teste mostra qual valor foi usado e qual mensagem deve ser retornada.

Isso facilita a leitura para quem entrar no projeto depois.

Os testes também ajudam a perceber regras que ainda não foram cobertas.

No projeto de referência, os testes de `Disciplina` e `Materia` já possuem cenários implementados.

Os testes de `Questao` estão organizados como métodos, mas ainda possuem `NotImplementedException`.

Isso representa uma próxima tarefa de implementação:

- preencher o arranjo;
- executar o comportamento;
- escrever as asserções;
- remover a exceção de teste não implementado.

Um método de teste criado, mas não executado corretamente, não oferece proteção ao sistema.

---

## Exercício: completar os testes de `Questao`

Complete o arquivo `QuestaoTests.cs` com testes para as regras da entidade.

Crie cenários para:

- vincular cada alternativa à questão no construtor;
- rejeitar enunciado vazio;
- rejeitar matéria não informada;
- rejeitar menos de duas alternativas;
- rejeitar mais de quatro alternativas;
- rejeitar uma questão sem alternativa correta;
- rejeitar uma questão com mais de uma alternativa correta.

Para cada teste:

1. crie os dados necessários no Arrange;
2. execute o método no Act;
3. confira a quantidade e as mensagens no Assert;
4. execute `dotnet test`;
5. confirme que todos os testes passam.

Um teste de domínio deve ser fácil de executar sem configurar banco, usuário ou navegador.

Se for difícil montar o teste, isso pode indicar que a entidade possui responsabilidades ou dependências demais.

---

## Testes unitários e testes de integração

Os testes unitários e de integração têm objetivos diferentes.

| Tipo | O que verifica | Exemplo |
|---|---|---|
| Unitário | Uma unidade isolada | `Disciplina.Validar()` |
| Integração | A comunicação entre partes | Service com repositório real |
| Funcional | Um fluxo completo do usuário | Cadastro pela tela |

Um tipo não substitui completamente o outro.

Os testes unitários são rápidos e ajudam a proteger muitas regras pequenas.

Os testes de integração verificam se as partes realmente funcionam juntas.

Os testes funcionais verificam o fluxo visto pelo usuário.

Nesta etapa, começamos pela camada mais interna.

Como o domínio não depende de detalhes externos, ele é um dos lugares mais simples para iniciar uma suíte de testes.

---

## Benefícios de testar o domínio

Testar as entidades ajuda a garantir que:

- objetos inválidos sejam identificados;
- mensagens de validação não desapareçam sem intenção;
- atualizações alterem os campos corretos;
- relacionamentos entre objetos sejam configurados;
- regras de quantidade sejam respeitadas;
- alterações futuras sejam detectadas rapidamente.

Existe também um benefício de design.

Quando uma classe é difícil de testar, normalmente ela possui muitas dependências ou responsabilidades.

Ao separar o domínio da infraestrutura, o código fica mais simples de testar.

> A testabilidade não é apenas uma consequência de um bom design. Ela também é um sinal de que as responsabilidades estão bem separadas.

---

## Conclusão

Testes automatizados transformam expectativas do sistema em código executável.

Com MSTest, criamos classes e métodos de teste usando:

- `[TestClass]`;
- `[TestMethod]`;
- `Assert`.

O padrão Arrange, Act e Assert organiza cada cenário em três partes:

- preparação dos dados;
- execução do comportamento;
- verificação do resultado.

Nesta aula, usamos testes unitários para verificar o domínio do Gerador de Provas.

Testamos validações de `Disciplina` e `Materia`.

Também vimos como testar atualização de objetos, relacionamentos entre `Questao` e `Alternativa`, e regras combinadas.

O próximo passo é completar os testes de `Questao` e, depois, avançar para testes das camadas de aplicação e integração.

Referência utilizada nos exemplos:

[Branch `tests/v1` no GitHub](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/tests/v1)
