---
slug: /introducao-ao-csharp/modificadores-acesso-static
tags:
  - Aula 16
  - Introdução ao C#
  - Static
  - Programação Estruturada
  - Modificadores de Acesso
---

Até agora, organizamos nossos programas utilizando métodos `static`.

Mas conforme o programa cresce, surge uma necessidade importante: separar o código em **diferentes partes (classes)**

E quando fazemos isso, aparece uma nova pergunta:

> Quais métodos podem ser usados pelo `Main` e quais devem ficar escondidos?

---

### Separando o programa em partes

Podemos dividir nosso programa em **classes estáticas diferentes**.

Pense assim:

- `Program` → onde está o `Main`
- Outras classes → responsáveis por tarefas específicas

---

### Exemplo inicial

```csharp
using System.Security.Cryptography;

class Program
{
    static void Main(string[] args)
    {
        int numero = Sorteio.SortearNumero();
        Console.WriteLine(numero);
    }
}

static class Sorteio
{
    public static int SortearNumero()
    {
        return RandomNumberGenerator.GetInt32(1, 11);
    }
}
```

---

### Por que o método precisa ser `public`?

```csharp
int numero = Sorteio.SortearNumero();
```

👉 Estamos acessando um método de outra classe

✔ `public` → permite acesso de fora da classe

---

### O que acontece se for `private`?

```csharp
static class Sorteio
{
    private static int SortearNumero()
    {
        return RandomNumberGenerator.GetInt32(1, 11);
    }
}
```

❌ O `Main` não consegue acessar → erro de compilação

---

### Regra importante

👉 `private` → só dentro da própria classe  
👉 `public` → acessível de fora (ex: pelo `Main`)

---

### Criando métodos internos (private)

```csharp
static class Sorteio
{
    public static int GerarNumero()
    {
        return GerarNumeroInterno();
    }

    private static int GerarNumeroInterno()
    {
        return RandomNumberGenerator.GetInt32(1, 11);
    }
}
```

---

### Tentando acessar o método privado

```csharp
int numero = Sorteio.GerarNumeroInterno();
```

❌ Erro!

---

### Trabalhando com atributos static

#### Público

```csharp
static class Configuracao
{
    public static int Limite = 10;
}
```

✔ Pode ser usado no `Main`

---

#### Privado

```csharp
static class Configuracao
{
    private static int Limite = 10;
}
```

❌ Não pode ser acessado fora da classe

---

### Expondo dados de forma controlada

```csharp
static class Configuracao
{
    private static int Limite = 10;

    public static int ObterLimite()
    {
        return Limite;
    }
}
```

Agora o `Main` consegue acessar de forma segura

---

### Exemplo completo

```csharp
using System.Security.Cryptography;

class Program
{
    static void Main(string[] args)
    {
        int numero = Sorteio.GerarNumero();
        int limite = Configuracao.ObterLimite();

        Console.WriteLine($"Número: {numero}");
        Console.WriteLine($"Limite: {limite}");
    }
}

static class Sorteio
{
    public static int GerarNumero()
    {
        return GerarNumeroInterno();
    }

    private static int GerarNumeroInterno()
    {
        return RandomNumberGenerator.GetInt32(1, 11);
    }
}

static class Configuracao
{
    private static int Limite = 10;

    public static int ObterLimite()
    {
        return Limite;
    }
}
```

---

## Resumo

- Classes static ajudam a organizar o código
- `public` libera acesso para o `Main`
- `private` bloqueia acesso externo
- O `Main` só enxerga o que é `public`
