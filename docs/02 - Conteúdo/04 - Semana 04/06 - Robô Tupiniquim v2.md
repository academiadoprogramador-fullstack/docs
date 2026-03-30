---
slug: /introducao-ao-csharp/robo-tupiniquim-v2
tags:
  - Aula 18
  - Introdução ao C#
  - Programação Estruturada
  - Static
---

Nesta versão, vamos refatorar a solução do **Robô Tupiniquim** para um modelo mais organizado, seguindo a mesma ideia aplicada no **Jogo dos Dados**.

Na versão anterior, conseguimos resolver o problema corretamente utilizando um fluxo mais direto: variáveis no `Main`, um `for` percorrendo os comandos e uma sequência de `if/else` para decidir o que fazer a cada letra.

Agora, o objetivo não é apenas “fazer funcionar”.

O objetivo desta etapa é começar a organizar melhor a solução, distribuindo responsabilidades e deixando o código mais fácil de ler, manter e expandir.

---

## O que mudou em relação à versão 1?

Na versão 1, tínhamos uma implementação mais sequencial:

- A posição e a orientação do robô eram controladas diretamente no código principal
- O laço `for` percorria os comandos
- A rotação e a movimentação eram tratadas no mesmo bloco
- Toda a lógica ficava concentrada em um único fluxo

Essa abordagem é ótima para começar, porque nos ajuda a entender o problema.

Mas, conforme a solução cresce, ela começa a ficar mais difícil de manter.

Nesta versão, vamos:

- Centralizar o estado do robô em uma classe estática
- Separar a lógica em métodos específicos
- Fazer o `Main` cuidar apenas do fluxo principal
- Tornar o código mais próximo de uma solução estruturada

---

## Relembrando a versão 1

Antes de partir para a refatoração, vale observar um trecho da ideia usada na versão anterior:

```csharp
for (int contador = 0; contador < comandoCompleto.Length; contador++)
{
    char comandoAtual = comandoCompleto[contador];

    if (comandoAtual == 'E')
    {
        if (orientacao == 'N') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'N';
    }
    else if (comandoAtual == 'D')
    {
        if (orientacao == 'N') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'N';
    }
    else if (comandoAtual == 'M')
    {
        if (orientacao == 'N') posicaoY++;
        else if (orientacao == 'S') posicaoY--;
        else if (orientacao == 'O') posicaoX--;
        else if (orientacao == 'L') posicaoX++;
    }
}
```

### O que esse código fazia bem?

Esse código já resolvia o problema corretamente:

- Lia os comandos um por um
- Verificava o comando atual
- Alterava a orientação quando necessário
- Movia o robô quando necessário

### Qual é a limitação?

O principal problema não é a lógica em si, e sim a **organização**.

Perceba que, dentro do mesmo laço:

- decidimos qual comando executar
- implementamos a rotação para esquerda
- implementamos a rotação para direita
- implementamos o avanço do robô

Tudo isso fica misturado no mesmo lugar.

Para um exercício pequeno, isso funciona bem.

Mas, quando pensamos em evolução de código, testes, manutenção e reaproveitamento, faz sentido separar essas responsabilidades.

---

## Conceito: por que refatorar?

Refatorar significa **melhorar a estrutura do código sem alterar o seu comportamento esperado**.

Ou seja:

- o robô continua fazendo a mesma coisa
- os comandos continuam tendo o mesmo significado
- a saída continua sendo equivalente

O que muda é a forma como organizamos a solução.

Nesta etapa, queremos deixar mais claro que:

- existe um “robô” com estado próprio
- existe uma ação para configurar esse robô
- existe uma ação para executar comandos
- existem ações menores, como girar e avançar

---

## Requisito 1: Transformar o robô em uma estrutura organizada

Agora vamos reorganizar a solução em torno de uma classe estática chamada `Robo`.

### O que estamos fazendo?

- Criando uma classe para concentrar os dados do robô
- Guardando `posicaoX`, `posicaoY` e `orientacao` dentro dessa classe
- Movendo a lógica de comportamento para métodos específicos

```csharp
static class Robo
{
    public static int posicaoX;
    public static int posicaoY;
    public static char orientacao;

    public static void Configurar(int pX, int pY, char ort)
    {
        posicaoX = pX;
        posicaoY = pY;
        orientacao = ort;
    }

    public static void ExecutarComando(string comandoCompleto)
    {
        for (int contador = 0; contador < comandoCompleto.Length; contador++)
        {
            char comandoAtual = comandoCompleto[contador];

            if (comandoAtual == 'E')
                GirarParaEsquerda();

            else if (comandoAtual == 'D')
                GirarParaDireita();

            else if (comandoAtual == 'M')
                Avancar();
        }
    }

    public static void Avancar()
    {
        if (orientacao == 'N') posicaoY++;
        else if (orientacao == 'S') posicaoY--;
        else if (orientacao == 'O') posicaoX--;
        else if (orientacao == 'L') posicaoX++;
    }

    public static void GirarParaEsquerda()
    {
        if (orientacao == 'N') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'N';
    }

    public static void GirarParaDireita()
    {
        if (orientacao == 'N') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'N';
    }
}
```

### Explicação

Aqui demos um passo importante de organização.

Antes, o estado do robô ficava espalhado no fluxo principal.

Agora, ele passa a ficar centralizado na própria classe `Robo`.

Isso nos dá algumas vantagens:

- fica mais claro onde os dados do robô estão
- cada comportamento recebeu seu próprio método
- o código principal deixa de conhecer os detalhes de rotação e avanço

Perceba que o método `ExecutarComando` agora ficou muito mais legível.

Em vez de conter toda a lógica detalhada de rotação e movimentação, ele apenas decide **qual ação chamar**.

Isso é um sinal forte de melhoria estrutural.

---

## Requisito 2: Separar a decisão da implementação

Na versão 1, o laço principal fazia duas coisas ao mesmo tempo:

1. Descobria qual comando estava sendo lido
2. Executava toda a lógica daquele comando

Agora essas responsabilidades foram separadas.

#### Antes

```csharp
else if (comandoAtual == 'M')
{
    if (orientacao == 'N') posicaoY++;
    else if (orientacao == 'S') posicaoY--;
    else if (orientacao == 'O') posicaoX--;
    else if (orientacao == 'L') posicaoX++;
}
```

#### Agora

```csharp
else if (comandoAtual == 'M')
    Avancar();
```

E a implementação do avanço fica isolada:

```csharp
public static void Avancar()
{
    if (orientacao == 'N') posicaoY++;
    else if (orientacao == 'S') posicaoY--;
    else if (orientacao == 'O') posicaoX--;
    else if (orientacao == 'L') posicaoX++;
}
```

### Explicação

Essa separação melhora muito a leitura do código.

Quando lemos `Avancar()`, já entendemos a intenção da ação sem precisar olhar imediatamente todos os detalhes da implementação.

O mesmo vale para:

- `GirarParaEsquerda()`
- `GirarParaDireita()`

Esse é um dos principais objetivos da refatoração estruturada:

👉 deixar o código mais expressivo.

---

## Requisito 3: Simplificar o `Main`

Com a lógica do robô organizada na classe `Robo`, o `Main` agora pode ficar mais limpo.

```csharp
class Program
{
    static void Main(string[] args)
    {
        Robo.Configurar(1, 2, 'N');

        Console.WriteLine("---------------------------------");
        Console.WriteLine("Robô Tupiniquim");
        Console.WriteLine("---------------------------------");
        Console.WriteLine($"Posição inicial: {Robo.posicaoX} {Robo.posicaoY} {Robo.orientacao}");

        Robo.ExecutarComando("EMEMEMEMM");

        Console.WriteLine($"Posição final: {Robo.posicaoX} {Robo.posicaoY} {Robo.orientacao}");
        Console.ReadLine();
    }
}
```

### Explicação

Agora o `Main` ficou responsável apenas por:

- configurar a posição inicial do robô
- exibir informações ao usuário
- mandar o robô executar uma sequência de comandos
- exibir a posição final

Ele não precisa mais saber como o robô gira ou como o robô avança.

Esses detalhes ficaram encapsulados na classe `Robo`.

Isso deixa o programa principal mais simples e mais fácil de entender.

---

## Conceito: o papel do `static` nesta solução

Assim como no documento do **Jogo dos Dados**, estamos utilizando `static` para trabalhar com uma estrutura única acessível diretamente pelo nome da classe.

Neste caso:

- `Robo.posicaoX`
- `Robo.posicaoY`
- `Robo.orientacao`
- `Robo.Configurar(...)`
- `Robo.ExecutarComando(...)`

Isso significa que não precisamos criar um objeto com `new` neste momento do curso.

Para o estágio atual da aprendizagem, isso é útil porque:

- reduz a complexidade
- mantém o foco em lógica e organização
- permite introduzir separação de responsabilidades sem exigir orientação a objetos completa

---

## Comparando as duas versões

### Versão 1

- mais direta
- ideal para entender a lógica inicial
- toda a solução concentrada em um único fluxo

### Versão 2

- mais organizada
- mais legível
- mais fácil de manter
- mais preparada para futuras melhorias

As duas resolvem o problema.

Mas a versão 2 faz isso de uma forma mais estruturada.

---

## Código completo

```csharp
class Program
{
    static void Main(string[] args)
    {
        Robo.Configurar(1, 2, 'N');

        Console.WriteLine("---------------------------------");
        Console.WriteLine("Robô Tupiniquim");
        Console.WriteLine("---------------------------------");
        Console.WriteLine($"Posição inicial: {Robo.posicaoX} {Robo.posicaoY} {Robo.orientacao}");

        Robo.ExecutarComando("EMEMEMEMM");

        Console.WriteLine($"Posição final: {Robo.posicaoX} {Robo.posicaoY} {Robo.orientacao}");
        Console.ReadLine();
    }
}

static class Robo
{
    public static int posicaoX;
    public static int posicaoY;
    public static char orientacao;

    public static void Configurar(int pX, int pY, char ort)
    {
        posicaoX = pX;
        posicaoY = pY;
        orientacao = ort;
    }

    public static void ExecutarComando(string comandoCompleto)
    {
        for (int contador = 0; contador < comandoCompleto.Length; contador++)
        {
            char comandoAtual = comandoCompleto[contador];

            if (comandoAtual == 'E')
                GirarParaEsquerda();

            else if (comandoAtual == 'D')
                GirarParaDireita();

            else if (comandoAtual == 'M')
                Avancar();
        }
    }

    public static void Avancar()
    {
        if (orientacao == 'N') posicaoY++;
        else if (orientacao == 'S') posicaoY--;
        else if (orientacao == 'O') posicaoX--;
        else if (orientacao == 'L') posicaoX++;
    }

    public static void GirarParaEsquerda()
    {
        if (orientacao == 'N') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'N';
    }

    public static void GirarParaDireita()
    {
        if (orientacao == 'N') orientacao = 'L';
        else if (orientacao == 'L') orientacao = 'S';
        else if (orientacao == 'S') orientacao = 'O';
        else if (orientacao == 'O') orientacao = 'N';
    }
}
```
