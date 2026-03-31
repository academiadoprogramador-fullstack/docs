---
slug: /introducao-ao-csharp/pedra-papel-tesoura-v3
tags:
  - Aula 22
  - Introdução ao C#
  - Programação Estruturada
  - Static
---

Nesta versão 3, iremos evoluir ainda mais o jogo **Pedra, Papel e Tesoura**, organizando o código em **múltiplas classes com métodos estáticos**.

Na versão anterior (v2), já havíamos separado o código em métodos.

Agora, vamos dar um passo além: **separar responsabilidades em classes diferentes**.

## Objetivo da Refatoração

- Separar responsabilidades por domínio
- Melhorar organização do código
- Facilitar leitura e manutenção
- Aproximar o código de uma arquitetura mais escalável

## Requisito 1: Separar responsabilidades em classes

### O que estamos fazendo?

Agora cada parte do sistema possui sua própria classe:

- `Jogador` → entrada do usuário
- `Computador` → geração aleatória
- `PedraPapelTesoura` → regras do jogo
- `Program` → fluxo principal

Cada classe tem uma responsabilidade bem definida

## Requisito 2: Classe Jogador

```csharp
class Jogador
{
    public static int ObterEscolha()
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
}
```

#### Explicação

- Responsável apenas pela interação com o jogador
- Valida e retorna a escolha

## Requisito 3: Classe Computador

```csharp
class Computador
{
    public static int ObterEscolha()
    {
        Console.WriteLine("----------------------------------------");
        Console.WriteLine("Turno do Computador");
        Console.WriteLine("----------------------------------------");

        return RandomNumberGenerator.GetInt32(1, 4);
    }
}
```

#### Explicação

- Responsável por gerar a jogada do computador
- Isola a lógica de aleatoriedade

## Requisito 4: Classe PedraPapelTesoura

```csharp
class PedraPapelTesoura
{
    const int OPCAO_PEDRA = 1;
    const int OPCAO_PAPEL = 2;
    const int OPCAO_TESOURA = 3;

    public static void CompararEscolhas(int escolhaJogador, int escolhaComputador)
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
}
```

#### Explicação

- Centraliza as regras do jogo
- Mantém a lógica isolada do restante do sistema

Isso facilita futuras mudanças nas regras

## Requisito 5: Organizar o fluxo principal

```csharp
class Program
{
    static void Main(string[] args)
    {
        while (true)
        {
            ExibirCabecalho();

            int escolhaJogador = Jogador.ObterEscolha();

            int escolhaComputador = Computador.ObterEscolha();

            PedraPapelTesoura.CompararEscolhas(escolhaJogador, escolhaComputador);

            if (!JogadorDesejaContinuar())
                break;
        }
    }
}
```

#### Explicação

- O `Main` agora apenas coordena o fluxo
- Toda lógica foi delegada para outras classes

## Requisito 6: Métodos auxiliares

```csharp
static void ExibirCabecalho()
{
    Console.Clear();
    Console.WriteLine("Pedra, Papel, Tesoura");
}

static bool JogadorDesejaContinuar()
{
    Console.WriteLine("Jogar novamente? (s/N): ");

    if (Console.ReadLine()?.ToUpper() != "S")
        return false;

    return true;
}
```

#### Explicação

- Mantém o `Program` limpo
- Responsável apenas por interface e controle

## Resultado da Refatoração

Agora temos um código:

- Separado por responsabilidades
- Mais organizado
- Mais próximo de boas práticas

## Comparação v2 vs v3

| Aspecto          | v2      | v3                |
| ---------------- | ------- | ----------------- |
| Organização      | Métodos | Classes + Métodos |
| Responsabilidade | Parcial | Bem definida      |
| Escalabilidade   | Média   | Alta              |
| Reutilização     | Boa     | Excelente         |
