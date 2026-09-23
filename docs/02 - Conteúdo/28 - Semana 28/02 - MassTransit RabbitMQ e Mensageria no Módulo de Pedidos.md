---
draft: false
slug: /conteudo/masstransit-rabbitmq-modulo-pedidos
tags:
  - trilha-arquitetura-software
  - trilha-devops
  - tech-dotnet
  - tech-docker
  - tech-mediatr
  - tech-masstransit
  - tech-rabbitmq
  - tech-entity-framework-core
  - conceito-mensageria
  - conceito-message-broker
  - conceito-produtor-consumidor
  - projeto-delivery-app
  - material-aula-pratica
---

# MassTransit, RabbitMQ e o Módulo de Pedidos

## Evoluindo o Delivery App

Nas aulas anteriores, iniciamos o Delivery App e organizamos sua solução em projetos:

- `DeliveryApp.Dominio`;
- `DeliveryApp.Aplicacao`;
- `DeliveryApp.Infraestrutura`;
- `DeliveryApp.WebApi`.

Também estudamos:

- PostgreSQL executado com Docker;
- Entity Framework Core;
- autenticação com JWT;
- MediatR;
- separação entre Commands e Queries;
- RabbitMQ e MassTransit em um exemplo isolado.

Agora vamos aplicar mensageria dentro do próprio Delivery App.

O módulo de Pedidos possui regras que podem exigir consultas a vários dados:

- cliente;
- estabelecimento;
- produtos;
- complementos;
- taxa de entrega;
- status do pedido.

Se a API executar todo esse trabalho durante a requisição HTTP, o cliente precisará aguardar até que todas as validações terminem.

Além disso, a operação poderá falhar por motivos externos, como:

- estabelecimento fechado;
- produto indisponível;
- serviço de banco temporariamente indisponível;
- mensagem sendo processada novamente;
- alteração de status concorrente.

Uma alternativa é aceitar a solicitação, publicar uma mensagem e processar o pedido em segundo plano.

```text
Cliente
  -> Web API
    -> valida a solicitação
    -> publica uma mensagem
    -> responde 202 Accepted

RabbitMQ
  -> mantém a mensagem na fila
    -> entrega ao consumidor

Consumer
  -> valida os dados completos
  -> cria ou altera o pedido
  -> salva no PostgreSQL
```

Esse é o fluxo que será construído nesta aula.

---

## O ponto de partida na branch `v6`

A branch [`v6` do Delivery App](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v6) representa o ponto inicial do módulo.

Ela já possui algumas partes importantes:

- a entidade `Pedido`;
- a enumeração `StatusPedido`;
- os itens e complementos do pedido;
- o `IRepositorioPedido`;
- a configuração da tabela `TBPedidos`;
- a migration inicial do pedido;
- o `CriarPedidoCommand`;
- o `CriarPedidoCommandHandler`.

Porém, o módulo ainda não está completo.

Na `v6`, o handler termina com um comentário:

```csharp
// Criação e envio da CriarPedidoMessage

return Result.Ok(pedidoId);
```

Esse comentário indica o ponto em que a aplicação deverá publicar a mensagem.

O handler ainda não cria o pedido no banco.

Essa responsabilidade será executada pelo consumidor.

A branch [`v7`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v7) apresenta a evolução com:

- pacote `MassTransit.RabbitMQ`;
- connection string do RabbitMQ;
- configuração do bus;
- fila `pedidos-criados`;
- contrato `CriarPedidoMessage`;
- `CriarPedidoConsumer`;
- Controller do módulo de Pedidos;
- resposta HTTP `202 Accepted`.

O exemplo de alteração de status será construído sobre essa mesma estrutura.

---

## Por que a criação do pedido será assíncrona?

Uma API tradicional poderia fazer isto dentro do `POST`:

```text
receber requisição
  -> validar cliente
  -> carregar estabelecimento
  -> carregar produtos
  -> validar complementos
  -> criar entidade Pedido
  -> salvar no banco
  -> responder 201 Created
```

Esse fluxo só responde depois que o pedido já foi persistido.

Com mensageria, o fluxo muda:

```text
receber requisição
  -> validar dados básicos
  -> criar identificador do pedido
  -> publicar CriarPedidoMessage
  -> responder 202 Accepted
```

Depois, o consumidor executa:

```text
receber CriarPedidoMessage
  -> verificar se já foi processada
  -> validar cliente
  -> validar estabelecimento
  -> validar produtos e complementos
  -> criar entidade Pedido
  -> salvar no banco
```

O código HTTP `202 Accepted` significa que a requisição foi aceita para processamento, mas ainda não foi concluída.

> `202 Accepted` não significa que o pedido foi criado com sucesso. Significa que a solicitação foi aceita e será processada de forma assíncrona.

Essa diferença precisa ser explicada para quem consome a API.

---

## Configurando a conexão com o RabbitMQ

Na aula anterior, executamos o RabbitMQ com Docker.

Caso o container ainda não exista, execute:

```bash
docker run \
  --name delivery-app-rabbitmq \
  --hostname delivery-app-rabbitmq \
  --restart unless-stopped \
  --publish 5672:5672 \
  --publish 15672:15672 \
  --volume delivery-app-rabbitmq-data:/var/lib/rabbitmq \
  --detach \
  rabbitmq:4-management
```

As portas são:

- `5672`: comunicação AMQP entre a aplicação e o RabbitMQ;
- `15672`: interface web de gerenciamento.

Se o container já existir, inicie-o com:

```bash
docker start delivery-app-rabbitmq
```

Confirme a execução:

```bash
docker ps
```

Abra a interface de gerenciamento em:

```text
http://localhost:15672
```

No ambiente local, as credenciais padrão são:

```text
Usuário: guest
Senha: guest
```

> **Atenção:** essas credenciais são adequadas apenas para estudo local. Um ambiente real deve utilizar usuário, senha e permissões próprios.

### Connection string

Adicione o RabbitMQ ao arquivo:

```text
src/Api/appsettings.Development.json
```

```json
{
  "ConnectionStrings": {
    "PostgresEF": "Host=localhost;Port=5432;Database=DeliveryAppDb;Username=postgres;Password=postgres",
    "RabbitMq": "amqp://guest:guest@localhost:5672"
  }
}
```

A connection string informa:

- protocolo `amqp`;
- usuário `guest`;
- senha `guest`;
- host `localhost`;
- porta `5672`.

O nome `RabbitMq` será usado pelo código de configuração.

Se a chave estiver ausente, a aplicação deverá falhar durante a inicialização.

É melhor identificar a configuração ausente imediatamente do que iniciar uma API que nunca conseguirá publicar mensagens.

---

## Adicionando o pacote do MassTransit

Na branch `v7`, o pacote foi adicionado ao projeto de aplicação:

```xml
<PackageReference Include="MassTransit.RabbitMQ" Version="8.5.10" />
```

O pacote deve ficar em:

```text
src/Aplicacao/DeliveryApp.Aplicacao.csproj
```

Isso acontece porque o `CriarPedidoCommandHandler` utilizará `IPublishEndpoint`.

O handler pertence ao projeto de aplicação.

Para instalar pela linha de comando:

```bash
dotnet add src/Aplicacao/DeliveryApp.Aplicacao.csproj \
  package MassTransit.RabbitMQ \
  --version 8.5.10
```

Depois, restaure os pacotes:

```bash
dotnet restore DeliveryApp.slnx
```

O MassTransit precisa ser registrado no Dependency Injection antes que `IPublishEndpoint` possa ser injetado.

---

## Onde configurar o MassTransit?

Na aplicação, a configuração de serviços fica no método `AddApplicationServices`.

Na `v6`, o método possui apenas o parâmetro `IServiceCollection`:

```csharp
public static void AddApplicationServices(
    this IServiceCollection services
)
```

Para ler a connection string, ele também precisa receber `IConfiguration`:

```csharp
public static void AddApplicationServices(
    this IServiceCollection services,
    IConfiguration configuration
)
```

O método completo começa assim:

```csharp
using DeliveryApp.Aplicacao.Modulos.Pedidos.Mensageria;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DeliveryApp.Aplicacao;

public static class DependencyInjection
{
    public static void AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(
                typeof(DependencyInjection).Assembly
            );
        });
    }
}
```

O `Program.cs` também precisa passar a configuração:

```csharp
builder.Services.AddApplicationServices(
    builder.Configuration
);
```

Antes, a chamada era:

```csharp
builder.Services.AddApplicationServices();
```

Essa alteração permite que a camada de aplicação leia a connection string necessária para configurar o transporte.

---

## Configurando o bus

O bus é o componente do MassTransit que coordena a comunicação com o transporte.

Adicione a leitura da configuração:

```csharp
var rabbitMqConnectionString = configuration
    .GetConnectionString("RabbitMq")
    ?? throw new InvalidOperationException(
        "A ConnectionString \"RabbitMq\" não foi configurada"
    );
```

Depois, registre o MassTransit:

```csharp
services.AddMassTransit(config =>
{
    config.AddConsumer<CriarPedidoConsumer>();

    config.UsingRabbitMq((context, rabbitMq) =>
    {
        rabbitMq.Host(new Uri(rabbitMqConnectionString));
    });
});
```

Essa configuração informa:

- qual consumer será criado pelo Dependency Injection;
- qual transporte será utilizado;
- em qual host RabbitMQ a aplicação deve conectar.

O parâmetro `context` contém o contexto de serviços da aplicação.

Ele será utilizado para configurar o consumer com suas dependências.

---

## Configurando a fila de criação

O consumer precisa ser associado a um endpoint de recebimento.

```csharp
services.AddMassTransit(config =>
{
    config.AddConsumer<CriarPedidoConsumer>();

    config.UsingRabbitMq((context, rabbitMq) =>
    {
        rabbitMq.Host(new Uri(rabbitMqConnectionString));

        rabbitMq.ReceiveEndpoint(
            "pedidos-criados",
            endpoint =>
            {
                endpoint.PrefetchCount = 4;
                endpoint.ConcurrentMessageLimit = 2;

                endpoint.ConfigureConsumer<
                    CriarPedidoConsumer
                >(context);
            }
        );
    });
});
```

A fila `pedidos-criados` receberá as mensagens do tipo `CriarPedidoMessage`.

### `PrefetchCount`

```csharp
endpoint.PrefetchCount = 4;
```

Indica quantas mensagens o RabbitMQ pode entregar antecipadamente ao endpoint.

Esse valor não significa que quatro mensagens serão necessariamente processadas em paralelo.

### `ConcurrentMessageLimit`

```csharp
endpoint.ConcurrentMessageLimit = 2;
```

Limita a quantidade de mensagens processadas ao mesmo tempo naquele endpoint.

A configuração ajuda a proteger o banco e os serviços utilizados pelo consumer.

Valores maiores não são automaticamente melhores.

Se cada processamento utiliza muitas conexões ao banco, aumentar a concorrência pode criar um novo gargalo.

---

## Aguardando a inicialização do bus

Configure também o comportamento de inicialização:

```csharp
services.Configure<MassTransitHostOptions>(options =>
{
    options.WaitUntilStarted = true;
    options.StartTimeout = TimeSpan.FromSeconds(30);
});
```

Com `WaitUntilStarted`, a aplicação aguarda o bus iniciar antes de ser considerada pronta.

O `StartTimeout` limita o tempo de espera pela conexão.

Essa configuração torna um problema de infraestrutura visível durante o startup.

Sem ela, a API poderia iniciar e somente apresentar erros quando tentasse publicar a primeira mensagem.

---

## Os contratos de mensagens

Uma mensagem não deve transportar entidades do Entity Framework.

Ela deve possuir apenas os dados necessários para o processamento.

Na criação de um pedido, o contrato pode ser definido assim:

```csharp
namespace DeliveryApp.Aplicacao.Modulos.Pedidos.Mensageria;

public sealed record ItemCriarPedidoMessage(
    Guid ProdutoId,
    uint Quantidade,
    string? Observacao,
    IReadOnlyList<Guid> ComplementosIds
);

public sealed record CriarPedidoMessage(
    Guid PedidoId,
    Guid ClienteId,
    Guid EstabelecimentoId,
    string EnderecoEntrega,
    IReadOnlyList<ItemCriarPedidoMessage> Itens,
    DateTimeOffset SolicitadoEmUtc
);
```

A mensagem contém:

- o identificador criado antes da publicação;
- o cliente autenticado;
- o estabelecimento escolhido;
- o endereço de entrega;
- os produtos e complementos solicitados;
- o horário da solicitação.

Ela não contém:

- uma instância de `DbContext`;
- um `Produto` do Entity Framework;
- um serviço;
- uma conexão com banco;
- regras de negócio executáveis.

O consumidor consultará os dados atuais usando os identificadores da mensagem.

---

## Publicando a criação do pedido

O `CriarPedidoCommandHandler` recebe `IPublishEndpoint`:

```csharp
public sealed class CriarPedidoCommandHandler(
    IProvedorDeUsuario provedorDeUsuario,
    IPublishEndpoint publishEndpoint
) : IRequestHandler<
    CriarPedidoCommand,
    Result<Guid>
>
```

O handler ainda realiza validações imediatas:

```csharp
if (provedorDeUsuario.Id is not Guid clienteId)
    return Result.Fail<Guid>(ErrosDePedido.NaoAutorizado());

if (!provedorDeUsuario.PossuiTipo(TipoUsuario.Cliente))
    return Result.Fail<Guid>(ErrosDePedido.NaoAutorizado());

var erros = Validar(command);

if (erros.Count > 0)
    return Result.Fail<Guid>(erros);
```

Depois das validações, ele gera o identificador e publica a mensagem:

```csharp
var pedidoId = Guid.CreateVersion7();
var solicitadoEmUtc = DateTimeOffset.UtcNow;

await publishEndpoint.Publish(
    new CriarPedidoMessage(
        pedidoId,
        clienteId,
        command.EstabelecimentoId,
        command.EnderecoEntrega,
        command.Itens.Select(item =>
            new ItemCriarPedidoMessage(
                item.ProdutoId,
                (uint)item.Quantidade,
                item.Observacao,
                item.ComplementosIds
            )
        ).ToList(),
        solicitadoEmUtc
    ),
    cancellationToken
);

return Result.Ok(pedidoId);
```

O `IPublishEndpoint` não chama o consumer diretamente.

Ele publica uma mensagem no bus.

O MassTransit serializa o record e entrega o evento ao RabbitMQ.

### O identificador antes do processamento

O `PedidoId` é criado antes da mensagem ser enviada.

Isso permite que a API devolva o identificador imediatamente:

```json
{
  "pedidoId": "01900000-0000-7000-8000-000000000000"
}
```

O mesmo identificador será usado pelo consumer para:

- verificar se o pedido já foi criado;
- criar a entidade com um ID conhecido;
- consultar o pedido posteriormente;
- evitar duplicidade em caso de reentrega.

---

## Criando o Controller de Pedidos

Na `v6`, o módulo ainda não possui o Controller.

A API precisa expor uma rota para o cliente criar um pedido.

Os contratos HTTP podem ser separados dos contratos de mensageria:

```csharp
namespace DeliveryApp.WebApi.Modulos.Pedidos;

public sealed record ItemCriarPedidoRequest(
    Guid ProdutoId,
    uint Quantidade,
    string? Observacao,
    IReadOnlyList<Guid> ComplementosIds
);

public sealed record CriarPedidoRequest(
    Guid EstabelecimentoId,
    string EnderecoEntrega,
    IReadOnlyList<ItemCriarPedidoRequest> Itens
);

public sealed record CriarPedidoResponse(Guid PedidoId);
```

O Controller utiliza MediatR:

```csharp
[ApiController]
[Route("api/pedidos")]
[Authorize(Roles = nameof(TipoUsuario.Cliente))]
public sealed class PedidosController(IMediator mediator)
    : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<CriarPedidoResponse>(
        StatusCodes.Status202Accepted
    )]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status400BadRequest
    )]
    public async Task<ActionResult<CriarPedidoResponse>> Criar(
        CriarPedidoRequest request,
        CancellationToken cancellationToken
    )
    {
        var resultado = await mediator.Send(
            new CriarPedidoCommand(
                request.EstabelecimentoId,
                request.EnderecoEntrega,
                request.Itens.Select(item =>
                    new ItemCriarPedidoCommand(
                        item.ProdutoId,
                        item.Quantidade,
                        item.Observacao,
                        item.ComplementosIds
                    )
                ).ToList()
            ),
            cancellationToken
        );

        if (resultado.IsFailed)
            return this.ProblemDetails(resultado);

        return AcceptedAtAction(
            nameof(ObterPorId),
            new { pedidoId = resultado.Value },
            new CriarPedidoResponse(resultado.Value)
        );
    }
}
```

O Controller conhece:

- HTTP;
- autorização;
- request e response;
- MediatR.

Ele não conhece:

- RabbitMQ;
- a fila;
- o `CriarPedidoConsumer`;
- o `DbContext`.

Essa separação mantém a infraestrutura de mensageria fora da camada HTTP.

---

## Implementando o `CriarPedidoConsumer`

O consumer implementa:

```csharp
IConsumer<CriarPedidoMessage>
```

Ele recebe as dependências necessárias para montar o pedido:

```csharp
public sealed class CriarPedidoConsumer(
    IRepositorioPedido repositorioPedido,
    IRepositorioCliente repositorioCliente,
    IRepositorioEstabelecimento repositorioEstabelecimento,
    IRepositorioProduto repositorioProduto,
    ILogger<CriarPedidoConsumer> logger
) : IConsumer<CriarPedidoMessage>
```

O método de consumo começa lendo a mensagem:

```csharp
public async Task Consume(
    ConsumeContext<CriarPedidoMessage> context
)
{
    CriarPedidoMessage mensagem = context.Message;

    // processamento do pedido
}
```

O `ConsumeContext` fornece:

- a mensagem desserializada;
- o `CancellationToken`;
- metadados da entrega;
- informações da tentativa de consumo.

### Evitando duplicidade

Uma mensagem pode ser entregue novamente.

Por isso, o consumer verifica se o pedido já existe:

```csharp
var pedidoParaProcessamento =
    await repositorioPedido.ObterParaProcessamentoAsync(
        mensagem.PedidoId,
        context.CancellationToken
    );

if (pedidoParaProcessamento is not null)
{
    logger.LogInformation(
        "A criação do pedido {PedidoId} já foi processada.",
        mensagem.PedidoId
    );

    return;
}
```

Esse comportamento é chamado de **idempotência**.

Se a mesma mensagem for recebida duas vezes, a segunda entrega não cria um segundo pedido.

### Validando o cliente

O consumer não deve confiar somente no fato de a requisição HTTP ter sido autenticada.

Ele verifica se o cliente ainda existe:

```csharp
var clienteExiste =
    await repositorioCliente.ExistePorIdAsync(
        mensagem.ClienteId,
        context.CancellationToken
    );

if (!clienteExiste)
{
    logger.LogInformation(
        "O cliente {ClienteId} não foi encontrado para o pedido {PedidoId}.",
        mensagem.ClienteId,
        mensagem.PedidoId
    );

    return;
}
```

O consumidor trabalha com o estado atual do sistema no momento do processamento.

### Validando o estabelecimento

O estabelecimento precisa ser consultado para verificar:

- se existe;
- se está ativo;
- se está dentro do horário de atendimento;
- qual taxa de entrega deve ser usada.

```csharp
var estabelecimento =
    await repositorioEstabelecimento.SelecionarParaPedidoAsync(
        mensagem.EstabelecimentoId,
        context.CancellationToken
    );

var horaAtual = TimeOnly.FromTimeSpan(
    DateTimeOffset.UtcNow.TimeOfDay
);

if (
    estabelecimento is null ||
    !estabelecimento.EstaDisponivel(horaAtual)
)
{
    logger.LogInformation(
        "O estabelecimento {EstabelecimentoId} não está disponível.",
        mensagem.EstabelecimentoId
    );

    return;
}
```

### Obtendo os produtos

A mensagem carrega IDs, não preços.

O preço deve ser obtido do produto no momento em que o pedido é criado.

```csharp
var produtosEncontrados =
    await repositorioProduto.ObterParaPedidoAsync(
        mensagem.EstabelecimentoId,
        mensagem.Itens.Select(item => item.ProdutoId),
        context.CancellationToken
    );

Dictionary<Guid, Produto> produtosPorId =
    produtosEncontrados.ToDictionary(produto => produto.Id);
```

Depois, verificamos se todos os produtos foram encontrados:

```csharp
var quantidadeDeProdutos = mensagem.Itens
    .Select(item => item.ProdutoId)
    .Distinct()
    .Count();

if (produtosPorId.Count != quantidadeDeProdutos)
{
    logger.LogInformation(
        "O pedido {PedidoId} possui produtos indisponíveis.",
        mensagem.PedidoId
    );

    return;
}
```

Essa consulta também deve garantir que os produtos pertencem ao estabelecimento e podem participar de um pedido.

### Criando os itens como snapshot

Um pedido precisa preservar o preço usado no momento da compra.

Por isso, o consumer copia para `ItemPedido`:

- ID do produto;
- nome do produto;
- quantidade;
- preço unitário;
- observação;
- complementos e preços adicionais.

```csharp
List<ItemPedido> itens = [];

foreach (ItemCriarPedidoMessage itemMensagem in mensagem.Itens)
{
    var produto = produtosPorId[itemMensagem.ProdutoId];

    var complementos = produto.Complementos
        .Where(complemento =>
            itemMensagem.ComplementosIds.Contains(complemento.Id)
        )
        .ToList();

    if (
        complementos.Count !=
        itemMensagem.ComplementosIds.Distinct().Count()
    )
    {
        logger.LogInformation(
            "O pedido {PedidoId} possui complementos indisponíveis.",
            mensagem.PedidoId
        );

        return;
    }

    itens.Add(new ItemPedido(
        produto.Id,
        produto.Nome,
        (int)itemMensagem.Quantidade,
        produto.Preco,
        itemMensagem.Observacao,
        complementos.Select(complemento =>
            new ComplementoItemPedido(
                complemento.Id,
                complemento.Nome,
                complemento.PrecoAdicional
            )
        )
    ));
}
```

O preço não deve ser recalculado depois consultando o cardápio atual.

Se o estabelecimento alterar o preço amanhã, o pedido antigo deve continuar apresentando o preço original.

### Criando e salvando o pedido

Depois das validações, criamos a entidade de domínio:

```csharp
Pedido pedido = new(
    mensagem.PedidoId,
    mensagem.ClienteId,
    mensagem.EstabelecimentoId,
    mensagem.EnderecoEntrega,
    estabelecimento.TaxaEntrega,
    itens,
    mensagem.SolicitadoEmUtc
);
```

O construtor define o status inicial:

```csharp
Status = StatusPedido.AguardandoAceite;
```

Validamos a entidade antes de persistir:

```csharp
var erros = pedido.Validar().ToList();

if (erros.Count > 0)
{
    logger.LogInformation(
        "O pedido {PedidoId} é inválido: {Erros}.",
        mensagem.PedidoId,
        string.Join("; ", erros.Select(erro => erro.Mensagem))
    );

    return;
}

await repositorioPedido.CadastrarAsync(
    pedido,
    context.CancellationToken
);
```

O repositório já existente na `v6` possui o método `CadastrarAsync`.

Essa estrutura permite que a criação seja realizada somente pelo consumer.

---

## O ciclo de vida de um pedido

O pedido começa aguardando uma decisão do estabelecimento.

Uma sequência possível é:

```text
AguardandoAceite
  -> EmPreparo
    -> EmEntrega
      -> Concluido
```

Também existem caminhos de recusa e cancelamento:

```text
AguardandoAceite -> Recusado
AguardandoAceite -> Cancelado
```

Os status da entidade são:

```csharp
public enum StatusPedido
{
    AguardandoAceite,
    Recusado,
    EmPreparo,
    EmEntrega,
    Concluido,
    Cancelado
}
```

O status não deve ser alterado livremente pelo Controller.

Cada alteração precisa respeitar:

- o status atual;
- a ação solicitada;
- o tipo do usuário;
- as regras do domínio;
- a versão atual do pedido.

---

## Representando a ação de status

Em vez de o Controller receber diretamente um novo status, podemos representar a intenção por uma ação:

```csharp
public enum AcaoPedido
{
    Aceitar,
    Recusar,
    Cancelar,
    IniciarEntrega,
    Concluir
}
```

Essa escolha é importante.

O cliente não deve poder enviar qualquer combinação de status.

Ele solicita uma ação, e o domínio decide qual transição é possível.

```text
ação Aceitar
  -> status EmPreparo

ação Recusar
  -> status Recusado
```

---

## Definindo as transições permitidas

Uma regra de transição pode ser representada assim:

| Status atual | Ação | Novo status | Usuário autorizado |
|---|---|---|---|
| `AguardandoAceite` | `Aceitar` | `EmPreparo` | estabelecimento |
| `AguardandoAceite` | `Recusar` | `Recusado` | estabelecimento |
| `AguardandoAceite` | `Cancelar` | `Cancelado` | cliente |
| `EmPreparo` | `IniciarEntrega` | `EmEntrega` | estabelecimento |
| `EmEntrega` | `Concluir` | `Concluido` | estabelecimento |

Transições fora dessa tabela devem ser recusadas.

Por exemplo:

- um pedido concluído não pode voltar para preparo;
- um cliente não pode aceitar o pedido pelo estabelecimento;
- um estabelecimento não pode cancelar o pedido como se fosse o cliente;
- um pedido recusado não pode iniciar uma entrega.

O domínio deve concentrar essa regra.

---

## Registrando o histórico de status

Além do status atual, é útil guardar o histórico das transições.

```csharp
public sealed class TransicaoStatusPedido
{
    public Guid Id { get; private set; }
    public Guid PedidoId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public TipoUsuario TipoUsuario { get; private set; }

    public StatusPedido? StatusAnterior { get; private set; }
    public StatusPedido StatusAtual { get; private set; }
    public string? Motivo { get; private set; }
    public DateTimeOffset OcorridaEmUtc { get; private set; }
}
```

O histórico permite responder perguntas como:

- quem aceitou o pedido;
- quando o pedido foi recusado;
- qual era o status anterior;
- por que o cliente cancelou;
- quanto tempo o pedido permaneceu em cada status.

O `Pedido` passa a possuir uma coleção:

```csharp
public List<TransicaoStatusPedido> Historico { get; private set; } = [];
```

Na criação, podemos registrar a transição inicial:

```csharp
Historico = [new TransicaoStatusPedido(
    clienteId,
    TipoUsuario.Cliente,
    null,
    StatusPedido.AguardandoAceite,
    null,
    criadoEmUtc
)];
```

Também precisamos configurar o relacionamento no Entity Framework:

```csharp
builder.HasMany(p => p.Historico)
    .WithOne()
    .HasForeignKey(h => h.PedidoId)
    .OnDelete(DeleteBehavior.Cascade);
```

Essa configuração cria uma relação entre `Pedido` e suas transições.

---

## Protegendo alterações concorrentes com uma versão

Duas mensagens podem tentar alterar o mesmo pedido quase ao mesmo tempo.

Por exemplo:

```text
mensagem A lê versão 3
mensagem B lê versão 3
mensagem A altera o pedido para EmPreparo
mensagem B tenta alterar o mesmo pedido
```

Sem um controle, a segunda mensagem poderia sobrescrever o resultado da primeira.

A entidade possui uma versão:

```csharp
public uint Versao { get; private set; }
```

O Entity Framework configura essa propriedade como token de concorrência:

```csharp
builder.Property(p => p.Versao)
    .IsConcurrencyToken();
```

A mensagem de alteração carrega a versão esperada:

```csharp
public sealed record AlterarStatusPedidoMessage(
    Guid PedidoId,
    Guid UsuarioId,
    TipoUsuario TipoUsuario,
    AcaoPedido Acao,
    string? Motivo,
    DateTimeOffset SolicitadaEmUtc,
    uint VersaoEsperada
);
```

Depois de uma alteração bem-sucedida, a versão é incrementada:

```csharp
Versao++;
```

Se a mensagem chegar com uma versão diferente, ela não deve aplicar novamente a transição.

> A versão transforma uma alteração concorrente em uma decisão explícita: processar somente se o pedido ainda estiver no estado esperado.

---

## Publicando a alteração de status

O Command representa a solicitação recebida pela API:

```csharp
public sealed record AlterarStatusPedidoCommand(
    Guid PedidoId,
    TipoUsuario TipoUsuario,
    AcaoPedido Acao,
    string? Motivo
) : IRequest<Result<Guid>>;
```

O handler valida o usuário e o pedido:

```csharp
public sealed class AlterarStatusPedidoCommandHandler(
    IRepositorioPedido repositorioPedido,
    IProvedorDeUsuario provedorDeUsuario,
    IPublishEndpoint publishEndpoint
) : IRequestHandler<
    AlterarStatusPedidoCommand,
    Result<Guid>
>
```

Depois, verifica se a ação é válida para o status atual:

```csharp
var pedido = await repositorioPedido.ObterParaProcessamentoAsync(
    command.PedidoId,
    cancellationToken
);

if (pedido is null)
    return Result.Fail<Guid>(ErrosDePedido.NaoEncontrado());

var transicaoValida = pedido.TentarObterNovoStatus(
    command.Acao,
    command.TipoUsuario,
    out _,
    out string? erro
);

if (!transicaoValida)
    return Result.Fail<Guid>(ErrosDePedido.Conflito(erro!));
```

O handler ainda não altera o pedido.

Ele publica a solicitação com a versão lida:

```csharp
await publishEndpoint.Publish(
    new AlterarStatusPedidoMessage(
        command.PedidoId,
        usuarioId,
        command.TipoUsuario,
        command.Acao,
        string.IsNullOrWhiteSpace(command.Motivo)
            ? null
            : command.Motivo.Trim(),
        DateTimeOffset.UtcNow,
        pedido.Versao
    ),
    cancellationToken
);

return Result.Ok(command.PedidoId);
```

Esse fluxo permite que a resposta HTTP seja rápida, enquanto a alteração real acontece no consumer.

---

## Configurando a fila de alterações

A criação e a alteração possuem responsabilidades diferentes.

Por isso, cada uma pode possuir sua própria fila:

```csharp
services.AddMassTransit(config =>
{
    config.AddConsumer<CriarPedidoConsumer>();
    config.AddConsumer<AlterarStatusPedidoConsumer>();

    config.UsingRabbitMq((context, rabbitMq) =>
    {
        rabbitMq.Host(new Uri(rabbitMqConnectionString));

        rabbitMq.ReceiveEndpoint(
            "pedidos-criados",
            endpoint =>
            {
                endpoint.PrefetchCount = 4;
                endpoint.ConcurrentMessageLimit = 2;
                endpoint.ConfigureConsumer<
                    CriarPedidoConsumer
                >(context);
            }
        );

        rabbitMq.ReceiveEndpoint(
            "pedidos-atualizados",
            endpoint =>
            {
                endpoint.PrefetchCount = 4;
                endpoint.ConcurrentMessageLimit = 2;
                endpoint.ConfigureConsumer<
                    AlterarStatusPedidoConsumer
                >(context);
            }
        );
    });
});
```

O nome da fila representa sua finalidade:

- `pedidos-criados`: criação de pedidos;
- `pedidos-atualizados`: alterações de status.

Separar as filas permite observar e controlar cada tipo de operação.

Uma fila de alterações também pode possuir uma política de concorrência diferente da fila de criação.

---

## Implementando o consumer de alteração

O consumer recebe as dependências necessárias:

```csharp
public sealed class AlterarStatusPedidoConsumer(
    IRepositorioPedido repositorioPedido,
    IRepositorioEstabelecimento repositorioEstabelecimento,
    ILogger<AlterarStatusPedidoConsumer> logger
) : IConsumer<AlterarStatusPedidoMessage>
```

O processamento começa buscando o pedido:

```csharp
public async Task Consume(
    ConsumeContext<AlterarStatusPedidoMessage> context
)
{
    AlterarStatusPedidoMessage mensagem = context.Message;

    var pedido = await repositorioPedido
        .ObterParaProcessamentoAsync(
            mensagem.PedidoId,
            context.CancellationToken
        );

    if (pedido is null)
    {
        throw new InvalidOperationException(
            $"O pedido {mensagem.PedidoId} ainda não está disponível."
        );
    }
}
```

Aqui existe uma diferença importante em relação a um dado inválido.

Se o pedido ainda não estiver disponível por causa da ordem das mensagens, lançar uma exceção permite tentar novamente.

### Verificando a versão

```csharp
if (pedido.Versao != mensagem.VersaoEsperada)
{
    logger.LogInformation(
        "A alteração do pedido {PedidoId} já foi processada.",
        mensagem.PedidoId
    );

    return;
}
```

Se a versão for diferente, outra mensagem já alterou o pedido.

A mensagem atual pode ser encerrada sem aplicar uma segunda transição.

### Verificando o vínculo do usuário

O consumer deve validar novamente quem solicitou a alteração:

```csharp
bool vinculadoAoUsuario = mensagem.TipoUsuario switch
{
    TipoUsuario.Cliente =>
        pedido.ClienteId == mensagem.UsuarioId,

    TipoUsuario.Estabelecimento =>
        (await repositorioEstabelecimento
            .SelecionarParaPedidoAsync(
                pedido.EstabelecimentoId,
                context.CancellationToken
            ))?.Id == mensagem.UsuarioId,

    _ => false
};

if (!vinculadoAoUsuario)
{
    logger.LogInformation(
        "O pedido {PedidoId} não está vinculado ao usuário.",
        mensagem.PedidoId
    );

    return;
}
```

Não devemos confiar apenas no Controller.

A mensagem pode ser reentregue, persistida ou publicada por outro processo.

O consumer precisa proteger a regra de negócio no ponto em que o estado será alterado.

### Aplicando a transição

Depois das verificações, o domínio tenta aplicar a mudança:

```csharp
var conseguiuAlterar = pedido.TentarAlterarStatus(
    mensagem.Acao,
    mensagem.UsuarioId,
    mensagem.TipoUsuario,
    mensagem.Motivo,
    mensagem.SolicitadaEmUtc,
    out string? erro
);

if (!conseguiuAlterar)
{
    logger.LogInformation(
        "O pedido {PedidoId} não pode ser alterado: {Erro}.",
        mensagem.PedidoId,
        erro!
    );

    return;
}

await repositorioPedido.SalvarAsync(
    context.CancellationToken
);
```

O método de domínio deve:

- descobrir o novo status;
- verificar se a transição é permitida;
- atualizar o status atual;
- atualizar `AtualizadoEmUtc`;
- incrementar `Versao`;
- adicionar uma entrada no histórico.

O consumer coordena o fluxo.

O domínio decide se a transição é válida.

---

## Tratando a ordem entre mensagens

A criação e a alteração podem ser publicadas em sequência:

```text
CriarPedidoMessage
AlterarStatusPedidoMessage
```

Se a alteração for processada antes da criação terminar, o consumer poderá não encontrar o pedido.

Por isso, o consumer de alteração lança uma exceção quando o pedido ainda não está disponível.

Podemos configurar tentativas automáticas:

```csharp
endpoint.UseMessageRetry(retry =>
    retry.Intervals(
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(5),
        TimeSpan.FromSeconds(15)
    )
);
```

O MassTransit tentará processar novamente nos intervalos definidos.

Essa estratégia é adequada para falhas temporárias.

Ela não corrige um pedido permanentemente inválido.

> Retry deve ser usado para falhas temporárias. Validar novamente uma mensagem inválida sem limite apenas repete o mesmo problema.

---

## A resposta da API para operações assíncronas

A criação retorna `202 Accepted`:

```csharp
return AcceptedAtAction(
    nameof(ObterPorId),
    new { pedidoId = resultado.Value },
    new CriarPedidoResponse(resultado.Value)
);
```

O mesmo comportamento pode ser utilizado nas alterações de status:

```csharp
return AcceptedAtAction(
    nameof(ObterPorId),
    new { pedidoId = resultado.Value },
    new AlterarStatusPedidoResponse(
        resultado.Value,
        acao
    )
);
```

O consumidor da API precisa compreender que:

- a resposta confirma o recebimento da solicitação;
- o status pode continuar igual por alguns instantes;
- uma consulta posterior mostrará o resultado do processamento;
- uma falha de processamento deve ser observável por logs e métricas.

Uma aplicação real pode evoluir esse fluxo para:

- endpoint de consulta do pedido;
- notificações ao cliente;
- eventos de status alterado;
- WebSockets;
- Server-Sent Events.

---

## Migrations do histórico de status

Ao adicionar `TransicaoStatusPedido`, o modelo do Entity Framework muda.

Crie uma migration:

```bash
dotnet ef migrations add Add_HistoricoStatusPedido \
  --project src/Infraestrutura \
  --startup-project src/Api \
  --output-dir Compartilhado/Orm/Migrations
```

Depois, aplique as migrations:

```bash
dotnet ef database update \
  --project src/Infraestrutura \
  --startup-project src/Api
```

A nova tabela poderá ser chamada:

```text
TBTransicoesStatusPedido
```

Ela deve armazenar:

- identificador da transição;
- identificador do pedido;
- usuário responsável;
- tipo do usuário;
- status anterior;
- status atual;
- motivo;
- data da ocorrência.

Durante o desenvolvimento, a própria API da branch utiliza `Database.Migrate()` no ambiente de desenvolvimento.

Mesmo assim, é importante saber criar a migration explicitamente e revisar sua alteração.

---

## Estrutura final do módulo

Depois dessas alterações, o módulo pode ficar organizado assim:

```text
src/
├── Api/
│   └── Modulos/
│       └── Pedidos/
│           ├── PedidosContracts.cs
│           └── PedidosController.cs
├── Aplicacao/
│   └── Modulos/
│       └── Pedidos/
│           ├── CriarPedidoCommandHandler.cs
│           ├── AlterarStatusPedidoCommandHandler.cs
│           ├── ListarPedidosQueryHandler.cs
│           ├── ObterPedidoQueryHandler.cs
│           ├── DTOs/
│           │   └── PedidoDto.cs
│           └── Mensageria/
│               ├── PedidosMessages.cs
│               └── PedidosConsumers.cs
├── Dominio/
│   └── Modulos/
│       └── Pedidos/
│           ├── Pedido.cs
│           ├── ItemPedido.cs
│           ├── StatusPedido.cs
│           ├── AcaoPedido.cs
│           └── TransicaoStatusPedido.cs
└── Infraestrutura/
    └── Modulos/
        └── Pedidos/
            └── RepositorioPedidoEmOrm.cs
```

Cada projeto possui uma responsabilidade:

- `Api`: recebe HTTP e devolve respostas;
- `Aplicacao`: coordena Commands, mensagens e consumers;
- `Dominio`: protege as regras de status do pedido;
- `Infraestrutura`: persiste dados e configura o Entity Framework.

---

## O fluxo completo da criação

```mermaid
sequenceDiagram
    participant Cliente
    participant API as PedidosController
    participant MediatR
    participant Bus as MassTransit
    participant Rabbit as RabbitMQ
    participant Consumer as CriarPedidoConsumer
    participant Banco as PostgreSQL

    Cliente->>API: POST /api/pedidos
    API->>MediatR: CriarPedidoCommand
    MediatR->>Bus: Publish(CriarPedidoMessage)
    Bus->>Rabbit: publica na fila pedidos-criados
    API-->>Cliente: 202 Accepted + PedidoId
    Rabbit->>Consumer: entrega mensagem
    Consumer->>Banco: valida dados e salva Pedido
    Consumer-->>Rabbit: ack após sucesso
```

O Controller não espera o processamento completo.

O consumer é responsável pela criação efetiva no banco.

---

## O fluxo completo da alteração de status

```mermaid
sequenceDiagram
    participant Usuario
    participant API as PedidosController
    participant MediatR
    participant Bus as MassTransit
    participant Rabbit as RabbitMQ
    participant Consumer as AlterarStatusPedidoConsumer
    participant Banco as PostgreSQL

    Usuario->>API: PATCH /api/pedidos/{id}/aceite
    API->>MediatR: AlterarStatusPedidoCommand
    MediatR->>Banco: lê pedido e versão
    MediatR->>Bus: Publish(AlterarStatusPedidoMessage)
    API-->>Usuario: 202 Accepted
    Bus->>Rabbit: publica na fila pedidos-atualizados
    Rabbit->>Consumer: entrega mensagem
    Consumer->>Banco: verifica versão e vínculo
    Consumer->>Banco: aplica transição e salva histórico
    Consumer-->>Rabbit: ack após sucesso
```

O status somente muda no consumer.

Isso mantém o processamento da mensagem como o ponto central da alteração.

---

## Observando as filas

Com o RabbitMQ e a API em execução:

1. Acesse `http://localhost:15672`.
2. Entre com `guest` e `guest`.
3. Abra **Queues and Streams**.
4. Localize `pedidos-criados`.
5. Localize `pedidos-atualizados`.
6. Observe as mensagens `Ready`.
7. Observe as mensagens `Unacked` durante o processamento.
8. Compare a quantidade de mensagens com os logs da API.

Se o consumer estiver processando uma mensagem, ela pode aparecer como `Unacked`.

Quando `Consume` termina sem erro, a mensagem é confirmada.

Se o consumer lançar uma exceção, a política de retry poderá entregar a mensagem novamente.

---

## Executando o projeto

Na raiz do repositório do Delivery App:

```bash
dotnet restore DeliveryApp.slnx
dotnet build DeliveryApp.slnx
```

Confirme que o PostgreSQL está em execução:

```bash
docker ps
```

Confirme também o RabbitMQ:

```bash
docker ps --filter name=delivery-app-rabbitmq
```

Depois, execute a API:

```bash
dotnet run --project src/Api/DeliveryApp.WebApi.csproj
```

A API deverá:

- conectar ao PostgreSQL;
- aplicar migrations em desenvolvimento;
- conectar ao RabbitMQ;
- declarar os endpoints de recebimento;
- iniciar os consumers.

Abra o Swagger na URL apresentada pelo terminal.

Depois de obter um token de cliente, envie um `POST` para:

```text
/api/pedidos
```

Exemplo de corpo:

```json
{
  "estabelecimentoId": "01900000-0000-7000-8000-000000000000",
  "enderecoEntrega": "Rua das Flores, 100",
  "itens": [
    {
      "produtoId": "01900000-0000-7000-8000-000000000001",
      "quantidade": 2,
      "observacao": "Sem cebola",
      "complementosIds": []
    }
  ]
}
```

A resposta esperada é semelhante a:

```json
{
  "pedidoId": "01900000-0000-7000-8000-000000000002"
}
```

O status HTTP esperado é `202 Accepted`.

Acompanhe o processamento:

- nos logs da aplicação;
- na fila `pedidos-criados`;
- na consulta posterior do pedido.

---

## Exercício: testar a criação assíncrona

1. Inicie o PostgreSQL.
2. Inicie o RabbitMQ.
3. Execute a API.
4. Cadastre ou utilize um cliente autenticado.
5. Crie um estabelecimento disponível.
6. Crie um produto ativo nesse estabelecimento.
7. Envie um `POST /api/pedidos`.
8. Confirme que a API respondeu `202 Accepted`.
9. Observe a fila `pedidos-criados`.
10. Consulte o pedido pelo ID retornado.
11. Compare o horário da solicitação com o horário da criação.
12. Pare temporariamente o consumer.
13. Publique outra criação.
14. Observe a mensagem aguardando na fila.
15. Inicie novamente a aplicação.
16. Observe o pedido sendo processado.

Responda:

- em que momento o ID do pedido foi criado?
- em que momento o pedido foi salvo no banco?
- qual componente conhece o preço do produto?
- por que o Controller não cria diretamente a entidade?
- o que significa a resposta `202 Accepted`?

---

## Exercício: testar alterações de status

Depois de implementar a alteração de status:

1. Crie um pedido com status `AguardandoAceite`.
2. Faça o estabelecimento aceitar o pedido.
3. Verifique a resposta `202 Accepted`.
4. Observe a fila `pedidos-atualizados`.
5. Consulte o pedido novamente.
6. Confirme o status `EmPreparo`.
7. Tente aceitar o mesmo pedido novamente.
8. Confirme que a transição inválida foi rejeitada.
9. Inicie a entrega.
10. Conclua o pedido.
11. Tente cancelar um pedido concluído.
12. Confirme que a transição não é permitida.
13. Consulte o histórico de transições.

Também teste concorrência:

1. Envie duas alterações para o mesmo pedido rapidamente.
2. Observe a `Versao` esperada em cada mensagem.
3. Confirme que somente uma transição compatível é aplicada.
4. Verifique os logs do consumer.

---

## Problemas comuns

### A aplicação não encontra `IPublishEndpoint`

Confira se:

- o pacote `MassTransit.RabbitMQ` foi adicionado ao projeto de aplicação;
- `services.AddMassTransit` foi executado;
- o consumer foi registrado;
- a aplicação recompilou após a instalação do pacote.

### A connection string não foi encontrada

Confira o nome da chave:

```text
ConnectionStrings:RabbitMq
```

E confira o arquivo:

```text
src/Api/appsettings.Development.json
```

### A aplicação não conecta ao RabbitMQ

Verifique:

- se o container está em execução;
- se a porta `5672` foi publicada;
- se a URI utiliza `localhost:5672`;
- se o RabbitMQ terminou de iniciar;
- se outro processo não ocupou a porta.

Consulte os logs:

```bash
docker logs delivery-app-rabbitmq
```

### O pedido retorna `202`, mas ainda não aparece

Esse comportamento pode ser esperado.

O pedido é criado de forma assíncrona.

Confira:

- a fila `pedidos-criados`;
- os logs do `CriarPedidoConsumer`;
- a disponibilidade do estabelecimento;
- a existência do cliente;
- a existência dos produtos;
- o estado do PostgreSQL.

### A alteração de status falha repetidamente

Confira:

- se o pedido já foi criado;
- se a versão esperada ainda é válida;
- se o usuário pertence ao pedido;
- se a transição é permitida;
- se a mensagem está chegando à fila correta.

Retry não corrige uma regra de domínio inválida.

### Uma mensagem cria dois pedidos

Confira a verificação de idempotência pelo `PedidoId`.

O consumer deve consultar o pedido antes de criar uma nova entidade.

Também confira se o identificador é gerado uma única vez antes da publicação.

---

## Cuidados importantes

### Não confirmar antes de concluir

O consumer deve terminar o processamento somente depois de salvar o resultado.

Se uma exceção ocorrer antes do final, a mensagem não deve ser considerada processada com sucesso.

### Não enviar entidades do banco

Mensagens devem possuir contratos estáveis e pequenos.

Enviar entidades do Entity Framework mistura transporte, persistência e domínio.

### Não confiar apenas no Controller

O Controller pode validar a entrada inicial.

O consumer deve validar novamente as regras que protegem a alteração do estado.

### Não recalcular o preço depois

O pedido deve guardar uma fotografia dos valores no momento da criação.

Alterações futuras no cardápio não devem modificar pedidos antigos.

### Não usar retry sem limite

Falhas permanentes precisam ser registradas e encaminhadas para tratamento.

Mais adiante, podemos estudar filas de erro, dead-letter queues e observabilidade de mensagens.

---

## Conclusão

Nesta aula, integramos o Delivery App ao RabbitMQ usando MassTransit.

O fluxo de criação passou a ser assíncrono:

- o Controller recebe a solicitação;
- o MediatR encaminha o Command;
- o handler publica `CriarPedidoMessage`;
- o RabbitMQ mantém a mensagem;
- o `CriarPedidoConsumer` valida e cria o pedido;
- o PostgreSQL armazena o resultado.

Também estruturamos a alteração de status:

- o usuário solicita uma ação;
- o domínio verifica a transição;
- o handler publica `AlterarStatusPedidoMessage`;
- o consumer verifica versão e autorização;
- o domínio altera o status;
- o histórico registra a transição.

O resultado é um módulo preparado para processamento assíncrono, com responsabilidades separadas entre API, aplicação, domínio, mensageria e persistência.

> Mensageria não elimina as regras de negócio. Ela muda o momento e o componente responsável por executá-las.

Referências:

- [Delivery App na branch `v6`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v6);
- [Delivery App na branch `v7`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/tree/v7);
- [Configuração do MassTransit na branch `v7`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v7/src/Aplicacao/DependencyInjection.cs);
- [Mensagens de pedidos na branch `v7`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v7/src/Aplicacao/Modulos/Pedidos/Mensageria/PedidosMessages.cs);
- [Consumer de pedidos na branch `v7`](https://github.com/academiadoprogramador-fullstack/delivery-app-2026/blob/v7/src/Aplicacao/Modulos/Pedidos/Mensageria/PedidosConsumers.cs);
- [MassTransit com RabbitMQ](https://masstransit.io/documentation/transports/rabbitmq);
- [Documentação do RabbitMQ](https://www.rabbitmq.com/docs);
- [Imagem oficial do RabbitMQ](https://hub.docker.com/_/rabbitmq).
