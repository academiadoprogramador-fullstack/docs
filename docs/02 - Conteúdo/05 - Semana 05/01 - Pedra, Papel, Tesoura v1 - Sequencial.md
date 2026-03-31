---
slug: /introducao-ao-csharp/pedra-papel-tesoura-v1
tags:
  - Aula 22
  - Introdução ao C#
---

Nesta atividade, iremos desenvolver o clássico jogo **Pedra, Papel e Tesoura** utilizando C#.

Este exercício é uma excelente oportunidade para praticar:

- Estruturas de repetição (`while`)
- Estruturas de decisão (`if/else`)
- Validação de entrada do usuário
- Uso de constantes para organização do código
- Geração de números aleatórios

Assim como no **Robô Tupiniquim**, iremos evoluir o sistema passo a passo, organizando o código em pequenos requisitos.

## Contexto do Problema

O jogo funciona da seguinte forma:

- O jogador escolhe entre:
  - Pedra
  - Papel
  - Tesoura
- O computador escolhe aleatoriamente uma opção
- O resultado é determinado com base nas regras:
  - Pedra vence Tesoura
  - Tesoura vence Papel
  - Papel vence Pedra

## Requisito 1: Definir as opções do jogo

### O que estamos fazendo?

Neste primeiro passo, vamos definir **constantes** para representar cada opção do jogo.

```csharp
const int OPCAO_PEDRA = 1;
const int OPCAO_PAPEL = 2;
const int OPCAO_TESOURA = 3;
```

## Requisito 2: Criar o loop principal do jogo

```csharp
while (true)
{
    Console.Clear();
    Console.WriteLine("Pedra, Papel, Tesoura");
}
```

## Requisito 3: Receber a jogada do jogador

```csharp
int opcaoJogador;

do
{
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("Turno do Jogador");
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("1 - Pedra");
    Console.WriteLine("2 - Papel");
    Console.WriteLine("3 - Tesoura");
    Console.WriteLine("----------------------------------------");
    Console.Write("Digite uma opção válida: ");

    string? opcaoSelecionada = Console.ReadLine();

    if (
        opcaoSelecionada == "1" ||
        opcaoSelecionada == "2" ||
        opcaoSelecionada == "3"
    )
    {
        opcaoJogador = Convert.ToInt32(opcaoSelecionada);
        break;
    }

} while (true);
```

## Requisito 4: Gerar a jogada do computador

```csharp
int opcaoComputador = RandomNumberGenerator.GetInt32(1, 4);
```

## Requisito 5: Verificar empate

```csharp
if (opcaoJogador == opcaoComputador)
{
    Console.WriteLine("Empate!");
}
```

## Requisito 6: Verificar vitória e derrota

#### Pedra

```csharp
else if (opcaoJogador == OPCAO_PEDRA)
{
    Console.Write("Pedra x ");

    if (opcaoComputador == OPCAO_TESOURA)
    {
        Console.WriteLine("Tesoura");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("Você venceu!");
        Console.WriteLine("----------------------------------------");
    }
    else
    {
        Console.WriteLine("Papel");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("O Computador venceu!");
        Console.WriteLine("----------------------------------------");
    }
}
```

#### Papel

```csharp
else if (opcaoJogador == OPCAO_PAPEL)
{
    Console.Write("Papel x ");

    if (opcaoComputador == OPCAO_PEDRA)
    {
        Console.WriteLine("Pedra");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("Você venceu!");
        Console.WriteLine("----------------------------------------");
    }
    else
    {
        Console.WriteLine("Tesoura");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("O Computador venceu!");
        Console.WriteLine("----------------------------------------");
    }
}
```

#### Tesoura

```csharp
else if (opcaoJogador == OPCAO_TESOURA)
{
    Console.Write("Tesoura x ");

    if (opcaoComputador == OPCAO_PAPEL)
    {
        Console.WriteLine("Papel");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("Você venceu!");
        Console.WriteLine("----------------------------------------");
    }
    else
    {
        Console.WriteLine("Pedra");

        Console.WriteLine("----------------------------------------");
        Console.WriteLine("O Computador venceu!");
        Console.WriteLine("----------------------------------------");
    }
}
```

## Requisito 7: Permitir jogar novamente

```csharp
Console.WriteLine("Jogar novamente? (s/N): ");

if (Console.ReadLine()?.ToUpper() != "S")
    break;
```
