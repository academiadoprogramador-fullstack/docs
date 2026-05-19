# Especificação SDD do Projeto

Este arquivo orienta futuras interações com agentes de IA neste repositório. Ele descreve o produto, a estrutura dos materiais e o estilo de escrita esperado para manter consistência com os documentos atuais.

## Visão do Projeto

O projeto é uma documentação em Docusaurus para a **Academia do Programador 2026**.

O conteúdo é voltado para estudantes em formação inicial e intermediária em desenvolvimento fullstack, com foco principal em:

- introdução ao C#;
- programação estruturada;
- programação orientada a objetos;
- generics;
- ASP.NET MVC;
- tutoriais de ambiente e ferramentas.

O material deve funcionar como apoio de aula, referência de estudo e guia prático para execução de exercícios.

## Estrutura do Repositório

Os documentos ficam em `docs/`.

A organização principal segue este padrão:

- `docs/00 - Inicio.md`: página inicial do curso;
- `docs/01 - Tutoriais/`: materiais de instalação e configuração;
- `docs/02 - Conteúdo/`: aulas organizadas por semana;
- `docs/02 - Conteúdo/XX - Semana XX/`: conteúdos semanais;
- `_assets/`: imagens usadas por documentos próximos.

Os arquivos de aula usam nomes numerados para preservar a ordem de leitura:

```text
01 - Nome do Conteúdo.md
02. Nome do Conteúdo.md
03 - Exercício ou Projeto.md
```

Ao criar novos materiais, mantenha a ordem cronológica e a nomenclatura já usada na pasta.

## Frontmatter

Todo documento publicado no Docusaurus deve começar com frontmatter quando precisar de rota, tags ou estado.

Formato recomendado:

```md
---
draft: false
slug: /categoria/assunto
tags:
  - Aula 01
  - Introdução ao C#
  - Tema
---
```

Use `draft: false` quando o padrão da seção já usar esse campo.

Use `slug` em português sem acentos, em letras minúsculas, com palavras separadas por hífen.

Use tags curtas e úteis para navegação, como:

- `Aula 55`;
- `Programação Web`;
- `MVC`;
- `ViewModels`;
- `Introdução ao C#`.

## Estilo de Escrita

O tom deve ser didático, direto e progressivo.

Escreva como um professor explicando o conteúdo durante uma aula prática. O texto deve conduzir o aluno de uma ideia simples para uma ideia mais completa, evitando saltos bruscos.

Preferências de estilo:

- usar frases curtas;
- usar parágrafos pequenos;
- explicar um conceito por vez;
- apresentar o problema antes da solução;
- usar exemplos concretos;
- reforçar a motivação de cada conceito;
- preferir clareza a formalismo;
- manter linguagem acessível para iniciantes;
- usar termos técnicos, mas explicá-los quando aparecem pela primeira vez.

Evite:

- parágrafos longos;
- explicações excessivamente acadêmicas;
- listas muito densas;
- muitas abstrações antes de exemplos;
- mudanças grandes de assunto sem transição;
- humor, ironia ou linguagem informal demais.

## Estrutura Recomendada de uma Aula

Uma aula costuma seguir esta sequência:

1. Apresentação do tema.
2. Contexto ou problema que motiva o tema.
3. Explicação conceitual.
4. Exemplo pequeno.
5. Evolução do exemplo.
6. Observações importantes.
7. Benefícios ou consequências.
8. Conclusão curta.

Exemplo de abertura:

```md
## ViewModels e Records no ASP.NET MVC

Até agora, já utilizamos:

- Models;
- Views;
- Controllers.

Com isso, já conseguimos criar páginas e exibir informações para o usuário.

Porém, conforme a aplicação cresce, surge um problema importante:

> nem sempre o Model da aplicação é o melhor objeto para ser enviado diretamente para a View.
```

## Títulos

Use `##` para seções principais dentro dos documentos de aula.

Use `#` apenas quando o documento realmente tiver um título principal fora do frontmatter, como na página inicial.

Prefira títulos descritivos:

```md
## O problema de usar o Model diretamente
## O que é uma ViewModel?
## Utilizando ViewModel na listagem
## Benefícios das ViewModels
```

Evite títulos genéricos demais:

```md
## Introdução
## Parte 1
## Mais coisas
```

## Parágrafos

O padrão dos documentos atuais usa parágrafos curtos, muitas vezes com uma única ideia por linha.

Exemplo:

```md
O Controller é o intermediário entre:

- usuário;
- regras;
- interface.

Ele recebe requisições HTTP.

Processa a lógica necessária e retorna uma resposta.
```

Esse formato melhora a leitura para alunos iniciantes e deve ser mantido.

## Listas

Use listas para separar conceitos, etapas, características e benefícios.

Em listas conceituais, use ponto e vírgula nos itens e ponto final apenas no último quando a lista completar uma frase.

Exemplo:

```md
Isso pode gerar problemas como:

- exposição de dados que a tela não deveria conhecer;
- formulários recebendo campos desnecessários;
- dificuldade para alterar o Model sem quebrar Views;
- mistura entre dados de negócio e dados de apresentação.
```

Em tutoriais passo a passo, use listas numeradas.

Exemplo:

```md
1. Abra a Paleta de Comandos.
2. Digite `.NET`.
3. Selecione a opção `.NET: New Project`.
```

## Blocos de Destaque

Use blockquotes para definições importantes, avisos ou ideias centrais.

Exemplo:

```md
> a ViewModel é o modelo da tela, não necessariamente o modelo do domínio.
```

Para alertas, use o mesmo formato já existente:

```md
> **Atenção:** uma variável em C# não guarda um objeto diretamente, mas uma referência para ele.
```

## Código

Use blocos fenced com linguagem explícita.

Preferências:

- `csharp` para C#;
- `html` para HTML/Razor simples;
- `bash` para comandos de terminal;
- `md` para exemplos de Markdown;
- `text` para estruturas de arquivos.

Exemplo:

```csharp
public class Produto
{
    public string Nome { get; set; }
    public decimal Preco { get; set; }
}
```

Os exemplos devem ser pequenos no início e crescer aos poucos.

Quando mostrar um código maior, explique antes quais partes o aluno deve observar.

## Progressão Pedagógica

Ao escrever ou alterar conteúdo, respeite o nível da semana.

Semanas iniciais devem evitar recursos avançados que ainda não foram apresentados.

Exemplo:

- em aulas iniciais de C#, prefira variáveis, `if`, `while`, `for` e métodos simples;
- em orientação a objetos, introduza classe, objeto, atributo e método antes de herança ou interfaces;
- em ASP.NET MVC, explique Model, View e Controller antes de ViewModel, validações ou persistência mais avançada.

Quando um recurso futuro for mencionado, sinalize que será aprofundado depois.

Exemplo:

```md
Mais adiante, veremos uma forma mais elegante de tratar esse problema usando exceções.
```

## Imagens

Tutoriais podem usar imagens para mostrar etapas de instalação ou configuração.

Use imagens próximas ao documento, dentro de uma pasta `_assets`.

Formato recomendado:

```md
![alt text](./_assets/1_vsc_open.png)
```

Quando o arquivo estiver em uma pasta irmã ou superior, mantenha caminhos relativos simples.

## Convenções de Linguagem

Use português do Brasil.

Termos técnicos podem permanecer em inglês quando forem nomes próprios ou termos comuns da tecnologia:

- Model;
- View;
- Controller;
- ViewModel;
- record;
- Controller;
- Repository;
- namespace.

Ao apresentar um termo novo, explique em português logo em seguida.

Exemplo:

```md
O `record` é um tipo do C# usado para representar dados de forma simples.
```

## Convenções de Código C#

Nos exemplos em C#:

- use nomes em português quando o domínio for didático;
- use nomes em inglês quando forem tipos, APIs ou convenções do framework;
- mantenha classes com PascalCase;
- mantenha métodos com PascalCase;
- mantenha variáveis locais com camelCase;
- prefira exemplos completos o suficiente para compilar quando isso for relevante.

Exemplo:

```csharp
Fabricante? fabricante = repositorioFabricante.SelecionarPorId(id);

if (fabricante == null)
    return RedirectToAction(nameof(Listar));
```

## Critérios Para Novos Conteúdos

Um novo documento deve:

- ter frontmatter quando publicado;
- seguir a ordem da semana;
- usar títulos claros;
- explicar o problema antes da solução;
- incluir exemplos práticos;
- manter parágrafos curtos;
- evitar assuntos fora do nível esperado;
- usar caminhos relativos corretos para imagens;
- preservar a consistência visual do Docusaurus.

## Critérios Para Alterações

Ao editar um documento existente:

- preserve o tom original;
- corrija sem reescrever tudo sem necessidade;
- mantenha a progressão didática;
- não introduza conceitos avançados sem explicação;
- não altere slugs sem motivo;
- não mova arquivos sem atualizar referências;
- não remova imagens ou exemplos úteis sem substituir por algo equivalente.

## Orientações Para Agentes

Antes de criar ou alterar aulas, o agente deve:

1. Ler documentos próximos na mesma semana.
2. Verificar documentos de semanas anteriores sobre o mesmo assunto.
3. Manter a nomenclatura de arquivos e pastas.
4. Criar conteúdo em português do Brasil.
5. Usar exemplos compatíveis com o nível do aluno.
6. Validar se o Markdown continua correto para Docusaurus.

Quando houver dúvida entre uma explicação curta e uma explicação completa, prefira a explicação curta com exemplo.

Quando houver dúvida entre uma abstração e um caso concreto, comece pelo caso concreto.

## Definição de Pronto

Uma alteração de documentação está pronta quando:

- o arquivo está no local correto;
- o frontmatter está consistente;
- os títulos seguem a hierarquia esperada;
- os exemplos de código estão formatados;
- a explicação segue uma progressão clara;
- o texto está em português do Brasil;
- não há links ou imagens quebrados introduzidos pela alteração;
- o conteúdo pode ser lido por um aluno sem depender de contexto externo excessivo.
