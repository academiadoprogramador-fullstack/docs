---
draft: false
slug: /conteudo/criacao-pokedex-consumo-pokeapi
tags:
  - trilha-programacao-web
  - tech-angular
  - tech-pokeapi
  - tech-bootstrap
  - tech-scss
  - tech-npm
  - conceito-componentes
  - material-aula-pratica
---

# Criação da Pokédex e Consumo da PokéAPI

## Iniciando um novo projeto

Na semana anterior, criamos projetos Angular, organizamos a interface em componentes e usamos Bootstrap com SCSS.

Agora vamos aplicar esses conhecimentos em uma nova aplicação: uma **Pokédex**.

Em vez de cadastrar os dados manualmente, vamos consultar a [PokéAPI](https://pokeapi.co/), uma API pública que fornece informações sobre Pokémon.

Nesta aula, vamos:

- criar o projeto Angular da Pokédex;
- configurar Bootstrap e Bootstrap Icons;
- entender a diferença entre uma resposta de listagem e uma resposta de detalhes;
- configurar o `HttpClient` do Angular;
- buscar e exibir os primeiros Pokémon em cards.

## Criando o projeto Angular

No terminal, escolha a pasta onde deseja criar a aplicação e execute:

```bash
npx --yes @angular/cli@22.2.0 new pokedex-2026 --style=scss --defaults
```

O comando cria o projeto usando a Angular CLI `22.2.0` e define SCSS como formato de estilos.

Entre na pasta do projeto:

```bash
cd pokedex-2026
```

Instale Bootstrap e Bootstrap Icons, utilizados no repositório de referência:

```bash
npm install bootstrap@5.3.8 bootstrap-icons@1.13.1
```

Confirme que `src/styles.scss` está listado em `styles` no `angular.json` e que o JavaScript do Bootstrap está listado em `scripts`:

```json
"styles": ["src/styles.scss"],
"scripts": ["bootstrap/dist/js/bootstrap.min.js"]
```

O projeto da [branch `v1` da Pokédex](https://github.com/academiadoprogramador-fullstack/pokedex-2026/tree/v1) já usa essa configuração e importa o Bootstrap e o Bootstrap Icons em `src/styles.scss`.

Para iniciar a aplicação:

```bash
npx ng serve
```

Quando a compilação terminar, acesse `http://localhost:4200/` no navegador.

## Conhecendo a PokéAPI

Uma API permite que uma aplicação faça requisições HTTP para obter dados.

Na PokéAPI, podemos consultar a lista de Pokémon pelo endereço:

```text
https://pokeapi.co/api/v2/pokemon/
```

A resposta da listagem contém informações como a quantidade total de resultados e uma coleção `results`. Cada item dessa coleção possui o nome do Pokémon e uma URL para consultar seus detalhes.

Uma resposta simplificada se parece com esta:

```json
{
  "count": 1302,
  "next": "https://pokeapi.co/api/v2/pokemon/?offset=20&limit=20",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    }
  ]
}
```

Os valores podem mudar conforme a API é atualizada. Por padrão, a PokéAPI retorna até 20 resultados por página.

> A listagem fornece nomes e URLs. Para exibir informações como tipos e imagens, precisamos consultar os detalhes de cada Pokémon.

Uma consulta de detalhes, como `https://pokeapi.co/api/v2/pokemon/1/`, inclui dados como:

- `id`, o identificador do Pokémon;
- `name`, o nome;
- `types`, a lista de tipos;
- `sprites.front_default`, o endereço da imagem padrão.

Consulte a [documentação da PokéAPI](https://pokeapi.co/docs/v2) para conhecer os demais campos e recursos disponíveis.

## Preparando o Angular para requisições HTTP

O Angular fornece o `HttpClient` para enviar requisições HTTP.

Antes de utilizá-lo, precisamos registrá-lo entre os provedores da aplicação. No arquivo `src/app/app.config.ts`, importe `provideHttpClient` e adicione-o a `providers`:

```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

Se o arquivo já possuir outros provedores, mantenha-os. Apenas acrescente `provideHttpClient()` à lista existente.

O repositório de referência já contém essa configuração.

## Criando os componentes da aplicação

O projeto de referência separa a interface em dois componentes:

- `Navbar`, responsável pela navegação;
- `ListagemPokemon`, responsável pelos cards.

Se ainda não criou a Navbar em outro projeto, gere o componente:

```bash
npx ng generate component components/navbar
```

Podemos usar a estrutura e os conceitos vistos na [aula sobre Bootstrap, SCSS e Navbar](/conteudo/estilizacao-bootstrap-scss-navbar).

Agora gere o componente que buscará e exibirá os Pokémon:

Em outro terminal, ainda dentro da pasta `pokedex-2026`, gere o componente:

```bash
npx ng generate component components/listagem-pokemon
```

A CLI cria o componente em `src/app/components/listagem-pokemon`.

Na branch `v1`, os arquivos principais são `listagem-pokemon.ts` e `listagem-pokemon.html`.

No arquivo `src/app/app.ts`, importe `Navbar` e `ListagemPokemon` e inclua as duas classes na propriedade `imports` do componente raiz:

```typescript
import { Component } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { ListagemPokemon } from './components/listagem-pokemon/listagem-pokemon';

@Component({
  imports: [Navbar, ListagemPokemon],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
```

No arquivo `src/app/app.html`, adicione o seletor da listagem:

```html
<app-navbar></app-navbar>

<app-listagem-pokemon></app-listagem-pokemon>
```

## Consultando a lista de Pokémon

O `HttpClient` envia a requisição e recebe os dados em JSON.

Primeiro, vamos representar somente a parte da resposta necessária para descobrir o nome e a URL de cada resultado:

```typescript
interface ResultadoPokemon {
  name: string;
  url: string;
}

interface RespostaListagemPokemon {
  results: ResultadoPokemon[];
}
```

No componente, injete o `HttpClient` e faça a consulta:

```typescript
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-listagem-pokemon',
  templateUrl: './listagem-pokemon.html',
})
export class ListagemPokemon {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://pokeapi.co/api/v2/pokemon/';

  constructor() {
    this.http.get<RespostaListagemPokemon>(this.apiUrl).subscribe((resposta) => {
      console.log(resposta.results);
    });
  }
}
```

O tipo passado para `get` ajuda o TypeScript a entender o formato esperado da resposta.

O `subscribe` inicia a requisição e permite observar o resultado quando ele chegar. Neste primeiro teste, os nomes e as URLs aparecem no console do navegador.

## Buscando os detalhes de cada Pokémon

Para montar os cards com tipos e imagens, precisamos consultar cada URL recebida na listagem.

O fluxo será:

```text
consulta da lista
  -> recebe nomes e URLs
    -> consulta os detalhes de cada URL
      -> transforma os dados para a tela
```

Cada requisição do `HttpClient` retorna um `Observable`, que representa um resultado que será recebido de forma assíncrona.

O `switchMap` permite iniciar a próxima etapa usando os dados recebidos na primeira consulta.

O `forkJoin` reúne várias requisições e emite os resultados quando todas terminam.

Adicione ao componente os tipos que serão usados para ler os detalhes e montar os cards:

```typescript
interface TipoPokemonResposta {
  type: {
    name: string;
  };
}

interface DetalhesPokemonResposta {
  id: number;
  name: string;
  types: TipoPokemonResposta[];
  sprites: {
    front_default: string | null;
  };
}

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string | null;
}
```

Agora podemos montar a sequência de requisições e transformar a resposta para manter somente os dados usados pela interface:

```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map, switchMap } from 'rxjs';

export class ListagemPokemon {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://pokeapi.co/api/v2/pokemon/';

  protected readonly pokemon = toSignal(
    this.http.get<RespostaListagemPokemon>(this.apiUrl).pipe(
      switchMap((resposta) => {
        const requisicoes = resposta.results.map((item) =>
          this.http.get<DetalhesPokemonResposta>(item.url),
        );

        return forkJoin(requisicoes);
      }),
      map((detalhes) =>
        detalhes.map((detalhe): Pokemon => ({
          id: detalhe.id,
          name: detalhe.name,
          types: detalhe.types.map((item) => item.type.name),
          sprite: detalhe.sprites.front_default,
        })),
      ),
    ),
    { initialValue: [] },
  );
}
```

O `map` interno percorre o array de tipos de cada Pokémon.

O `map` do RxJS transforma a coleção de respostas em uma coleção menor, com os campos que vamos mostrar.

O `toSignal` converte o resultado em um Signal do Angular. Com `initialValue: []`, a tela começa com uma lista vazia enquanto as requisições estão em andamento.

## Exibindo os Pokémon em cards

No template `src/app/components/listagem-pokemon/listagem-pokemon.html`, podemos percorrer a lista usando `@for`:

```html
<div class="container my-3">
  <div class="row g-3">
    @for (pokemom of pokemon(); track pokemom.id) {
      <div class="col-md-6 col-lg-2">
        <div class="card p-3 text-center">
          <span class="fs-6 fw-medium card-title">{{ pokemom.name }}</span>

          <div class="d-flex justify-content-center gap-2">
            @for (tipo of pokemom.types; track tipo) {
              <span class="badge rounded-pill text-light">{{ tipo }}</span>
            }
          </div>

          @if (pokemom.sprite) {
            <img [src]="pokemom.sprite" [alt]="pokemom.name" />
          } @else {
            <p>Imagem não disponível</p>
          }
        </div>
      </div>
    }
  </div>
</div>
```

O `@for` externo cria um card por Pokémon.

O `@for` interno mostra os tipos daquele Pokémon.

O `@if` verifica se existe uma imagem antes de criar o elemento `<img>`.

As classes `container`, `row`, `col-md-6`, `card` e `text-center` vêm do Bootstrap e organizam os cards em uma grade responsiva.

## Observando as requisições no navegador

Com `ng serve` em execução, abra a aplicação e acesse as ferramentas de desenvolvedor do navegador.

Na aba **Network** ou **Rede**, observe as chamadas para `pokeapi.co`:

- uma requisição para obter a página de resultados;
- uma requisição de detalhes para cada URL daquela página.

A resposta da listagem contém até 20 resultados por padrão. Por isso, essa implementação faz uma requisição de listagem e várias requisições de detalhes.

> A PokéAPI é um serviço externo. A aplicação precisa de conexão com a internet, e o carregamento pode falhar se o serviço ou a rede estiver indisponível.

Este primeiro fluxo não implementa paginação nem uma mensagem de erro para falhas nas requisições. Esses comportamentos podem ser evoluídos em etapas posteriores.

## Conclusão

Nesta aula, criamos uma aplicação Angular que consulta uma API externa e usa os dados recebidos para montar uma interface.

Também vimos que uma listagem pode fornecer links para detalhes, que são consultados em uma segunda etapa.

O resultado é uma Pokédex simples, com nome, tipos e imagem dos Pokémon retornados pela PokéAPI.
