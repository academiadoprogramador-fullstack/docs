---
draft: false
slug: /introducao-ao-csharp/jogo-dados-v2
tags:
  - Aula 16
  - "Introdução ao C#"
  - Programação Estruturada
  - Static
---

# Jogo dos Dados (Versão 2)

Nesta versão do jogo, iremos evoluir a implementação anterior para um
modelo mais organizado, utilizando **programação estruturada** e
introduzindo o conceito de **membros estáticos (`static`)**.

Enquanto na versão anterior todo o código estava concentrado no `Main`,
agora iremos separar responsabilidades, melhorar a legibilidade e tornar
o código mais fácil de manter.

---

## O que mudou em relação à versão 1?

Na versão 1, tínhamos:

- Toda a lógica concentrada em um único bloco
- Repetição de código para jogador e computador
- Pouca reutilização

Nesta versão, iremos:

- Separar o código em **classes**
- Criar **métodos responsáveis por partes específicas**
- Utilizar `static` para simplificar o acesso às funcionalidades

---

## Conceito: O que é `static`?

Antes de avançar, é importante entender o conceito central desta versão.

Em C#, quando utilizamos a palavra-chave `static`, estamos dizendo que
aquele membro pertence à **classe**, e não a um objeto específico.

## Requisito 1: Separação em classes e métodos estáticos

Agora iremos separar a lógica do jogador e do computador em classes
diferentes.

### O que estamos fazendo?

- Criando classes `Jogador` e `Computador`
- Criando métodos responsáveis por executar uma rodada
- Organizando melhor o fluxo do jogo

```csharp
static class Jogador
{
    public static int ExecutarRodada(
        int posicaoJogador,
        int limiteLinhaChegada,
        int bonusAvancoExtra,
        int penalidadeRecuo
    )
    {
        do
        {
            Console.Clear();
            Console.WriteLine("-------------------------------------------");
            Console.WriteLine("Jogo dos Dados");
            Console.WriteLine("-------------------------------------------");
            Console.WriteLine("Rodada do Jogador");
            Console.WriteLine("-------------------------------------------");

            Console.Write("Pressione ENTER para lançar um dado...");
            Console.ReadLine();

            int resultado = RandomNumberGenerator.GetInt32(1, 7);

            Console.WriteLine("-------------------------------------------");
            Console.WriteLine($"O número sorteado foi: {resultado}");
            Console.WriteLine("-------------------------------------------");

            posicaoJogador += resultado;

            Console.WriteLine($"Você está na posição: {posicaoJogador} de {limiteLinhaChegada}");

            if (posicaoJogador == 5 || posicaoJogador == 10 || posicaoJogador == 15 || posicaoJogador == 25)
            {
                Console.WriteLine($"
EVENTO: Avanço de {bonusAvancoExtra} casas!");
                posicaoJogador += bonusAvancoExtra;
            }
            else if (posicaoJogador == 7 || posicaoJogador == 13 || posicaoJogador == 20)
            {
                Console.WriteLine($"
EVENTO: Recuo de {penalidadeRecuo} casas!");
                posicaoJogador -= penalidadeRecuo;
            }

            if (posicaoJogador >= limiteLinhaChegada)
            {
                Console.WriteLine("
Parabéns! Você venceu!");
                Console.ReadLine();
                break;
            }

            if (resultado == 6)
            {
                Console.WriteLine("
EVENTO: Rodada Extra!");
                Console.ReadLine();
                continue;
            }

            Console.ReadLine();
            break;

        } while (true);

        return posicaoJogador;
    }
}
```

### Explicação

Nesta etapa, saímos de um código único e passamos a dividir
responsabilidades.

Agora:

- O jogador tem sua própria lógica
- O computador terá uma lógica semelhante
- O `Program` apenas controla o fluxo

Também introduzimos:

- Uso de métodos para encapsular comportamento
- Retorno de valores (`return`) para atualizar estado

Além disso, adicionamos uma nova regra:

👉 Se o jogador tirar **6**, ele ganha uma rodada extra.

---

## Requisito 2: Uso de atributos estáticos

Agora vamos evoluir ainda mais o código, eliminando a necessidade de
passar parâmetros.

### O que estamos fazendo?

- Transformando variáveis em **atributos da classe**
- Utilizando `static` para manter estado global

```csharp
static class Jogador
{
    public static int posicao = 0;
    private static int limiteLinhaChegada = 30;
    private static int bonusAvancoExtra = 3;
    private static int penalidadeRecuo = 2;

    public static void ExecutarRodada()
    {
        do
        {
            Console.Clear();
            Console.WriteLine("-------------------------------------------");
            Console.WriteLine("Jogo dos Dados");
            Console.WriteLine("-------------------------------------------");
            Console.WriteLine("Rodada do Jogador");
            Console.WriteLine("-------------------------------------------");

            Console.Write("Pressione ENTER para lançar um dado...");
            Console.ReadLine();

            int resultado = RandomNumberGenerator.GetInt32(1, 7);

            Console.WriteLine($"Resultado: {resultado}");

            posicao += resultado;

            if (posicao == 5 || posicao == 10 || posicao == 15 || posicao == 25)
                posicao += bonusAvancoExtra;
            else if (posicao == 7 || posicao == 13 || posicao == 20)
                posicao -= penalidadeRecuo;

            if (posicao >= limiteLinhaChegada)
                break;

            if (resultado == 6)
                continue;

            break;

        } while (true);
    }

    public static bool Venceu()
    {
        return posicao >= limiteLinhaChegada;
    }
}
```

### Explicação

Aqui damos um passo importante.

Antes: - Precisávamos passar valores entre métodos

Agora: - O estado pertence à própria classe

Isso significa que:

- `Jogador.posicao` é compartilhado
- Não precisamos mais de parâmetros
- O código fica mais simples

Também criamos o método:

```csharp
public static bool Venceu()
```

Que encapsula a lógica de vitória.

---

## Programa principal

Agora o `Program` apenas controla o fluxo:

```csharp
class Program
{
    static void Main(string[] args)
    {
        while (true)
        {
            Jogador.posicao = 0;
            Computador.posicao = 0;

            while (true)
            {
                Jogador.ExecutarRodada();

                if (Jogador.Venceu())
                    break;

                Computador.ExecutarRodada();

                if (Computador.Venceu())
                    break;
            }

            Console.Write("Deseja continuar? (s/N): ");
            string? opcao = Console.ReadLine()?.ToUpper();

            if (opcao != "S")
                break;
        }
    }
}
```

### Explicação

Agora o `Main` ficou extremamente simples:

- Inicia o jogo
- Alterna turnos
- Verifica vitória
- Pergunta se deseja continuar

👉 Toda a complexidade foi distribuída nas classes.
