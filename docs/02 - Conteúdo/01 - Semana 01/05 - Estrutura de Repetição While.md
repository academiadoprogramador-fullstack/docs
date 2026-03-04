---
draft: false
slug: /introducao-ao-csharp/estrutura-de-repeticao-while
tags:
  - Aula 03
  - Introdução ao C#
  - Estruturas de Repetição
---

Em C#, estruturas de repetição permitem executar um bloco de código várias vezes enquanto uma condição for verdadeira.

A estrutura mais simples para isso é o `while`.

## O que é o `while`?

A palavra-chave `while` significa "enquanto".

Ela executa um bloco de código enquanto a condição for verdadeira.

### Sintaxe básica

```cs
while (condicao)
{
    // código executado repetidamente
}
```

O funcionamento é:

1. O programa verifica a condição
2. Se for `true`, executa o bloco
3. Volta e verifica novamente
4. Repete até que a condição seja `false`

## Exemplo simples

```cs
int contador = 1;

while (contador <= 5)
{
    Console.WriteLine(contador);
    contador++;
}
```

Saída:

```
1
2
3
4
5
```

Aqui temos:

- `contador <= 5` → condição
- `contador++` → incrementa o valor
- Quando contador passa de 5, o loop termina

## A importância da atualização da variável

Se você esquecer de alterar a variável de controle, o loop nunca termina.

Exemplo perigoso:

```cs
int numero = 1;

while (numero <= 5)
{
    Console.WriteLine(numero);
}
```

> ⚠️ Isso cria um loop infinito, pois numero nunca muda.

Sempre garanta que a condição eventualmente se torne falsa.

## Usando booleano como condição

```cs
bool ativo = true;

while (ativo)
{
    Console.WriteLine("Sistema em execução...");
    ativo = false;
}
```

Se a condição for uma variável booleana, basta utilizá-la diretamente.

## `while` com operadores lógicos

Podemos combinar condições:

```cs
int idade = 16;
bool possuiAutorizacao = false;

while (idade < 18 && !possuiAutorizacao)
{
    Console.WriteLine("Aguardando autorização...");
    possuiAutorizacao = true;
}
```

Aqui usamos:

`&&` → operador AND
`!` → operador NOT

## Estrutura `do-while`

Existe uma variação chamada do-while.

A diferença é que o bloco executa pelo menos uma vez, mesmo que a condição seja falsa.

### Sintaxe

```cs
do
{
    // código executado ao menos uma vez
}
while (condicao);
```

### Exemplo

```cs
int numero = 10;

do
{
    Console.WriteLine("Executando...");
    numero++;
}
while (numero < 5);
```

Mesmo com numero < 5 sendo falso, o bloco executa uma vez.

## Diferença entre `while` e `do-while`

| Estrutura  | Quando verifica a condição? |
| ---------- | --------------------------- |
| `while`    | Antes de executar           |
| `do-while` | Depois de executar          |

## Usando `break`

Podemos interromper um loop antes da condição se tornar falsa usando `break`.

```cs
int contador = 1;

while (true)
{
    Console.WriteLine(contador);

    if (contador == 5)
        break;

    contador++;
}
```

`break` encerra o loop imediatamente.

## Usando `continue`

`continue` faz o loop pular para a próxima iteração.

```cs
int numero = 0;

while (numero < 5)
{
    numero++;

    if (numero == 3)
        continue;

    Console.WriteLine(numero);
}
```

Aqui o número 3 não será exibido.
