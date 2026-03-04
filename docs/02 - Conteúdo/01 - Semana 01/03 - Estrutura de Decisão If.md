---
draft: false
slug: /introducao-ao-csharp/estrutura-de-decisao-if
tags:
  - Aula 03
  - Introdução ao C#
  - Estruturas de Decisão
---

Em C#, estruturas de decisão permitem que o programa tome decisões com base em condições.

Elas definem qual bloco de código será executado dependendo de uma regra lógica.

A estrutura mais básica para isso é o `if`.

## O que é o `if`?

A palavra-chave `if` significa "se".

Ela executa um bloco de código apenas se a condição for verdadeira.

### Sintaxe básica

```cs
if (condicao)
{
    // código executado se a condição for verdadeira
}
```

```cs
int idade = 18;

if (idade >= 18)
{
    Console.WriteLine("Você é maior de idade.");
}
```

Aqui temos:

- `idade >= 18` → condição
- Se for `true`, o texto será exibido
- Se for `false`, nada acontece

## Operadores de Comparação

As condições normalmente utilizam operadores lógicos.

| Operador | Significado    | Exemplo       |
| -------- | -------------- | ------------- |
| `==`     | Igual a        | `idade == 18` |
| `!=`     | Diferente de   | `idade != 18` |
| `>`      | Maior que      | `idade > 18`  |
| `<`      | Menor que      | `idade < 18`  |
| `>=`     | Maior ou igual | `idade >= 18` |
| `<=`     | Menor ou igual | `idade <= 18` |

## Usando `else`

O else significa "senão".

Ele executa um bloco quando a condição do `if` for falsa.

```cs
int idade = 16;

if (idade >= 18)
{
    Console.WriteLine("Maior de idade");
}
else
{
    Console.WriteLine("Menor de idade");
}
```

Agora sempre haverá uma resposta.

## Usando `else if`

Quando precisamos testar múltiplas condições, usamos `else if`.

```cs
int nota = 7;

if (nota >= 9)
{
    Console.WriteLine("Excelente");
}
else if (nota >= 7)
{
    Console.WriteLine("Aprovado");
}
else if (nota >= 5)
{
    Console.WriteLine("Recuperação");
}
else
{
    Console.WriteLine("Reprovado");
}
```

O programa verifica as condições de cima para baixo.

Quando encontra a primeira verdadeira, ele para.

## Operadores Lógicos

Podemos combinar condições usando:

| Operador | Significado | Exemplo                        |         |             |     |                |
| -------- | ----------- | ------------------------------ | ------- | ----------- | --- | -------------- |
| `&&`     | E (AND)     | `idade >= 18 && ativo == true` |         |             |     |                |
| `        |             | `                              | OU (OR) | `idade < 18 |     | idoso == true` |
| `!`      | NÃO         | `!ativo`                       |         |             |     |                |

### Exemplo com AND

```cs
int idade = 20;
bool possuiCarteira = true;

if (idade >= 18 && possuiCarteira)
{
    Console.WriteLine("Pode dirigir.");
}
```

Ambas as condições precisam ser verdadeiras.

### Exemplo com OR

```cs
bool ehAluno = true;
bool ehProfessor = false;

if (ehAluno || ehProfessor)
{
    Console.WriteLine("Pode acessar o sistema.");
}
```

Basta uma ser verdadeira.

## Simplificando com booleano

Se a variável já for bool, não é necessário comparar com true.

Evite:

```cs
if (ativo == true)
```

```cs
if (ativo)
```
