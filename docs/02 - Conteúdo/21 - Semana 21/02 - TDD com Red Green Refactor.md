---
draft: false
slug: /conteudo/tdd-red-green-refactor-mstest
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - conceito-testes-unitarios
  - conceito-testes-dominio
  - material-aula-pratica
---

# TDD com Red-Green-Refactor

Na aula anterior, aprendemos a criar testes unitários para entidades do domínio usando MSTest.

Agora vamos observar uma forma de organizar o desenvolvimento utilizando esses testes desde o início.

Essa forma é conhecida como **TDD**, sigla para *Test-Driven Development*, ou desenvolvimento orientado por testes.

O exemplo desta aula utiliza a entidade `Prova` do projeto Gerador de Provas.

O objetivo não é testar a aplicação web inteira.

Vamos testar as regras da entidade diretamente, sem banco de dados, Controller ou navegador.

> **TDD não significa escrever muitos testes depois que o código está pronto. Significa usar o teste para orientar a construção do código.**

## O problema de implementar primeiro e testar depois

Considere uma regra do domínio:

> o título de uma prova deve possuir entre 2 e 100 caracteres.

Uma abordagem comum seria:

1. criar a classe `Prova`;
2. implementar o método `Validar`;
3. acessar a aplicação pela tela;
4. verificar se a validação funciona.

Essa abordagem pode funcionar.

Porém, a regra fica conhecida apenas pela implementação ou pelo comportamento da tela.

Também podemos esquecer alguns cenários:

- título vazio;
- título com um caractere;
- título com cem caracteres;
- título com cento e um caracteres.

O TDD propõe começar pelo comportamento esperado.

Antes de implementar a regra, escrevemos um teste que descreve o cenário.

Esse teste falha no início.

Depois, escrevemos a menor implementação capaz de fazê-lo passar.

Por fim, melhoramos o código sem alterar o comportamento protegido pelo teste.

Esse ciclo é chamado de **Red-Green-Refactor**.

## O ciclo Red-Green-Refactor

O ciclo possui três etapas.

### Red: escrever um teste que falha

Nesta etapa, descrevemos uma regra que ainda não foi implementada.

O resultado esperado é uma falha.

Essa falha confirma que o teste realmente consegue perceber a ausência do comportamento.

### Green: fazer o teste passar

Agora implementamos apenas o necessário para atender ao teste.

Não precisamos resolver todas as regras da entidade de uma vez.

O objetivo é obter um teste passando com uma alteração pequena.

### Refactor: melhorar o código

Com o teste passando, podemos melhorar a organização do código.

Durante a refatoração, o comportamento externo deve continuar igual.

Executamos os testes novamente para confirmar isso.

O ciclo completo fica assim:

```text
Red       -> teste falhando
Green     -> teste passando
Refactor  -> código melhor organizado, com os testes passando
```

Depois da refatoração, começamos um novo ciclo com outra regra.

## O domínio de `Prova`

No projeto de referência, uma `Prova` possui dados como:

- título;
- disciplina;
- matéria;
- série;
- quantidade de questões;
- indicação de prova de recuperação;
- questões selecionadas.

Algumas regras pertencem diretamente ao domínio:

- o título deve ser válido;
- a disciplina deve ser informada;
- a série deve ser maior que zero;
- uma prova de recuperação não deve receber uma matéria específica;
- a série da prova deve estar de acordo com a série da matéria;
- a quantidade de questões deve ser positiva.

Essas regras podem ser verificadas chamando `Prova.Validar()`.

Não é necessário iniciar a aplicação para testar esse comportamento.

## O projeto de testes

O projeto de testes deve referenciar o projeto que contém o domínio.

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
    Modulos/
      ModuloProva/
        ProvaTests.cs
```

O arquivo do projeto de testes utiliza MSTest e referencia o domínio:

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

O projeto de testes depende do domínio.

O domínio não deve depender dos testes.

O pacote `MSTest` fornece os atributos e as asserções usados nos exemplos.

## Primeiro ciclo: validar o título

Vamos começar com uma única regra.

### Red: escrevendo o teste

O requisito diz que o título da prova deve ser preenchido.

Um título vazio deve produzir um erro específico.

O teste pode ser escrito assim:

```csharp
using GeradorDeProvas.Dominio.Modulos.ModuloDisciplina;
using GeradorDeProvas.Dominio.Modulos.ModuloMateria;
using GeradorDeProvas.Dominio.Modulos.ModuloProva;

namespace GeradorDeProvas.Testes.Unidade.Modulos.ModuloProva;

[TestClass]
public sealed class ProvaTests
{
    [TestMethod]
    public void Validar_SemTitulo_DeveRetornar_ErroCorrespondente()
    {
        // Arranjo
        Disciplina disciplina = new Disciplina("Matemática");
        Materia materia = new Materia("Álgebra", 8, disciplina);

        Prova prova = new Prova(
            string.Empty,
            disciplina,
            materia,
            8,
            10,
            false
        );

        // Ação
        List<string> erros = prova.Validar();

        // Asserção
        Assert.HasCount(1, erros);
        Assert.AreEqual(
            "O campo \"Título\" deve ser conter entre 2 e 100 caracteres.",
            erros.First()
        );
    }
}
```

O método está organizado em três partes:

- **Arranjo:** cria a disciplina, a matéria e a prova;
- **Ação:** chama `Validar`;
- **Asserção:** confere a quantidade e a mensagem do erro.

Se `Prova.Validar` ainda retornar uma lista vazia, o teste falhará.

Essa é a etapa **Red**.

O teste falha porque o comportamento ainda não existe.

> Um teste que sempre passa não ajuda a confirmar se uma regra está realmente protegida.

### Green: implementando o mínimo necessário

Agora podemos implementar a validação do título.

Uma primeira versão pode ser:

```csharp
public override List<string> Validar()
{
    List<string> erros = [];

    if (string.IsNullOrWhiteSpace(Titulo)
        || Titulo.Length < 2
        || Titulo.Length > 100)
    {
        erros.Add(
            "O campo \"Título\" deve ser conter entre 2 e 100 caracteres."
        );
    }

    return erros;
}
```

O teste deve passar.

Essa é a etapa **Green**.

Ainda não implementamos as outras regras da prova.

Isso é intencional.

O TDD orienta a implementação por pequenos comportamentos, em vez de exigir uma solução completa antes da primeira verificação.

### Refactor: melhorando sem alterar o comportamento

Neste exemplo, a implementação já é curta.

Não precisamos criar abstrações apenas para demonstrar uma refatoração.

Podemos, por exemplo:

- remover comentários temporários;
- padronizar a quebra de linhas;
- conferir se o nome do teste descreve o cenário;
- garantir que a mensagem corresponda ao contrato do domínio.

Depois de cada melhoria, executamos o teste novamente.

Se ele continuar passando, a refatoração preservou o comportamento.

## Segundo ciclo: disciplina obrigatória

O próximo requisito é que a disciplina seja informada.

O teste deve criar uma prova sem disciplina e verificar a mensagem correspondente:

```csharp
[TestMethod]
public void Validar_SemDisciplina_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Materia materia = new Materia("Álgebra", 8, null!);

    Prova prova = new Prova(
        "Prova de Álgebra 8a Serie",
        null!,
        materia,
        8,
        10,
        false
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Disciplina\" deve ser preenchido.",
        erros.First()
    );
}
```

O operador `null!` aparece porque o cenário inválido é intencional.

O valor continua sendo `null` durante a execução.

O operador apenas evita que o compilador trate esse trecho como um aviso de nulidade.

Para fazer esse teste passar, adicionamos outra regra:

```csharp
if (Disciplina is null)
    erros.Add("O campo \"Disciplina\" deve ser preenchido.");
```

O método agora protege duas regras.

O teste do título deve continuar passando.

Essa verificação é importante: uma nova regra não deve quebrar uma regra já implementada.

## Isolando cada cenário

Um teste deve falhar por causa da regra que está sendo verificada.

Para isso, os demais dados precisam ser válidos.

No teste de título vazio, por exemplo, a série deve ser positiva e a quantidade de questões deve ser válida.

Caso a prova seja criada com vários valores inválidos, o método pode retornar vários erros.

Nesse caso, a falha não indicará claramente qual regra está sendo desenvolvida.

Compare os dois cenários:

```csharp
// Cenário isolado: apenas o título é inválido.
Prova prova = new Prova(
    string.Empty,
    disciplina,
    materia,
    8,
    10,
    false
);
```

```csharp
// Cenário misturado: várias regras podem falhar ao mesmo tempo.
Prova prova = new Prova(
    string.Empty,
    null!,
    null!,
    0,
    0,
    true
);
```

O primeiro cenário é mais fácil de entender.

O segundo pode ser útil para testar o comportamento de múltiplos erros, mas não é o melhor ponto de partida para um ciclo Red-Green-Refactor.

## Terceiro ciclo: validar a série

A série da prova deve ser maior que zero.

O teste usa zero como valor inválido:

```csharp
[TestMethod]
public void Validar_ComSerieZeroOuAbaixo_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova(
        "Prova de Álgebra",
        disciplina,
        materia,
        0,
        10,
        false
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Série\" deve ser maior que zero.",
        erros.First()
    );
}
```

A implementação correspondente é pequena:

```csharp
if (Serie <= 0)
    erros.Add("O campo \"Série\" deve ser maior que zero.");
```

O cenário usa o limite inválido.

Também podemos criar testes para valores válidos:

- série igual a 1;
- série igual a 8;
- série maior que 8, se o domínio permitir esse valor.

Testar apenas o caso inválido não prova que todos os casos válidos funcionam.

## Quarto ciclo: regra da prova de recuperação

Uma prova de recuperação considera todas as matérias da disciplina.

Por isso, ela não deve receber uma matéria específica.

O teste deve diferenciar:

- `ProvaRecuperacao = true`;
- `Materia` preenchida.

```csharp
[TestMethod]
public void Validar_RecuperacaoComMateria_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova(
        "Prova de Álgebra",
        disciplina,
        materia,
        8,
        10,
        true
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Matéria\" não pode ser prenchido em uma prova de recuperação.",
        erros.First()
    );
}
```

A regra pode ser implementada assim:

```csharp
if (ProvaRecuperacao && Materia is not null)
{
    erros.Add(
        "O campo \"Matéria\" não pode ser prenchido em uma prova de recuperação."
    );
}
```

O teste protege uma combinação de propriedades.

Não basta verificar cada propriedade isoladamente.

Algumas regras só aparecem quando dois ou mais valores são analisados juntos.

## Quinto ciclo: série e matéria

Quando a prova não é de recuperação e possui uma matéria, a série da prova deve coincidir com a série da matéria.

O cenário pode ser criado com:

- matéria da série 8;
- prova da série 5;
- `ProvaRecuperacao = false`.

```csharp
[TestMethod]
public void Validar_ComSerieEMateria_Diferentes_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova(
        "Prova de Álgebra",
        disciplina,
        materia,
        5,
        10,
        false
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Série\" precisa alinhar com a série da \"Matéria\".",
        erros.First()
    );
}
```

Uma implementação possível é:

```csharp
else if (!ProvaRecuperacao
         && Materia is not null
         && !Equals(Materia.Serie, Serie))
{
    erros.Add(
        "O campo \"Série\" precisa alinhar com a série da \"Matéria\"."
    );
}
```

O `else if` evita produzir simultaneamente a mensagem da prova de recuperação e a mensagem de série incompatível quando a primeira regra já se aplica.

## A quantidade de questões e o estado do teste

O requisito também informa que a quantidade de questões deve ser positiva.

O teste pode ser escrito antes da implementação:

```csharp
[TestMethod]
public void Validar_QuantidadeQuestoesAbaixoDeUm_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    Prova prova = new Prova(
        "Prova de Álgebra",
        disciplina,
        materia,
        8,
        0,
        false
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Quantidade de Questões\" não pode ser zero ou negativo.",
        erros.First()
    );
}
```

Se a implementação ainda não possui essa regra, o teste falha.

Essa falha não deve ser escondida alterando a asserção para aceitar uma lista vazia.

Devemos decidir qual é o comportamento correto:

1. a regra faz parte do domínio e precisa ser implementada;
2. o requisito mudou e o teste precisa refletir a nova regra;
3. o cenário foi montado incorretamente e precisa ser corrigido.

O teste é um instrumento para encontrar essa decisão.

Uma implementação correspondente seria:

```csharp
if (QuantidadeQuestoes <= 0)
{
    erros.Add(
        "O campo \"Quantidade de Questões\" não pode ser zero ou negativo."
    );
}
```

Depois de adicionar a regra, executamos toda a classe de testes.

Isso confirma que o novo comportamento não quebrou os ciclos anteriores.

## Um teste por comportamento

Na referência, os testes de `Prova` seguem uma estrutura semelhante:

```text
ProvaTests
  Validar_SemTitulo_DeveRetornar_ErroCorrespondente
  Validar_SemDisciplina_DeveRetornar_ErroCorrespondente
  Validar_ComSerieZeroOuAbaixo_DeveRetornar_ErroCorrespondente
  Validar_ComSerieEMateria_Diferentes_DeveRetornar_ErroCorrespondente
  Validar_RecuperacaoComMateria_DeveRetornar_ErroCorrespondente
  Validar_QuantidadeQuestoesAbaixoDeUm_DeveRetornar_ErroCorrespondente
  Validar_MateriaFora_DaDisciplina_DeveRetornar_ErroCorrespondente
```

Cada método comunica:

- qual comportamento foi chamado;
- qual cenário foi criado;
- qual resultado era esperado.

Um teste chamado `Teste1` não comunica essa informação.

Quando uma execução falha, nomes claros reduzem o tempo de investigação.

## O teste de matéria fora da disciplina

Uma prova não deve utilizar uma matéria que pertença a outra disciplina.

Esse teste precisa criar duas disciplinas diferentes:

```csharp
[TestMethod]
public void Validar_MateriaForaDaDisciplina_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Disciplina disciplinaDaProva = new Disciplina("Matemática");
    Disciplina outraDisciplina = new Disciplina("História");
    Materia materia = new Materia("Álgebra", 8, outraDisciplina);

    Prova prova = new Prova(
        "Prova de Álgebra",
        disciplinaDaProva,
        materia,
        8,
        10,
        false
    );

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O valor do campo \"Matéria\" deve pertencer à \"Disciplina\" selecionada.",
        erros.First()
    );
}
```

Esse cenário ensina uma regra importante de isolamento.

Não basta chamar a matéria de “Álgebra”.

O teste precisa criar uma relação inválida entre objetos.

Se as duas variáveis usarem a mesma disciplina, o teste não estará verificando matéria fora da disciplina.

A implementação poderia ser:

```csharp
if (Materia is not null
    && Disciplina is not null
    && !ReferenceEquals(Materia.Disciplina, Disciplina))
{
    erros.Add(
        "O valor do campo \"Matéria\" deve pertencer à \"Disciplina\" selecionada."
    );
}
```

O uso de `ReferenceEquals` depende do contrato do domínio.

Se a regra for baseada no identificador da entidade, a comparação deve usar o identificador.

O teste deve acompanhar a forma como o domínio define pertencimento.

## Refatorando os testes

Depois de vários testes, o Arrange pode ficar repetitivo.

Quando os testes já estão passando, podemos extrair uma fábrica para o cenário válido:

```csharp
private static Prova CriarProvaValida()
{
    Disciplina disciplina = new Disciplina("Matemática");
    Materia materia = new Materia("Álgebra", 8, disciplina);

    return new Prova(
        "Prova de Álgebra",
        disciplina,
        materia,
        8,
        10,
        false
    );
}
```

Um teste pode utilizar a fábrica e alterar apenas o valor relevante:

```csharp
[TestMethod]
public void Validar_ComQuantidadeZero_DeveRetornar_ErroCorrespondente()
{
    // Arranjo
    Prova prova = CriarProvaValida();
    prova.QuantidadeQuestoes = 0;

    // Ação
    List<string> erros = prova.Validar();

    // Asserção
    Assert.HasCount(1, erros);
    Assert.AreEqual(
        "O campo \"Quantidade de Questões\" não pode ser zero ou negativo.",
        erros.First()
    );
}
```

Essa refatoração reduz repetição.

Porém, não devemos esconder informações importantes do cenário.

Se a fábrica tornar difícil entender os dados usados, é melhor manter o Arrange explícito.

O objetivo da refatoração é melhorar a leitura, não diminuir a quantidade de linhas a qualquer custo.

## O método `Validar` depois dos ciclos

Depois de implementar as regras apresentadas, uma versão possível do método é:

```csharp
public override List<string> Validar()
{
    List<string> erros = [];

    if (string.IsNullOrWhiteSpace(Titulo)
        || Titulo.Length < 2
        || Titulo.Length > 100)
    {
        erros.Add(
            "O campo \"Título\" deve ser conter entre 2 e 100 caracteres."
        );
    }

    if (Disciplina is null)
        erros.Add("O campo \"Disciplina\" deve ser preenchido.");

    if (Serie <= 0)
        erros.Add("O campo \"Série\" deve ser maior que zero.");

    if (QuantidadeQuestoes <= 0)
    {
        erros.Add(
            "O campo \"Quantidade de Questões\" não pode ser zero ou negativo."
        );
    }

    if (ProvaRecuperacao && Materia is not null)
    {
        erros.Add(
            "O campo \"Matéria\" não pode ser prenchido em uma prova de recuperação."
        );
    }
    else if (!ProvaRecuperacao
             && Materia is not null
             && !Equals(Materia.Serie, Serie))
    {
        erros.Add(
            "O campo \"Série\" precisa alinhar com a série da \"Matéria\"."
        );
    }

    return erros;
}
```

O método pode evoluir durante a refatoração.

O mais importante é que cada mudança seja acompanhada pela execução dos testes.

Também devemos revisar as mensagens.

Uma mensagem com erro de digitação pode fazer o teste falhar, mesmo que a condição esteja correta.

Nesse caso, precisamos decidir se a mensagem faz parte do contrato que desejamos preservar.

## Executando o ciclo pelo terminal

Para executar todos os testes da solução:

```bash
dotnet test
```

Para executar somente o projeto de testes unitários:

```bash
dotnet test tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj
```

Para executar somente os testes de `Prova`:

```bash
dotnet test \
  tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj \
  --filter "FullyQualifiedName~ProvaTests"
```

Durante o TDD, o terminal mostra rapidamente em qual etapa estamos:

```text
Red       -> Failed
Green     -> Passed
Refactor  -> Passed
```

O objetivo não é evitar a fase Red.

O objetivo é fazer com que ela seja curta, compreensível e causada pelo comportamento que estamos desenvolvendo.

## Quando o teste falha por outro motivo

Uma falha pode indicar problemas diferentes:

- a regra ainda não foi implementada;
- o código implementado está incorreto;
- o cenário do teste possui dados inválidos além do que pretendíamos testar;
- a mensagem esperada não corresponde ao contrato atual;
- a regra do domínio foi alterada.

Por isso, devemos ler o resultado da asserção.

Uma mensagem como:

```text
Expected: 1
Actual:   2
```

indica que o cenário produziu dois erros, não necessariamente que a regra principal está errada.

Precisamos revisar os dados do Arrange e todas as regras executadas por `Validar`.

Na referência, uma alteração posterior corrigiu os dados de alguns testes de `Prova` para que cada cenário fosse isolado.

Por exemplo, o teste da prova de recuperação precisa usar a mesma série da matéria para que a falha seja causada pela matéria preenchida, e não pela série incompatível.

Essa é uma aplicação prática do princípio:

> um teste deve preparar um cenário que destaque o comportamento que deseja verificar.

## O que TDD não significa

TDD não significa:

- testar apenas métodos privados;
- escrever uma asserção para cada linha do código;
- criar testes que dependem de banco de dados real;
- aceitar qualquer resultado para manter o teste passando;
- nunca alterar um teste;
- substituir todos os testes de integração e funcionais.

TDD significa usar exemplos executáveis para construir o comportamento do sistema em pequenos ciclos.

Os testes unitários do domínio são um bom ponto de partida porque são rápidos e independentes de recursos externos.

## Benefícios do Red-Green-Refactor

O ciclo ajuda a:

- esclarecer os requisitos antes da implementação;
- descobrir cenários esquecidos;
- manter as alterações pequenas;
- detectar regressões rapidamente;
- melhorar o design do domínio;
- documentar regras com exemplos executáveis;
- tornar as falhas mais fáceis de investigar.

Existe também um benefício de comunicação.

O nome `Validar_RecuperacaoComMateria_DeveRetornar_ErroCorrespondente` explica uma regra do domínio sem exigir que o leitor conheça toda a implementação.

## Exercício: completar o ciclo de `Prova`

Utilize o projeto Gerador de Provas como referência.

Crie ou revise os testes de `Prova` para os seguintes comportamentos:

- título vazio;
- disciplina não informada;
- série menor ou igual a zero;
- série diferente da série da matéria;
- matéria preenchida em prova de recuperação;
- quantidade de questões menor que um;
- matéria pertencente a outra disciplina.

Para cada comportamento:

1. escreva o teste primeiro;
2. execute `dotnet test` e observe a falha;
3. implemente somente a regra necessária;
4. execute os testes novamente;
5. refatore se houver uma melhoria clara;
6. execute todos os testes mais uma vez.

Ao final, verifique também cenários válidos:

- prova comum com matéria da mesma disciplina;
- prova de recuperação sem matéria;
- série positiva;
- título dentro dos limites;
- quantidade positiva de questões.

## Conclusão

TDD é uma forma de desenvolver usando testes como orientação.

O ciclo Red-Green-Refactor pode ser resumido em:

1. escrever um teste que falha;
2. implementar o mínimo para fazê-lo passar;
3. melhorar o código mantendo os testes passando.

Com MSTest, usamos `[TestClass]`, `[TestMethod]` e `Assert` para transformar as regras em verificações executáveis.

Ao testar `Prova`, começamos pelo domínio.

Cada teste cria seus próprios objetos e verifica uma regra específica.

Isso reduz dependências externas e torna o feedback rápido.

O teste não é apenas uma verificação feita no final.

Durante o TDD, ele também funciona como uma descrição concreta do comportamento esperado.

Referências utilizadas nos exemplos:

- [Testes Automatizados com MSTest](/conteudo/testes-automatizados-mstest);
- [Projeto Gerador de Provas na branch `v2`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/tree/v2);
- [Commit com os testes de `Prova` utilizando TDD](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/commit/b549e122a0f52b3619ce585b3b6c9fc0793f48f8);
- [Documentação do MSTest](https://learn.microsoft.com/dotnet/core/testing/unit-testing-csharp-with-mstest).
