---
draft: false
slug: /conteudo/validacao-problemdetails-documentacao-apis
tags:
  - trilha-programacao-web
  - tech-dotnet
  - conceito-web-apis
  - conceito-validacao
  - material-aula-pratica
---

# Validação, ProblemDetails e Documentação de APIs

## O que acontece quando uma requisição falha?

Na [aula anterior](/conteudo/introducao-web-apis-aspnet-core), criamos uma Web API que recebe JSON, chama um Service e devolve respostas HTTP.

Na branch `v1` do e-Agenda, um cadastro inválido podia terminar assim:

```csharp
if (resultadoCadastro.IsFailed)
    return BadRequest();
```

O cliente recebia o status **400 Bad Request**, mas não sabia qual campo precisava corrigir.

Na branch [`v2` do e-Agenda](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v2), a validação passa a identificar campos e tipos de erro. A API usa essas informações para devolver uma resposta mais útil.

Depois de compreender essa evolução, veremos como descrever as rotas da API e explorá-las com Swagger UI e Postman.

---

## Refatorando a validação das entidades

Antes, `Contato.Validar()` devolvia uma lista de mensagens (`List<string>`). Uma mensagem dizia o que estava errado, mas não identificava o campo de forma estruturada.

Na `v2`, o domínio define um tipo para cada erro de validação:

```csharp
public sealed record ErroValidacao(string Campo, string Mensagem);
```

Um `record` é um tipo do C# adequado para agrupar dados. Aqui ele associa o nome do campo à mensagem.

A entidade passa a devolver uma lista desses erros. Observe dois exemplos extraídos de `Contato.Validar()`:

```csharp
public override IReadOnlyList<ErroValidacao> Validar()
{
    List<ErroValidacao> erros = [];

    if (string.IsNullOrWhiteSpace(Nome) || Nome.Length < 2 || Nome.Length > 100)
        erros.Add(new(nameof(Nome), "O campo \"Nome\" deve conter entre 2 e 100 caracteres."));

    if (!Regex.IsMatch(Telefone, @"^\(\d{2}\) \d{4,5}-\d{4}$"))
        erros.Add(new(nameof(Telefone), "O campo \"Telefone\" deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX."));

    // A entidade também valida Email, Cargo e Empresa.
    return erros;
}
```

`nameof(Nome)` produz o nome do campo como texto, sem depender de uma string escrita manualmente.

Se nome e telefone estiverem inválidos, os dois erros podem ser retornados na mesma validação. O cliente consegue associar cada mensagem ao campo correspondente.

> A entidade conhece as regras dos seus dados. Ela não precisa conhecer HTTP, Controller nem JSON.

---

## Levando os erros do domínio até o Controller

O Service precisa preservar as informações recebidas da entidade. Na `v2`, `ServicoBase` transforma os erros em resultados do FluentResults, mantendo metadados sobre o tipo e o campo:

```csharp
protected static Result ValidarEntidade<TEntidade>(EntidadeBase<TEntidade> entidade)
{
    IReadOnlyList<ErroValidacao> erros = entidade.Validar();

    if (erros.Count == 0)
        return Result.Ok();

    Result resultado = Result.Ok();

    foreach (ErroValidacao erro in erros)
        resultado.WithError(CriarErro(TipoErro.Validacao, erro.Campo, erro.Mensagem));

    return resultado;
}
```

`Result` representa o sucesso ou a falha da operação. No projeto, `CriarErro` guarda o `TipoErro` e o campo nos metadados de cada erro.

Além da validação, o Service pode informar outras falhas:

```csharp
public enum TipoErro
{
    Validacao,
    NaoEncontrado,
    Conflito
}
```

Por exemplo, `ServicoContato.Cadastrar()` usa `TipoErro.Conflito` quando já existe um contato com o mesmo e-mail. Esse caso é diferente de um telefone com formato inválido.

O caminho das informações fica assim:

```text
Contato.Validar()
  -> ErroValidacao(Campo, Mensagem)
    -> ServicoContato / ServicoBase
      -> Result com TipoErro e Campo
        -> ContatosController
```

Os tipos de erro pertencem à aplicação. A decisão sobre o **status HTTP** cabe à camada Web API.

---

## Devolvendo erros com ProblemDetails

`ProblemDetails` é um formato padronizado para descrever problemas em respostas HTTP. Em vez de enviar apenas o código 400, a API pode incluir título, descrição e status.

Para erros de campos, o ASP.NET Core também oferece `ValidationProblemDetails`, que acrescenta uma coleção `errors` organizada pelo nome de cada campo.

A `v2` concentra a conversão dos resultados do Service na extensão `ResultExtensions.ValidationProblem`:

```csharp
if (tipoErro.Equals(TipoErro.Validacao))
{
    var modelState = new ModelStateDictionary();

    foreach (var erro in result.Errors)
    {
        var campo = erro.Metadata["Campo"].ToString()!;
        modelState.AddModelError(campo, erro.Message);
    }

    ValidationProblemDetails problemDetails = new(modelState)
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Requisição Inválida",
        Type = ProblemDetailsTypes.BadRequest
    };

    return controller.ValidationProblem(problemDetails);
}
```

Para uma requisição cujo `Nome` é curto e cujo `Telefone` tem formato incorreto, a resposta pode ter esta estrutura ilustrativa:

```json
{
  "type": "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status/400",
  "title": "Requisição Inválida",
  "status": 400,
  "errors": {
    "Nome": ["O campo \"Nome\" deve conter entre 2 e 100 caracteres."],
    "Telefone": ["O campo \"Telefone\" deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX."]
  }
}
```

O ASP.NET Core pode incluir outras propriedades na resposta, como `traceId`. O exemplo destaca os campos relevantes para entender a validação.

> **Atenção:** o `[ApiController]` já pode produzir uma resposta 400 automaticamente quando o **modelo recebido** falha na validação. Aqui estamos tratando também os erros das **regras do domínio**, descobertos após a Action chamar o Service.

---

## Diferenciando validação, conflito e recurso não encontrado

Nem toda falha deve ser apresentada como 400. Na `v2`, a extensão converte o tipo informado pelo Service em uma resposta HTTP:

| Tipo de erro | Exemplo | Resposta |
|---|---|---|
| `Validacao` | Nome curto ou telefone inválido | `400 Bad Request`, com erros por campo |
| `Conflito` | E-mail já cadastrado | `409 Conflict`, com uma descrição |
| `NaoEncontrado` | Buscar um contato inexistente | `404 Not Found`, com uma descrição |

No caso de conflito, o código usa `controller.Problem(...)`:

```csharp
return controller.Problem(
    statusCode: StatusCodes.Status409Conflict,
    detail: result.Errors.First().Message,
    title: "Conflito",
    type: ProblemDetailsTypes.Conflict
);
```

O campo `detail` explica o ocorrido. A propriedade `type` aponta para uma página sobre o status HTTP; no projeto, esses endereços ficam em `ProblemDetailsTypes`.

Ao final, o Controller só precisa traduzir o resultado da operação:

```csharp
var resultadoCadastro = servicoContato.Cadastrar(dto);

if (resultadoCadastro.IsFailed)
    return this.ValidationProblem(resultadoCadastro);
```

`this.ValidationProblem(resultadoCadastro)` chama a **extensão do projeto**. Ela não deve ser confundida com `ControllerBase.ValidationProblem(ValidationProblemDetails)`, usado dentro da própria extensão.

---

## Por que documentar as rotas?

Para usar uma API, outro desenvolvedor precisa saber:

- qual método HTTP e qual endereço chamar;
- quais dados enviar;
- quais respostas esperar;
- o que significam as falhas.

Na branch `v2`, o Controller define as rotas de contatos com atributos como `[HttpGet]`, `[HttpPost]` e `[HttpPut("{id:guid}")]`. O projeto também inclui `Contatos.http`, útil para executar requisições manualmente.

Porém, o `Program.cs` dessa branch **ainda não configura a geração de um documento OpenAPI nem uma interface Swagger UI**. O arquivo `.http` ajuda a testar as rotas, mas não gera uma documentação navegável automaticamente.

**OpenAPI** é um formato para descrever rotas, parâmetros e respostas de uma API. **Swagger UI** é uma interface que pode apresentar esse documento no navegador. **Postman** é um cliente para organizar e executar requisições; ele também pode importar um documento OpenAPI.

---

## Adicionando OpenAPI e Swagger UI ao projeto

Esta etapa é uma **evolução proposta** para o e-Agenda `v2`; o código a seguir não está presente na branch de referência.

Com .NET 10, adicione ao projeto Web API os pacotes para gerar o documento e apresentar a interface:

```bash
dotnet add src/eAgenda.WebApi/eAgenda.WebApi.csproj package Microsoft.AspNetCore.OpenApi
dotnet add src/eAgenda.WebApi/eAgenda.WebApi.csproj package Swashbuckle.AspNetCore.SwaggerUi
```

No `Program.cs`, mantenha o registro dos repositórios, dos Services, dos Controllers e as outras configurações já existentes. Acrescente apenas as linhas destacadas abaixo nos lugares indicados:

```csharp
// Antes de builder.Build(), junto dos demais registros:
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Mantenha a configuração do banco já existente no bloco de Development.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "e-Agenda v1"));
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
```

`AddOpenApi()` prepara a geração do documento. `MapOpenApi()` publica o JSON em `/openapi/v1.json`; `UseSwaggerUI(...)` oferece a interface em `/swagger`.

> O bloco acima mostra onde inserir as novas chamadas. Ao editar o arquivo real, **preserve** os registros e a migração do banco existentes no `Program.cs` da `v2`.

Após configurar a conexão com o SQL Server e iniciar a API, abra `https://localhost:7098/swagger` ou `https://localhost:7098/openapi/v1.json` no ambiente de desenvolvimento.

Documentar os **status possíveis** de cada Action também é importante. Atributos como `[ProducesResponseType]` podem informar aos leitores do OpenAPI que o cadastro pode responder com `201`, `400` ou `409`. Esses atributos descrevem respostas: a lógica do Controller e do Service continua responsável por produzi-las.

Por exemplo, acima da assinatura da Action `Cadastrar`, poderíamos acrescentar estes atributos:

```csharp
[ProducesResponseType(typeof(DetalhesContatoDto), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
```

Este trecho é uma sugestão para documentar a `v2`. Adicione os atributos antes do `[HttpPost]` existente, sem alterar a implementação do cadastro.

---

## Explorando e compartilhando as rotas com Postman

O Postman permite criar requisições para a API e salvá-las em uma **collection**, ou coleção. Uma coleção reúne as operações que outras pessoas precisam conhecer.

Podemos começar mesmo sem OpenAPI:

1. Crie uma coleção chamada `e-Agenda - Contatos`.
2. Adicione uma requisição `GET https://localhost:7098/api/contatos`.
3. Adicione uma requisição `POST https://localhost:7098/api/contatos` com corpo JSON e `Content-Type: application/json`.
4. Descreva na coleção as respostas `201 Created`, `400 Bad Request` e `409 Conflict` do cadastro.
5. Execute um cadastro com e-mail repetido e examine o corpo `ProblemDetails` recebido.

Se você tiver adicionado OpenAPI conforme a seção anterior, pode importar no Postman o endereço `https://localhost:7098/openapi/v1.json` e gerar uma coleção a partir das rotas descritas. Depois, confira as URLs e complete as descrições e exemplos necessários.

O Swagger UI apresenta a documentação gerada; o Postman ajuda a manter e compartilhar requisições de uso da API. Nenhum dos dois substitui as regras implementadas nos Controllers e Services.

---

## Exercício: observando os três tipos de erro

Com a API `v2` em execução, use `Contatos.http`, Swagger UI após a configuração proposta ou um cliente como Postman:

1. Envie um cadastro com `nome` igual a `"A"` e telefone fora do formato esperado. Mantenha os demais dados válidos e únicos. Observe os erros separados por campo na resposta 400.
2. Cadastre um contato válido e repita o cadastro com o mesmo e-mail. Observe o status 409 e a mensagem em `detail`.
3. Consulte `GET /api/contatos/{id}` com um `Guid` inexistente. Observe o status 404.
4. Identifique em cada caso qual camada descobriu o problema e qual camada produziu a resposta HTTP.

Repare que `Contatos.http` na `v2` contém exemplos para as operações usuais. Para os casos inválidos, edite os dados da requisição ou crie requisições adicionais no seu cliente HTTP.

---

## Conclusão

Na `v2` do e-Agenda, a validação da entidade passa a devolver **campo e mensagem**. O Service preserva esses dados e classifica a falha. A Web API transforma o resultado em `ProblemDetails` com status e informações úteis para o cliente.

Para que outras pessoas descubram as rotas e saibam como usá-las, podemos complementar os exemplos `.http` com um documento OpenAPI, apresentá-lo no Swagger UI e organizar requisições no Postman.

Referências:

- [Introdução às Web APIs com ASP.NET Core](/conteudo/introducao-web-apis-aspnet-core);
- [Projeto e-Agenda API na branch `v2`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v2);
- [`Contato.cs` e validação da entidade](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v2/src/eAgenda.Dominio/Modulos/ModuloContato/Contato.cs);
- [`ServicoBase.cs` e classificação de erros](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v2/src/eAgenda.Aplicacao/Compartilhado/ServicoBase.cs);
- [`ResultExtensions.cs` e ProblemDetails](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v2/src/eAgenda.WebApi/Compartilhado/ResultExtensions.cs);
- [Documentação da Microsoft sobre respostas de erro em APIs](https://learn.microsoft.com/aspnet/core/fundamentals/error-handling-api);
- [Documentação da Microsoft sobre OpenAPI no ASP.NET Core](https://learn.microsoft.com/aspnet/core/fundamentals/openapi/overview).
