---
draft: false
slug: /introducao-ao-csharp/geracao-de-numeros-aleatorios
tags:
  - Aula 06
  - Introdução ao C#
  - Randomização
---

Em C#, podemos gerar números aleatórios para criar jogos, sorteios,
simulações e várias outras funcionalidades.

Esse recurso é muito útil quando queremos que o programa produza valores
diferentes a cada execução.

Para isso utilizaremos a classe `RandomNumberGenerator`, disponível no
namespace `System.Security.Cryptography`.

Essa classe gera números aleatórios com base em um gerador
criptograficamente seguro.

## Importando o namespace necessário

Antes de usar o gerador de números aleatórios, precisamos importar o
namespace correto.

```cs
using System.Security.Cryptography;
```

Isso nos permite acessar a classe `RandomNumberGenerator`.

## Gerando um número aleatório

Podemos gerar um número aleatório inteiro usando o método `GetInt32`.

```cs
using System.Security.Cryptography;

int numeroAleatorio = RandomNumberGenerator.GetInt32(0, 100);

Console.WriteLine(numeroAleatorio);
```

Nesse exemplo:

- `GetInt32(0, 100)` gera um número inteiro aleatório
- O valor mínimo é `0`
- O valor máximo é `100`, mas **não é incluído no sorteio**

Ou seja, os números possíveis vão de **0 a 99**.

## Gerando números dentro de um intervalo

Normalmente queremos gerar números dentro de um intervalo específico.

```cs
using System.Security.Cryptography;

int numeroAleatorio = RandomNumberGenerator.GetInt32(1, 11);

Console.WriteLine(numeroAleatorio);
```

Nesse caso:

- `1` é o valor mínimo
- `11` é o limite superior não incluído
- O resultado será um número entre **1 e 10**

## Entendendo o limite superior

O segundo valor passado para `GetInt32` não é incluído.

Veja este exemplo:

```cs
using System.Security.Cryptography;

int numero = RandomNumberGenerator.GetInt32(0, 5);

Console.WriteLine(numero);
```

Os valores possíveis serão:

- 0
- 1
- 2
- 3
- 4

O número `5` não será sorteado.

## Exemplo prático com sorteio

Podemos usar números aleatórios para criar um pequeno sorteio.

```cs
using System.Security.Cryptography;

int numeroSorteado = RandomNumberGenerator.GetInt32(1, 101);

Console.WriteLine($"Número sorteado: {numeroSorteado}");
```

Nesse exemplo o programa sorteia um número entre **1 e 100**.

## Gerando vários números aleatórios

Podemos gerar vários números chamando o método várias vezes.

```cs
using System.Security.Cryptography;

int numero1 = RandomNumberGenerator.GetInt32(1, 11);
int numero2 = RandomNumberGenerator.GetInt32(1, 11);
int numero3 = RandomNumberGenerator.GetInt32(1, 11);

Console.WriteLine(numero1);
Console.WriteLine(numero2);
Console.WriteLine(numero3);
```

Cada chamada ao método gera um novo número aleatório.

## Usando números aleatórios com while

Também podemos usar estruturas de repetição para gerar vários números.

```cs
using System.Security.Cryptography;

int contador = 1;

while (contador <= 5)
{
    int numeroAleatorio = RandomNumberGenerator.GetInt32(1, 101);

    Console.WriteLine($"Número {contador}: {numeroAleatorio}");

    contador++;
}
```

Esse exemplo gera **5 números aleatórios entre 1 e 100**.

## Usando números aleatórios com for

Outra forma comum de gerar vários números é utilizando o `for`.

```cs
using System.Security.Cryptography;

for (int i = 1; i <= 5; i++)
{
    int numeroAleatorio = RandomNumberGenerator.GetInt32(1, 101);

    Console.WriteLine($"Número {i}: {numeroAleatorio}");
}
```

Esse programa também gera **5 números aleatórios entre 1 e 100**.
