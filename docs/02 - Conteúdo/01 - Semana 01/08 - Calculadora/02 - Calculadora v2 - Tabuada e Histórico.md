---
draft: false
slug: /introducao-ao-csharp/calculadora-v2
tags:
  - Aula 04
  - Introdução ao C#
  - Tipos Primitivos
  - I/O
  - Estruturas de Decisão
  - Estruturas de Repetição
---

## Passo a passo

1. Nossa calculadora deve dar a possibilidade de produzir a tabuada de um número informado
2. Nossa calculadora deve dar a possibilidade de visualizar histórico de operações

## Requisito 1: Produzir a tabuada de um número informado

Agora que nossa calculadora está mais robusta, podemos adicionar um **novo recurso matemático**: a geração da tabuada de um número.

A tabuada é um dos conceitos mais fundamentais da matemática e pode ser muito útil em diversos contextos. Para isso, vamos adicionar uma nova opção no menu e usar um **loop** `**for**` para exibir os valores da multiplicação de um número escolhido pelo usuário.

**O que aprenderemos?**

- Como utilizar loops (`for`) para gerar séries de cálculos
- Como adicionar funcionalidades extras a um programa já existente

**Requisitos:**

- [ ] Criar uma opção para gerar a tabuada
- [ ] Exibir a tabuada de 1 a 10 para um número informado
- [ ] Permitir que o usuário visualize os resultados antes de continuar

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
    Console.WriteLine("5 - Tabuada");
    Console.WriteLine("S - Sair");
    Console.WriteLine("-----------------------------------------");

    Console.Write("Escolha uma opção: ");

    string opcao = Console.ReadLine();

    if (opcao == "S")
        break;

    // resto das opções omitidas

    else if (opcao == "5")
    {
        Console.Write("Digite o número desejado: ");
        string strNumeroTabuada = Console.ReadLine();
        int numeroTabuada = Convert.ToInt32(strNumeroTabuada);

        for (int i = 1; i <= 10; i++)
        {
            Console.WriteLine($"{numeroTabuada} x {i} = {numeroTabuada * i}");
        }

        Console.ReadLine();
        return;
    }
}
```

## Requisito 2: Visualizar histórico de operações

Agora que nossa calculadora já executa operações e gera tabuada, vamos adicionar um recurso muito útil: histórico de operações.

A ideia é simples:

Toda vez que o usuário fizer uma operação (somar, subtrair, multiplicar ou dividir), vamos salvar uma descrição dessa operação em um array de strings.

No menu, vamos adicionar uma nova opção para o usuário visualizar o histórico quando quiser.

**O que aprenderemos**?

- Como armazenar valores em um array
- Como controlar o preenchimento de um array com um contador
- Como exibir dados armazenados para o usuário através de uma opção de menu

Requisitos:

- [ ] Criar um array de strings para salvar o histórico
- [ ] Salvar cada operação executada no histórico
- [ ] Adicionar uma opção de menu para exibir o histórico
- [ ] Mostrar uma mensagem quando ainda não houver operações registradas

```cs
string[] historicoOperacoes = new string[100];
int totalOperacoes = 0;

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
    Console.WriteLine("5 - Tabuada");
    Console.WriteLine("6 - Histórico");
    Console.WriteLine("S - Sair");
    Console.WriteLine("-----------------------------------------");

    Console.Write("Escolha uma opção: ");
    string opcao = Console.ReadLine().ToUpper();

    if (opcao == "S")
        break;

    // Opção: Histórico
    if (opcao == "6")
    {
        Console.WriteLine("-----------------------------------------");
        Console.WriteLine("Histórico de Operações");
        Console.WriteLine("-----------------------------------------");

        if (totalOperacoes == 0)
        {
            Console.WriteLine("Nenhuma operação registrada ainda.");
        }
        else
        {
            for (int i = 0; i < totalOperacoes; i++)
            {
                Console.WriteLine(historicoOperacoes[i]);
            }
        }

        Console.ReadLine();
        continue;
    }

    Console.Write("Digite o primeiro número: ");
    decimal numero1 = Convert.ToDecimal(Console.ReadLine());

    Console.Write("Digite o segundo número: ");
    decimal numero2 = Convert.ToDecimal(Console.ReadLine());

    decimal resultado = 0;
    string operacaoTexto = "";

    if (opcao == "1")
    {
        resultado = numero1 + numero2;
        operacaoTexto = $"{numero1} + {numero2} = {resultado}";
    }
    else if (opcao == "2")
    {
        resultado = numero1 - numero2;
        operacaoTexto = $"{numero1} - {numero2} = {resultado}";
    }
    else if (opcao == "3")
    {
        resultado = numero1 * numero2;
        operacaoTexto = $"{numero1} * {numero2} = {resultado}";
    }
    else if (opcao == "4")
    {
        if (numero2 == 0)
        {
            Console.WriteLine("Erro: Não é possível dividir por zero.");
            Console.ReadLine();
            continue;
        }

        resultado = numero1 / numero2;
        operacaoTexto = $"{numero1} / {numero2} = {resultado}";
    }
    else
    {
        Console.WriteLine("Opção inválida!");
        Console.ReadLine();
        continue;
    }

    // Salvar no histórico (se ainda houver espaço)
    if (totalOperacoes < historicoOperacoes.Length)
    {
        historicoOperacoes[totalOperacoes] = operacaoTexto;
        totalOperacoes++;
    }

    Console.WriteLine("-----------------------------------------");
    Console.WriteLine($"Resultado: {resultado}");
    Console.WriteLine("-----------------------------------------");
    Console.ReadLine();
}
```
