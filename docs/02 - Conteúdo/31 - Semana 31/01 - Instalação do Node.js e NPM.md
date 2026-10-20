---
draft: false
slug: /conteudo/instalacao-nodejs-npm
tags:
  - trilha-ferramentas
  - tech-nodejs
  - tech-npm
  - material-tutorial
---

# Instalação do Node.js e NPM

## Executando JavaScript fora do navegador

Até agora, o JavaScript costuma aparecer associado às páginas web e ao navegador.

Mas também podemos executar JavaScript fora do navegador, inclusive no servidor.

Para isso, usamos o **Node.js**.

Além de executar programas, o Node.js é utilizado por ferramentas de desenvolvimento, como a Angular CLI.

Nesta aula, vamos instalar o Node.js e conhecer o npm, que será usado para instalar e organizar pacotes JavaScript.

## O que é o Node.js?

O Node.js é um ambiente de execução para JavaScript.

Ele permite executar arquivos JavaScript diretamente pelo terminal:

```bash
node programa.js
```

O Node.js também fornece APIs para operações que não estão disponíveis da mesma forma no navegador, como acessar arquivos e criar servidores.

Por isso, ele pode ser usado para desenvolver aplicações JavaScript no servidor.

> O Node.js executa JavaScript fora do navegador. Isso não significa que uma aplicação Angular será executada no servidor: a aplicação Angular criada nesta semana será executada no navegador, enquanto o Node.js dará suporte às ferramentas de desenvolvimento.

## O que são npm e npx?

O **npm** é o gerenciador de pacotes que acompanha a instalação do Node.js.

Um pacote é um código reutilizável que pode ser instalado em um projeto.

O npm também ajuda a registrar as dependências e os comandos do projeto.

O **npx** permite executar comandos disponibilizados por pacotes npm. Por exemplo, poderemos usá-lo para executar a Angular CLI sem instalá-la globalmente na máquina.

Em resumo:

- `node` executa arquivos JavaScript;
- `npm` instala e gerencia pacotes;
- `npx` executa comandos fornecidos por pacotes.

## Instalando o Node.js

O Node.js está disponível para Windows, macOS e Linux.

Para instalar:

1. Acesse a [página oficial de download do Node.js](https://nodejs.org/en/download).
2. Escolha uma versão compatível com as ferramentas que serão utilizadas no curso.
3. Baixe o instalador adequado ao seu sistema operacional.
4. Execute o instalador e mantenha o npm selecionado durante a instalação.
5. Feche e abra novamente o terminal.

O Angular 22 exige versões específicas do Node.js. Antes de instalar ou atualizar, confira a [tabela oficial de compatibilidade do Angular](https://angular.dev/reference/versions).

> **Atenção:** não escolha uma versão do Node.js apenas por ser a mais recente. Ela precisa estar na faixa compatível com a versão do Angular usada no projeto.

## Verificando a instalação

Abra um terminal e consulte as versões instaladas:

```bash
node --version
npm --version
```

O primeiro comando mostra a versão do Node.js.

O segundo mostra a versão do npm.

Os números exatos podem variar conforme as versões instaladas.

Se o terminal informar que os comandos não foram encontrados, feche e abra o terminal novamente. Se o problema continuar, revise a instalação e a configuração do PATH do sistema.

## Executando um arquivo JavaScript

Para confirmar que o Node.js consegue executar JavaScript, crie um arquivo chamado `programa.js`:

```javascript
console.log('JavaScript executado pelo Node.js');
```

No terminal, acesse a pasta onde o arquivo foi salvo e execute:

```bash
node programa.js
```

O texto será exibido no terminal, sem a necessidade de abrir um navegador.

## Pacotes e dependências do projeto

Projetos JavaScript frequentemente utilizam pacotes externos.

O npm registra informações do projeto no arquivo `package.json`, incluindo suas dependências e comandos.

Os pacotes instalados para o projeto ficam, normalmente, na pasta `node_modules`.

Também é comum encontrar o arquivo `package-lock.json`. Ele registra detalhes das versões instaladas para ajudar a repetir a instalação em outros ambientes.

Quando recebermos um projeto que já possui `package.json` e `package-lock.json`, poderemos instalar suas dependências com:

```bash
npm install
```

Na próxima aula, vamos usar o npx para executar a Angular CLI e criar um projeto.
