---
draft: false
slug: /introducao-ao-csharp/variaveis-e-tipos-primitivos
tags:
  - Aula 03
  - Introdução ao C#
  - Tipos Primitivos
---

Em C#, variáveis e tipos primitivos são a base de qualquer programa. Eles definem como armazenamos dados na memória e qual tipo de informação pode ser guardada.

## O que é uma variável?

Uma variável é um espaço nomeado na memória que armazena um valor.

Ela possui:

- Um tipo
- Um nome
- Um valor

```cs
int idade = 25;
```

Aqui temos:

- `int` → tipo da variável
- `idade` → nome
- `25` → valor armazenado

## Como o C# entende isso?

C# é uma linguagem fortemente tipada.
Isso significa que o tipo da variável deve ser declarado e não pode mudar depois.

```cs
int numero = 10;
numero = "texto"; // ERRO
```

## Tipos Primitivos em C#

Tipos primitivos (também chamados de tipos simples ou built-in types) são os tipos básicos fornecidos pela linguagem.

Eles armazenam valores diretos (value types).

| Tipo    | Tamanho | Exemplo                        |
| ------- | ------- | ------------------------------ |
| `byte`  | 8 bits  | `byte idade = 30;`             |
| `short` | 16 bits |                                |
| `int`   | 32 bits | `int quantidade = 100;`        |
| `long`  | 64 bits | `long populacao = 8000000000;` |

Exemplo:

```cs
int ano = 2026;
long distancia = 15000000000;
```

## Números Decimais

Para números com casas decimais:

| Tipo      | Precisão       | Uso comum       |
| --------- | -------------- | --------------- |
| `float`   | menor precisão | jogos, gráficos |
| `double`  | precisão média | cálculos gerais |
| `decimal` | alta precisão  | dinheiro        |

Exemplo:

```cs
double altura = 1.75;
decimal preco = 19.99m;
```

Observe que decimal usa `m` no final.

## Booleano

Armazena apenas dois valores:

```cs
bool ativo = true;
```

Valores possíveis:

- true
- false

Muito usado em condições:

```cs
if (ativo)
{
    Console.WriteLine("Usuário ativo");
}
```

## Caractere

Armazena um único caractere:

```cs
char letra = 'A';
```

Usa aspas simples.

## String (texto)

Embora tecnicamente seja uma classe, é usada como tipo primitivo no dia a dia:

```cs
string nome = "Tiago";
```

Usa aspas duplas.

## Inferência de Tipo com `var`

C# permite que o compilador descubra o tipo automaticamente:

```cs
var idade = 30; // int
var nome = "Ana"; // string
```

Mas o tipo continua fixo após a definição.
