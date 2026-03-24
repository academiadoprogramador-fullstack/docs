---
slug: /introducao-ao-csharp/static
tags:
  - Aula 16
  - Introdução ao C#
  - Programação Estruturada
  - Static
---

Durante o desenvolvimento de programas em C#, principalmente no início do aprendizado, utilizamos uma abordagem **sequencial/estruturada**, onde o código é executado de cima para baixo.

Até agora, você já utilizou estruturas como:

- `if`
- `while`
- `for`
- Variáveis
- Métodos como `Console.WriteLine`

Mas existe um detalhe importante por trás desses métodos que usamos o tempo todo: muitos deles são **`static`**

---

## O que significa `static`?

A palavra-chave `static` indica que um método ou variável **pertence ao programa como um todo**, e não a uma instância específica.

Como ainda não estamos estudando orientação a objetos, pense assim:

> Um membro `static` pode ser usado diretamente, sem precisar "criar algo antes".

---

## Exemplo simples: Console.WriteLine

Você já utilizou:

```csharp
Console.WriteLine("Olá, mundo!");
```

Perceba que:

- Você **não criou nenhuma variável do tipo Console**
- Mesmo assim, conseguiu usar `WriteLine`

Isso acontece porque `WriteLine` é um método `static`.

👉 Ou seja, ele pode ser chamado diretamente.

---

## Comparando com uma ideia não-static (conceitual)

Imagine se não fosse static:

```csharp
Console console = new Console();
console.WriteLine("Olá, mundo!");
```

Seria mais trabalhoso, certo?

O `static` evita isso.

---

## Onde usamos `static` na programação estruturada?

Na programação estruturada, usamos `static` principalmente em:

- Métodos auxiliares
- Funções reutilizáveis
- Função principal (`Main`)

---

## O método Main

Todo programa em C# começa por:

```csharp
static void Main(string[] args)
{
    Console.WriteLine("Início do programa");
}
```

O `Main` precisa ser `static` porque:

👉 Ele é chamado diretamente pelo sistema  
👉 Não existe nada criado antes dele

---

## Criando nossos próprios métodos static

Podemos criar métodos para organizar melhor nosso código.

### Exemplo sem método

```csharp
Console.WriteLine("Olá!");
Console.WriteLine("Olá!");
Console.WriteLine("Olá!");
```

### Exemplo com método static

```csharp
static void ExibirMensagem()
{
    Console.WriteLine("Olá!");
}

ExibirMensagem();
ExibirMensagem();
ExibirMensagem();
```

👉 Agora temos um código mais organizado e reutilizável.

---

## Vantagens do uso de static nesse momento

Mesmo sem estudar orientação a objetos ainda, `static` já traz vários benefícios:

#### Organização

Separar o código em métodos menores

#### Reutilização

Evitar repetir código

#### Clareza

Fica mais fácil entender o que cada parte faz

---

## Quando usar static?

Neste estágio do aprendizado, use `static` quando:

- Criar métodos auxiliares
- Reaproveitar lógica
- Organizar o programa
