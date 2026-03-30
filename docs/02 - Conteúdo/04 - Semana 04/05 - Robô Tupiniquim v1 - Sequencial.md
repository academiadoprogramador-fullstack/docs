---
slug: /introducao-ao-csharp/robo-tupiniquim-v1
tags:
  - Aula 18
  - Introdução ao C#
  - Programação Estruturada
---

Nesta atividade, iremos desenvolver o sistema de navegação do **Robô Tupiniquim I**, responsável por explorar um terreno em formato de grade (grid).

Este exercício é uma excelente oportunidade para praticar:

- Estruturas de repetição (`for`)
- Estruturas de decisão (`if/else`)
- Manipulação de caracteres e strings
- Organização lógica do código

Assim como fizemos no **Jogo dos Dados**, iremos evoluir o problema passo a passo, melhorando a clareza e organização da solução.

---

## Contexto do Problema

A Agência Espacial Brasileira (AEB) enviará comandos simples para o robô:

- `E` → Girar 90° para a esquerda
- `D` → Girar 90° para a direita
- `M` → Mover uma posição para frente

O robô possui:

- Uma posição: `(X, Y)`
- Uma orientação: `N`, `S`, `L`, `O`

---

## Requisito 1: Rotação do Robô

### O que estamos fazendo?

Neste primeiro passo, vamos implementar **apenas a rotação**, sem movimentação.

Ou seja:

- O robô muda a direção
- Mas permanece na mesma posição

```csharp
int posicaoX = 1;
int posicaoY = 2;
char orientacao = 'N';

string comandoCompleto = "EMEMEMEMM";

Console.WriteLine("---------------------------------");
Console.WriteLine("Robô Tupiniquim");
Console.WriteLine("---------------------------------");
Console.WriteLine($"Posição inicial: {posicaoX} {posicaoY} {orientacao}");

for (int contador = 0; contador < comandoCompleto.Length; contador++)
{
    char comandoAtual = comandoCompleto[contador];

    if (comandoAtual == 'E')
    {
        if (orientacao == 'N') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'N';
    }
    else if (comandoAtual == 'D')
    {
        if (orientacao == 'N') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'N';
    }
}

Console.WriteLine($"Posição final: {posicaoX} {posicaoY} {orientacao}");
Console.ReadLine();
```

### Explicação

Aqui estamos percorrendo a string de comandos utilizando um `for`.

Para cada comando:

- Identificamos se é `E` ou `D`
- Atualizamos a orientação do robô

👉 Note que usamos uma cadeia de `if/else` para simular uma “bússola”.

---

## Requisito 2: Movimentação do Robô

Agora vamos evoluir o sistema, adicionando o comando `M`.

### O que estamos fazendo?

- Mantendo a lógica de rotação
- Adicionando movimentação baseada na direção atual

```csharp
int posicaoX = 1;
int posicaoY = 2;
char orientacao = 'N';

string comandoCompleto = "EMEMEMEMM";

Console.WriteLine("---------------------------------");
Console.WriteLine("Robô Tupiniquim");
Console.WriteLine("---------------------------------");
Console.WriteLine($"Posição inicial: {posicaoX} {posicaoY} {orientacao}");

for (int contador = 0; contador < comandoCompleto.Length; contador++)
{
    char comandoAtual = comandoCompleto[contador];

    if (comandoAtual == 'E')
    {
        if (orientacao == 'N') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'N';
    }
    else if (comandoAtual == 'D')
    {
        if (orientacao == 'N') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'N';
    }
    else if (comandoAtual == 'M')
    {
        if (orientacao == 'N') posicaoY++;
        else if (orientacao == 'S') posicaoY--;
        else if (orientacao == 'O') posicaoX--;
        else if (orientacao == 'L') posicaoX++;
    }
}

Console.WriteLine($"Posição final: {posicaoX} {posicaoY} {orientacao}");
Console.ReadLine();
```
