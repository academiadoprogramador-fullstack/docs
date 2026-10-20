---
draft: false
slug: /conteudo/angular-cli-projetos-componentes
tags:
  - trilha-programacao-web
  - tech-angular
  - tech-nodejs
  - tech-npm
  - conceito-componentes
  - material-aula-pratica
---

# Introdução ao Angular e Criação de Componentes com Angular CLI

## Criando a estrutura inicial da aplicação

Na aula anterior, instalamos o Node.js e conhecemos o npm e o npx.

Agora vamos utilizar o **Angular**, um framework para criar aplicações web com TypeScript.

Uma aplicação Angular é organizada em componentes. Cada componente reúne uma parte da interface e o código relacionado a ela.

Para começar, vamos usar a **Angular CLI** (*Command Line Interface*), uma ferramenta de linha de comando que cria e organiza projetos Angular.

Nesta aula, vamos:

- criar um projeto Angular com o npx;
- conhecer alguns arquivos da estrutura criada;
- iniciar a aplicação localmente;
- gerar um componente com a Angular CLI;
- exibir esse componente na aplicação.

## Criando um projeto com npx

O npx permite executar um pacote sem instalá-lo globalmente.

No terminal, escolha uma pasta onde deseja criar o projeto e execute:

```bash
npx --yes @angular/cli@22.2.0 new portfolio-2026 --style=scss --defaults
```

O comando solicita ao npm a execução da Angular CLI na versão `22.2.0`.

O trecho `new portfolio-2026` cria um novo workspace chamado `portfolio-2026` com uma aplicação inicial.

O argumento `--style=scss` define SCSS como formato de estilos.

O argumento `--defaults` usa as opções padrão sem apresentar perguntas interativas.

Durante a criação, a CLI instala as dependências do projeto. É necessário aguardar o término do processo.

Depois, entre na pasta criada:

```bash
cd portfolio-2026
```

> Se a versão da CLI mudar no futuro, confira os requisitos de Node.js na documentação oficial antes de atualizar o comando.

## Conhecendo os arquivos principais

A CLI cria vários arquivos e pastas. Para começar, vamos observar:

```text
portfolio-2026/
├── angular.json
├── package.json
├── package-lock.json
├── node_modules/
└── src/
    └── app/
```

O `angular.json` guarda configurações usadas pela Angular CLI.

O `package.json` descreve o projeto, suas dependências e seus comandos.

O `package-lock.json` registra detalhes das versões instaladas.

A pasta `node_modules` contém os pacotes instalados pelo npm.

A pasta `src` contém os arquivos da aplicação. Dentro dela, a pasta `app` reúne os componentes e configurações principais.

## Executando a aplicação

Ainda dentro da pasta do projeto, execute:

```bash
npx ng serve
```

O comando inicia o servidor de desenvolvimento do Angular.

Quando a compilação terminar, abra `http://localhost:4200/` no navegador.

O servidor observa as alterações nos arquivos e atualiza a aplicação durante o desenvolvimento.

Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`.

## O que é um componente?

Um componente representa uma parte da interface da aplicação.

Ele normalmente combina:

- uma classe TypeScript com os dados e comportamentos;
- um template HTML com a estrutura visual;
- estilos opcionais para a aparência.

Por exemplo, um portfólio pode ter componentes separados para a barra de navegação e para a seção “Sobre”.

Na branch `v1` do [projeto de referência](https://github.com/academiadoprogramador-fullstack/portfolio-2026/tree/v1), existem os componentes `Navbar` e `Sobre`.

## Gerando um componente com a Angular CLI

Com o servidor encerrado e o terminal na pasta do projeto, execute:

```bash
npx ng generate component components/sobre
```

Também podemos usar a forma abreviada:

```bash
npx ng g c components/sobre
```

O comando `generate component` cria os arquivos do componente dentro de `src/app/components/sobre`.

Na versão da CLI utilizada como referência, os arquivos principais seguem este padrão:

```text
src/app/components/sobre/
├── sobre.html
└── sobre.ts
```

A CLI também pode criar um arquivo de teste e outros arquivos, dependendo das opções usadas.

## Entendendo a classe e o template

O arquivo `sobre.ts` contém a classe e as configurações do componente. Um exemplo simplificado é:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-sobre',
  templateUrl: './sobre.html',
})
export class Sobre {}
```

O decorador `@Component` informa ao Angular que a classe representa um componente.

O `selector` define o nome da tag que será usada para exibi-lo.

O `templateUrl` aponta para o arquivo HTML do componente.

No arquivo `sobre.html`, podemos colocar o conteúdo visual:

```html
<section id="sobre">
  <h2>Sobre</h2>
  <p>Esta é a seção de apresentação do portfólio.</p>
</section>
```

## Exibindo o componente na aplicação

Criar o componente não o adiciona automaticamente à tela.

Em uma aplicação Angular com componentes standalone, precisamos importar o componente no componente que vai utilizá-lo.

No componente raiz, por exemplo em `src/app/app.ts`, importamos `Sobre` e incluímos a classe na propriedade `imports`:

```typescript
import { Component } from '@angular/core';
import { Sobre } from './components/sobre/sobre';

@Component({
  imports: [Sobre],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
```

Depois, em `src/app/app.html`, usamos o seletor definido pelo componente:

```html
<app-sobre></app-sobre>
```

Ao salvar os arquivos, o servidor de desenvolvimento recompila a aplicação e a seção “Sobre” passa a aparecer no navegador.

O mesmo fluxo pode ser repetido para criar outras partes, como `components/navbar`.

## Usando o projeto de referência

O repositório [portfolio-2026 na branch `v1`](https://github.com/academiadoprogramador-fullstack/portfolio-2026/tree/v1) usa Angular CLI `22.2.0` e componentes standalone.

Nele, o componente raiz importa `Navbar` e `Sobre`, e o template raiz usa as tags `<app-navbar>` e `<app-sobre>`.

Observe no projeto:

- como o nome da classe é importado no componente raiz;
- como o seletor do componente corresponde à tag no template;
- como cada componente organiza sua própria lógica e seu HTML.

O objetivo desta etapa não é memorizar todos os arquivos gerados.

O mais importante é compreender que a CLI automatiza a estrutura inicial e que os componentes ajudam a dividir a interface em partes menores.
