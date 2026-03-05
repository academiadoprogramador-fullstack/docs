---
draft: false
slug: /introducao-ao-csharp/estrutura-de-repeticao-for
tags:
  - Aula 04
  - "Introdução ao C#"
  - Estruturas de Repetição
---

Em C#, a estrutura de repetição `for` é utilizada quando sabemos
exatamente quantas vezes queremos executar um bloco de código.

Ela é muito comum para contagens, iterações numéricas e percorrer
posições de listas.

## O que é o `for`?

O `for` executa um bloco de código repetidamente com base em três
partes:

1.  Inicialização
2.  Condição
3.  Incremento (ou atualização)

### Sintaxe básica

```cs
for (inicializacao; condicao; incremento)
{
    // código executado repetidamente
}
```

Estrutura detalhada:

- **Inicialização** → executada uma única vez
- **Condição** → verificada antes de cada repetição
- **Incremento** → executado ao final de cada repetição

## Exemplo simples

```cs
for (int i = 1; i <= 5; i++)
{
    Console.WriteLine(i);
}
```

Saída:

```text
1
2
3
4
5
```

Explicação:

- `int i = 1` → começa em 1
- `i <= 5` → repete enquanto for verdadeiro
- `i++` → incrementa 1 a cada repetição

## Entendendo cada parte

### Inicialização

Define a variável de controle:

```cs
int i = 0;
```

### Condição

Define até quando o loop continuará:

```cs
i < 10;
```

### Incremento

Atualiza o valor da variável:

```cs
i++;
```

Também podemos usar:

```cs
i += 2;
i--;
```

### Exemplo com decremento

```cs
for (int i = 5; i >= 1; i--)
{
    Console.WriteLine(i);
}
```

Saída:

```text
5
4
3
2
1
```

## Usando o `for` com cálculos

```cs
int soma = 0;

for (int i = 1; i <= 5; i++)
{
    soma += i;
}

Console.WriteLine("Soma total: " + soma);
```

Resultado:

```text
Soma total: 15
```

## Múltiplas variáveis no for

```cs
for (int i = 0, j = 10; i < j; i++, j--)
{
    Console.WriteLine($"i = {i}, j = {j}");
}
```

## Loop infinito com for

```cs
for (;;)
{
    Console.WriteLine("Loop infinito");
}
```

> ⚠️ Esse tipo de uso deve ser feito com cuidado.

## Usando break no for

```cs
for (int i = 1; i <= 10; i++)
{
    if (i == 5)
        break;

    Console.WriteLine(i);
}
```

## Usando continue no for

```cs
for (int i = 1; i <= 5; i++)
{
    if (i == 3)
        continue;

    Console.WriteLine(i);
}
```

## Quando usar `for` ao invés de `while`?

Use `for` quando:

- Você sabe exatamente o número de repetições
- Está trabalhando com contadores
- Está percorrendo posições numéricas

Use `while` quando:

- Não sabe quantas vezes o loop irá executar
- A repetição depende de uma condição dinâmica

## Comparação visual

### Com `while`

```cs
int i = 1;

while (i <= 5)
{
    Console.WriteLine(i);
    i++;
}
```

### Com `for`

```cs
for (int i = 1; i <= 5; i++)
{
    Console.WriteLine(i);
}
```
