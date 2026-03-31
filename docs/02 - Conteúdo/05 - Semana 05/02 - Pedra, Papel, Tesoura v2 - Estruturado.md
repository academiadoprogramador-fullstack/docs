---
slug: /introducao-ao-csharp/pedra-papel-tesoura-v2
tags:
  - Aula 22
  - Introdução ao C#
  - Programação Estruturada
---

Nesta versão 2, iremos refatorar o jogo **Pedra, Papel e Tesoura** para uma abordagem **estruturada**, separando responsabilidades em métodos.

Na versão anterior (v1), todo o código estava dentro do `while`, o que dificultava leitura e manutenção. fileciteturn1file0

Agora, vamos dividir o problema em **pequenos blocos reutilizáveis**.

## Objetivo da Refatoração

- Melhorar a organização do código
- Separar responsabilidades
- Facilitar manutenção e leitura
- Introduzir o conceito de **métodos estáticos**

## Requisito 1: Organizar o fluxo principal

### O que estamos fazendo?

Agora o `Main` apenas **orquestra o jogo**, chamando métodos menores.

```csharp
static void Main(string[] args)
{
    while (true)
    {
        ExibirCabecalho();

        int escolhaJogador = ObterEscolhaJogador();

        int escolhaComputador = ObterEscolhaComputador();

        CompararEscolhas(escolhaJogador, escolhaComputador);

        if (!JogadorDesejaContinuar())
            break;
    }
}
```

#### Explicação

Antes: lógica toda em um único bloco  
Agora: cada responsabilidade foi separada

## Requisito 2: Exibir cabeçalho

```csharp
static void ExibirCabecalho()
{
    Console.Clear();
    Console.WriteLine("Pedra, Papel, Tesoura");
}
```

#### Explicação

Responsável apenas por limpar e exibir o título.

## Requisito 3: Obter escolha do jogador

```csharp
static int ObterEscolhaJogador()
{
    int escolhaJogador;

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
            escolhaJogador = Convert.ToInt32(opcaoSelecionada);
            break;
        }

    } while (true);

    return escolhaJogador;
}
```

#### Explicação

- Responsável apenas por entrada e validação
- Retorna um valor válido para o jogo

## Requisito 4: Gerar escolha do computador

```csharp
static int ObterEscolhaComputador()
{
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("Turno do Computador");
    Console.WriteLine("----------------------------------------");

    return RandomNumberGenerator.GetInt32(1, 4);
}
```

#### Explicação

- Gera valor aleatório
- Retorna diretamente

## Requisito 5: Comparar escolhas

```csharp
static void CompararEscolhas(int escolhaJogador, int escolhaComputador)
{
    if (escolhaJogador == escolhaComputador)
    {
        Console.WriteLine("Empate!");
    }
    else if (escolhaJogador == OPCAO_PEDRA)
    {
        if (escolhaComputador == OPCAO_TESOURA)
            Console.WriteLine("Você venceu!");
        else
            Console.WriteLine("O Computador venceu!");
    }
}
```

#### Explicação

- Recebe os valores
- Executa toda a lógica de decisão

👉 Centraliza regras do jogo

## Requisito 6: Perguntar se deseja continuar

```csharp
static bool JogadorDesejaContinuar()
{
    Console.WriteLine("Jogar novamente? (s/N): ");

    if (Console.ReadLine()?.ToUpper() != "S")
        return false;

    return true;
}
```

#### Explicação

- Retorna `true` ou `false`
- Controla o loop do jogo

👉 Comunicação direta com o `Main`

## Resultado da Refatoração

Agora temos um código:

- Mais organizado
- Mais legível
- Mais fácil de manter
- Com responsabilidades bem definidas

## Comparação v1 vs v2

| Aspecto      | v1           | v2                  |
| ------------ | ------------ | ------------------- |
| Organização  | Tudo no Main | Separado em métodos |
| Leitura      | Difícil      | Clara               |
| Manutenção   | Complexa     | Simples             |
| Reutilização | Nenhuma      | Alta                |
