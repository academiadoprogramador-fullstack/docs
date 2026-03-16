---
draft: false
slug: /introducao-ao-csharp/paradigmas-programacao-sequencial-e-procedural
tags:
  - Aula 11
  - Introdução ao C#
  - Paradigmas de Programação
  - Programação Sequencial
  - Programação Procedural
---

Antes de estudarmos programação sequencial e programação procedural, é importante entender um conceito maior chamado **paradigma de programação**.

Um **paradigma** é uma forma de pensar e estruturar soluções utilizando programação.

Podemos imaginar paradigmas como **estilos diferentes de organizar um programa**.

Assim como na construção de uma casa existem diferentes métodos de construção, na programação também existem diferentes formas de organizar o código.

Cada paradigma possui suas próprias características, vantagens e formas de resolver problemas.

## Paradigmas na Engenharia de Software

Na engenharia de software existem vários paradigmas de programação. Os principais são:

## Programação Imperativa

A **programação imperativa** descreve passo a passo o que o computador deve fazer.

Ou seja, o programador escreve **instruções que o computador executa em sequência**.

Exemplo de linguagens:

- C
- C#
- Java
- Python
- Go

Dentro da programação imperativa existem dois estilos muito importantes:

- **Programação Sequencial**
- **Programação Procedural**

Esses são justamente os dois estilos que estamos aprendendo neste momento do curso.

## Programação Procedural

A **programação procedural** é uma evolução da programação sequencial.

Ela organiza o programa em **procedimentos ou funções**.

Essas funções permitem:

- dividir o programa em partes menores
- reutilizar código
- organizar melhor a lógica do sistema

Linguagens que utilizam muito esse paradigma:

- C
- Pascal
- C#

## Programação Orientada a Objetos (POO)

A **programação orientada a objetos** organiza o software em **objetos** que representam entidades do mundo real.

Por exemplo:

- Aluno
- Pedido
- Produto
- Conta bancária

Cada objeto possui:

- **dados (atributos)**
- **comportamentos (métodos)**

Esse paradigma é amplamente utilizado em sistemas modernos.

Exemplos de linguagens:

- C#
- Java
- Kotlin
- Python
- C++

Mais adiante no curso iremos estudar esse paradigma com mais profundidade.

## Programação Funcional

A **programação funcional** é um paradigma que trata o programa como uma **composição de funções matemáticas**.

Nesse paradigma:

- evitamos alterar variáveis
- evitamos efeitos colaterais
- priorizamos funções puras

Exemplos de linguagens que utilizam esse paradigma:

- Haskell
- Elixir
- F#
- Scala

Hoje muitas linguagens modernas misturam conceitos funcionais com outros paradigmas.

## Programação Lógica

A **programação lógica** é baseada em regras e fatos.

Em vez de dizer **como resolver o problema**, descrevemos **o que é verdadeiro**, e o sistema encontra a solução.

Esse paradigma é comum em:

- sistemas de inteligência artificial
- sistemas especialistas

Exemplo de linguagem:

- Prolog

## Paradigmas Mistos

Hoje a maioria das linguagens modernas utiliza **mais de um paradigma ao mesmo tempo**.

Por exemplo, o **C#** permite usar:

- programação imperativa
- programação procedural
- programação orientada a objetos
- programação funcional

Isso dá mais flexibilidade para resolver diferentes tipos de problemas.

## Onde estamos no curso

Neste momento do curso estamos aprendendo os **fundamentos da programação imperativa**, começando com:

1. **Programação Sequencial**
2. **Programação Procedural**

Esses dois estilos são a **base para praticamente toda a programação moderna**.

Quando você entende bem esses conceitos, fica muito mais fácil aprender:

- orientação a objetos
- arquitetura de software
- desenvolvimento de sistemas maiores

Por isso vamos começar com o mais importante:

**entender como os programas são executados e como organizar melhor nosso código.**

## Programação Sequencial e Procedural em C#

Nesta aula vamos aprender dois conceitos fundamentais da programação:

- **Programação Sequencial**
- **Programação Procedural**

Essas duas abordagens são a base para praticamente qualquer linguagem de programação moderna.

Antes de aprender conceitos mais avançados como **orientação a objetos**, precisamos entender bem como os programas são executados e como podemos organizar melhor nosso código.

## Programação Sequencial

A **programação sequencial** é a forma mais simples de escrever um programa.

Nesse modelo, o computador executa as instruções **uma após a outra**, exatamente na ordem em que aparecem no código.

Ou seja:

1. O programa começa na primeira linha.
2. Executa a instrução.
3. Vai para a próxima linha.
4. Continua até o final.

Podemos imaginar isso como **uma receita de bolo**, onde seguimos cada passo na ordem correta.

Exemplo:

1. Quebrar os ovos
2. Misturar com farinha
3. Adicionar açúcar
4. Levar ao forno

Se mudarmos a ordem, o resultado pode não funcionar.

Com programas acontece a mesma coisa.

## Entrada, Processamento e Saída

Grande parte dos programas segue um fluxo simples:

**Entrada → Processamento → Saída**

### Entrada

Dados fornecidos pelo usuário.

Exemplo:

- Digitar um número
- Informar uma idade
- Informar uma temperatura

### Processamento

O programa realiza algum cálculo ou lógica com esses dados.

Exemplo:

- Somar números
- Calcular média
- Converter unidades

### Saída

O resultado é exibido ao usuário.

Exemplo:

- Mostrar o resultado no console.

## Exemplo 1 — Calculando Média

```cs
Console.WriteLine("Digite a primeira nota:");
double nota1 = Convert.ToDouble(Console.ReadLine());

Console.WriteLine("Digite a segunda nota:");
double nota2 = Convert.ToDouble(Console.ReadLine());

double media = (nota1 + nota2) / 2;

Console.WriteLine($"Média final: {media}");
```

### Explicação linha por linha

```cs
Console.WriteLine("Digite a primeira nota:");
```

Mostra uma mensagem pedindo a primeira nota.

```cs
double nota1 = Convert.ToDouble(Console.ReadLine());
```

- `Console.ReadLine()` lê o texto digitado pelo usuário
- `Convert.ToDouble` converte o texto para número decimal
- O valor é armazenado na variável `nota1`

```cs
Console.WriteLine("Digite a segunda nota:");
```

Pede a segunda nota.

```cs
double nota2 = Convert.ToDouble(Console.ReadLine());
```

Armazena a segunda nota.

```cs
double media = (nota1 + nota2) / 2;
```

O programa calcula a média das duas notas.

```cs
Console.WriteLine($"Média final: {media}");
```

Exibe o resultado na tela.

---

## Exemplo 2 — Calculando Idade

```cs
Console.WriteLine("Digite o ano de nascimento:");

int anoNascimento = Convert.ToInt32(Console.ReadLine());

int anoAtual = DateTime.Now.Year;

int idade = anoAtual - anoNascimento;

Console.WriteLine($"Você tem aproximadamente {idade} anos.");
```

Aqui o programa:

1. Recebe o ano de nascimento
2. Descobre o ano atual
3. Calcula a idade
4. Mostra o resultado

## Exemplo 3 — Converter Temperatura

Converter **Celsius para Fahrenheit**.

Fórmula:

F = (C × 9 / 5) + 32

```cs
Console.WriteLine("Digite a temperatura em Celsius:");

double celsius = Convert.ToDouble(Console.ReadLine());

double fahrenheit = (celsius * 9 / 5) + 32;

Console.WriteLine($"Temperatura em Fahrenheit: {fahrenheit}");
```

## Exemplo 4 — Área de um Retângulo

```cs
Console.WriteLine("Digite a largura:");
double largura = Convert.ToDouble(Console.ReadLine());

Console.WriteLine("Digite a altura:");
double altura = Convert.ToDouble(Console.ReadLine());

double area = largura * altura;

Console.WriteLine($"Área do retângulo: {area}");
```

## Limitações da Programação Sequencial

A programação sequencial funciona bem para programas pequenos.

Mas conforme o programa cresce, surgem alguns problemas.

## Repetição de código

Imagine que precisamos calcular média várias vezes no programa.

Teríamos que repetir todo o código várias vezes.

Isso deixa o programa maior e mais difícil de manter.

## Dificuldade de manutenção

Se precisarmos alterar algo no cálculo da média, teremos que procurar **todas as partes do código** onde ele aparece.

Isso pode causar erros.

## Dificuldade de reutilização

Seria muito melhor se pudéssemos **reutilizar partes do código** sempre que necessário.

É exatamente para isso que existem **funções**.

## Introdução à Programação Procedural

A **programação procedural** organiza o programa em **funções**.

Uma função é um **bloco de código que executa uma tarefa específica**.

Podemos imaginar funções como **ferramentas em uma caixa de ferramentas**.

Exemplo:

- Uma ferramenta para calcular média
- Uma ferramenta para calcular área
- Uma ferramenta para converter temperatura

Sempre que precisarmos dessa tarefa, usamos a função.

## Exemplo Sequencial (Tudo no Main)

```cs
Console.WriteLine("Digite a largura:");
double largura = Convert.ToDouble(Console.ReadLine());

Console.WriteLine("Digite a altura:");
double altura = Convert.ToDouble(Console.ReadLine());

double area = largura * altura;

Console.WriteLine($"Área: {area}");
```

Tudo acontece dentro do `Main`.

## Exemplo Procedural

Agora vamos separar o cálculo em uma função.

```cs
double CalcularArea(double largura, double altura)
{
    return largura * altura;
}

Console.WriteLine("Digite a largura:");
double largura = Convert.ToDouble(Console.ReadLine());

Console.WriteLine("Digite a altura:");
double altura = Convert.ToDouble(Console.ReadLine());

double area = CalcularArea(largura, altura);

Console.WriteLine($"Área: {area}");
```

Agora temos uma função:

```cs
double CalcularArea(double largura, double altura)
```

Essa função recebe dois valores e retorna o cálculo da área.

## Exemplo com Função de Média

```cs
double CalcularMedia(double n1, double n2)
{
    return (n1 + n2) / 2;
}

Console.WriteLine("Digite a primeira nota:");
double nota1 = Convert.ToDouble(Console.ReadLine());

Console.WriteLine("Digite a segunda nota:");
double nota2 = Convert.ToDouble(Console.ReadLine());

double media = CalcularMedia(nota1, nota2);

Console.WriteLine($"Média: {media}");
```

## Boas Práticas Iniciais

## Use nomes claros

Prefira:

```
CalcularMedia()
CalcularArea()
ConverterTemperatura()
```

Evite:

```
calc()
func1()
teste()
```

## Funções pequenas

Cada função deve fazer **apenas uma coisa**.

Isso deixa o código mais fácil de entender.

## Evite repetição de código

Se você percebe que está copiando e colando código, provavelmente deveria criar uma função.

## Dicas para Quem Está Aprendendo

Aprender programação pode parecer difícil no começo, mas algumas dicas ajudam muito.

### Pratique todos os dias

Programação é uma habilidade prática.

Quanto mais você pratica, mais natural fica.

### Erros fazem parte do processo

Todo programador erra.

Na verdade, **os erros são uma das principais formas de aprendizado**.

### Leia o código com calma

Tente entender **linha por linha**.

Pergunte sempre:

> "O que essa linha está fazendo?"

### Quebre problemas grandes em problemas pequenos

Essa é uma das habilidades mais importantes de um programador.

Resolver **pequenas partes do problema** torna tudo mais fácil.
