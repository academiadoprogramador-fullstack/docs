---
draft: false
slug: /conteudo/introducao-web-apis-aspnet-core
tags:
  - trilha-programacao-web
  - tech-dotnet
  - conceito-web-apis
  - conceito-mvc
  - material-aula-pratica
---

# Introdução às Web APIs com ASP.NET Core

## Do MVC para uma aplicação que fornece dados

Nas aulas de [ASP.NET Core MVC](/programacao-web-aspnet-mvc/mvc), criamos páginas com Controllers e Views.

Quando alguém acessa a listagem de contatos, o servidor pode consultar os dados, renderizar uma View e devolver **HTML** ao navegador.

Agora imagine que um aplicativo de celular também precise mostrar os mesmos contatos. Ele não precisa receber a página HTML pronta: precisa dos **dados** para montar sua própria interface.

Como disponibilizar esses dados para clientes diferentes?

Uma resposta é criar uma **Web API**.

---

## O que é uma Web API?

Uma Web API é uma interface de comunicação pela web. Um cliente faz uma requisição HTTP para um endereço da aplicação, e o servidor devolve uma resposta que o cliente consegue interpretar.

No projeto [e-Agenda, branch `v1`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v1), a rota de contatos é um exemplo:

```text
GET /api/contatos
```

Em vez de montar uma View Razor, a API devolve os contatos como **JSON**. JSON é um formato de texto usado para representar dados, por exemplo:

```json
[
  {
    "id": "6b3910a1-172b-4741-b6b6-03a13e7daef7",
    "nome": "Ana",
    "email": "ana@exemplo.com",
    "telefone": "(11) 99999-0000",
    "cargo": null,
    "empresa": null
  }
]
```

Esse JSON é um **exemplo ilustrativo** da estrutura retornada pela listagem. Os valores reais dependem dos contatos cadastrados.

> Uma Web API expõe operações e dados por HTTP. Quem consome a resposta decide como apresentar essas informações ao usuário.

---

## O que muda em relação ao MVC com Views?

Os dois tipos de projeto usam ASP.NET Core, rotas, Controllers, injeção de dependência e Services. A diferença principal está na resposta que cada fluxo costuma produzir.

| Aspecto | MVC com Views | Web API com Controllers |
|---|---|---|
| Cliente comum | Navegador acessando páginas | Navegador, aplicativo ou outro sistema |
| Apresentação | View Razor renderizada no servidor | O cliente monta sua própria interface |
| Resposta comum | HTML ou redirecionamento | Dados em JSON e código de status HTTP |
| Classe base do Controller | `Controller` | `ControllerBase` |
| Registro usual no `Program.cs` | `AddControllersWithViews()` | `AddControllers()` |
| Mapeamento usual | `MapControllerRoute()` ou `MapDefaultControllerRoute()` | `MapControllers()` |

No MVC, um Controller pode devolver uma View:

```csharp
public IActionResult Listar()
{
    return View();
}
```

Na API, uma Action pode devolver dados:

```csharp
[HttpGet]
public ActionResult<List<ListarContatosDto>> SelecionarTodos()
{
    var resultado = servicoContato.SelecionarTodos();

    return Ok(resultado);
}
```

`Ok(resultado)` devolve o status **200 OK** e os dados na resposta.

> **Atenção:** MVC e Web API não são plataformas diferentes. O ASP.NET Core pode oferecer páginas e endpoints de API no mesmo projeto. Aqui estamos comparando as configurações usadas em projetos focados em cada finalidade.

---

## Preparando os Controllers de API

O `Program.cs` do projeto `eAgenda.WebApi` registra os Services e repositórios da aplicação. Para receber requisições nos Controllers, ele também contém estas duas linhas:

```csharp
builder.Services.AddControllers();

// Após construir a aplicação com builder.Build():
app.MapControllers();
```

`AddControllers()` registra os recursos necessários aos Controllers. `MapControllers()` associa as rotas declaradas nos Controllers aos endpoints HTTP.

O restante da configuração, como conexão com o banco e registro dos Services, continua necessário para que as operações funcionem. Na branch `v1`, o projeto Web API também utiliza os projetos `eAgenda.Aplicacao` e `eAgenda.Infra`.

Isso permite manter as regras de negócio no Service, sem colocá-las dentro da Action HTTP.

---

## Definindo uma rota no Controller

O módulo de contatos começa assim:

```csharp
using eAgenda.Aplicacao.Modulos.ModuloContato;
using Microsoft.AspNetCore.Mvc;

namespace eAgenda.WebApi.Features.Contatos;

[ApiController]
[Route("api/contatos")]
public sealed class ContatosController(ServicoContato servicoContato) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<ListarContatosDto>> SelecionarTodos()
    {
        var resultado = servicoContato.SelecionarTodos();

        return Ok(resultado);
    }
}
```

Observe cada parte:

- `[Route("api/contatos")]` define o endereço base;
- `[HttpGet]` indica que a Action responde a requisições GET;
- `ControllerBase` fornece recursos para responder a requisições sem renderizar Views;
- `ServicoContato` chega pelo construtor e executa a operação de aplicação;
- `ActionResult<List<ListarContatosDto>>` permite devolver dados ou uma resposta HTTP, como `Ok(...)`.

O atributo `[ApiController]` habilita comportamentos úteis para APIs, como inferir a origem dos parâmetros e retornar **400 Bad Request** automaticamente quando houver erros de validação do modelo.

Isso não elimina a validação das regras de negócio: o Service continua responsável por elas.

---

## Usando métodos HTTP para as operações

A mesma rota pode representar operações diferentes conforme o método HTTP e o caminho solicitado.

Na branch `v1`, `ContatosController` oferece:

| Requisição | Operação | Resposta de sucesso no projeto |
|---|---|---|
| `GET /api/contatos` | Listar contatos | `200 OK`, com a lista |
| `GET /api/contatos/{id}` | Buscar um contato | `200 OK`, com o contato |
| `POST /api/contatos` | Cadastrar | `201 Created`, com o contato criado |
| `PUT /api/contatos/{id}` | Editar | `204 No Content` |
| `DELETE /api/contatos/{id}` | Excluir | `204 No Content` |

`{id}` representa o identificador do contato. No Controller, `[HttpGet("{id:guid}")]` indica que esse trecho da rota deve ter formato de `Guid`.

Quando um contato não é encontrado, o método de busca devolve `NotFound(id)`, isto é, **404 Not Found**:

```csharp
[HttpGet("{id:guid}")]
public ActionResult<DetalhesContatoDto> SelecionarPorId(Guid id)
{
    var resultado = servicoContato.SelecionarPorId(id);

    if (resultado.IsFailed)
        return NotFound(id);

    return Ok(resultado.Value);
}
```

O parâmetro `id` vem do endereço. O Controller traduz o resultado do Service em uma resposta HTTP adequada ao cenário.

---

## Recebendo JSON para cadastrar um contato

Em um formulário MVC, o navegador envia campos para uma Action. Na API, um cliente pode enviar um corpo JSON em uma requisição POST.

O projeto define os dados aceitos no cadastro por meio de um **request**: um tipo que representa a entrada da requisição.

```csharp
public record CadastrarContatoRequest(
    string Nome,
    string Email,
    string Telefone,
    string? Cargo,
    string? Empresa
);
```

Por exemplo, um cliente pode enviar:

```text
POST /api/contatos
Content-Type: application/json

{"nome":"Ana","email":"ana@exemplo.com","telefone":"(11) 99999-0000","cargo":null,"empresa":null}
```

O cabeçalho `Content-Type` informa o formato do corpo. O ASP.NET Core lê o JSON e preenche o `CadastrarContatoRequest` recebido pela Action. Com `[ApiController]`, a origem de um parâmetro complexo como esse é inferida como o corpo da requisição.

Na Action, o request é convertido em `CadastrarContatoDto`, utilizado pelo Service. Depois do cadastro, a API busca os detalhes e devolve o contato criado:

```csharp
[HttpPost]
public ActionResult<DetalhesContatoDto> Cadastrar(CadastrarContatoRequest req)
{
    var dto = new CadastrarContatoDto(
        req.Nome, req.Email, req.Telefone, req.Cargo, req.Empresa
    );

    var resultadoCadastro = servicoContato.Cadastrar(dto);

    if (resultadoCadastro.IsFailed)
        return BadRequest();

    var id = resultadoCadastro.Value;
    var resultadoSelecao = servicoContato.SelecionarPorId(id);

    if (resultadoSelecao.IsFailed)
        return NotFound(id);

    return CreatedAtAction(
        nameof(SelecionarPorId),
        new { id },
        resultadoSelecao.Value
    );
}
```

`CreatedAtAction` devolve **201 Created**, inclui o contato criado no corpo e indica no cabeçalho `Location` a rota pela qual ele pode ser consultado.

Neste código da branch `v1`, uma falha de cadastro retorna `BadRequest()` sem detalhar a regra violada. Mais adiante, podemos evoluir a resposta de erro para ajudar o cliente a entender o problema.

---

## Testando a API sem uma View

Uma API pode ser chamada por um cliente HTTP, sem precisar de uma página da aplicação.

O projeto de referência inclui `Features/Contatos/Contatos.http`, com requisições para cadastrar, listar, editar e excluir contatos. O arquivo usa a URL configurada para execução local:

```text
@baseUrl = https://localhost:7098

### Listar contatos
GET {{baseUrl}}/api/contatos

### Cadastrar contato
POST {{baseUrl}}/api/contatos
Content-Type: application/json

{
  "nome": "Ana",
  "email": "ana@exemplo.com",
  "telefone": "(11) 99999-0000",
  "cargo": null,
  "empresa": null
}
```

Antes de executar as requisições, configure a conexão com o SQL Server usada pelo projeto e inicie a aplicação:

```bash
dotnet run --project src/eAgenda.WebApi
```

Em um cliente HTTP que suporte arquivos `.http`, envie as requisições e observe o corpo e o status retornados. A listagem pode estar vazia antes do primeiro cadastro.

---

## Exercício: investigando um endpoint

Abra `ContatosController.cs` na branch `v1` e escolha a Action `Editar`.

1. Identifique o método HTTP e a rota utilizados.
2. Localize o tipo que representa os dados recebidos no corpo da requisição.
3. Observe como o `id` da rota e os dados do request formam o DTO enviado ao Service.
4. Verifique qual status HTTP é devolvido em caso de sucesso e qual é devolvido quando o Service falha.
5. Compare esse fluxo com a edição em um Controller MVC que devolve uma View ou faz um redirecionamento.

Para praticar, envie uma requisição de edição com o arquivo `Contatos.http` depois de cadastrar um contato. Confira o status **204 No Content** e consulte o contato novamente para observar os dados atualizados.

---

## Conclusão

Uma Web API atende requisições HTTP e entrega dados para clientes que podem ter interfaces diferentes.

No ASP.NET Core, podemos desenvolvê-la com Controllers, rotas, Services e DTOs, como já fazemos em aplicações MVC. O foco da resposta muda: em vez de renderizar uma View, a API devolve dados e códigos de status HTTP.

O e-Agenda `v1` mostra esse caminho no módulo de contatos: `AddControllers`, `MapControllers`, `ContatosController`, requests, DTOs e um arquivo `.http` para experimentar as operações.

Referências:

- [Models, Views e Controllers](/programacao-web-aspnet-mvc/mvc);
- [Projeto e-Agenda API na branch `v1`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v1);
- [`Program.cs` da Web API](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v1/src/eAgenda.WebApi/Program.cs);
- [`ContatosController.cs`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v1/src/eAgenda.WebApi/Features/Contatos/ContatosController.cs);
- [`Contatos.http`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v1/src/eAgenda.WebApi/Features/Contatos/Contatos.http);
- [Documentação de Web APIs com Controllers no ASP.NET Core](https://learn.microsoft.com/aspnet/core/web-api/).
