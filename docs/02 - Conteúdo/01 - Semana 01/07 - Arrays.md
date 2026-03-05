---
draft: false
slug: /introducao-ao-csharp/arrays-simples
tags:
  - Aula 04
  - "Introdução ao C#"
  - Coleções
---

Em C#, um array é uma estrutura que permite armazenar vários valores do
mesmo tipo em uma única variável.

Em vez de criar várias variáveis separadas, podemos organizar os dados
em uma coleção indexada.

## O que é um Array?

Um array é uma estrutura de dados que armazena múltiplos valores do
mesmo tipo.

Cada valor é armazenado em uma posição chamada índice.

> ⚠️ Os índices começam em **0**.

## Declarando um Array

### Sintaxe básica

```cs
tipo[] nomeDoArray = new tipo[tamanho];
```

### Exemplo

```cs
int[] numeros = new int[5];
```

Aqui:

- `int` → tipo dos elementos\
- `numeros` → nome do array\
- `5` → quantidade de posições

O array terá índices:

```text
0, 1, 2, 3, 4
```

## Atribuindo valores

Podemos atribuir valores individualmente:

```cs
int[] numeros = new int[3];

numeros[0] = 10;
numeros[1] = 20;
numeros[2] = 30;
```

## Declarando e inicializando ao mesmo tempo

```cs
int[] numeros = { 10, 20, 30 };
```

Ou:

```cs
int[] numeros = new int[] { 10, 20, 30 };
```

O tamanho é definido automaticamente.

## Acessando valores

Para acessar um elemento:

```cs
int[] numeros = { 10, 20, 30 };

Console.WriteLine(numeros[0]); // 10
Console.WriteLine(numeros[1]); // 20
Console.WriteLine(numeros[2]); // 30
```

## Percorrendo um Array com for

Como os arrays possuem índice, o `for` é muito utilizado:

```cs
int[] numeros = { 10, 20, 30 };

for (int i = 0; i < numeros.Length; i++)
{
    Console.WriteLine(numeros[i]);
}
```

`Length` representa o tamanho do array.

## Propriedade Length

Todo array possui a propriedade `Length`:

```cs
int[] numeros = { 5, 8, 12 };

Console.WriteLine(numeros.Length); // 3
```

Ela indica quantos elementos o array possui.

## Arrays de outros tipos

### Array de string

```cs
string[] nomes = { "Ana", "Carlos", "Marina" };

Console.WriteLine(nomes[1]); // Carlos
```

### Array de bool

```cs
bool[] status = { true, false, true };
```

## Valores padrão

Quando criamos um array sem definir valores, o C# inicializa
automaticamente:

Tipo Valor padrão

---

int 0
double 0.0
bool false
string null

Exemplo:

```cs
int[] numeros = new int[3];

Console.WriteLine(numeros[0]); // 0
```

## Erro comum: Índice fora do limite

Se tentarmos acessar uma posição que não existe:

```cs
int[] numeros = { 10, 20, 30 };

Console.WriteLine(numeros[3]);
```

Isso causará erro:

```text
IndexOutOfRangeException
```

Porque o índice máximo é 2.

## Comparando várias variáveis vs Array

Sem array:

```cs
int nota1 = 7;
int nota2 = 8;
int nota3 = 9;
```

Com array:

```cs
int[] notas = { 7, 8, 9 };
```

O array torna o código mais organizado e escalável.

## Quando usar Arrays?

Use arrays quando:

- Precisar armazenar vários valores do mesmo tipo
- O tamanho da coleção for fixo
- Precisar acessar elementos por índice
