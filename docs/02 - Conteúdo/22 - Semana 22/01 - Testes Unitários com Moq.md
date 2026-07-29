---
draft: false
slug: /conteudo/testes-unitarios-moq
tags:
  - trilha-testes
  - tech-dotnet
  - tech-mstest
  - tech-moq
  - conceito-testes-unitarios
  - conceito-mocking
  - material-aula-pratica
---

# Testes Unitários com Moq

## O que vimos até agora

Nas aulas anteriores, aprendemos a:

- criar testes automatizados com MSTest;
- organizar os testes usando Arrange, Act e Assert;
- aplicar o ciclo Red-Green-Refactor;
- testar repositórios com Entity Framework InMemory.

Os testes das entidades de domínio eram simples porque essas entidades não dependiam de outros serviços.

Porém, as classes da camada de aplicação normalmente recebem dependências no construtor.

O `ServicoDisciplina`, por exemplo, precisa conversar com dois repositórios:

- `IRepositorioDisciplina`;
- `IRepositorioMateria`.

Nesta aula, vamos aprender a substituir essas dependências por objetos controlados pelo teste usando **Moq**.

> Moq permite criar objetos que imitam interfaces e classes para que o teste controle as respostas e observe as chamadas realizadas.

---

## O problema de testar um Service com repositórios reais

Considere o construtor do `ServicoDisciplina`:

```csharp
public class ServicoDisciplina(
    IRepositorioDisciplina repositorioDisciplina,
    IRepositorioMateria repositorioMateria
)
{
    // métodos do serviço...
}
```

Para testar o método `Cadastrar`, o serviço precisa consultar o repositório de disciplinas.

Para testar `Excluir`, ele precisa:

1. localizar a disciplina;
2. consultar as matérias existentes;
3. verificar se há matérias vinculadas;
4. excluir a disciplina quando a regra permitir.

Se usarmos o repositório real, o teste poderá precisar de:

- Entity Framework;
- `DbContext`;
- banco de dados em memória;
- provedor de usuário;
- configuração de infraestrutura.

Nesse caso, o teste deixa de verificar apenas o `ServicoDisciplina`.

Ele passa a verificar também o funcionamento de outras camadas.

Isso pode ser correto em um teste de integração.

Mas não é o objetivo de um teste unitário.

O teste unitário deve responder a uma pergunta menor:

> dadas determinadas respostas dos repositórios, o Service toma a decisão correta?

---

## O que é um mock?

Um mock é um objeto controlado pelo teste que representa uma dependência real.

Ele pode:

- retornar dados preparados pelo teste;
- informar que uma exceção deve ser lançada;
- guardar argumentos recebidos;
- registrar quantas vezes um método foi chamado;
- verificar se uma chamada aconteceu ou não aconteceu.

Por exemplo, em vez de usar uma implementação real de `IRepositorioDisciplina`, podemos criar:

```csharp
Mock<IRepositorioDisciplina> repositorioDisciplina = new();
```

O objeto `repositorioDisciplina` é o controlador do mock.

O objeto que implementa a interface e será passado para o Service fica em:

```csharp
repositorioDisciplina.Object
```

O mock não é o repositório diretamente.

Ele é uma ferramenta usada para criar e configurar um objeto que se comporta como o repositório.

---

## Adicionando o pacote Moq

O projeto de testes precisa referenciar o pacote `Moq`.

A partir da pasta raiz da solução, podemos executar:

```bash
dotnet add tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj package Moq
```

Também podemos conferir a referência no arquivo `.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="Moq" Version="4.20.72" />
  <PackageReference Include="MSTest" Version="4.0.2" />
</ItemGroup>
```

O arquivo de teste precisa importar o namespace:

```csharp
using Moq;
```

O projeto de referência utilizado nesta aula possui essa configuração em:

```text
tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj
```

---

## O primeiro mock

Vamos criar um mock de `IRepositorioDisciplina`:

```csharp
Mock<IRepositorioDisciplina> repositorioDisciplina = new();
```

O tipo entre os sinais `<` e `>` informa qual dependência será imitada.

Para utilizar o objeto como uma implementação da interface, usamos `.Object`:

```csharp
ServicoDisciplina servicoDisciplina = new(
    repositorioDisciplina.Object,
    repositorioMateria.Object
);
```

Neste exemplo, `repositorioMateria` também precisa ser um mock:

```csharp
Mock<IRepositorioMateria> repositorioMateria = new();
```

O teste agora consegue criar o Service sem iniciar a infraestrutura.

Ainda falta dizer como cada mock deve responder quando for utilizado.

---

## Configurando uma resposta com `Setup` e `Returns`

O método `Setup` configura uma chamada esperada.

O método `Returns` define o valor que o mock deve devolver.

Para informar que o repositório não possui disciplinas cadastradas:

```csharp
repositorioDisciplina
    .Setup(r => r.SelecionarTodos())
    .Returns([]);
```

Quando o Service chamar `SelecionarTodos`, o mock devolverá uma lista vazia.

Podemos configurar uma lista com dados:

```csharp
repositorioDisciplina
    .Setup(r => r.SelecionarTodos())
    .Returns([new Disciplina("Matemática")]);
```

Agora o Service se comportará como se o repositório tivesse retornado uma disciplina.

O mock não consulta um banco.

Ele apenas devolve os dados que o Arrange preparou.

> `Setup` define o que deve acontecer quando uma chamada ocorrer. `Returns` define o resultado dessa chamada.

---

## Configurando argumentos com `It.IsAny`

Alguns métodos recebem objetos criados dentro do Service.

No cadastro, o serviço cria uma nova `Disciplina`:

```csharp
Disciplina novaDisciplina = new(dto.Nome);
repositorioDisciplina.Cadastrar(novaDisciplina);
```

O teste não conhece a mesma instância antes da execução.

Por isso, podemos aceitar qualquer `Disciplina` usando `It.IsAny<Disciplina>()`:

```csharp
repositorioDisciplina
    .Setup(r => r.Cadastrar(It.IsAny<Disciplina>()));
```

Essa configuração informa que o método pode receber qualquer objeto do tipo `Disciplina`.

`It.IsAny<T>()` é útil quando o valor exato do argumento não é importante para aquela configuração.

Também podemos restringir o valor com `It.Is<T>()`:

```csharp
repositorioDisciplina
    .Setup(r => r.Cadastrar(
        It.Is<Disciplina>(d => d.Nome == "Matemática")
    ));
```

Nesse caso, a configuração só corresponde a uma disciplina cujo nome seja `"Matemática"`.

Use `It.IsAny` quando qualquer valor for válido para o cenário.

Use `It.Is` quando uma propriedade específica fizer parte do comportamento que está sendo testado.

---

## Guardando um argumento com `Callback`

O método `Cadastrar` não retorna a entidade criada.

Mesmo assim, podemos verificar o objeto recebido pelo repositório usando `Callback`:

```csharp
Disciplina? disciplinaCadastrada = null;

repositorioDisciplina
    .Setup(r => r.Cadastrar(It.IsAny<Disciplina>()))
    .Callback<Disciplina>(disciplina =>
    {
        disciplinaCadastrada = disciplina;
    });
```

Quando o mock receber a chamada, o `Callback` será executado.

O argumento recebido será guardado em `disciplinaCadastrada`.

Depois da ação, podemos verificar o valor:

```csharp
Assert.IsNotNull(disciplinaCadastrada);
Assert.AreEqual("Matemática", disciplinaCadastrada.Nome);
```

O `Callback` é útil para observar dados enviados a uma dependência.

Ele não deve ser usado para reimplementar no teste a lógica do Service.

O teste deve observar o comportamento, não duplicar a implementação.

---

## Primeiro teste completo: cadastrar uma disciplina

O método `Cadastrar` deve:

1. verificar se já existe uma disciplina com o mesmo nome;
2. criar uma nova disciplina;
3. validar a entidade;
4. enviá-la ao repositório;
5. retornar sucesso.

O teste para um cadastro válido pode ser escrito assim:

```csharp
using FluentResults;
using GeradorDeProvas.Aplicacao.Modulos.ModuloDisciplina;
using GeradorDeProvas.Dominio.Modulos.ModuloDisciplina;
using GeradorDeProvas.Dominio.Modulos.ModuloMateria;
using Moq;

namespace GeradorDeProvas.Testes.Unidade.Modulos.ModuloDisciplina;

[TestClass]
public sealed class ServicoDisciplinaTests
{
    [TestMethod]
    public void Cadastrar_DadosValidos_PersisteDisciplina()
    {
        // Arrange
        Mock<IRepositorioDisciplina> repositorioDisciplina = new();
        Mock<IRepositorioMateria> repositorioMateria = new();

        repositorioDisciplina
            .Setup(r => r.SelecionarTodos())
            .Returns([]);

        Disciplina? disciplinaCadastrada = null;

        repositorioDisciplina
            .Setup(r => r.Cadastrar(It.IsAny<Disciplina>()))
            .Callback<Disciplina>(disciplina =>
            {
                disciplinaCadastrada = disciplina;
            });

        ServicoDisciplina servicoDisciplina = new(
            repositorioDisciplina.Object,
            repositorioMateria.Object
        );

        // Act
        Result resultado = servicoDisciplina
            .Cadastrar(new CadastrarDisciplinaDto("Matemática"));

        // Assert
        Assert.IsTrue(resultado.IsSuccess);
        Assert.IsNotNull(disciplinaCadastrada);
        Assert.AreEqual("Matemática", disciplinaCadastrada.Nome);

        repositorioDisciplina.Verify(
            r => r.Cadastrar(It.IsAny<Disciplina>()),
            Times.Once
        );
    }
}
```

O teste possui duas verificações diferentes:

- o resultado do Service foi sucesso;
- o repositório recebeu uma disciplina uma vez.

Também verificamos o nome da disciplina capturada pelo `Callback`.

O banco de dados não participa desse cenário.

O teste verifica apenas a decisão do Service e a chamada feita à sua dependência.

---

## Verificando chamadas com `Verify`

As asserções verificam valores e estados.

O `Verify` verifica interações com um mock.

Para confirmar que `Cadastrar` foi chamado uma vez:

```csharp
repositorioDisciplina.Verify(
    r => r.Cadastrar(It.IsAny<Disciplina>()),
    Times.Once
);
```

Algumas opções comuns de `Times` são:

```csharp
Times.Once
Times.Never
Times.AtLeastOnce
Times.AtMostOnce
Times.Exactly(2)
```

Em um cenário de erro por nome duplicado, esperamos que o cadastro nunca aconteça:

```csharp
repositorioDisciplina.Verify(
    r => r.Cadastrar(It.IsAny<Disciplina>()),
    Times.Never
);
```

Essa verificação é importante.

Não basta confirmar que o Service retornou uma falha.

Também precisamos confirmar que ele não persistiu um dado que deveria ser rejeitado.

---

## Segundo teste: nome duplicado

O Service normaliza o nome antes de procurar duplicidades.

Assim, `" MATEMÁTICA "` deve ser considerado igual a `"Matemática"`.

O mock precisa devolver uma disciplina existente:

```csharp
[TestMethod]
public void Cadastrar_NomeDuplicado_RetornaFalha()
{
    // Arrange
    Mock<IRepositorioDisciplina> repositorioDisciplina = new();
    Mock<IRepositorioMateria> repositorioMateria = new();

    repositorioDisciplina
        .Setup(r => r.SelecionarTodos())
        .Returns([new Disciplina("Matemática")]);

    ServicoDisciplina servicoDisciplina = new(
        repositorioDisciplina.Object,
        repositorioMateria.Object
    );

    // Act
    Result resultado = servicoDisciplina
        .Cadastrar(new CadastrarDisciplinaDto(" MATEMÁTICA "));

    // Assert
    Assert.IsTrue(resultado.IsFailed);
    Assert.AreEqual("Nome", resultado.Errors.Single().Metadata["Campo"]);
    Assert.Contains("Já existe", resultado.Errors.Single().Message);

    repositorioDisciplina.Verify(
        r => r.Cadastrar(It.IsAny<Disciplina>()),
        Times.Never
    );
}
```

Observe que o teste não configura `Cadastrar`.

Como o nome é duplicado, o Service deve retornar antes de tentar chamar esse método.

O `Verify(..., Times.Never)` protege justamente essa regra.

---

## Verificando os argumentos com `It.Is`

Podemos fazer uma verificação mais específica:

```csharp
repositorioDisciplina.Verify(
    r => r.Cadastrar(
        It.Is<Disciplina>(d => d.Nome == "Matemática")
    ),
    Times.Once
);
```

Essa asserção verifica que:

- `Cadastrar` foi chamado;
- o argumento é uma `Disciplina`;
- o nome da disciplina é `"Matemática"`;
- a chamada aconteceu exatamente uma vez.

Podemos também verificar um identificador específico:

```csharp
repositorioDisciplina.Verify(
    r => r.Excluir(id),
    Times.Once
);
```

Quanto mais específica for a verificação, mais detalhes do contrato ela protege.

Por outro lado, não devemos conferir detalhes que não fazem parte do comportamento importante.

---

## Testando exclusão sem matérias vinculadas

O método `Excluir` primeiro localiza a disciplina e depois consulta as matérias.

Para testar uma exclusão válida, os dois mocks precisam ser configurados:

```csharp
[TestMethod]
public void Excluir_DisciplinaSemVinculos_ExcluiDisciplina()
{
    // Arrange
    Disciplina disciplina = new("Matemática");

    Mock<IRepositorioDisciplina> repositorioDisciplina = new();
    Mock<IRepositorioMateria> repositorioMateria = new();

    repositorioDisciplina
        .Setup(r => r.SelecionarPorId(disciplina.Id))
        .Returns(disciplina);

    repositorioMateria
        .Setup(r => r.SelecionarTodos())
        .Returns([]);

    ServicoDisciplina servicoDisciplina = new(
        repositorioDisciplina.Object,
        repositorioMateria.Object
    );

    // Act
    Result resultado = servicoDisciplina.Excluir(disciplina.Id);

    // Assert
    Assert.IsTrue(resultado.IsSuccess);

    repositorioDisciplina.Verify(
        r => r.Excluir(disciplina.Id),
        Times.Once
    );
}
```

O primeiro `Setup` informa que a disciplina existe.

O segundo informa que não há matérias vinculadas.

Com essas respostas, o Service deve chamar `Excluir` no repositório de disciplinas.

---

## Testando exclusão com matérias vinculadas

Agora vamos preparar o cenário em que a exclusão deve ser impedida.

```csharp
[TestMethod]
public void Excluir_DisciplinaComMateriasVinculadas_RetornaFalha()
{
    // Arrange
    Disciplina disciplina = new("Matemática");
    Materia materia = new("Álgebra", 7, disciplina);

    Mock<IRepositorioDisciplina> repositorioDisciplina = new();
    Mock<IRepositorioMateria> repositorioMateria = new();

    repositorioDisciplina
        .Setup(r => r.SelecionarPorId(disciplina.Id))
        .Returns(disciplina);

    repositorioMateria
        .Setup(r => r.SelecionarTodos())
        .Returns([materia]);

    ServicoDisciplina servicoDisciplina = new(
        repositorioDisciplina.Object,
        repositorioMateria.Object
    );

    // Act
    Result resultado = servicoDisciplina.Excluir(disciplina.Id);

    // Assert
    Assert.IsTrue(resultado.IsFailed);
    Assert.Contains(
        "matérias vinculadas",
        resultado.Errors.Single().Message
    );

    repositorioDisciplina.Verify(
        r => r.Excluir(disciplina.Id),
        Times.Never
    );
}
```

O objeto `Materia` utiliza a mesma disciplina que será excluída.

Assim, o cenário realmente representa uma matéria vinculada.

A asserção principal verifica a mensagem de erro.

O `Verify` confirma que a operação destrutiva não foi executada.

> Em testes de regras de negócio, verifique tanto o que deveria acontecer quanto o que deveria ser impedido.

---

## Quando usar `Returns` em métodos que retornam valores

Alguns métodos do repositório retornam `bool`.

O método `Editar` do Service utiliza o retorno de `repositorioDisciplina.Editar` para saber se a disciplina foi encontrada.

Para simular uma edição bem-sucedida:

```csharp
repositorioDisciplina
    .Setup(r => r.Editar(
        id,
        It.IsAny<Disciplina>()
    ))
    .Returns(true);
```

Para simular uma disciplina inexistente:

```csharp
repositorioDisciplina
    .Setup(r => r.Editar(
        id,
        It.IsAny<Disciplina>()
    ))
    .Returns(false);
```

O teste escolhe a resposta que representa o cenário.

Ele não precisa criar um registro no banco para simular cada possibilidade.

Essa é uma das principais vantagens do mock para testes unitários.

---

## `Setup` não é uma asserção

É importante diferenciar configuração e verificação.

`Setup` prepara o comportamento do mock:

```csharp
repositorioDisciplina
    .Setup(r => r.SelecionarTodos())
    .Returns([]);
```

Essa linha não confirma que o método foi chamado.

Ela apenas define o que acontecerá se ele for chamado.

`Verify` verifica a interação:

```csharp
repositorioDisciplina.Verify(
    r => r.SelecionarTodos(),
    Times.Once
);
```

Uma configuração pode existir mesmo que o Service nunca use aquela dependência.

Quando a chamada fizer parte do comportamento importante, use `Verify` explicitamente.

---

## O ciclo Arrange, Act e Assert com mocks

O uso de Moq não muda a estrutura básica do teste.

O Arrange passa a incluir a configuração das dependências:

```csharp
// Arrange
Mock<IRepositorioDisciplina> repositorioDisciplina = new();
Mock<IRepositorioMateria> repositorioMateria = new();

repositorioDisciplina
    .Setup(r => r.SelecionarTodos())
    .Returns([]);

ServicoDisciplina servicoDisciplina = new(
    repositorioDisciplina.Object,
    repositorioMateria.Object
);
```

O Act executa o comportamento do Service:

```csharp
// Act
Result resultado = servicoDisciplina
    .Cadastrar(new CadastrarDisciplinaDto("Matemática"));
```

O Assert verifica o resultado e as interações:

```csharp
// Assert
Assert.IsTrue(resultado.IsSuccess);

repositorioDisciplina.Verify(
    r => r.Cadastrar(It.IsAny<Disciplina>()),
    Times.Once
);
```

O mock é preparado no Arrange e observado no Assert.

---

## Testes unitários e testes de integração

Moq ajuda a isolar dependências.

Ele não verifica se o repositório real funciona.

Por exemplo, um teste com Moq pode confirmar que:

```csharp
repositorioDisciplina.Verify(
    r => r.Cadastrar(It.IsAny<Disciplina>()),
    Times.Once
);
```

Isso prova que o Service pediu o cadastro ao repositório.

Não prova que:

- o Entity Framework gerou o comando correto;
- a entidade foi persistida;
- os relacionamentos foram carregados;
- uma migration está correta;
- o banco aceitou os dados.

Essas perguntas pertencem aos testes de integração.

| Tipo | Dependências | Exemplo |
|---|---|---|
| Unitário com Moq | Mocks controlados pelo teste | `ServicoDisciplina` com repositórios simulados |
| Unitário de domínio | Nenhuma dependência externa | `Disciplina.Validar()` |
| Integração | Infraestrutura real ou em memória | `RepositorioDisciplinaEmOrm` com EF InMemory |

Os testes são complementares.

Não devemos substituir todos os testes de integração por mocks.

---

## O que testar em um Service

Um Service geralmente possui decisões condicionais.

Devemos criar cenários para caminhos importantes, como:

- dados válidos;
- dados duplicados;
- entidade não encontrada;
- relacionamento que impede uma operação;
- dependência retornando sucesso;
- dependência retornando falha;
- operação que não deve ser executada em caso de erro.

Para cada cenário, pergunte:

1. qual resposta das dependências prepara esse cenário?
2. qual comportamento do Service deve ser executado?
3. qual resultado deve ser retornado?
4. quais chamadas devem acontecer?
5. quais chamadas não devem acontecer?

Essas perguntas ajudam a evitar testes que verificam apenas o retorno final.

---

## O que não fazer com Moq

### Não simular a classe que está sendo testada

O mock deve representar uma dependência do Service.

Não devemos criar um mock de `ServicoDisciplina` para testar o próprio `ServicoDisciplina`.

Nesse caso, estaríamos testando o comportamento configurado no mock, e não a implementação real.

### Não verificar cada detalhe sem importância

Um teste não precisa verificar todas as chamadas internas se elas não fazem parte do comportamento relevante.

Verifique as interações que representam uma regra importante.

### Não configurar respostas que o cenário não utiliza

Configurações desnecessárias deixam o teste mais difícil de ler.

Prepare apenas as dependências que participam daquele caminho.

### Não usar mocks para esconder um problema de design

Se uma classe precisa de muitas dependências, o teste pode ficar difícil de montar.

Isso pode indicar responsabilidades demais na classe.

O mock ajuda a perceber esse problema, mas não deve ser usado para escondê-lo com uma configuração enorme.

### Não testar a implementação privada

O teste deve observar o comportamento público do Service.

No exemplo, testamos `Cadastrar` e `Excluir`.

Não testamos diretamente `ExisteDisciplinaComMesmoNome` ou `PossuiMateriasVinculadas` porque são métodos privados.

---

## Organização do arquivo de testes

Os testes de Service podem acompanhar a organização dos módulos da aplicação:

```text
tests/GeradorDeProvas.Testes.Unidade/
  Modulos/
    ModuloDisciplina/
      DisciplinaTests.cs
      ServicoDisciplinaTests.cs
    ModuloMateria/
      MateriaTests.cs
      ServicoMateriaTests.cs
    ModuloQuestao/
      QuestaoTests.cs
      ServicoQuestaoTests.cs
```

`DisciplinaTests` testa a entidade de domínio.

`ServicoDisciplinaTests` testa as regras da camada de aplicação.

Essa separação facilita descobrir qual unidade falhou.

Também ajuda a evitar que um teste de Service precise conhecer detalhes do banco.

---

## Exercício: testar `ServicoMateria`

Crie ou complete `ServicoMateriaTests.cs` usando Moq.

Crie testes para os seguintes cenários:

- cadastrar uma matéria válida;
- rejeitar uma matéria com nome duplicado;
- rejeitar uma matéria sem disciplina;
- editar uma matéria existente;
- retornar falha quando a matéria a editar não for encontrada;
- excluir uma matéria existente;
- retornar falha quando a matéria não for encontrada.

Para cada teste:

1. crie os mocks dos repositórios necessários;
2. configure as respostas com `Setup` e `Returns`;
3. crie o `ServicoMateria` usando `.Object`;
4. execute o método no Act;
5. verifique o resultado com `Assert`;
6. use `Verify` para confirmar as chamadas importantes;
7. use `Times.Never` nas operações que devem ser impedidas;
8. execute `dotnet test`.

Antes de escrever cada teste, leia o código de `ServicoMateria`.

O mock deve representar as respostas que o Service realmente consulta.

Não configure chamadas inventadas apenas para seguir o formato do exemplo.

---

## Executando os testes

Para executar todos os testes da solução:

```bash
dotnet test
```

Para executar apenas os testes unitários:

```bash
dotnet test tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj
```

Para filtrar a classe de Service:

```bash
dotnet test \
  tests/GeradorDeProvas.Testes.Unidade/GeradorDeProvas.Testes.Unidade.csproj \
  --filter "FullyQualifiedName~ServicoDisciplinaTests"
```

Quando um teste falhar, observe:

- o valor retornado pelo Service;
- os argumentos usados na chamada;
- a quantidade de chamadas registrada pelo mock;
- se um `Setup` corresponde exatamente aos argumentos utilizados;
- se a chamada deveria acontecer naquele cenário.

Um erro comum é configurar uma chamada diferente daquela realizada pelo código.

Por exemplo, este setup:

```csharp
repositorioDisciplina
    .Setup(r => r.SelecionarPorId(id))
    .Returns(disciplina);
```

não corresponde a uma chamada com outro `id`.

Quando os argumentos variam, podemos usar um matcher:

```csharp
repositorioDisciplina
    .Setup(r => r.SelecionarPorId(It.IsAny<Guid>()))
    .Returns(disciplina);
```

Use o matcher com cuidado.

Se o identificador fizer parte da regra, é melhor manter a configuração específica.

---

## Conclusão

Moq permite testar classes que dependem de interfaces sem utilizar as implementações reais dessas interfaces.

Com ele, aprendemos a:

- criar mocks com `Mock<T>`;
- obter a dependência simulada com `.Object`;
- configurar respostas com `Setup` e `Returns`;
- aceitar argumentos com `It.IsAny`;
- verificar argumentos com `It.Is`;
- capturar valores com `Callback`;
- verificar chamadas com `Verify` e `Times`.

Usamos essas ferramentas para testar o `ServicoDisciplina`.

Os mocks simularam os repositórios e permitiram testar decisões da camada de aplicação de forma rápida e isolada.

Também vimos que um mock não substitui um teste de integração.

O teste com Moq verifica a comunicação esperada entre o Service e suas dependências.

O teste de integração verifica se as implementações reais funcionam juntas.

Uma suíte completa usa os dois tipos para proteger comportamentos diferentes.

Referências utilizadas nos exemplos:

- [Projeto Gerador de Provas no GitHub](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026);
- [Código de `ServicoDisciplinaTests.cs`](https://github.com/academiadoprogramador-fullstack/gerador-de-provas-2026/blob/main/tests/GeradorDeProvas.Testes.Unidade/Modulos/ModuloDisciplina/ServicoDisciplinaTests.cs);
- [Documentação do Moq](https://github.com/devlooped/moq);
- [Testes Automatizados com MSTest](/conteudo/testes-automatizados-mstest);
- [Testes de Integração com Entity Framework InMemory](/conteudo/testes-integracao-entity-framework-inmemory).
