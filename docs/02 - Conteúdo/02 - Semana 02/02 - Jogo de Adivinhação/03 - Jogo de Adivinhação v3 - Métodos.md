---
draft: false
slug: /introducao-ao-csharp/jogo-de-adivinhacao-v3
tags:
  - Aula 08
  - Introdução ao C#
  - Estruturas de Decisão
  - Estruturas de Repetição
  - Arrays
  - Randomização
  - Métodos
---

Neste tutorial, vamos aprender como transformar um código sequencial (onde tudo acontece um passo após o outro no mesmo bloco) em um código estruturado.

A programação estruturada utiliza métodos para organizar o código em "blocos de responsabilidade". Isso torna o programa mais fácil de ler, testar e dar manutenção.

## O que é Refatoração?

Refatorar significa melhorar a estrutura interna de um código sem alterar o que ele faz para o usuário final. É como organizar o seu guarda-roupa: as roupas continuam as mesmas, mas agora você encontra tudo muito mais rápido.

## Requisito 1: Identificando as responsabilidades do programa

Antes de criar métodos, precisamos observar o que o programa realmente faz.

Ao analisar o código atual do jogo, percebemos que existem **três grandes responsabilidades** acontecendo dentro do mesmo bloco:

1. Exibir o menu e perguntar a dificuldade ao jogador.
2. Configurar as regras do jogo com base na dificuldade escolhida.
3. Executar a partida (tentativas, validações e pontuação).

Quando percebemos essas responsabilidades, fica mais fácil dividir o
programa em partes menores.

Nossa estratégia será:

- criar um método para **exibir o menu**
- criar um método para **configurar a partida**
- criar um método para **executar o jogo**

Isso deixará o fluxo principal do programa muito mais simples de entender.

## Requisito 2: Criando o primeiro método (Interface)

A primeira parte que podemos separar do programa é a **interface do menu**.

Essa parte apenas mostra informações na tela e lê a escolha do jogador.

Quando movemos esse código para um método, estamos aplicando um conceito
importante da programação: **abstração**.

A abstração permite esconder detalhes internos e deixar apenas a
informação essencial visível.

Em vez de enxergar várias linhas de `Console.WriteLine`, o programa passa
a enxergar apenas uma chamada de método.

Isso torna o fluxo principal do programa muito mais fácil de ler.

Código Sequencial:

```csharp
// ...código acima
Console.Clear();

Console.WriteLine("------------------------------------");
Console.WriteLine("Jogo de Adivinhação");
Console.WriteLine("------------------------------------");
Console.WriteLine("Escolha o nível de dificuldade:");
Console.WriteLine("------------------------------------");
Console.WriteLine("1 - Fácil (10 tentativas)");
Console.WriteLine("2 - Médio (5 tentativas)");
Console.WriteLine("3 - Difícil (3 tentativas)");
Console.WriteLine("------------------------------------");

Console.Write("Digite sua escolha: ");
string? dificuldade = Console.ReadLine();

// ...código abaixo
```

Código Refatorado:

```csharp
static string? ExibirMenuEscolhaDificuldade()
{
    Console.Clear();

    Console.WriteLine("------------------------------------");
    Console.WriteLine("Jogo de Adivinhação");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("Escolha o nível de dificuldade:");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("1 - Fácil (10 tentativas)");
    Console.WriteLine("2 - Médio (5 tentativas)");
    Console.WriteLine("3 - Difícil (3 tentativas)");
    Console.WriteLine("------------------------------------");

    Console.Write("Digite sua escolha: ");
    string? dificuldade = Console.ReadLine();

    return dificuldade;
}
```

> O `static string?` indica que este método devolve (retorna) um texto para quem o chamou.

## Requisito 3: Configuração do jogo com parâmetros de saída (`out`)

O próximo passo é mover a lógica que define **as regras da partida**.

Dependendo da dificuldade escolhida pelo jogador, precisamos configurar:

- o número máximo possível
- a quantidade de tentativas disponíveis

Nesse caso, o método precisa devolver **mais de um valor**.

Para isso utilizamos a palavra-chave `out`.

Parâmetros `out` permitem que um método **retorne múltiplas informações
ao mesmo tempo**.

Assim, o método `ConfigurarPartida` recebe a dificuldade escolhida e
devolve os valores que serão utilizados no restante do jogo.

Código Sequencial:

```csharp
int numeroMaximo;
int tentativasMaximas;

switch (dificuldade)
{
    case "1":
        numeroMaximo = 20;
        tentativasMaximas = 10;
        break;

    case "2":
        numeroMaximo = 50;
        tentativasMaximas = 5;
        break;

    case "3":
        numeroMaximo = 100;
        tentativasMaximas = 3;
        break;

    default:
        Console.WriteLine("------------------------------------");
        Console.WriteLine("Por favor, selecione uma dificuldade válida.");
        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();
        continue;
}
```

Código Refatorado:

```csharp
static void ConfigurarPartida(string? dificuldade, out int numeroMaximo, out int tentativasMaximas)
{
    numeroMaximo = 0;
    tentativasMaximas = 0;

    switch (dificuldade)
    {
        case "1":
            numeroMaximo = 20;
            tentativasMaximas = 10;
            break;

        case "2":
            numeroMaximo = 50;
            tentativasMaximas = 5;
            break;

        case "3":
            numeroMaximo = 100;
            tentativasMaximas = 3;
            break;

        default:
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Por favor, selecione uma dificuldade válida.");
            Console.Write("Digite ENTER para continuar...");
            Console.ReadLine();
            Environment.Exit(0);
            break;
    }
}
```

## Requisito 4: Isolando a lógica da partida

A parte mais complexa do programa é a execução da partida.

Ela envolve várias responsabilidades:

- gerar o número secreto
- ler as tentativas do jogador
- validar números repetidos
- calcular a pontuação
- informar se o jogador acertou ou errou

Em vez de manter toda essa lógica no método principal, vamos movê-la
para um novo método chamado `ExecutarPartida`.

Isso permite **isolar a lógica do jogo em um único lugar**, facilitando:

- leitura
- manutenção
- futuras melhorias

Código Sequencial:

```csharp
int numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo + 1);

for (int tentativa = 1; tentativa <= tentativasMaximas; tentativa++)
{
    Console.Clear();
    Console.WriteLine("------------------------------------");
    Console.WriteLine($"Tentativa {tentativa} de {tentativasMaximas}.");
    Console.WriteLine("------------------------------------");

    Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
    string? chute = Console.ReadLine();

    int numeroDigitado = Convert.ToInt32(chute);

    bool numeroEstaRepetido = false;

    for (int indiceChecado = 0; indiceChecado < numerosDigitados.Length; indiceChecado++)
    {
        if (numerosDigitados[indiceChecado] == numeroDigitado)
        {
            numeroEstaRepetido = true;
            break;
        }
    }

    if (numeroEstaRepetido == true)
    {
        Console.WriteLine("------------------------------------");
        Console.WriteLine("Você já digitou esse número, tente novamente.");
        Console.WriteLine("------------------------------------");
        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();

        tentativa--;

        continue;
    }

    if (contadorNumerosDigitados < numerosDigitados.Length)
    {
        numerosDigitados[contadorNumerosDigitados] = numeroDigitado;

        contadorNumerosDigitados++;
    }

    if (numeroDigitado == numeroAleatorio)
    {
        Console.WriteLine("------------------------------------");
        Console.WriteLine("Parabéns, você acertou!");
        Console.WriteLine("------------------------------------");

        break;
    }
    else if (numeroDigitado > numeroAleatorio)
    {
        Console.WriteLine("------------------------------------");
        Console.WriteLine("O número digitado foi maior que o número secreto!");
        Console.WriteLine("------------------------------------");
    }
    else
    {
        Console.WriteLine("------------------------------------");
        Console.WriteLine("O número digitado foi menor que o número secreto!");
        Console.WriteLine("------------------------------------");
    }

    int diferencaNumerica = Math.Abs(numeroAleatorio - numeroDigitado); // 90 - 100 = 10;

    if (diferencaNumerica >= 10)
    {
        pontuacao -= 100;
    }
    else if (diferencaNumerica >= 5)
    {
        pontuacao -= 50;
    }
    else
    {
        pontuacao -= 20;
    }

    Console.WriteLine("Sua pontuação é: " + pontuacao);
    Console.WriteLine("------------------------------------");
    Console.Write("Digite ENTER para continuar...");
    Console.ReadLine();

    if (tentativa == tentativasMaximas)
    {
        Console.WriteLine($"Você usou todas as suas tentativas! O número era {numeroAleatorio}.");
        Console.WriteLine("------------------------------------");
        break;
    }
}
```

Código Refatorado:

```csharp
static void ExecutarPartida(int numeroMaximo, int tentativasMaximas)
{
    int numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo + 1);

    int[] numerosDigitados = new int[100];
    int contadorNumerosDigitados = 0;
    int pontuacao = 1000;

    for (int tentativa = 1; tentativa <= tentativasMaximas; tentativa++)
    {
        Console.Clear();
        Console.WriteLine("------------------------------------");
        Console.WriteLine($"Tentativa {tentativa} de {tentativasMaximas}.");
        Console.WriteLine("------------------------------------");

        Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
        string? chute = Console.ReadLine();

        int numeroDigitado = Convert.ToInt32(chute);

        bool numeroEstaRepetido = false;

        for (int indiceChecado = 0; indiceChecado < numerosDigitados.Length; indiceChecado++)
        {
            if (numerosDigitados[indiceChecado] == numeroDigitado)
            {
                numeroEstaRepetido = true;
                break;
            }
        }

        if (numeroEstaRepetido == true)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Você já digitou esse número, tente novamente.");
            Console.WriteLine("------------------------------------");
            Console.Write("Digite ENTER para continuar...");
            Console.ReadLine();

            tentativa--;

            continue;
        }

        if (contadorNumerosDigitados < numerosDigitados.Length)
        {
            numerosDigitados[contadorNumerosDigitados] = numeroDigitado;

            contadorNumerosDigitados++;
        }

        if (numeroDigitado == numeroAleatorio)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Parabéns, você acertou!");
            Console.WriteLine("------------------------------------");

            break;
        }
        else if (numeroDigitado > numeroAleatorio)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("O número digitado foi maior que o número secreto!");
            Console.WriteLine("------------------------------------");
        }
        else
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("O número digitado foi menor que o número secreto!");
            Console.WriteLine("------------------------------------");
        }

        int diferencaNumerica = Math.Abs(numeroAleatorio - numeroDigitado); // 90 - 100 = 10;

        if (diferencaNumerica >= 10)
        {
            pontuacao -= 100;
        }
        else if (diferencaNumerica >= 5)
        {
            pontuacao -= 50;
        }
        else
        {
            pontuacao -= 20;
        }

        Console.WriteLine("Sua pontuação é: " + pontuacao);
        Console.WriteLine("------------------------------------");
        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();

        if (tentativa == tentativasMaximas)
        {
            Console.WriteLine($"Você usou todas as suas tentativas! O número era {numeroAleatorio}.");
            Console.WriteLine("------------------------------------");
            break;
        }
    }
}
```

## Requisito 5: Organizando o fluxo principal da aplicação

Depois de criar os métodos auxiliares, podemos reorganizar o método
`Main`, que é o ponto de entrada do programa.

Agora o método principal passa a funcionar como um **orquestrador** do
programa.

Ele apenas define a sequência das operações:

1. Mostrar o menu
2. Configurar a partida
3. Executar o jogo
4. Perguntar se o jogador deseja continuar

Isso faz com que o fluxo do programa fique **muito mais claro e fácil de
entender**, mesmo para quem está lendo o código pela primeira vez.

Observe como o `Main` agora descreve o funcionamento do programa em
apenas algumas linhas.

Código Sequencial:

```csharp
while (true == true)
{
    int[] numerosDigitados = new int[100];
    int contadorNumerosDigitados = 0;
    int pontuacao = 1000;

    Console.Clear();

    Console.WriteLine("------------------------------------");
    Console.WriteLine("Jogo de Adivinhação");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("Escolha o nível de dificuldade:");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("1 - Fácil (10 tentativas)");
    Console.WriteLine("2 - Médio (5 tentativas)");
    Console.WriteLine("3 - Difícil (3 tentativas)");
    Console.WriteLine("------------------------------------");

    Console.Write("Digite sua escolha: ");
    string? dificuldade = Console.ReadLine();

    int numeroMaximo;
    int tentativasMaximas;

    switch (dificuldade)
    {
        case "1":
            numeroMaximo = 20;
            tentativasMaximas = 10;
            break;

        case "2":
            numeroMaximo = 50;
            tentativasMaximas = 5;
            break;

        case "3":
            numeroMaximo = 100;
            tentativasMaximas = 3;
            break;

        default:
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Por favor, selecione uma dificuldade válida.");
            Console.Write("Digite ENTER para continuar...");
            Console.ReadLine();
            continue;
    }

    int numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo + 1);

    for (int tentativa = 1; tentativa <= tentativasMaximas; tentativa++)
    {
        Console.Clear();
        Console.WriteLine("------------------------------------");
        Console.WriteLine($"Tentativa {tentativa} de {tentativasMaximas}.");
        Console.WriteLine("------------------------------------");

        Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
        string? chute = Console.ReadLine();

        int numeroDigitado = Convert.ToInt32(chute);

        bool numeroEstaRepetido = false;

        for (int indiceChecado = 0; indiceChecado < numerosDigitados.Length; indiceChecado++)
        {
            if (numerosDigitados[indiceChecado] == numeroDigitado)
            {
                numeroEstaRepetido = true;
                break;
            }
        }

        if (numeroEstaRepetido == true)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Você já digitou esse número, tente novamente.");
            Console.WriteLine("------------------------------------");
            Console.Write("Digite ENTER para continuar...");
            Console.ReadLine();

            tentativa--;

            continue;
        }

        if (contadorNumerosDigitados < numerosDigitados.Length)
        {
            numerosDigitados[contadorNumerosDigitados] = numeroDigitado;

            contadorNumerosDigitados++;
        }

        if (numeroDigitado == numeroAleatorio)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Parabéns, você acertou!");
            Console.WriteLine("------------------------------------");

            break;
        }
        else if (numeroDigitado > numeroAleatorio)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("O número digitado foi maior que o número secreto!");
            Console.WriteLine("------------------------------------");
        }
        else
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("O número digitado foi menor que o número secreto!");
            Console.WriteLine("------------------------------------");
        }

        int diferencaNumerica = Math.Abs(numeroAleatorio - numeroDigitado); // 90 - 100 = 10;

        if (diferencaNumerica >= 10)
        {
            pontuacao -= 100;
        }
        else if (diferencaNumerica >= 5)
        {
            pontuacao -= 50;
        }
        else
        {
            pontuacao -= 20;
        }

        Console.WriteLine("Sua pontuação é: " + pontuacao);
        Console.WriteLine("------------------------------------");
        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();

        if (tentativa == tentativasMaximas)
        {
            Console.WriteLine($"Você usou todas as suas tentativas! O número era {numeroAleatorio}.");
            Console.WriteLine("------------------------------------");
            break;
        }
    }

    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine();

    if (opcaoContinuar?.ToUpper() != "S")
    {
        break;
    }
}
```

Código Refatorado:

```csharp
static void Main(string[] args)
{
    while (true)
    {
        string? dificuldade = ExibirMenuEscolhaDificuldade();

        ConfigurarPartida(dificuldade, out int numeroMaximo, out int tentativasMaximas);

        ExecutarPartida(numeroMaximo, tentativasMaximas);

        if (JogadorDesejaContinuar() == true)
            break;
    }
}

static bool JogadorDesejaContinuar()
{
    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine();

    if (opcaoContinuar?.ToUpper() != "S")
        return false;

    return true;
}
```

## Código Completo

```csharp
using System; // biblioteca padrão do sistema com classes genéricas
using System.Security.Cryptography; // biblioteca padrão do sistema relacionada a criptografia

class Program
{
    static void Main(string[] args)
    {
        while (true)
        {
            string? dificuldade = ExibirMenuEscolhaDificuldade();

            ConfigurarPartida(dificuldade, out int numeroMaximo, out int tentativasMaximas);

            ExecutarPartida(numeroMaximo, tentativasMaximas);

            if (JogadorDesejaContinuar() == true)
                break;
        }
    }

    static string? ExibirMenuEscolhaDificuldade()
    {
        Console.Clear();

        Console.WriteLine("------------------------------------");
        Console.WriteLine("Jogo de Adivinhação");
        Console.WriteLine("------------------------------------");
        Console.WriteLine("Escolha o nível de dificuldade:");
        Console.WriteLine("------------------------------------");
        Console.WriteLine("1 - Fácil (10 tentativas)");
        Console.WriteLine("2 - Médio (5 tentativas)");
        Console.WriteLine("3 - Difícil (3 tentativas)");
        Console.WriteLine("------------------------------------");

        Console.Write("Digite sua escolha: ");
        string? dificuldade = Console.ReadLine();

        return dificuldade;
    }

    static void ConfigurarPartida(string? dificuldade, out int numeroMaximo, out int tentativasMaximas)
    {
        numeroMaximo = 0;
        tentativasMaximas = 0;

        switch (dificuldade)
        {
            case "1":
                numeroMaximo = 20;
                tentativasMaximas = 10;
                break;

            case "2":
                numeroMaximo = 50;
                tentativasMaximas = 5;
                break;

            case "3":
                numeroMaximo = 100;
                tentativasMaximas = 3;
                break;

            default:
                Console.WriteLine("------------------------------------");
                Console.WriteLine("Por favor, selecione uma dificuldade válida.");
                Console.Write("Digite ENTER para continuar...");
                Console.ReadLine();
                Environment.Exit(0);
                break;
        }
    }

    static void ExecutarPartida(int numeroMaximo, int tentativasMaximas)
    {
        int numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo + 1);

        int[] numerosDigitados = new int[100];
        int contadorNumerosDigitados = 0;
        int pontuacao = 1000;

        for (int tentativa = 1; tentativa <= tentativasMaximas; tentativa++)
        {
            Console.Clear();
            Console.WriteLine("------------------------------------");
            Console.WriteLine($"Tentativa {tentativa} de {tentativasMaximas}.");
            Console.WriteLine("------------------------------------");

            Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
            string? chute = Console.ReadLine();

            int numeroDigitado = Convert.ToInt32(chute);

            bool numeroEstaRepetido = false;

            for (int indiceChecado = 0; indiceChecado < numerosDigitados.Length; indiceChecado++)
            {
                if (numerosDigitados[indiceChecado] == numeroDigitado)
                {
                    numeroEstaRepetido = true;
                    break;
                }
            }

            if (numeroEstaRepetido == true)
            {
                Console.WriteLine("------------------------------------");
                Console.WriteLine("Você já digitou esse número, tente novamente.");
                Console.WriteLine("------------------------------------");
                Console.Write("Digite ENTER para continuar...");
                Console.ReadLine();

                tentativa--;

                continue;
            }

            if (contadorNumerosDigitados < numerosDigitados.Length)
            {
                numerosDigitados[contadorNumerosDigitados] = numeroDigitado;

                contadorNumerosDigitados++;
            }

            if (numeroDigitado == numeroAleatorio)
            {
                Console.WriteLine("------------------------------------");
                Console.WriteLine("Parabéns, você acertou!");
                Console.WriteLine("------------------------------------");

                break;
            }
            else if (numeroDigitado > numeroAleatorio)
            {
                Console.WriteLine("------------------------------------");
                Console.WriteLine("O número digitado foi maior que o número secreto!");
                Console.WriteLine("------------------------------------");
            }
            else
            {
                Console.WriteLine("------------------------------------");
                Console.WriteLine("O número digitado foi menor que o número secreto!");
                Console.WriteLine("------------------------------------");
            }

            int diferencaNumerica = Math.Abs(numeroAleatorio - numeroDigitado); // 90 - 100 = 10;

            if (diferencaNumerica >= 10)
            {
                pontuacao -= 100;
            }
            else if (diferencaNumerica >= 5)
            {
                pontuacao -= 50;
            }
            else
            {
                pontuacao -= 20;
            }

            Console.WriteLine("Sua pontuação é: " + pontuacao);
            Console.WriteLine("------------------------------------");
            Console.Write("Digite ENTER para continuar...");
            Console.ReadLine();

            if (tentativa == tentativasMaximas)
            {
                Console.WriteLine($"Você usou todas as suas tentativas! O número era {numeroAleatorio}.");
                Console.WriteLine("------------------------------------");
                break;
            }
        }
    }

    static bool JogadorDesejaContinuar()
    {
        Console.Write("Deseja continuar? (s/N): ");
        string? opcaoContinuar = Console.ReadLine();

        if (opcaoContinuar?.ToUpper() != "S")
            return false;

        return true;
    }
}
```
