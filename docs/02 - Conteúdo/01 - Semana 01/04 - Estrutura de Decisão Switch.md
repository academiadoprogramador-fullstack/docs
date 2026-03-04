---
draft: false
slug: /introducao-ao-csharp/estrutura-de-decisao-switch
tags:
  - Aula 03
  - "Introdução ao C#"
  - Estruturas de Decisão
---

Em C#, a estrutura `switch` é utilizada quando precisamos comparar uma
variável com múltiplos valores possíveis.

Ela é uma alternativa mais organizada ao uso repetitivo de vários
`else if`.

## O que é o `switch`?

O `switch` avalia o valor de uma variável e executa o bloco
correspondente ao caso encontrado.

### Sintaxe básica

```cs
switch (variavel)
{
    case valor1:
        // código executado se variavel == valor1
        break;

    case valor2:
        // código executado se variavel == valor2
        break;

    default:
        // executado se nenhum caso for atendido
        break;
}
```

## Exemplo simples

```cs
int numero = 2;

switch (numero)
{
    case 1:
        Console.WriteLine("Número é 1");
        break;

    case 2:
        Console.WriteLine("Número é 2");
        break;

    case 3:
        Console.WriteLine("Número é 3");
        break;

    default:
        Console.WriteLine("Número desconhecido");
        break;
}
```

O programa compara o valor de `numero` com cada `case`.

Quando encontra o correspondente, executa o bloco e encerra o `switch`
com `break`.

## A importância do `break`

O `break` impede que o programa continue executando os próximos casos.

Sem ele, o fluxo continuaria para os cases seguintes.

## Exemplo com string

```cs
string opcao = "A";

switch (opcao)
{
    case "A":
        Console.WriteLine("Opção A selecionada");
        break;

    case "B":
        Console.WriteLine("Opção B selecionada");
        break;

    default:
        Console.WriteLine("Opção inválida");
        break;
}
```

## Agrupando casos

```cs
int dia = 6;

switch (dia)
{
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
        Console.WriteLine("Dia útil");
        break;

    case 6:
    case 7:
        Console.WriteLine("Final de semana");
        break;

    default:
        Console.WriteLine("Dia inválido");
        break;
}
```

## Switch Expressions (C# moderno)

```cs
int nota = 8;

string resultado = nota switch
{
    >= 9 => "Excelente",
    >= 7 => "Aprovado",
    >= 5 => "Recuperação",
    _ => "Reprovado"
};

Console.WriteLine(resultado);
```

## Quando usar `switch` ao invés de `if`?

Use `switch` quando:

- Você está comparando uma única variável
- Existem muitos valores fixos possíveis
- O código está ficando poluído com muitos `else if`

Use `if` quando:

- As condições envolvem operadores complexos
- Você precisa avaliar expressões mais elaboradas

## Resumo

- `switch` compara uma variável com múltiplos valores
- Cada `case` representa uma possibilidade
- `break` encerra o bloco
- `default` é executado se nenhum caso for atendido
- `switch expression` é a versão moderna e mais compacta

A estrutura `switch` é ideal para menus, validações de opções e sistemas
baseados em estados.
