---
draft: true
slug: /introducao-ao-csharp/calculadora
tags:
  - Aula 02
  - Introdução ao C#
  - Tipos Primitivos
  - I/O
---

Nosso primeiro desafio é fazer um sistema para calcular operações matemáticas simples, como adição, subtração, multiplicação e divisão entre dois números.

Nossa calculadora deve necessariamente conter as funcionalidades descritas abaixo.

## Passo a passo

1. Nossa calculadora deve ter a possibilidade de somar dois números
2. Nossa calculadora deve ter a possibilidade fazer operações de soma e de subtração

## Requisito 1: Soma

O primeiro passo será criar uma interação simples entre o usuário e o sistema, para isso, iremos apresentar uma mensagem no cabeçalho utilizando `WriteLine` da classe `Console`. Para que possamos saber o que o usuário digitou, utilizaremos o método `ReadLine`.

É importante enfatizar que apenas chamar o método `ReadLine` não basta, precisamos também capturar o valor digitado em uma **variável**, iremos chamar as variáveis de `numero1` e `numero2`.

Para que a operação acima tenha sucesso, também precisamos levar em conta que tudo que o usuário digita é considerado pelo C# com um tipo de dado **string**, que não pode ser utilizado em operações aritméticas, portanto, além de capturar o resultado de `ReadLine`, também iremos convertê-lo para o tipo **double**, que serve para armazenar valores numéricos separados por casas decimais.

**O que aprenderemos?**

- Enviar mensagens para o usuário através do Console
- Receber entrada de dados do usuário através de `Readline()`
- Converter strings para números decimais com `ToDouble`

**Requisitos:**

✅ Exibir mensagem inicial  
✅ Solicitar dois números do usuário  
✅ Somar os dois números e exibir o resultado

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

`Program.cs`

## Requisito 2: Subtração

Agora que nossa calculadora permite operações de soma, o próximo passo é expandir suas funcionalidades adicionando a **subtração**.

Para isso, precisaremos oferecer ao usuário a opção de escolher qual operação deseja realizar. Implementaremos um **menu interativo**, onde o usuário pode selecionar `1` para soma ou `2` para subtração.

Utilizaremos a estrutura de decisão `if/else if` para verificar qual operação foi escolhida e calcular o resultado de acordo. Assim como na Requisito anterior, o programa continuará rodando até que o usuário decida encerrar.

**O que aprenderemos?**

- Estruturas de decisão exclusivas com `if/else if`
- Sair do programa/método com a palavra chave `return`

**Requisitos:**

✅ Adicionar a operação de subtração  
✅ Criar um menu para o usuário escolher a operação

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
decimal primeiroNumero = Convert.ToDouble(Console.ReadLine());

Console.Write("Digite o segundo número: ");
decimal segundoNumero = Convert.ToDouble(Console.ReadLine());

decimal resultado = 0;

if (opcao == "1")
	resultado = primeiroNumero + segundoNumero;

else if (opcao == "2")
	resultado = primeiroNumero - segundoNumero;

Console.WriteLine("-----------------------------------------");
Console.Write($"Resultado: {resultado}");

Console.ReadLine();
```

`Program.cs`

## Requisito 3: Multiplicação e Divisão

Agora que nossa calculadora já permite somar e subtrair, vamos completar as **quatro operações matemáticas básicas**, adicionando **multiplicação** e **divisão**.

Para tornar nosso código mais organizado e eficiente, substituiremos o `if/else if` pelo comando `switch`, que facilita a leitura e manutenção quando temos várias opções de escolha.

Além disso, ao lidar com a **divisão**, precisamos verificar se o **segundo número é zero**. Como não podemos dividir por zero, exibiremos uma mensagem de erro e utilizaremos a palavra-chave `continue` para **reiniciar a iteração do loop**, permitindo que o usuário insira outro valor.

**O que aprenderemos?**

- Utilizar estruturas de decisão `switch`
- Pular a iteração de um loop com a palavra-chave `continue`

**Requisitos:**

✅ Implementar as quatro operações matemáticas básicas  
✅ Melhorar a interface do menu

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

	Console.WriteLine("-----------------------------------------");

	Console.Write("Digite o primeiro número: ");
	int numero1 = Convert.ToInt32(Console.ReadLine());

	Console.Write("Digite o segundo número: ");
	int numero2 = Convert.ToInt32(Console.ReadLine());

	int resultado = 0;

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
			resultado = numero1 / numero2;
			break;
		default:
			Console.WriteLine("\nOpção inválida!");
			Console.ReadLine();
			continue;
	}

	Console.WriteLine("-----------------------------------------");
	Console.WriteLine($"Resultado: {resultado}");
	Console.WriteLine("-----------------------------------------");

	Console.Write("Deseja continuar? (S/N): ");
	string opcaoContinuar = Console.ReadLine().ToUpper();

	if (opcaoContinuar != "S")
		break;
}
```

`Program.cs`
