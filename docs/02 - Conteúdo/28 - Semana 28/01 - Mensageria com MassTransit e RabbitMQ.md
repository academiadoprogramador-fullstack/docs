---
draft: false
slug: /conteudo/mensageria-masstransit-rabbitmq
tags:
  - trilha-arquitetura-software
  - trilha-devops
  - tech-dotnet
  - tech-docker
  - tech-masstransit
  - tech-rabbitmq
  - conceito-mensageria
  - conceito-message-broker
  - conceito-produtor-consumidor
  - projeto-message-broker
  - material-aula-pratica
---

# Mensageria com MassTransit e RabbitMQ

## O problema de executar tudo na mesma requisição

Imagine uma API responsável por receber um novo pedido.

Depois de salvar o pedido, ela também precisa:

- enviar uma confirmação ao cliente;
- atualizar o estoque;
- avisar o estabelecimento;
- calcular uma previsão de entrega;
- registrar informações para o painel administrativo.

Uma solução simples seria executar todas essas tarefas dentro da mesma requisição HTTP:

```text
cliente
  -> API
    -> salva pedido
    -> atualiza estoque
    -> envia notificação
    -> calcula entrega
    -> retorna resposta
```

Esse fluxo pode gerar problemas:

- a resposta demora mais para chegar;
- uma tarefa lenta atrasa todas as outras;
- uma falha secundária pode impedir a resposta principal;
- a API precisa conhecer muitos serviços;
- é difícil repetir uma tarefa que falhou;
- picos de acesso podem sobrecarregar o servidor.

Para separar essas responsabilidades, podemos publicar uma mensagem e deixar outro processo tratá-la depois.

```text
cliente
  -> API salva o pedido
    -> publica PedidoCriado
      -> retorna resposta

RabbitMQ
  -> consumidor recebe PedidoCriado
    -> processa as tarefas necessárias
```

Esse modelo é chamado de **mensageria**.

---

## O que é mensageria?

Mensageria é uma forma de comunicação em que uma aplicação envia dados em uma mensagem para que outro componente processe essa informação.

A aplicação que envia não precisa chamar diretamente o método do componente que processará a mensagem.

Ela apenas publica um evento ou envia uma solicitação.

Uma mensagem pode conter:

- um identificador;
- dados do negócio;
- a data em que ocorreu um evento;
- valores necessários para o processamento;
- metadados de rastreamento.

No exemplo desta aula, a mensagem representa um pedido criado:

```text
PedidoCriado
```

O produtor publica essa mensagem.

O consumidor recebe e processa a mensagem.

> Uma mensagem representa uma informação que pode ser transportada entre partes da aplicação sem que o produtor precise conhecer a implementação do consumidor.

---

## O que é um Message Broker?

Um **Message Broker** é o componente responsável por receber, armazenar e encaminhar mensagens.

Ele fica entre o produtor e o consumidor:

```text
Produtor
   -> Message Broker
      -> Consumidor
```

O broker pode oferecer recursos como:

- filas;
- roteamento;
- armazenamento temporário;
- confirmação de processamento;
- reentrega após falhas;
- controle de concorrência;
- monitoramento.

O produtor e o consumidor não precisam estar executando exatamente no mesmo momento.

O broker mantém a mensagem até que um consumidor possa processá-la.

### RabbitMQ

O RabbitMQ é um Message Broker que utiliza o protocolo AMQP e oferece recursos para comunicação assíncrona entre aplicações.

Neste projeto, ele será responsável por:

- receber os eventos publicados pelo MassTransit;
- manter a fila `pedidos-criados`;
- entregar mensagens ao consumidor;
- informar quais mensagens ainda aguardam processamento;
- confirmar mensagens processadas.

O RabbitMQ possui uma interface web de gerenciamento.

Ela permite observar filas, mensagens e conexões sem precisar consultar o banco ou os logs da aplicação.

---

## Produtor, consumidor e fila

### Produtor

O produtor é o componente que cria e publica a mensagem.

Na branch `v1`, o produtor é o `GeradorDePedidosService`.

Ele cria pedidos aleatórios e publica um `PedidoCriado` a cada intervalo.

### Consumidor

O consumidor é o componente que recebe e processa a mensagem.

Na branch `v1`, o consumidor é o `PedidoCriadoConsumer`.

Ele registra o recebimento, simula um processamento demorado e registra a conclusão.

### Fila

A fila é o local onde as mensagens aguardam processamento.

Neste exemplo, a fila se chama:

```text
pedidos-criados
```

Quando o consumidor está ocupado, novas mensagens permanecem aguardando na fila.

```text
Pedido 1 -> processando
Pedido 2 -> aguardando
Pedido 3 -> aguardando
```

Essa espera permite desacoplar a velocidade do produtor da velocidade do consumidor.

---

## Eventos e comandos

Existem duas formas comuns de interpretar uma mensagem.

### Evento

Um evento descreve algo que já aconteceu:

- `PedidoCriado`;
- `ClienteCadastrado`;
- `PagamentoAprovado`;
- `EntregaIniciada`.

O nome geralmente usa o passado porque representa um fato.

O produtor publica o evento sem precisar saber exatamente quais componentes se interessarão por ele.

### Comando

Um comando solicita que algo seja feito:

- `ProcessarPagamento`;
- `EnviarNotificacao`;
- `SepararPedido`;
- `AtualizarEstoque`.

O comando normalmente possui um destinatário mais específico.

Nesta aula, trabalharemos com um evento:

```text
PedidoCriado
```

O objetivo é observar o ciclo básico de publicação e consumo antes de estudar roteamentos mais avançados.

---

## Por que utilizar o MassTransit?

O RabbitMQ fornece o broker e o protocolo de comunicação.

Ainda precisamos escrever código para:

- conectar ao RabbitMQ;
- declarar consumidores;
- configurar endpoints;
- serializar mensagens;
- publicar eventos;
- controlar confirmações;
- integrar o fluxo ao container de dependências.

O **MassTransit** é uma biblioteca .NET que simplifica essa integração.

Ele oferece abstrações para:

- publicar mensagens;
- consumir mensagens;
- configurar endpoints;
- registrar consumidores no Dependency Injection;
- controlar o ciclo de vida do bus;
- trabalhar com diferentes transportes.

Neste exemplo, o transporte utilizado será o RabbitMQ.

```text
Código .NET
  -> MassTransit
    -> RabbitMQ
      -> fila
```

O MassTransit não substitui o RabbitMQ.

Ele atua como uma camada de integração entre a aplicação e o broker.

> RabbitMQ é o broker. MassTransit é a biblioteca que facilita o uso do broker dentro da aplicação .NET.

---

## A versão inicial do exemplo

Na branch [`v0` do exemplo](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/tree/v0), o projeto possui apenas a base da aplicação:

```text
ExemploMessageBroker.slnx
└── src/Api
    └── ExemploMessageBroker.WebApi.csproj
```

O `Program.cs` ainda possui uma rota simples:

```csharp
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    Aplicacao = "Exemplo de Message Broker",
    Status = "Gerando pedidos aleatorios",
    Fila = "pedidos-criados",
    RabbitMqUi = "http://localhost:15672"
}));

app.Run();
```

Essa versão ajuda a confirmar que o projeto web foi criado.

Ela ainda não possui:

- o pacote do MassTransit;
- conexão com RabbitMQ;
- produtor;
- consumidor;
- contrato de mensagem.

Na branch `v1`, esses elementos são adicionados.

---

## Instalando o RabbitMQ com Docker

Para a aplicação funcionar, precisamos de um RabbitMQ acessível localmente.

O Docker permite executar o broker sem instalar o RabbitMQ diretamente no sistema operacional.

### Portas utilizadas

O RabbitMQ usará duas portas:

- `5672`: comunicação AMQP entre a aplicação e o broker;
- `15672`: interface web de gerenciamento.

O fluxo fica assim:

```text
Aplicação .NET
  -> localhost:5672
    -> RabbitMQ no container

Navegador
  -> http://localhost:15672
    -> RabbitMQ Management
```

### Criando o container

Confirme que o Docker está em execução:

```bash
docker --version
docker version
```

Crie um volume para manter os dados do broker:

```bash
docker volume create exemplo-message-broker-rabbitmq-data
```

Depois, crie o container usando a imagem com o plugin de gerenciamento:

```bash
docker run \
  --name exemplo-message-broker-rabbitmq \
  --hostname exemplo-message-broker-rabbitmq \
  --restart unless-stopped \
  --publish 5672:5672 \
  --publish 15672:15672 \
  --volume exemplo-message-broker-rabbitmq-data:/var/lib/rabbitmq \
  --detach \
  rabbitmq:4-management
```

O parâmetro `--publish` conecta uma porta do computador a uma porta do container.

O volume mantém os dados do RabbitMQ quando o container é reiniciado ou recriado.

O sufixo `-management` inclui a interface web de gerenciamento.

### Verificando o container

Liste os containers em execução:

```bash
docker ps
```

Confira os logs:

```bash
docker logs -f exemplo-message-broker-rabbitmq
```

O RabbitMQ pode levar alguns segundos para concluir a inicialização.

Quando estiver pronto, abra no navegador:

```text
http://localhost:15672
```

No ambiente local, utilize:

```text
Usuário: guest
Senha: guest
```

> **Atenção:** `guest` e `guest` são credenciais adequadas apenas para o ambiente local desta aula. Não utilize essas credenciais em um servidor acessível externamente.

### Comandos de ciclo de vida

Para interromper o container:

```bash
docker stop exemplo-message-broker-rabbitmq
```

Para iniciá-lo novamente:

```bash
docker start exemplo-message-broker-rabbitmq
```

Para removê-lo sem remover o volume:

```bash
docker rm -f exemplo-message-broker-rabbitmq
```

Para conferir o volume:

```bash
docker volume ls
```

Para remover também os dados persistidos:

```bash
docker volume rm exemplo-message-broker-rabbitmq-data
```

Use o último comando somente quando quiser recriar o broker vazio.

---

## Configurando a conexão da aplicação

Na branch `v1`, a aplicação lê a connection string chamada `RabbitMq`:

```json
{
  "ConnectionStrings": {
    "RabbitMq": "amqp://guest:guest@localhost:5672/"
  }
}
```

A URI possui esta estrutura:

```text
amqp://usuario:senha@host:porta/vhost
```

No exemplo:

| Parte | Valor | Significado |
|---|---|---|
| protocolo | `amqp` | protocolo de comunicação com o RabbitMQ |
| usuário | `guest` | usuário local padrão |
| senha | `guest` | senha local padrão |
| host | `localhost` | RabbitMQ publicado no computador |
| porta | `5672` | porta AMQP |
| vhost | `/` | virtual host padrão |

O `Program.cs` interrompe a inicialização se a configuração não existir:

```csharp
var rabbitMqConnectionString = builder.Configuration
    .GetConnectionString("RabbitMq")
    ?? throw new InvalidOperationException(
        "A ConnectionString \"RabbitMq\" não foi configurada"
    );
```

Em outro ambiente, podemos sobrescrever o valor com uma variável de ambiente:

```bash
export ConnectionStrings__RabbitMq="amqp://app:senha@rabbitmq:5672/"
```

No PowerShell:

```powershell
$env:ConnectionStrings__RabbitMq = "amqp://app:senha@rabbitmq:5672/"
```

Os dois sublinhados representam a separação entre seções da configuração do ASP.NET Core.

---

## Instalando o MassTransit

O projeto `v1` utiliza o pacote:

```xml
<PackageReference Include="MassTransit.RabbitMQ" Version="8.5.10" />
```

Para adicionar o pacote manualmente:

```bash
dotnet add src/Api/ExemploMessageBroker.WebApi.csproj \
  package MassTransit.RabbitMQ \
  --version 8.5.10
```

O pacote inclui a integração com o transporte RabbitMQ.

O README da referência fixa a versão `8.5.10` porque este exemplo didático foi preparado com a última versão 8.

Ao iniciar um projeto real, verifique a política de versão, licenciamento e compatibilidade adotada pela equipe.

Depois de adicionar o pacote, restaure e compile:

```bash
dotnet restore ExemploMessageBroker.slnx
dotnet build ExemploMessageBroker.slnx
```

---

## Criando o contrato da mensagem

O contrato descreve o formato da mensagem que circulará entre o produtor e o consumidor.

Na branch `v1`, o contrato está em:

```text
src/Api/Modulos/Pedidos/PedidoCriado.cs
```

Ele possui dois `record`s:

```csharp
namespace ExemploMessageBroker.WebApi.Modulos.Pedidos;

public sealed record ItemPedido(
    string Nome,
    int Quantidade,
    decimal PrecoUnitario
);

public sealed record PedidoCriado(
    Guid PedidoId,
    string Cliente,
    string Estabelecimento,
    IReadOnlyCollection<ItemPedido> Itens,
    decimal ValorTotal,
    DateTimeOffset CriadoEmUtc
);
```

O `PedidoCriado` representa o evento.

O `ItemPedido` representa os itens incluídos no pedido.

### Regras para contratos de mensagens

Um contrato de mensagem deve ser:

- claro para quem publica e para quem consome;
- estável o suficiente para permitir evolução;
- formado por dados serializáveis;
- independente de detalhes internos do produtor;
- pequeno o suficiente para ser transportado com eficiência.

Evite colocar no contrato:

- objetos de infraestrutura;
- conexões com banco;
- serviços da aplicação;
- referências a `HttpContext`;
- lógica de negócio executável.

Uma mensagem carrega dados.

O consumidor possui o comportamento para processar esses dados.

---

## Configurando o MassTransit no `Program.cs`

Depois de criar o contrato e o consumidor, registramos o MassTransit:

```csharp
using ExemploMessageBroker.WebApi.Modulos.Pedidos;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);

var rabbitMqConnectionString = builder.Configuration
    .GetConnectionString("RabbitMq")
    ?? throw new InvalidOperationException(
        "A ConnectionString \"RabbitMq\" não foi configurada"
    );

builder.Services.AddMassTransit(config =>
{
    config.AddConsumer<PedidoCriadoConsumer>();

    config.UsingRabbitMq((context, rabbitMq) =>
    {
        rabbitMq.Host(new Uri(rabbitMqConnectionString));

        rabbitMq.ReceiveEndpoint("pedidos-criados", endpoint =>
        {
            endpoint.PrefetchCount = 4;
            endpoint.ConcurrentMessageLimit = 2;

            endpoint.ConfigureConsumer<PedidoCriadoConsumer>(context);
        });
    });
});
```

Vamos dividir essa configuração.

### Registrando o consumidor

```csharp
config.AddConsumer<PedidoCriadoConsumer>();
```

Esse registro informa ao MassTransit que o tipo será usado para processar mensagens.

O container de dependências poderá fornecer o Logger e outras dependências do consumidor.

### Selecionando o RabbitMQ

```csharp
config.UsingRabbitMq((context, rabbitMq) =>
{
    rabbitMq.Host(new Uri(rabbitMqConnectionString));
});
```

O MassTransit utiliza RabbitMQ como transporte.

A URI contém as credenciais e o endereço do broker.

### Criando o endpoint de recebimento

```csharp
rabbitMq.ReceiveEndpoint(
    "pedidos-criados",
    endpoint =>
    {
        endpoint.ConfigureConsumer<PedidoCriadoConsumer>(context);
    }
);
```

O endpoint conecta o consumidor à fila `pedidos-criados`.

Se a fila ainda não existir, o MassTransit solicita ao RabbitMQ que a declare.

### Configurando a concorrência

O exemplo possui duas configurações importantes:

```csharp
endpoint.PrefetchCount = 4;
endpoint.ConcurrentMessageLimit = 2;
```

`PrefetchCount` indica quantas mensagens o consumidor pode buscar antecipadamente.

`ConcurrentMessageLimit` limita quantas mensagens podem ser processadas ao mesmo tempo naquele endpoint.

Neste caso, até duas mensagens podem estar em processamento, enquanto outras podem estar aguardando ou pré-carregadas.

Esses valores não são universais.

Eles precisam considerar:

- tempo de processamento;
- quantidade de consumidores;
- capacidade do banco;
- memória disponível;
- necessidade de ordenação.

---

## Aguardando o bus iniciar

O projeto também configura o comportamento de inicialização do MassTransit:

```csharp
builder.Services.Configure<MassTransitHostOptions>(options =>
{
    options.WaitUntilStarted = true;
    options.StartTimeout = TimeSpan.FromSeconds(30);
});
```

Com `WaitUntilStarted`, a aplicação aguarda o bus iniciar antes de considerar o serviço pronto.

O `StartTimeout` define o tempo máximo para essa inicialização.

Isso ajuda a evitar que o produtor comece a publicar antes que a conexão e os endpoints estejam disponíveis.

Se o RabbitMQ estiver desligado, a aplicação poderá falhar ou permanecer tentando conectar de acordo com a configuração do transporte.

O log da aplicação deve ser consultado para identificar o problema.

---

## Gerando e publicando mensagens

O produtor da referência é um `BackgroundService`:

```csharp
public sealed class GeradorDePedidosService(
    IBus bus,
    ILogger<GeradorDePedidosService> logger
) : BackgroundService
```

Um `BackgroundService` é um serviço hospedado pelo ASP.NET Core que executa trabalho em segundo plano.

O `IBus` é usado para publicar a mensagem.

O método `ExecuteAsync` possui um loop controlado pelo token de cancelamento:

```csharp
protected override async Task ExecuteAsync(
    CancellationToken stoppingToken
)
{
    try
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var pedido = CriarPedido();

            await bus.Publish(pedido, stoppingToken);

            logger.LogInformation(
                "Publicado pedido {PedidoId} para {Cliente}",
                pedido.PedidoId,
                pedido.Cliente
            );

            await Task.Delay(
                TimeSpan.FromSeconds(5),
                stoppingToken
            );
        }
    }
    catch (OperationCanceledException)
        when (stoppingToken.IsCancellationRequested)
    {
        logger.LogInformation("Gerador de Pedidos encerrado.");
    }
}
```

### Publicando com `IBus`

O ponto principal é:

```csharp
await bus.Publish(pedido, stoppingToken);
```

O MassTransit identifica o tipo da mensagem, serializa o objeto e publica o evento no RabbitMQ.

O produtor não chama `PedidoCriadoConsumer` diretamente.

Também não precisa conhecer a fila internamente.

Ele conhece apenas o contrato `PedidoCriado`.

### Criando o pedido

O método `CriarPedido` gera dados para a simulação:

```csharp
private static PedidoCriado CriarPedido()
{
    var itens = Enumerable
        .Range(0, RandomNumberGenerator.GetInt32(1, 4))
        .Select(_ => new ItemPedido(
            Produtos[RandomNumberGenerator.GetInt32(Produtos.Length)],
            RandomNumberGenerator.GetInt32(1, 4),
            RandomNumberGenerator.GetInt32(1200, 6501) / 100
        ))
        .ToArray();

    return new PedidoCriado(
        Guid.CreateVersion7(),
        Clientes[RandomNumberGenerator.GetInt32(Clientes.Length)],
        Estabelecimentos[
            RandomNumberGenerator.GetInt32(Estabelecimentos.Length)
        ],
        itens,
        itens.Sum(item => item.Quantidade * item.PrecoUnitario),
        DateTimeOffset.UtcNow
    );
}
```

O uso de dados aleatórios é apenas uma simulação.

Em uma aplicação real, o pedido viria de um caso de uso, de um Controller ou de outra integração.

### Registrando o serviço hospedado

O `Program.cs` registra o produtor:

```csharp
builder.Services
    .AddHostedService<GeradorDePedidosService>();
```

Depois que a aplicação inicia, o ASP.NET Core executa o `BackgroundService` automaticamente.

Quando a aplicação é encerrada, o `CancellationToken` sinaliza o término do loop.

---

## Criando o consumidor

O consumidor implementa `IConsumer<PedidoCriado>`:

```csharp
public sealed class PedidoCriadoConsumer(
    ILogger<PedidoCriadoConsumer> logger
) : IConsumer<PedidoCriado>
```

Essa declaração informa que a classe processa mensagens do tipo `PedidoCriado`.

O método obrigatório é `Consume`:

```csharp
public async Task Consume(
    ConsumeContext<PedidoCriado> context
)
{
    PedidoCriado pedido = context.Message;

    logger.LogInformation(
        "Recebido pedido {PedidoId} de {Cliente}. Processamento iniciado",
        pedido.PedidoId,
        pedido.Cliente
    );

    await Task.Delay(
        TimeSpan.FromSeconds(5),
        context.CancellationToken
    );

    logger.LogInformation(
        "Pedido {PedidoId} de {Cliente} processado",
        pedido.PedidoId,
        pedido.Cliente
    );
}
```

### Acessando a mensagem

O objeto recebido está em:

```csharp
context.Message
```

O tipo já é conhecido como `PedidoCriado` porque a classe implementa:

```csharp
IConsumer<PedidoCriado>
```

O consumidor não precisa converter manualmente um JSON.

O MassTransit cuida da desserialização antes de chamar `Consume`.

### Simulando um processamento demorado

O exemplo aguarda cinco segundos:

```csharp
await Task.Delay(
    TempoProcessamento,
    context.CancellationToken
);
```

Essa espera representa uma tarefa real, como:

- gravar em outro banco;
- atualizar um sistema externo;
- gerar um documento;
- enviar uma notificação;
- consultar um serviço de entrega.

O atraso também facilita observar a fila no RabbitMQ.

### Confirmação da mensagem

Quando `Consume` termina sem lançar uma exceção, o MassTransit confirma o processamento da mensagem.

Essa confirmação é chamada de **acknowledgement**, ou `ack`.

Durante o processamento, a mensagem pode aparecer como `Unacked` na interface do RabbitMQ.

Se o consumidor lançar uma exceção, o MassTransit poderá tratar a falha conforme suas políticas de retry e erro.

Nesta aula, o mais importante é entender a regra básica:

```text
Consume termina com sucesso
  -> mensagem confirmada

Consume termina com exceção
  -> mensagem não é confirmada como sucesso
```

Não devemos confirmar uma mensagem antes de concluir a tarefa que ela representa.

---

## O fluxo completo da mensagem

O fluxo do exemplo pode ser representado assim:

```mermaid
sequenceDiagram
    participant Gerador as GeradorDePedidosService
    participant MT as MassTransit
    participant Rabbit as RabbitMQ
    participant Fila as pedidos-criados
    participant Consumer as PedidoCriadoConsumer

    Gerador->>MT: Publish(PedidoCriado)
    MT->>Rabbit: publica evento
    Rabbit->>Fila: armazena mensagem
    Fila-->>Consumer: entrega mensagem
    Consumer->>Consumer: processa por alguns segundos
    Consumer-->>Rabbit: ack após sucesso
```

O produtor e o consumidor não precisam chamar um ao outro.

O RabbitMQ organiza a entrega.

O MassTransit converte as mensagens em objetos .NET.

---

## Exchange, fila e endpoint

Para entender a interface do RabbitMQ, precisamos diferenciar alguns conceitos.

### Exchange

O exchange recebe mensagens publicadas e decide para quais filas elas serão encaminhadas.

Quando utilizamos `Publish`, o MassTransit utiliza convenções para publicar o tipo da mensagem.

O produtor não precisa informar manualmente cada fila que deve receber o evento.

### Queue

A queue é a fila que armazena mensagens até que sejam processadas.

Neste exemplo:

```text
pedidos-criados
```

É possível observar a quantidade de mensagens prontas, em processamento e já tratadas.

### Receive endpoint

O `ReceiveEndpoint` configura a forma como a aplicação consumirá uma fila:

```csharp
rabbitMq.ReceiveEndpoint(
    "pedidos-criados",
    endpoint =>
    {
        endpoint.ConfigureConsumer<PedidoCriadoConsumer>(context);
    }
);
```

Ele conecta:

- o transporte RabbitMQ;
- a fila;
- o consumidor;
- as regras de concorrência.

No código da aplicação, o endpoint é o ponto de entrada das mensagens recebidas.

---

## Observando as mensagens na interface do RabbitMQ

Com o container e a aplicação em execução:

1. Abra `http://localhost:15672`.
2. Entre com `guest` e `guest`.
3. Abra **Queues and Streams**.
4. Selecione a fila `pedidos-criados`.
5. Observe os contadores da fila.

Os principais contadores são:

- **Ready**: mensagens aguardando consumo;
- **Unacked**: mensagens entregues ao consumidor, mas ainda não confirmadas;
- **Total**: quantidade total observada pela interface.

Como o produtor publica a cada cinco segundos e o consumidor processa por cinco segundos, os números podem variar conforme a concorrência.

Para inspecionar uma mensagem:

1. Abra a seção **Get messages**.
2. Informe `1` em **Messages**.
3. Escolha o modo `Nack message requeue true`.
4. Clique em **Get Message(s)**.

Esse modo devolve a mensagem para a fila depois da inspeção.

Isso evita removê-la definitivamente durante o estudo.

> **Atenção:** a interface de gerenciamento é útil para observar o ambiente, mas o processamento real deve acontecer pelo consumidor da aplicação.

---

## Executando o exemplo completo

Selecione a branch `v1` do repositório:

```bash
git clone https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026.git
cd exemplo-message-broker-2026
```

Na raiz da solução, restaure os pacotes:

```bash
dotnet restore ExemploMessageBroker.slnx
```

Compile:

```bash
dotnet build ExemploMessageBroker.slnx
```

Inicie o RabbitMQ com Docker:

```bash
docker start exemplo-message-broker-rabbitmq
```

Se o container ainda não existir, execute o comando de criação apresentado nesta aula.

Depois, execute a API:

```bash
dotnet run --project src/Api/ExemploMessageBroker.WebApi.csproj
```

Os logs devem mostrar eventos semelhantes a:

```text
Publicado pedido ...
Recebido pedido ... Processamento iniciado
Pedido ... processado
```

O endpoint HTTP raiz também informa o estado da aplicação:

```text
http://localhost:5028/
```

O fluxo principal, entretanto, acontece entre o produtor, o RabbitMQ e o consumidor.

---

## Publicar não é o mesmo que enviar para uma fila

O exemplo utiliza:

```csharp
await bus.Publish(pedido, stoppingToken);
```

Esse método publica um evento.

Outros consumidores interessados no mesmo tipo de evento podem receber uma cópia em suas próprias filas.

Em sistemas de mensageria, também existe o envio direto para um endpoint ou fila específica.

Essa distinção pode ser resumida assim:

| Operação | Intenção |
|---|---|
| `Publish` | informar que um evento aconteceu |
| `Send` | enviar uma mensagem para um destino específico |

Nesta primeira aula, utilizamos `Publish` para destacar o conceito de evento.

---

## O que acontece quando o consumidor é mais lento?

Considere estes tempos:

- o produtor gera uma mensagem a cada 5 segundos;
- o consumidor processa uma mensagem em 6 segundos.

Nesse cenário, o produtor pode criar mensagens mais rapidamente do que o consumidor consegue processar.

A fila acumula mensagens:

```text
tempo 0s: 1 mensagem em processamento
tempo 5s: 1 mensagem em processamento, 1 aguardando
tempo 10s: processamento continua, novas mensagens chegam
```

Esse acúmulo não significa necessariamente um erro.

Ele indica que a capacidade de produção está maior que a capacidade de consumo.

Podemos responder a isso com estratégias como:

- aumentar a quantidade de instâncias consumidoras;
- ajustar o limite de concorrência;
- otimizar o processamento;
- controlar a velocidade do produtor;
- separar tipos de trabalho em filas diferentes.

Não devemos aumentar a concorrência sem observar a capacidade dos serviços usados pelo consumidor.

Se cada mensagem acessa o banco, aumentar a concorrência pode apenas transferir o gargalo para o banco.

---

## Falhas e reprocessamento

Uma mensagem pode falhar por diversos motivos:

- serviço externo indisponível;
- erro temporário de rede;
- dado inválido;
- banco indisponível;
- regra de negócio não atendida.

O consumidor não deve esconder a falha:

```csharp
public async Task Consume(
    ConsumeContext<PedidoCriado> context
)
{
    // se uma operação crítica falhar,
    // a exceção deve ser tratada conforme a política definida
}
```

O MassTransit possui recursos de retry, redelivery e endpoints de erro.

Esses recursos serão aprofundados em aulas posteriores.

Nesta etapa, observe apenas a consequência da exceção:

- a mensagem não deve ser confirmada como processada;
- o broker pode permitir uma nova tentativa;
- a equipe precisa acompanhar mensagens que falharam;
- o consumidor deve ser idempotente quando puder receber a mesma mensagem novamente.

### Idempotência

Uma operação idempotente produz o mesmo resultado quando executada mais de uma vez para a mesma mensagem.

Por exemplo, ao marcar um pedido como processado, podemos verificar se ele já foi processado antes:

```text
se pedido já está processado
  -> não repetir a operação
senão
  -> processar e registrar o resultado
```

Mensagens podem ser reentregues.

Por isso, o consumidor não deve assumir que verá cada mensagem apenas uma vez.

---

## Cuidados com contratos de mensagens

Uma mensagem pode ser consumida por aplicações diferentes.

Alterar o contrato sem cuidado pode quebrar consumidores antigos.

Ao evoluir `PedidoCriado`:

- prefira adicionar campos opcionais;
- evite renomear propriedades sem um plano de migração;
- mantenha tipos compatíveis;
- documente mudanças importantes;
- evite colocar detalhes internos de uma classe na mensagem;
- defina claramente a finalidade do evento.

O contrato de mensagem é uma fronteira entre componentes.

Ele deve ser tratado como uma API.

---

## Exercício: acompanhar uma mensagem

Execute o exemplo da branch `v1`.

1. Inicie o container RabbitMQ.
2. Abra a interface em `http://localhost:15672`.
3. Compile a solução `ExemploMessageBroker.slnx`.
4. Inicie a API.
5. Observe os logs do `GeradorDePedidosService`.
6. Abra a fila `pedidos-criados`.
7. Observe as mensagens `Ready` e `Unacked`.
8. Compare o intervalo de publicação com o tempo de processamento.
9. Pare a API enquanto existirem mensagens na fila.
10. Observe que as mensagens permanecem no RabbitMQ.
11. Inicie a API novamente.
12. Observe o consumidor processando as mensagens pendentes.
13. Pare o container RabbitMQ e observe o erro de conexão da aplicação.
14. Inicie o container novamente e acompanhe a reconexão.

Responda:

- qual componente cria o `PedidoCriado`?
- qual componente mantém a fila?
- qual classe recebe a mensagem?
- quando a mensagem recebe `ack`?
- o que acontece enquanto o consumidor está processando?
- por que a API não chama diretamente o método do consumidor?

---

## Exercício: criar um segundo consumidor

Crie um consumidor adicional para o mesmo evento.

O novo consumidor pode simular uma notificação:

```csharp
public sealed class NotificarPedidoCriadoConsumer(
    ILogger<NotificarPedidoCriadoConsumer> logger
) : IConsumer<PedidoCriado>
{
    public Task Consume(
        ConsumeContext<PedidoCriado> context
    )
    {
        logger.LogInformation(
            "Notificação preparada para o pedido {PedidoId}",
            context.Message.PedidoId
        );

        return Task.CompletedTask;
    }
}
```

Registre o consumidor:

```csharp
config.AddConsumer<NotificarPedidoCriadoConsumer>();
```

Depois, configure um endpoint próprio:

```csharp
rabbitMq.ReceiveEndpoint(
    "notificacoes-pedidos",
    endpoint =>
    {
        endpoint.ConfigureConsumer<
            NotificarPedidoCriadoConsumer
        >(context);
    }
);
```

Execute a aplicação e observe:

- a fila `pedidos-criados` continua recebendo o consumidor original;
- a fila `notificacoes-pedidos` recebe o novo consumidor;
- o mesmo evento pode ser processado por responsabilidades diferentes;
- cada fila possui seu próprio estado.

Esse comportamento mostra uma vantagem de eventos: produtores não precisam conhecer todos os consumidores interessados.

---

## Problemas comuns

### A aplicação não conecta ao RabbitMQ

Confira:

- se o container está em execução com `docker ps`;
- se a porta `5672` foi publicada;
- se a URI utiliza `localhost:5672`;
- se usuário e senha correspondem ao RabbitMQ local;
- se o RabbitMQ terminou de inicializar;
- se outro processo já utiliza a porta `5672`.

Consulte os logs:

```bash
docker logs exemplo-message-broker-rabbitmq
```

### A interface web não abre

Confira se a porta `15672` foi publicada:

```bash
docker ps
```

O mapeamento esperado é:

```text
0.0.0.0:15672->15672/tcp
```

Abra exatamente:

```text
http://localhost:15672
```

### A fila não aparece

A fila pode ser declarada quando o endpoint do consumidor inicia.

Verifique:

- se a aplicação iniciou sem erro;
- se o consumidor foi registrado com `AddConsumer`;
- se o `ReceiveEndpoint` utiliza o nome esperado;
- se o MassTransit conseguiu conectar ao RabbitMQ.

### Não há mensagens na fila

O produtor pode estar publicando e o consumidor processando imediatamente.

Pare temporariamente a API ou aumente o tempo de processamento para observar mensagens aguardando.

Também confira os logs:

```text
Publicado pedido
Recebido pedido
Pedido processado
```

### O container foi removido e os dados sumiram

Confira se o container foi criado com o volume:

```bash
docker inspect exemplo-message-broker-rabbitmq
```

O volume precisa estar conectado a:

```text
/var/lib/rabbitmq
```

Se o volume também foi removido, o RabbitMQ foi recriado sem o estado anterior.

---

## Conclusão

Mensageria permite separar a publicação de um evento do processamento que acontecerá depois.

Neste exemplo:

- RabbitMQ atua como Message Broker;
- MassTransit integra a aplicação .NET ao RabbitMQ;
- `PedidoCriado` é o contrato do evento;
- `GeradorDePedidosService` é o produtor;
- `PedidoCriadoConsumer` é o consumidor;
- `pedidos-criados` é a fila;
- `IBus.Publish` publica a mensagem;
- `ConsumeContext` fornece a mensagem ao consumidor;
- o `ack` ocorre depois do processamento bem-sucedido.

A branch `v0` apresenta apenas o esqueleto da API.

A branch `v1` adiciona o fluxo completo de geração, publicação e consumo.

O próximo passo será conectar essa ideia aos eventos reais do Delivery App.

Referências:

- [Exemplo de Message Broker na branch `v0`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/tree/v0);
- [Exemplo de Message Broker na branch `v1`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/tree/v1);
- [`Program.cs`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/blob/v1/src/Api/Program.cs);
- [`PedidoCriado.cs`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/blob/v1/src/Api/Modulos/Pedidos/PedidoCriado.cs);
- [`GeradorDePedidosService.cs`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/blob/v1/src/Api/Modulos/Pedidos/GeradorDePedidosService.cs);
- [`PedidoCriadoConsumer.cs`](https://github.com/academiadoprogramador-fullstack/exemplo-message-broker-2026/blob/v1/src/Api/Modulos/Pedidos/PedidoCriadoConsumer.cs);
- [Documentação do MassTransit](https://masstransit.io/documentation/transports/rabbitmq);
- [Documentação do RabbitMQ](https://www.rabbitmq.com/docs);
- [Imagem oficial do RabbitMQ](https://hub.docker.com/_/rabbitmq).
