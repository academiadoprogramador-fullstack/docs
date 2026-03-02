---
draft: false
slug: /introducao-ao-csharp/hello-world
tags:
  - Aula 01
  - Introdução ao C#
  - I/O
---

"Hello World" (Olá, Mundo) é o programa de computador mais simples e clássico, usado para exibir essa frase na tela, servindo como o primeiro passo no aprendizado de qualquer linguagem de programação.

## Criando a Solução

Em um local acessível, crie uma pasta chamada `HelloWorld`, este será o nome da nossa solução.

Clique com o botão direito do mouse na pasta criada, ao avançar para o menu de contexto, clique em `Abrir com Code`.

![alt text](./_assets/1_vsc_open.png)

Sua tela deve estar assim:

![alt text](./_assets/2_vsc_init.png)

## Criando um projeto através da Paleta de Comandos

Agora abra a Paleta de Comandos do Visual Studio Code utilizando o atalho `CTRL + SHIFT + P`, isso permite que encontremos comandos e configurações padrão ou de terceiros.

1. Digite `.NET` para acessar os comandos da extensão `C# Dev Kit`.
2. Selecione a opção `.NET: New Project`.

![alt text](./_assets/3_vsc_command.png)

A tela de seleção de template será aberta, aqui você pode selecionar que tipo de projeto irá ser criado, as opções disponíveis dependem dos `workloads` instalados com a `SDK`.

2. Selecione "Aplicativo do Console"

![alt text](./_assets/4_vsc_consoleapp.png)

3. No próximo prompt, você deve nomear o projeto que está criando, neste caso digitaremos `HelloWorld.ConsoleApp`

![alt text](./_assets/5_vsc_projname.png)

4. Agora selecione a pasta onde o projeto será criado, como já criamos a pasta da solução `HelloWorld`, manteremos o padrão.

![alt text](./_assets/6_vsc_projdir.png)

5. No proximo prompt, selecione o tipo de solução `sln` (padrão pré .NET 10).

![alt text](./_assets/7_vsc_soltype.png)

6. Confirme a criação do projeto e as configurações serão criadas.

![alt text](./_assets/8_vsc_newprog.png)

## Execução do Projeto

Agora que o nosso projeto de aplicativo do console está criado, o .NET automaticamente cria um arquivo Program.cs que será o "ponto de partida" da nossa aplicação.

Execute o projeto clicando no botão no canto superior direito:

![alt text](./_assets/9_vsc_execute.png)

O código gerado deve escrever a frase "Hello World" ao executar o programa.

![alt text](./_assets/10_vsc_helloworld.png)

Parabéns, essa é sua primeira execução de um programa em C#!
