---
draft: false
slug: /conteudo/authservice-sessao-cors
tags:
  - trilha-programacao-web
  - trilha-seguranca-web
  - tech-angular
  - tech-dotnet
  - conceito-autenticacao
  - conceito-jwt
  - conceito-cors
  - material-aula-pratica
---

# Lógica de Autenticação, AuthService e CORS

## Conectando os formulários à autenticação

Na aula anterior, criamos as telas de cadastro e login do Gerador de Certificados.

Agora vamos estudar a lógica por trás desses formulários.

O cadastro valida os dados e envia uma requisição para a API.

O login valida as credenciais e recebe um token JWT.

Depois, a aplicação precisa manter o estado da sessão e permitir que o navegador acesse a API em outra origem.

Vamos acompanhar esse fluxo na branch `v3` do [Gerador de Certificados](https://github.com/academiadoprogramador-fullstack/gerador-de-certificados-2026/tree/v3):

```text
formulário Angular
  -> AuthService
    -> API ASP.NET Core
      -> resposta de cadastro ou token JWT
        -> estado de sessão no client
```

## Validando os dados do cadastro

Na branch `v3`, o [componente `Cadastro`](https://github.com/academiadoprogramador-fullstack/gerador-de-certificados-2026/blob/v3/client/src/app/auth/cadastro/cadastro.ts) mantém os dados do formulário em um Signal:

```typescript
interface CadastroFormModel {
  readonly email: string;
  readonly senha: string;
}

protected readonly modeloCadastro = signal<CadastroFormModel>({
  email: '',
  senha: '',
});
```

Um **Signal** é um valor reativo do Angular. Quando seu valor muda, os componentes que dependem dele podem atualizar a tela.

O Angular Signal Forms cria o formulário a partir desse modelo e registra suas validações:

```typescript
protected readonly formularioCadastro = form(this.modeloCadastro, (modelo) => {
  required(modelo.email, { message: 'Informe seu email.' });
  email(modelo.email, { message: 'Informe um email válido.' });
  required(modelo.senha, { message: 'Informe sua senha.' });
  minLength(modelo.senha, 8, {
    message: 'A senha precisa ter pelo menos 8 caracteres.',
  });
  pattern(modelo.senha, /(?=.*\d)(?=.*[^a-zA-Z0-9]).+/, {
    message: 'Inclua pelo menos um número e um caractere especial.',
  });
});
```

O cadastro exige:

- um e-mail preenchido e válido;
- uma senha com pelo menos oito caracteres;
- pelo menos um número e um caractere especial.

O template conecta cada campo ao formulário com `[formField]`.

Ele mostra a mensagem somente quando o campo foi visitado e está inválido:

```html
<input type="email" [formField]="formularioCadastro.email" />

@if (formularioCadastro.email().touched() && formularioCadastro.email().invalid()) {
  <p>{{ formularioCadastro.email().errors()[0].message }}</p>
}
```

`touched()` indica que a pessoa já interagiu com o campo.

`invalid()` indica que pelo menos uma validação falhou.

As validações do client ajudam a orientar a pessoa, mas a API também precisa validar os dados recebidos.

## Enviando o cadastro

Quando o formulário é enviado, o componente impede o comportamento padrão do navegador e verifica as validações:

```typescript
protected enviarFormulario(event: SubmitEvent): void {
  event.preventDefault();

  const formulario = this.formularioCadastro();

  if (formulario.invalid()) {
    formulario.markAsTouched();
    return;
  }

  const modelo = this.modeloCadastro();

  const requisicao: CadastroRequest = {
    email: modelo.email,
    senha: modelo.senha,
  };

  this.authService.cadastrar(requisicao).subscribe((usuario) => {
    void this.router.navigateByUrl('/login', {
      state: { emailCadastrado: usuario.email },
    });
  });
}
```

Se o formulário for inválido, `markAsTouched()` permite exibir as mensagens dos campos.

Se for válido, o componente envia somente os dados necessários para o cadastro.

Após o sucesso, a aplicação navega para `/login` e envia o e-mail cadastrado como estado de navegação.

Na tela de login, esse estado pode ser usado para preencher o campo de e-mail.

Esse dado existe apenas para facilitar a navegação. Ele não representa uma sessão autenticada.

## Validando e enviando o login

O componente `Login` também usa um modelo reativo:

```typescript
interface LoginFormModel {
  readonly email: string;
  readonly senha: string;
}

protected readonly modeloLogin = signal<LoginFormModel>({
  email: '',
  senha: '',
});

protected readonly formularioLogin = form(this.modeloLogin, (modelo) => {
  required(modelo.email, { message: 'Informe seu email.' });
  email(modelo.email, { message: 'Informe um email válido.' });
  required(modelo.senha, { message: 'Informe sua senha.' });
  minLength(modelo.senha, 8, {
    message: 'A senha precisa ter pelo menos 8 caracteres.',
  });
});
```

Quando o login é válido, o componente cria um `LoginRequest` e chama `AuthService.login`.

Se a chamada for concluída, o usuário segue para a página inicial:

```typescript
this.authService.login(requisicao).subscribe(() => {
  void this.router.navigateByUrl('/');
});
```

Na implementação da branch `v3`, o formulário ainda não apresenta mensagens dinâmicas para falhas da API.

Uma evolução seria tratar o canal de erro da requisição e exibir mensagens adequadas, por exemplo para credenciais incorretas ou indisponibilidade do servidor.

## O que o AuthService centraliza?

O `AuthService` concentra as operações de autenticação usadas por diferentes componentes.

Ele conhece o endereço da API e usa o `HttpClient` para enviar as requisições:

```typescript
cadastrar(requisicao: CadastroRequest): Observable<UsuarioDto> {
  return this.http.post<UsuarioDto>(
    `${this.urlApi}/auth/cadastro`,
    requisicao,
  );
}

login(requisicao: LoginRequest): Observable<TokenDto> {
  return this.http
    .post<TokenDto>(`${this.urlApi}/auth/login`, requisicao)
    .pipe(tap((token) => this.salvarSessao(token, requisicao.email)));
}
```

O cadastro retorna os dados do usuário criado.

O login retorna um `TokenDto`, com dados como o identificador do usuário, o token de acesso e sua data de expiração.

O `tap` executa uma ação adicional quando a resposta chega, sem transformar o valor emitido pela requisição.

Nesse caso, ele pede ao serviço para montar e salvar a sessão.

## Como a branch v3 mantém a sessão

No [`AuthService` da branch `v3`](https://github.com/academiadoprogramador-fullstack/gerador-de-certificados-2026/blob/v3/client/src/app/auth/auth.service.ts), a sessão é mantida em um Signal:

```typescript
private readonly sessaoState = signal<SessaoAutenticada | null>(null);
readonly sessao = this.sessaoState.asReadonly();
```

Depois do login, o serviço combina o token e os dados do usuário:

```typescript
private salvarSessao(token: TokenDto, email: string): void {
  const usuario: UsuarioDto = {
    id: token.usuarioId,
    email,
  };

  const sessao: SessaoAutenticada = {
    token,
    usuario,
  };

  this.sessaoState.set(sessao);
}
```

O Signal permite que componentes como a página inicial e a Navbar reajam ao estado de autenticação.

O método `encerrarSessao()` limpa o Signal e navega para `/login`.

> Na branch `v3`, a sessão fica somente na memória.

Se a página for recarregada, o serviço é recriado e o Signal volta ao valor inicial `null`.

## Enviando o token em requisições protegidas

Depois do login, rotas protegidas da API esperam o token no cabeçalho:

```text
Authorization: Bearer <token>
```

Uma forma de centralizar esse cabeçalho no Angular é criar um interceptor HTTP.

Um **interceptor** observa as requisições feitas pelo `HttpClient` e pode alterá-las antes de enviá-las.

Na branch `v3`, o `AuthService` mantém a sessão em memória, mas a configuração do `HttpClient` ainda não registra um interceptor de autenticação.

Portanto, o armazenamento da sessão e o envio automático do Bearer token são etapas distintas.

## Por que o navegador bloqueia uma chamada à API?

O client e a API são servidos em origens diferentes:

- client local: `http://localhost:4200`;
- API local: `http://localhost:5146`.

Uma **origem** é definida pela combinação de protocolo, host e porta.

Por isso, essas URLs são origens diferentes, mesmo quando estão abertas na mesma máquina.

O navegador aplica a política de mesma origem para limitar requisições entre sites.

O **CORS** (*Cross-Origin Resource Sharing*) permite que a API declare quais origens podem acessá-la a partir de um navegador.

CORS não substitui autenticação nem autorização.

Ele controla o acesso do navegador à resposta. Outros clientes HTTP não dependem dessa política do navegador.

## Configurando CORS na API

No [`Program.cs` da branch `v3`](https://github.com/academiadoprogramador-fullstack/gerador-de-certificados-2026/blob/v3/server/src/Api/Program.cs), a API lê as origens permitidas da configuração e registra uma política chamada `Client`:

```csharp
const string corsPolicyCliente = "Client";

string[] origensPermitidas = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options => options.AddPolicy(
    corsPolicyCliente,
    policy =>
    {
        if (origensPermitidas.Length > 0)
            policy.WithOrigins(origensPermitidas);

        policy.AllowAnyHeader()
            .AllowAnyMethod();
    }));
```

`WithOrigins` define quais aplicações web podem fazer chamadas ao backend.

`AllowAnyHeader` permite cabeçalhos como `Content-Type` e `Authorization`.

`AllowAnyMethod` permite métodos HTTP como `GET` e `POST`.

Em [`appsettings.Development.json`](https://github.com/academiadoprogramador-fullstack/gerador-de-certificados-2026/blob/v3/server/src/Api/appsettings.Development.json), a configuração local da referência permite o client em `http://localhost:4200`:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:4200"
    ]
  }
}
```

Em produção, configure a origem pública do client. O README do projeto usa a variável de ambiente:

```text
Cors__AllowedOrigins__0=https://endereco-publico-do-client.exemplo
```

Para mais origens, configure outros índices, como `Cors__AllowedOrigins__1`.

Informe a origem completa, incluindo `http` ou `https` e a porta quando aplicável.

Não inclua um caminho como `/login` nem uma barra final.

## Aplicando a política na ordem correta

Depois de registrar a política, a API precisa aplicá-la no pipeline de middlewares:

```csharp
app.UseHttpsRedirection();

app.UseCors(corsPolicyCliente);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
```

O CORS deve ser aplicado antes da autenticação e autorização.

Isso permite que a API responda corretamente inclusive às verificações preliminares (*preflight*) do navegador.

Uma chamada `POST` com JSON ou o cabeçalho `Authorization` pode gerar uma requisição `OPTIONS` antes da chamada principal.

## Testando o fluxo

Com o client e a API em execução:

1. Abra `/cadastro` e envie um e-mail e uma senha que atendam às regras.
2. Confirme que a API respondeu ao cadastro.
3. Verifique se a aplicação navega para `/login` com o e-mail preenchido.
4. Faça login e observe a resposta que contém o token.
5. Observe as requisições na aba **Network** ou **Rede** e confira se o navegador bloqueou alguma chamada por CORS.

Se surgir um erro de CORS, confira se a origem configurada corresponde exatamente à origem do client.

Também verifique se a política é aplicada antes de autenticação e autorização.

## Conclusão

Os componentes de cadastro e login validam os dados, chamam o `AuthService` e respondem aos resultados das operações.

Na branch `v3`, o `AuthService` publica a sessão por meio de um Signal em memória. O client também precisa respeitar a expiração do token informado pela API.

O CORS completa o fluxo ao permitir que o navegador acesse a API a partir da origem configurada para o client.
