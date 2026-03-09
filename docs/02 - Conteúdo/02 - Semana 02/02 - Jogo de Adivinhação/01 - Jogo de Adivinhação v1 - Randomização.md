---
draft: false
slug: /introducao-ao-csharp/jogo-de-adivinhacao
tags:
  - Aula 06
  - Introdução ao C#
  - Tipos Primitivos
  - I/O
  - Estruturas de Decisão
  - Estruturas de Repetição
  - Randomização
---

Neste projeto iremos construir um **jogo de adivinhação no console**,
evoluindo o programa por meio de **requisitos incrementais**.

Ao longo do desenvolvimento iremos revisar conceitos fundamentais de C#,
como:

- Entrada e saída no console
- Conversão de tipos
- Estruturas condicionais
- Estruturas de repetição
- Geração de números aleatórios

Também utilizaremos a classe **RandomNumberGenerator** do namespace
`System.Security.Cryptography` para gerar números aleatórios.

## Passo a passo

1. Nosso jogo deve aceitar o input do jogador e exibir o valor digitado
2. Nosso jogo deve gerar um número secreto aleatório
3. Nosso jogo deve validar a tentativa do jogador e exibir uma mensagem

## Requisito 1: Estrutura básica e entrada do usuário

O primeiro passo será criar a estrutura básica do jogo, permitindo que o
usuário digite um número e veja esse número exibido na tela.

**Requisitos**

- [ ] Exibir uma mensagem inicial
- [ ] Solicitar um número ao usuário
- [ ] Exibir o número digitado

```csharp
Console.WriteLine("----------------------------------------");
Console.WriteLine("Jogo de Adivinhação");
Console.WriteLine("----------------------------------------");

Console.Write("Digite um número: ");
int numeroDigitado = Convert.ToInt32(Console.ReadLine());

Console.WriteLine($"\nVocê digitou: {numeroDigitado}");

Console.ReadLine();
```

## Requisito 2: Gerar um número secreto aleatório

Agora vamos adicionar um **número secreto gerado aleatoriamente**.

Utilizaremos a classe `RandomNumberGenerator` para gerar um número entre
**1 e 20**.

```csharp
using System.Security.Cryptography;

Console.WriteLine("----------------------------------------");
Console.WriteLine("Jogo de Adivinhação");
Console.WriteLine("----------------------------------------");

int numeroSecreto = RandomNumberGenerator.GetInt32(1, 21);

Console.Write("Digite um número entre 1 e 20: ");
int numeroDigitado = Convert.ToInt32(Console.ReadLine());

Console.WriteLine("----------------------------------------");
Console.WriteLine($"Você digitou: {numeroDigitado}");
Console.WriteLine($"O número secreto era: {numeroSecreto}");
Console.WriteLine("----------------------------------------");

Console.ReadLine();
```

## Requisito 3: Verificar se o jogador acertou

Agora vamos comparar o número digitado com o número secreto.

**Requisitos**

- [ ] Comparar os números
- [ ] Informar se o jogador acertou
- [ ] Informar se o número digitado é maior ou menor

```csharp
using System.Security.Cryptography;

Console.WriteLine("----------------------------------------");
Console.WriteLine("Jogo de Adivinhação");
Console.WriteLine("----------------------------------------");

int numeroSecreto = RandomNumberGenerator.GetInt32(1, 21);

Console.Write("Digite um número entre 1 e 20: ");
int numeroDigitado = Convert.ToInt32(Console.ReadLine());

if (numeroDigitado == numeroSecreto)
{
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("Parabéns! Você acertou!");
    Console.WriteLine("----------------------------------------");
}
else if (numeroDigitado > numeroSecreto)
{
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("O número digitado é maior que o número secreto.");
    Console.WriteLine("----------------------------------------");
}
else
{
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("O número digitado é menor que o número secreto.");
    Console.WriteLine("----------------------------------------");
}

Console.ReadLine();
```

## Requisito 4: Criar múltiplas tentativas

Agora vamos permitir que o jogador tenha **várias tentativas para
acertar o número secreto**.

Iremos utilizar o loop `while` para manter o programa executando após a avaliação da tentativa.

**Requisitos**

- [ ] Permitir várias execuções do jogo

```csharp
using System.Security.Cryptography;

while (true)
{
    Console.Clear();
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("Jogo de Adivinhação");
    Console.WriteLine("----------------------------------------");

    int numeroSecreto = RandomNumberGenerator.GetInt32(1, 21);

    Console.Write("Digite um número entre 1 e 20: ");
    int numeroDigitado = Convert.ToInt32(Console.ReadLine());

    if (numeroDigitado == numeroSecreto)
    {
        Console.WriteLine("----------------------------------------");
        Console.WriteLine("Parabéns! Você acertou!");
        Console.WriteLine("----------------------------------------");
    }
    else if (numeroDigitado > numeroSecreto)
    {
        Console.WriteLine("----------------------------------------");
        Console.WriteLine("O número digitado é maior que o número secreto.");
        Console.WriteLine("----------------------------------------");
    }
    else
    {
        Console.WriteLine("----------------------------------------");
        Console.WriteLine("O número digitado é menor que o número secreto.");
        Console.WriteLine("----------------------------------------");
    }

    Console.ReadLine();
}
```
