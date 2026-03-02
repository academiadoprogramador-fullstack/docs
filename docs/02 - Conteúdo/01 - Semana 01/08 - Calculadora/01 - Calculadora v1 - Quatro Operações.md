---
draft: true
slug: /introducao-ao-csharp/calculadora-v1
tags:
  - Aula 02
  - Introdução ao C#
  - Tipos Primitivos
  - I/O
  - Estruturas de Decisão
  - Estruturas de Repetição
---

Nosso primeiro desafio é fazer um sistema para calcular operações matemáticas simples, como adição, subtração, multiplicação e divisão entre dois números.

Nossa calculadora deve necessariamente conter as funcionalidades descritas abaixo.

## Passo a passo

1. Nossa calculadora deve ter a possibilidade de somar dois números
2. Nossa calculadora deve ter a possibilidade de subtrair dois números
3. Nossa calculadora deve ter a possibilidade de multiplicar dois números
4. Nossa calculadora deve ter a possibilidade de dividir dois números
5. Nossa calculadora deve permitir que o usuário continue utilizando o sistema até decidir sair

## Requisito 1: Soma

O primeiro passo será criar uma interação simples entre o usuário e o sistema, para isso, iremos apresentar uma mensagem no cabeçalho utilizando `WriteLine` da classe `Console`. Para que possamos saber o que o usuário digitou, utilizaremos o método `ReadLine`.

É importante enfatizar que apenas chamar o método `ReadLine` não basta, precisamos também capturar o valor digitado em uma **variável**, iremos chamar as variáveis de `numero1` e `numero2`.

Para que a operação acima tenha sucesso, também precisamos levar em conta que tudo que o usuário digita é considerado pelo C# com um tipo de dado **string**, que não pode ser utilizado em operações aritméticas, portanto, além de capturar o resultado de `ReadLine`, também iremos convertê-lo para o tipo **double**, que serve para armazenar valores numéricos separados por casas decimais.

**O que aprenderemos?**

- Enviar mensagens para o usuário através do Console
- Receber entrada de dados do usuário através de `Readline()`
- Converter strings para números decimais com `ToDouble`

**Requisitos:**

- [ ] Exibir mensagem inicial
- [ ] Solicitar dois números do usuário
- [ ] Somar os dois números e exibir o resultado

```cs
Console.WriteLine("-----------------------------------------");
Console.WriteLine("Calculadora Tabajara 2025");
Console.WriteLine("-----------------------------------------");

Console.Write("Digite o primeiro número: ");
string strNumero1 = Console.ReadLine();
decimal primeiroNumero = Convert.ToDecimal(strNumero1);

Console.Write("Digite o segundo número: ");
string strNumero2 = Console.ReadLine();
decimal segundoNumero = Convert.ToDecimal(strNumero2);

decimal resultado = primeiroNumero + segundoNumero;

Console.WriteLine();
Console.WriteLine($"Resultado da soma: {resultado}");

Console.ReadLine();
```

## Requisito 2: Subtração

Agora que nossa calculadora permite operações de soma, o próximo passo é expandir suas funcionalidades adicionando a **subtração**.

Para isso, precisaremos oferecer ao usuário a opção de escolher qual operação deseja realizar. Implementaremos um **menu interativo**, onde o usuário pode selecionar `1` para soma ou `2` para subtração.

Utilizaremos a estrutura de decisão `if/else if` para verificar qual operação foi escolhida e calcular o resultado de acordo. Assim como na Requisito anterior, o programa continuará rodando até que o usuário decida encerrar.

**O que aprenderemos?**

- Estruturas de decisão exclusivas com `if/else if`
- Sair do programa/método com a palavra chave `return`

**Requisitos:**

- [ ] Adicionar a operação de subtração
- [ ] Criar um menu para o usuário escolher a operação

```cs
Console.WriteLine("-----------------------------------------");
Console.WriteLine("Calculadora Tabajara 2025");
Console.WriteLine("-----------------------------------------");

Console.WriteLine("1 - Somar");
Console.WriteLine("2 - Subtrair");
Console.WriteLine("S - Sair");
Console.WriteLine("-----------------------------------------");

Console.Write("Escolha uma opção: ");

string opcao = Console.ReadLine();

if (opcao == "S")
{
	return;
}

Console.WriteLine("-----------------------------------------");

// atribuição direta do input do usuário para variável com ReadLine()
Console.Write("Digite o primeiro número: ");
decimal primeiroNumero = Convert.ToDecimal(Console.ReadLine());

Console.Write("Digite o segundo número: ");
decimal segundoNumero = Convert.ToDecimal(Console.ReadLine());

decimal resultado = 0;

if (opcao == "1")
	resultado = primeiroNumero + segundoNumero;

else if (opcao == "2")
	resultado = primeiroNumero - segundoNumero;

Console.WriteLine("-----------------------------------------");
Console.Write($"Resultado: {resultado}");

Console.ReadLine();
```

## Requisito 3: Multiplicação

Agora iremos adicionar a operação de **multiplicação**.

Assim como fizemos anteriormente, adicionaremos uma nova opção ao menu e utilizaremos a estrutura `switch` para organizar melhor as decisões.

**O que aprenderemos?**

- Organizar múltiplas decisões com `switch`

**Requisitos:**

- [ ] Adicionar a operação de multiplicação
- [ ] Atualizar o menu

```cs
Console.WriteLine("-----------------------------------------");
Console.WriteLine("Calculadora Tabajara 2025");
Console.WriteLine("-----------------------------------------");

Console.WriteLine("1 - Somar");
Console.WriteLine("2 - Subtrair");
Console.WriteLine("3 - Multiplicar");
Console.WriteLine("S - Sair");
Console.WriteLine("-----------------------------------------");

Console.Write("Escolha uma opção: ");

string opcao = Console.ReadLine();

if (opcao == "S")
    return;

Console.WriteLine("-----------------------------------------");

Console.Write("Digite o primeiro número: ");
decimal numero1 = Convert.ToDecimal(Console.ReadLine());

Console.Write("Digite o segundo número: ");
decimal numero2 = Convert.ToDecimal(Console.ReadLine());

decimal resultado = 0;

switch (opcao)
{
    case "1":
        resultado = numero1 + numero2;
        break;
    case "2":
        resultado = numero1 - numero2;
        break;
    case "3":
        resultado = numero1 * numero2;
        break;
    default:
        Console.WriteLine("Opção inválida!");
        return;
}

Console.WriteLine("-----------------------------------------");
Console.WriteLine($"Resultado: {resultado}");
Console.ReadLine();
```

## Requisito 4: Divisão

Agora vamos adicionar a operação de divisão.

Diferente das outras operações, precisamos tomar cuidado com um caso especial: não é possível dividir por zero.

Antes de realizar a divisão, verificaremos se o segundo número é igual a zero.

O que aprenderemos?

- Validação de regras antes de executar uma operação
- Evitar erros matemáticos no sistema

Requisitos:

- [ ] Adicionar operação de divisão
- [ ] Impedir divisão por zero

```cs
Console.WriteLine("-----------------------------------------");
Console.WriteLine("Calculadora Tabajara 2025");
Console.WriteLine("-----------------------------------------");

Console.WriteLine("1 - Somar");
Console.WriteLine("2 - Subtrair");
Console.WriteLine("3 - Multiplicar");
Console.WriteLine("4 - Dividir");
Console.WriteLine("S - Sair");
Console.WriteLine("-----------------------------------------");

Console.Write("Escolha uma opção: ");

string opcao = Console.ReadLine();

if (opcao == "S")
    return;

Console.WriteLine("-----------------------------------------");

Console.Write("Digite o primeiro número: ");
decimal numero1 = Convert.ToDecimal(Console.ReadLine());

Console.Write("Digite o segundo número: ");
decimal numero2 = Convert.ToDecimal(Console.ReadLine());

decimal resultado = 0;

switch (opcao)
{
    case "1":
        resultado = numero1 + numero2;
        break;
    case "2":
        resultado = numero1 - numero2;
        break;
    case "3":
        resultado = numero1 * numero2;
        break;
	case "4":
		if (numero2 == 0)
		{
			Console.WriteLine("Erro: Não é possível dividir por zero.");
			Console.ReadLine();
			continue;
		}
		resultado = numero1 / numero2;
		break;

    default:
        Console.WriteLine("Opção inválida!");
		Console.ReadLine();
        return;
}

Console.WriteLine("-----------------------------------------");
Console.WriteLine($"Resultado: {resultado}");
Console.ReadLine();
```

## Requisito 5: Permitir múltiplas execuções (Repetição)

Até agora, nossa calculadora executa apenas uma operação por vez.

Agora iremos permitir que o usuário utilize o sistema várias vezes até decidir sair.

Para isso, utilizaremos a estrutura de repetição `while`.

O que aprenderemos?

Criar repetições com `while`

Encerrar loops com `break`

Requisitos:

- [ ] Permitir múltiplas operações
- [ ] Encerrar o sistema quando o usuário desejar

```cs
while (true)
{
    Console.Clear();

    Console.WriteLine("-----------------------------------------");
    Console.WriteLine("Calculadora Tabajara 2025");
    Console.WriteLine("-----------------------------------------");
    Console.WriteLine("1 - Somar");
    Console.WriteLine("2 - Subtrair");
    Console.WriteLine("3 - Multiplicar");
    Console.WriteLine("4 - Dividir");
    Console.WriteLine("S - Sair");
    Console.WriteLine("-----------------------------------------");

    Console.Write("Escolha uma opção: ");
    string opcao = Console.ReadLine().ToUpper();

    if (opcao == "S")
        break;

    Console.Write("Digite o primeiro número: ");
    decimal numero1 = Convert.ToDecimal(Console.ReadLine());

    Console.Write("Digite o segundo número: ");
    decimal numero2 = Convert.ToDecimal(Console.ReadLine());

    decimal resultado = 0;

    switch (opcao)
    {
        case "1":
            resultado = numero1 + numero2;
            break;
        case "2":
            resultado = numero1 - numero2;
            break;
        case "3":
            resultado = numero1 * numero2;
            break;
        case "4":
            if (numero2 == 0)
            {
                Console.WriteLine("Erro: Não é possível dividir por zero.");
                Console.ReadLine();
                continue;
            }
            resultado = numero1 / numero2;
            break;
        default:
            Console.WriteLine("Opção inválida!");
            Console.ReadLine();
            continue;
    }

    Console.WriteLine($"Resultado: {resultado}");
    Console.ReadLine();
}
```
