---
draft: false
slug: /conteudo/estilizacao-bootstrap-scss-navbar
tags:
  - trilha-programacao-web
  - tech-angular
  - tech-bootstrap
  - tech-scss
  - tech-npm
  - conceito-componentes
  - material-aula-pratica
---

# Estilização com Bootstrap e SCSS e Criação da Navbar

## Preparando o estilo da aplicação

Na aula anterior, criamos um projeto Angular e conhecemos os componentes.

Agora vamos preparar a aparência da aplicação e criar uma barra de navegação.

Vamos utilizar o **Bootstrap**, que oferece estilos prontos para organizar interfaces, e o **SCSS**, uma sintaxe do Sass que permite usar recursos como variáveis.

O objetivo é definir algumas cores e uma fonte para a aplicação e, depois, criar uma Navbar com links para as seções do portfólio.

## Instalando Bootstrap e Bootstrap Icons

O projeto de referência utiliza o Bootstrap para os estilos e o Bootstrap Icons para os ícones.

No terminal, dentro da pasta do projeto Angular, execute:

```bash
npm install bootstrap@5.3.8 bootstrap-icons@1.13.1
```

O npm registra os pacotes no `package.json` e instala seus arquivos em `node_modules`.

O Angular CLI compila o SCSS usado pelo projeto. O arquivo `angular.json` deve apontar para `src/styles.scss` na lista de estilos globais:

```json
"styles": [
  "src/styles.scss"
]
```

Essa configuração já existe no projeto `portfolio-2026` da branch `v1`.

## O que são tokens de estilo?

Um **token de estilo** é um valor nomeado que representa uma decisão visual da aplicação.

Em vez de repetir o mesmo código de cor em vários lugares, podemos guardar esse valor em uma variável SCSS:

```scss
$cor-primaria: #ec6afa;
$cor-secundaria: #6d2bc2;
$fonte-padrao: Georgia, 'Times New Roman', serif;
```

Se a cor principal mudar, alteramos o valor em um único ponto.

Neste exemplo, os nomes `$cor-primaria`, `$cor-secundaria` e `$fonte-padrao` são variáveis SCSS. Elas são usadas durante a compilação dos estilos.

## Personalizando o Bootstrap no SCSS

No arquivo `src/styles.scss`, podemos passar os tokens para as variáveis do Bootstrap:

```scss
$cor-primaria: #ec6afa;
$cor-secundaria: #6d2bc2;
$fonte-padrao: Georgia, 'Times New Roman', serif;

@use 'bootstrap/scss/bootstrap' with (
  $primary: $cor-primaria,
  $secondary: $cor-secundaria,
  $font-family-base: $fonte-padrao,
  $font-family-sans-serif: $fonte-padrao
);

@use 'bootstrap-icons';
```

O `@use` carrega os estilos do pacote.

O bloco `with` substitui alguns valores padrão do Bootstrap. Por exemplo, `$primary` recebe a cor definida em `$cor-primaria`.

Depois da compilação, as classes do Bootstrap usam as cores configuradas. No HTML, podemos aplicar classes como `bg-primary` e `bg-secondary` sem repetir os valores hexadecimais.

O `@use 'bootstrap-icons'` carrega os estilos dos ícones instalados pelo npm.

> As variáveis SCSS são utilizadas durante a compilação. Elas não ficam disponíveis como variáveis JavaScript no navegador.

## Criando a Navbar com Angular CLI

Com o terminal na pasta do projeto, gere um componente para a barra de navegação:

```bash
npx ng generate component components/navbar
```

A CLI cria o componente dentro de `src/app/components/navbar`.

Na branch `v1`, os arquivos principais são `navbar.ts` e `navbar.html`.

O componente terá uma classe TypeScript com os dados dos links e um template HTML com a estrutura visual.

## Definindo os itens da navegação

No arquivo `src/app/components/navbar/navbar.ts`, podemos organizar os links em uma lista:

```typescript
import { Component } from '@angular/core';

interface ItemNavbar {
  titulo: string;
  url: string;
  icone: string;
}

@Component({
  imports: [],
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar {
  public readonly itens: ItemNavbar[] = [
    {
      titulo: 'Sobre',
      url: '#sobre',
      icone: 'bi-person',
    },
    {
      titulo: 'Habilidades',
      url: '#habilidades',
      icone: 'bi-award',
    },
    {
      titulo: 'Portfólio',
      url: '#portfolio',
      icone: 'bi-card-list',
    },
  ];
}
```

Cada item tem um título, um endereço e o nome de um ícone.

Os endereços com `#` apontam para elementos da mesma página. Para que cada link leve a uma seção, essa seção precisa existir com o `id` correspondente.

## Montando a Navbar com as classes do Bootstrap

No arquivo `navbar.html`, usamos as classes do Bootstrap para estruturar a barra e aplicar estilos:

```html
<nav class="navbar navbar-expand-lg fixed-top bg-secondary">
  <div class="container">
    <a class="navbar-brand fw-medium fst-italic" href="#">Meu Portfólio</a>

    <ul class="navbar-nav ms-auto">
      @for (item of itens; track $index) {
        <li class="nav-item">
          <a class="nav-link" [href]="item.url">
            <i class="bi {{ item.icone }}"></i>
            {{ item.titulo }}
          </a>
        </li>
      }
    </ul>
  </div>
</nav>
```

Observe algumas classes:

- `navbar` identifica a barra de navegação;
- `navbar-expand-lg` define o comportamento responsivo a partir do tamanho `lg`;
- `fixed-top` mantém a barra fixa no topo;
- `container` limita e centraliza o conteúdo;
- `bg-secondary` usa a cor secundária configurada no Bootstrap;
- `ms-auto` empurra a lista de links para o lado oposto da marca.

O bloco `@for` percorre a lista `itens` e produz um link para cada registro.

As classes `bi` e `bi-person`, por exemplo, são fornecidas pelo Bootstrap Icons.

## Adicionando o componente à aplicação

Assim como fizemos com `Sobre`, precisamos importar `Navbar` no componente raiz.

Em `src/app/app.ts`, adicione o import e inclua `Navbar` na lista `imports`:

```typescript
import { Component } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Sobre } from './components/sobre/sobre';

@Component({
  imports: [Navbar, Sobre],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
```

Em `src/app/app.html`, use os seletores dos componentes:

```html
<app-navbar></app-navbar>

<app-sobre></app-sobre>
```

Como a Navbar está fixa no topo, o início do conteúdo pode ficar encoberto por ela.

Se isso acontecer, adicione um espaçamento superior ao conteúdo, por exemplo com uma classe de margem do Bootstrap.

## Sobre o botão responsivo da Navbar

O exemplo da branch `v1` também possui um botão para abrir e recolher os links em telas menores.

Esse comportamento depende do JavaScript do Bootstrap. Os atributos `data-bs-toggle="collapse"` e `data-bs-target` no botão, sozinhos, não executam a ação.

No projeto de referência, o arquivo `angular.json` configura os estilos, mas não inclui o JavaScript do Bootstrap.

Por isso, antes de apresentar o botão como funcional, é necessário configurar o bundle JavaScript, por exemplo adicionando o caminho abaixo à lista `scripts` do target de build em `angular.json`:

```json
"scripts": [
  "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
]
```

Depois de alterar `angular.json`, encerre e reinicie `ng serve`.

O bundle inclui os recursos necessários ao componente Collapse. Para esta primeira etapa, também podemos manter a navegação simples e estudar esse comportamento responsivo separadamente.

## Conclusão

O SCSS permite organizar valores visuais em variáveis e passá-los ao Bootstrap durante a compilação.

As classes do Bootstrap ajudam a compor a interface, enquanto o Angular organiza os links e renderiza cada item da Navbar.

Com essa estrutura, a aplicação já possui uma identidade visual inicial e um componente reutilizável para sua navegação.
