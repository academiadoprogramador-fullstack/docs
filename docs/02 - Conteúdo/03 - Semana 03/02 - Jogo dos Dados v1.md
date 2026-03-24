---
draft: false
slug: /introducao-ao-csharp/jogo-dados-v1
tags:
  - Aula 15
  - Introdução ao C#
  - Estruturas de Repetição
  - Estruturas de Decisão
  - Random
---

# Jogo dos Dados (Versão 1)

Neste tutorial, iremos desenvolver um **jogo de corrida no console**, onde o jogador disputa contra o computador para ver quem chega primeiro à linha de chegada.

Este material segue a mesma didática da calculadora, evoluindo o sistema **passo a passo**, adicionando funcionalidades gradualmente.

---

## Objetivo do jogo

- Jogador e computador começam na posição `0`
- A cada rodada, um dado é sorteado (1 a 6)
- O valor é somado à posição atual
- Existem casas com eventos especiais
- Vence quem atingir o final primeiro

---

## Conceitos que iremos praticar

- Entrada e saída com `Console`
- Estruturas de repetição (`while`)
- Estruturas de decisão (`if/else`)
- Geração de números aleatórios
- Controle de estado do jogo

---

## Requisito 1: Sorteio do dado

Nosso primeiro passo é simular o lançamento de um dado.

Para isso, utilizamos a classe `RandomNumberGenerator`, que gera números aleatórios seguros.

### O que estamos fazendo?

- Esperamos o usuário pressionar ENTER
- Geramos um número entre 1 e 6
- Exibimos o resultado

```cs
while (true)
{
    Console.Clear();
    Console.WriteLine("----------------------------------");
    Console.WriteLine("Jogo dos Dados");
    Console.WriteLine("----------------------------------");

    Console.Write("Pressione ENTER para lançar o dado...");
    Console.ReadLine();

    int resultado = RandomNumberGenerator.GetInt32(1, 7);

    Console.WriteLine("----------------------------------");
    Console.WriteLine($"O valor sorteado foi: {resultado}!");
    Console.WriteLine("----------------------------------");

    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine()?.ToUpper();

    if (opcaoContinuar != "S")
        break;
}
```

---

## Requisito 2: Linha de chegada

Agora vamos transformar isso em um jogo com progresso.

### O que adicionamos?

- Variável de posição do jogador
- Limite de vitória
- Condição de fim de jogo

```cs
const int limiteLinhaChegada = 30;

while (true)
{
    int posicaoJogador = 0;
    bool jogoEmAndamento = true;

    while (jogoEmAndamento)
    {
        Console.Clear();
        Console.WriteLine("----------------------------------");
        Console.WriteLine("Jogo dos Dados");
        Console.WriteLine("----------------------------------");

        Console.Write("Pressione ENTER para lançar o dado...");
        Console.ReadLine();

        int resultado = RandomNumberGenerator.GetInt32(1, 7);

        Console.WriteLine("----------------------------------");
        Console.WriteLine($"O valor sorteado foi: {resultado}!");
        Console.WriteLine("----------------------------------");

        posicaoJogador += resultado;

        if (posicaoJogador >= limiteLinhaChegada)
        {
            jogoEmAndamento = false;

            Console.WriteLine("Parabéns! Você alcançou a linha de chegada!");
        }
        else
            Console.WriteLine($"Você está na posição: {posicaoJogador} de {limiteLinhaChegada}!");

        Console.WriteLine("----------------------------------");
        Console.ReadLine();
    }

    Console.Write("Deseja continuar? (s/N) ");
    string opcaoContinuar = Console.ReadLine()!.ToUpper();

    if (opcaoContinuar != "S")
        break;
}
```

---

## Requisito 3: Eventos especiais

Agora deixamos o jogo mais interessante adicionando regras especiais.

### O que adicionamos?

- Casas que fazem avançar
- Casas que fazem recuar
- Uso de múltiplas condições com `if/else`

```cs
if (posicaoJogador == 5 || posicaoJogador == 10 || posicaoJogador == 15 || posicaoJogador == 25)
{
    Console.WriteLine("EVENTO: Avanço de 3 casas!");
    posicaoJogador += 3;
}
else if (posicaoJogador == 7 || posicaoJogador == 13 || posicaoJogador == 20)
{
    Console.WriteLine("EVENTO: Recuo de 2 casas!");
    posicaoJogador -= 2;
}
```

Aqui introduzimos regras de negócio no jogo.

---

## Requisito 4: Turnos do computador

Agora o jogo passa a ter dois participantes.

### O que adicionamos?

- Segunda variável de posição
- Alternância de turnos
- Condição de vitória para ambos

```cs
const int limiteLinhaChegada = 30;

while (true)
{
    int posicaoUsuario = 0;
    int posicaoComputador = 0;

    bool jogoEmAndamento = true;

    while (jogoEmAndamento)
    {
        Console.Clear();
        Console.WriteLine("----------------------------------");
        Console.WriteLine("Jogo dos Dados");
        Console.WriteLine("----------------------------------");
        Console.WriteLine("Rodada do Usuário");
        Console.WriteLine("----------------------------------");

        Console.Write("Pressione ENTER para lançar o dado...");
        Console.ReadLine();

        int resultadoUsuario = RandomNumberGenerator.GetInt32(1, 7);

        Console.WriteLine($"Resultado: {resultadoUsuario}");
        posicaoUsuario += resultadoUsuario;

        Console.WriteLine($"Posição do jogador: {posicaoUsuario}");

        if (posicaoUsuario >= limiteLinhaChegada)
        {
            Console.WriteLine("Você venceu!");
            jogoEmAndamento = false;
            continue;
        }

        Console.WriteLine("Rodada do Computador");
        Console.ReadLine();

        int resultadoComputador = RandomNumberGenerator.GetInt32(1, 7);
        posicaoComputador += resultadoComputador;

        Console.WriteLine($"Posição do computador: {posicaoComputador}");

        if (posicaoComputador >= limiteLinhaChegada)
        {
            Console.WriteLine("Computador venceu!");
            jogoEmAndamento = false;
        }

        Console.ReadLine();
    }

    Console.Write("Deseja continuar? (s/N) ");
    string opcaoContinuar = Console.ReadLine()!.ToUpper();

    if (opcaoContinuar != "S")
        break;
}
```
