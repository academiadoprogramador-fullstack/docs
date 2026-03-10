---
draft: false
slug: /introducao-ao-csharp/jogo-de-adivinhacao-v2
tags:
  - Aula 07
  - Introdução ao C#
  - Estruturas de Decisão
  - Estruturas de Repetição
  - Arrays
  - Randomização
---

Nesta nova versão do projeto iremos **evoluir o jogo de adivinhação**
implementado anteriormente.

Agora iremos adicionar novas funcionalidades que tornam o jogo mais
interessante e completo.

Entre as melhorias implementadas nesta versão estão:

- escolha de nível de dificuldade
- validação de tentativas repetidas
- sistema de pontuação do jogador

Essas melhorias introduzem novos conceitos importantes da linguagem C#,
como:

- uso de `switch`
- manipulação de arrays
- controle de estado do jogo
- cálculos matemáticos
- lógica de pontuação

## Requisito 1: Escolha de dificuldade

Agora vamos tornar o jogo mais interessante permitindo que o jogador
**escolha um nível de dificuldade** antes de iniciar a partida.

Cada nível de dificuldade irá alterar duas coisas no jogo:

- a **quantidade de tentativas disponíveis**
- o **intervalo possível do número secreto**

Isso significa que níveis mais difíceis terão **menos tentativas** e
**intervalos maiores de números**, tornando mais difícil adivinhar o
número correto.

Para implementar essa funcionalidade, iremos:

- solicitar ao jogador que escolha uma dificuldade
- utilizar uma estrutura `switch` para definir as configurações do jogo
- alterar a quantidade de tentativas disponíveis
- alterar o limite máximo do número aleatório gerado

**Requisitos**

- [ ] Permitir que o jogador escolha um nível de dificuldade
- [ ] Definir a quantidade de tentativas de acordo com a dificuldade
- [ ] Alterar o intervalo do número secreto conforme a dificuldade escolhida
- [ ] Validar se a opção digitada pelo usuário é válida

```csharp
using System.Security.Cryptography;

while (true == true)
{
    Console.Clear();

    Console.WriteLine("------------------------------------");
    Console.WriteLine("Jogo de Adivinhação");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("Escolha um nível de dificuldade:");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("1 - Fácil (10 tentativas)");
    Console.WriteLine("2 - Médio (5 tentativas)");
    Console.WriteLine("3 - Difícil (3 tentativas)");
    Console.WriteLine("------------------------------------");

    Console.Write("Digite sua escolha: ");
    string? entrada = Console.ReadLine();

    int totalDeTentativas;
    int numeroAleatorio;
    int numeroMaximo;

    switch (entrada)
    {
        case "1":
            totalDeTentativas = 10;
            numeroMaximo = 21;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "2":
            totalDeTentativas = 5;
            numeroMaximo = 51;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "3":
            totalDeTentativas = 3;
            numeroMaximo = 71;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        default:
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Por favor, selecione uma dificuldade válida.");
            Console.WriteLine("Digite ENTER para continuar...");
            Console.ReadLine();
            continue;
    }

    for (int tentativa = 1; tentativa <= totalDeTentativas; tentativa++)
    {
        Console.Clear();
        Console.WriteLine("------------------------------------");
        Console.WriteLine($"Tentativa {tentativa} de {totalDeTentativas}");
        Console.WriteLine("------------------------------------");

        Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
        string? chute = Console.ReadLine();

        int numeroDigitado = Convert.ToInt32(chute);

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

        if (tentativa == totalDeTentativas)
        {
            Console.WriteLine($"Você usou todas as tentativas. O número era {numeroAleatorio}.");
            Console.WriteLine("------------------------------------");
            break;
        }

        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();
    }

    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine();

    if (opcaoContinuar?.ToUpper() != "S")
    {
        break;
    }
}
```

## Requisito 2: Validação tentativas repetidas

Agora vamos melhorar a experiência do jogador impedindo que o mesmo número
seja digitado mais de uma vez durante a partida.

Até este ponto, o jogador pode repetir tentativas já realizadas, o que
não contribui para o progresso do jogo e pode desperdiçar tentativas.

Para resolver isso, iremos:

- armazenar os números já digitados em um array
- percorrer os valores já registrados para verificar se o número atual já foi informado
- exibir uma mensagem de aviso caso o jogador repita uma tentativa
- impedir que uma tentativa repetida seja descontada do total disponível

Com isso, o jogo passa a validar melhor as entradas do usuário e evita
que números já utilizados sejam informados novamente.

**Requisitos**

- [ ] Armazenar os números digitados pelo jogador
- [ ] Verificar se um número já foi informado anteriormente
- [ ] Exibir uma mensagem quando o jogador repetir uma tentativa
- [ ] Garantir que tentativas repetidas não sejam descontadas

```csharp
while (true == true)
{
    int[] numerosDigitados = new int[100];
    int contadorNumerosDigitados = 0;

    Console.Clear();

    Console.WriteLine("------------------------------------");
    Console.WriteLine("Jogo de Adivinhação");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("Escolha um nível de dificuldade:");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("1 - Fácil (10 tentativas)");
    Console.WriteLine("2 - Médio (5 tentativas)");
    Console.WriteLine("3 - Difícil (3 tentativas)");
    Console.WriteLine("------------------------------------");

    Console.Write("Digite sua escolha: ");
    string? entrada = Console.ReadLine();

    int totalDeTentativas;
    int numeroAleatorio;
    int numeroMaximo;

    switch (entrada)
    {
        case "1":
            totalDeTentativas = 10;
            numeroMaximo = 21;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "2":
            totalDeTentativas = 5;
            numeroMaximo = 51;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "3":
            totalDeTentativas = 3;
            numeroMaximo = 71;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        default:
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Por favor, selecione uma dificuldade válida.");
            Console.WriteLine("Digite ENTER para continuar...");
            Console.ReadLine();
            continue;
    }

    for (int tentativa = 1; tentativa <= totalDeTentativas; tentativa++)
    {
        Console.Clear();
        Console.WriteLine("------------------------------------");
        Console.WriteLine($"Tentativa {tentativa} de {totalDeTentativas}");
        Console.WriteLine("------------------------------------");

        Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
        string? chute = Console.ReadLine();

        int numeroDigitado = Convert.ToInt32(chute);

        bool numeroInvalido = false;

        for (int i = 0; i < numerosDigitados.Length; i++)
        {
            if (numerosDigitados[i] == numeroDigitado)
            {
                numeroInvalido = true;
                break;
            }
        }

        if (numeroInvalido == true)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Você já digitou esse número, tente novamente.");
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Digite ENTER para continuar...");
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

        if (tentativa == totalDeTentativas)
        {
            Console.WriteLine($"Você usou todas as tentativas. O número era {numeroAleatorio}.");
            Console.WriteLine("------------------------------------");
            break;
        }

        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();
    }

    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine();

    if (opcaoContinuar?.ToUpper() != "S")
    {
        break;
    }
}
```

## Requisito 3: Pontuação do Jogador

Agora vamos adicionar um **sistema de pontuação** ao jogo.

Até este ponto, o jogo apenas informa se o jogador acertou ou não o número
secreto. Com a introdução da pontuação, o jogo passa a recompensar
tentativas mais próximas do número correto.

O jogador inicia cada partida com **1000 pontos**.

A cada tentativa incorreta, a pontuação será reduzida de acordo com a
diferença entre o número digitado e o número secreto.

Quanto **mais distante** o jogador estiver do número correto, **maior será
a penalidade aplicada**.

Para implementar essa funcionalidade, iremos:

- criar uma variável para armazenar a pontuação inicial do jogador
- calcular a diferença entre o número digitado e o número secreto
- aplicar penalidades diferentes dependendo dessa diferença
- exibir a pontuação atual após cada tentativa

Para calcular a diferença entre os números utilizaremos o método
`Math.Abs()`, que retorna o **valor absoluto** de um número.

Isso garante que a diferença será sempre positiva, independentemente do
valor digitado ser maior ou menor que o número secreto.

**Requisitos**

- [ ] Inicializar a pontuação do jogador
- [ ] Calcular a diferença entre o chute e o número secreto
- [ ] Reduzir a pontuação de acordo com a distância do número correto
- [ ] Exibir a pontuação atual após cada tentativa

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
    Console.WriteLine("Escolha um nível de dificuldade:");
    Console.WriteLine("------------------------------------");
    Console.WriteLine("1 - Fácil (10 tentativas)");
    Console.WriteLine("2 - Médio (5 tentativas)");
    Console.WriteLine("3 - Difícil (3 tentativas)");
    Console.WriteLine("------------------------------------");

    Console.Write("Digite sua escolha: ");
    string? entrada = Console.ReadLine();

    int totalDeTentativas;
    int numeroAleatorio;
    int numeroMaximo;

    switch (entrada)
    {
        case "1":
            totalDeTentativas = 10;
            numeroMaximo = 21;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "2":
            totalDeTentativas = 5;
            numeroMaximo = 51;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        case "3":
            totalDeTentativas = 3;
            numeroMaximo = 71;
            numeroAleatorio = RandomNumberGenerator.GetInt32(1, numeroMaximo);
            break;

        default:
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Por favor, selecione uma dificuldade válida.");
            Console.WriteLine("Digite ENTER para continuar...");
            Console.ReadLine();
            continue;
    }

    for (int tentativa = 1; tentativa <= totalDeTentativas; tentativa++)
    {
        Console.Clear();
        Console.WriteLine("------------------------------------");
        Console.WriteLine($"Tentativa {tentativa} de {totalDeTentativas}");
        Console.WriteLine("------------------------------------");

        Console.Write($"Digite um número entre 1 e {numeroMaximo}: ");
        string? chute = Console.ReadLine();

        int numeroDigitado = Convert.ToInt32(chute);

        bool numeroInvalido = false;

        for (int i = 0; i < numerosDigitados.Length; i++)
        {
            if (numerosDigitados[i] == numeroDigitado)
            {
                numeroInvalido = true;
                break;
            }
        }

        if (numeroInvalido == true)
        {
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Você já digitou esse número, tente novamente.");
            Console.WriteLine("------------------------------------");
            Console.WriteLine("Digite ENTER para continuar...");
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

        int diferencaNumerica = Math.Abs(numeroAleatorio - numeroDigitado);

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

        if (tentativa == totalDeTentativas)
        {
            Console.WriteLine($"Você usou todas as tentativas. O número era {numeroAleatorio}.");
            Console.WriteLine("------------------------------------");
            break;
        }

        Console.WriteLine("Sua pontuação é: " + pontuacao);
        Console.WriteLine("------------------------------------");
        Console.Write("Digite ENTER para continuar...");
        Console.ReadLine();
    }

    Console.Write("Deseja continuar? (s/N): ");
    string? opcaoContinuar = Console.ReadLine();

    if (opcaoContinuar?.ToUpper() != "S")
    {
        break;
    }
}
```
