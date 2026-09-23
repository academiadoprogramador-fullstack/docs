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

Na branch [`v2` do e-Agenda](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v2), a validação passou a identificar campos e tipos de erro. A branch [`v3`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v3) amplia o tratamento de erros e adiciona o módulo de compromissos.

Vamos acompanhar essa evolução e explorar as rotas da API com Swagger UI e Postman.

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

Na `v2`, o caso de conflito usava `controller.Problem(...)`:

```csharp
return controller.Problem(
    statusCode: StatusCodes.Status409Conflict,
    detail: result.Errors.First().Message,
    title: "Conflito",
    type: ProblemDetailsTypes.Conflict
);
```

O campo `detail` explica o ocorrido. A propriedade `type` aponta para uma página sobre o status HTTP; no projeto, esses endereços ficam em `ProblemDetailsTypes`.

Na `v3`, `ResultExtensions` cria um `ProblemDetails`, adiciona o `traceId` e devolve `controller.StatusCode(statusCode, problemDetails)`. O cliente continua recebendo o status apropriado e uma descrição da falha.

Na `v2`, o Controller chamava `this.ValidationProblem(resultadoCadastro)`. Na `v3`, a extensão do projeto passa a se chamar `ProblemDetails`:

```csharp
var resultadoCadastro = servicoContato.Cadastrar(dto);

if (resultadoCadastro.IsFailed)
    return this.ProblemDetails(resultadoCadastro);
```

`this.ProblemDetails(resultadoCadastro)` chama a **extensão do projeto** em `ResultExtensions.cs`. Ela cria o resultado HTTP conforme o tipo da falha. Para erros de validação, a extensão ainda usa `controller.ValidationProblem(problemDetails)` internamente.

---

## Finalizando a configuração global do ProblemDetails

Os erros de validação e conflito vêm do Service e são convertidos pelo Controller. Mas uma exceção inesperada pode ocorrer antes que ele produza uma resposta.

Na `v3`, o `Program.cs` também registra o serviço de ProblemDetails e configura um tratamento global:

```csharp
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        string? type = ProblemDetailsTypes.ObterPorStatus(context.ProblemDetails.Status);

        if (type is not null)
            context.ProblemDetails.Type = type;

        context.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
    };
});

// Depois de builder.Build():
app.UseExceptionHandler();
```

`UseExceptionHandler()` intercepta exceções não tratadas. Com `AddProblemDetails()`, a aplicação pode devolver uma resposta de erro estruturada em vez de expor uma página de falha.

`CustomizeProblemDetails` acrescenta o endereço de referência do status em `type` e um `traceId`: um identificador que ajuda a localizar a requisição durante a investigação do erro.

`ProblemDetailsTypes.ObterPorStatus` associa os códigos 400, 404, 409 e 500 às páginas correspondentes da documentação HTTP. Para outros códigos, ele retorna `null`.

> **Atenção:** o tratamento global de exceções não substitui o resultado produzido pelo Controller para regras de negócio. Na `v3`, `ResultExtensions.ProblemDetails` também adiciona o `traceId` aos problemas montados diretamente a partir dos resultados dos Services.

Uma falha de validação esperada continua sendo **400**. Um e-mail duplicado continua sendo **409**. Já uma exceção inesperada pode produzir **500 Internal Server Error**.

---

## Módulo de Compromissos na Web API

A `v3` acrescenta `CompromissosController`, com a rota base `api/compromissos`. Ele recebe requests, chama `ServicoCompromisso` e transforma os resultados em respostas HTTP, como já acontece com contatos.

| Requisição | Operação | Resposta de sucesso |
|---|---|---|
| `GET /api/compromissos` | Listar | `200 OK` |
| `GET /api/compromissos/{id}` | Selecionar | `200 OK` |
| `POST /api/compromissos` | Cadastrar | `201 Created` |
| `PUT /api/compromissos/{id}` | Editar | `204 No Content` |
| `DELETE /api/compromissos/{id}` | Excluir | `204 No Content` |

O request de cadastro recebe, entre outros dados, assunto, data, horário, tipo e um contato opcional:

```csharp
public record CadastrarCompromissoRequest(
    string Assunto,
    DateTime DataOcorrencia,
    TimeSpan HoraInicio,
    TimeSpan HoraTermino,
    TipoCompromisso Tipo,
    string? Local,
    string? Link,
    Guid? ContatoId
);
```

`TipoCompromisso` é um `enum` com os valores `Presencial` e `Remoto`. O `Program.cs` registra `JsonStringEnumConverter`, permitindo enviar o tipo como texto no JSON.

Por exemplo, para cadastrar um compromisso remoto sem contato associado:

```json
{
  "assunto": "Reunião de planejamento",
  "dataOcorrencia": "2026-10-15T00:00:00",
  "horaInicio": "09:00:00",
  "horaTermino": "10:00:00",
  "tipo": "Remoto",
  "local": null,
  "link": "https://exemplo.com/reuniao",
  "contatoId": null
}
```

A entidade exige `Local` para compromissos presenciais e `Link` para remotos. O Service verifica se o contato informado existe e se há conflito de horário. Assim, um `ContatoId` inválido pode gerar **400** e um compromisso no mesmo intervalo pode gerar **409**.

Na Action de cadastro, o Controller converte o request em DTO e consulta o Service. Observe o trecho que transforma o resultado em resposta:

```csharp
var resultadoCadastro = servico.Cadastrar(dto);

if (resultadoCadastro.IsFailed)
    return this.ProblemDetails(resultadoCadastro);

Guid id = resultadoCadastro.Value;
var resultadoSelecao = servico.SelecionarPorId(id);

if (resultadoSelecao.IsFailed)
    return this.ProblemDetails(resultadoSelecao);

return CreatedAtAction(nameof(SelecionarPorId), new { id }, resultadoSelecao.Value);
```

`CreatedAtAction` devolve **201 Created**, o compromisso criado e o endereço para consultá-lo. As demais Actions usam a mesma extensão para traduzir falhas de validação, conflito ou recurso não encontrado.

---

## Documentando rotas com OpenAPI e Swagger

Para consumir a API, outra pessoa precisa conhecer as rotas, os dados de entrada e as respostas possíveis.

**OpenAPI** é o formato do documento que descreve a API. **Swagger UI** apresenta as rotas em uma página interativa. Na `v3`, os pacotes `Microsoft.AspNetCore.OpenApi` e `Swashbuckle.AspNetCore` já estão no projeto.

O `Program.cs` registra os geradores e publica suas rotas:

```csharp
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// Depois de builder.Build():
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapOpenApi();
app.MapControllers();
```

Aqui existem **dois documentos**: `MapOpenApi()` publica `/openapi/v1.json`, enquanto `UseSwagger()` publica `/swagger/v1/swagger.json`. No ambiente de desenvolvimento, `UseSwaggerUI()` disponibiliza a interface em `/swagger` usando o documento do Swagger.

Observe que, nesse código, `MapOpenApi()` está **fora** do bloco de desenvolvimento. Portanto, o endpoint `/openapi/v1.json` também fica mapeado em outros ambientes; a interface Swagger UI e o documento gerado por `UseSwagger()` ficam no bloco de desenvolvimento.

O Controller de Compromissos também descreve respostas de algumas Actions com atributos. Por exemplo:

```csharp
[HttpPost]
[ProducesResponseType<DetalhesCompromissoDto>(StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(StatusCodes.Status409Conflict)]
```

Esses atributos ajudam a documentar as respostas do cadastro. Quem produz os status de fato continua sendo o Controller com o Service.

Após configurar a conexão com o SQL Server, inicie a API:

```bash
dotnet run --project src/eAgenda.WebApi
```

Com o perfil HTTPS do projeto, abra `https://localhost:7098/swagger` para explorar as rotas de contatos e compromissos. O documento JSON também pode ser consultado em `https://localhost:7098/openapi/v1.json`.

---

## Explorando e compartilhando as rotas com Postman

O **Postman** é um cliente HTTP que permite salvar requisições em uma *collection*, ou coleção. Podemos usar o documento OpenAPI da `v3` para começar essa coleção:

1. Com a API em execução, abra a opção de importação do Postman.
2. Informe `https://localhost:7098/openapi/v1.json` ou importe o JSON obtido nesse endereço.
3. Gere uma coleção e configure a URL local usada para enviar as requisições.
4. Envie `GET /api/compromissos` para conferir a listagem.
5. Envie `POST /api/compromissos` com o JSON do exemplo anterior e observe o status `201 Created`.
6. Teste um horário conflitante e confira o status `409 Conflict` e o campo `detail`.

Também é possível criar as requisições manualmente no Postman. Nesse caso, informe o método HTTP, a URL, o corpo JSON e o cabeçalho `Content-Type: application/json`.

O Swagger UI facilita a descoberta das rotas. O Postman ajuda a organizar e compartilhar os exemplos de uso. Nenhum deles substitui as regras implementadas na aplicação.

---

## Exercício: documentando e testando compromissos

Com a API `v3` em execução, use o Swagger UI ou o Postman:

1. Localize `POST /api/compromissos` e observe os dados esperados no request.
2. Cadastre um compromisso remoto válido com `contatoId` igual a `null`.
3. Envie outro compromisso no mesmo dia e horário. Compare a resposta **409** com a resposta de sucesso.
4. Tente cadastrar um compromisso presencial sem `local`. Observe o erro por campo na resposta **400**.
5. Consulte um `id` inexistente em `GET /api/compromissos/{id}` e observe a resposta **404**.
6. Identifique o `traceId` em uma das respostas de erro.

Em cada cenário, compare o status observado com as respostas declaradas no Controller. Depois, localize no Service ou na entidade a regra que produziu a falha.

---

## Conclusão

Na `v2` do e-Agenda, a validação da entidade passou a devolver **campo e mensagem**. A `v3` mantém esse caminho e configura o tratamento global de erros inesperados com `AddProblemDetails` e `UseExceptionHandler`.

O módulo de Compromissos mostra como reutilizar essas respostas em novos endpoints. O projeto também publica documentos OpenAPI, oferece Swagger UI em desenvolvimento e permite importar suas rotas no Postman.

Referências:

- [Introdução às Web APIs com ASP.NET Core](/conteudo/introducao-web-apis-aspnet-core);
- [Projeto e-Agenda API na branch `v2`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v2);
- [Projeto e-Agenda API na branch `v3`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/tree/v3);
- [`Contato.cs` e validação da entidade](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v2/src/eAgenda.Dominio/Modulos/ModuloContato/Contato.cs);
- [`ServicoBase.cs` e classificação de erros](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v2/src/eAgenda.Aplicacao/Compartilhado/ServicoBase.cs);
- [`Program.cs` e configuração global](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v3/src/eAgenda.WebApi/Program.cs);
- [`ResultExtensions.cs` e ProblemDetails](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v3/src/eAgenda.WebApi/Compartilhado/ResultExtensions.cs);
- [`CompromissosController.cs`](https://github.com/academiadoprogramador-fullstack/e-agenda-api-2026/blob/v3/src/eAgenda.WebApi/Features/Compromissos/CompromissosController.cs);
- [Documentação da Microsoft sobre respostas de erro em APIs](https://learn.microsoft.com/aspnet/core/fundamentals/error-handling-api);
- [Documentação da Microsoft sobre OpenAPI no ASP.NET Core](https://learn.microsoft.com/aspnet/core/fundamentals/openapi/overview).
