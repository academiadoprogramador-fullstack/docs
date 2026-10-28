---
draft: false
slug: /conteudo/configuracoes-mcps-opencode
tags:
  - trilha-ferramentas
  - material-aula-conceitual
  - material-tutorial
  - material-aula-pratica
---

# Configurações e MCPs no OpenCode

## Adaptando o OpenCode ao projeto

O OpenCode pode trabalhar com projetos diferentes e com servidores MCP diferentes.

Para isso, ele combina arquivos de configuração com opções de linha de comando.

Nesta aula, vamos entender onde essas configurações ficam e conectar dois servidores MCP:

- **Context7**, para consultar documentação de bibliotecas;
- **Playwright**, para automatizar um navegador.

## O que é um arquivo de configuração?

Um arquivo de configuração registra opções que a ferramenta deve usar.

No OpenCode, os arquivos de configuração podem estar no formato JSON ou JSONC.

O JSONC aceita comentários e vírgulas finais, o que facilita explicar as opções dentro do próprio arquivo.

Um arquivo mínimo pode incluir o schema oficial:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
}
```

O schema ajuda editores como o Visual Studio Code a validar os nomes das opções e sugerir valores.

## Configurações globais e por projeto

O local do arquivo determina onde as opções serão aplicadas.

### Configuração global

A configuração global vale para os projetos usados pela pessoa no computador.

Ela é útil para preferências e servidores MCP que queremos disponíveis em vários projetos.

O OpenCode também permite adicionar um servidor ao escopo global com `--global`.

### Configuração do projeto

Uma configuração de projeto vale quando o OpenCode é iniciado naquele projeto ou em uma pasta interna.

Os arquivos podem ser colocados na raiz do projeto:

```text
meu-projeto/
└── opencode.jsonc
```

Ou na pasta de configuração do OpenCode:

```text
meu-projeto/
└── .opencode/
    └── opencode.jsonc
```

Essa opção é útil quando a equipe quer compartilhar configurações específicas do projeto.

Não coloque chaves de API, senhas ou outros segredos em arquivos que possam ser adicionados ao Git.

### Configuração gerenciada pelo computador

Em ambientes administrados, uma configuração de sistema pode ser fornecida para todos os usuários.

No Windows, o diretório usado para essa configuração é `%ProgramData%\opencode`.

Essa configuração é opcional para o uso individual. Ela tem prioridade sobre as configurações global e do projeto.

### Como as opções são combinadas

O OpenCode lê configurações globais e arquivos encontrados a partir da pasta atual até os diretórios acima dela.

Em geral, uma configuração mais específica do projeto substitui valores conflitantes da configuração global.

Para entender de onde vieram as opções ativas, execute:

```powershell
opencode debug config
```

Para descobrir os diretórios usados pelo OpenCode, execute:

```powershell
opencode debug paths
```

## `opencode.jsonc` e `cli.json` têm funções diferentes

O OpenCode separa a configuração do projeto das preferências da interface de terminal.

Use `opencode.json` ou `opencode.jsonc` para configurações como:

- modelo padrão e agente principal;
- instruções adicionais;
- permissões;
- servidores MCP.

As preferências específicas do terminal ficam em um arquivo global `cli.json`.

Por exemplo, opções de aparência, atalhos de teclado e comportamento da sessão pertencem à configuração do CLI, não ao `opencode.jsonc` do projeto.

## O que é um servidor MCP?

Um servidor **Model Context Protocol (MCP)** oferece ferramentas ou informações adicionais a um agente.

O OpenCode pode se conectar a dois tipos comuns:

- **remoto:** o OpenCode se conecta a um serviço pela internet usando uma URL;
- **local:** o OpenCode inicia um programa no computador e se comunica com ele pelo processo.

O Context7 é remoto.

O Playwright MCP é local e será iniciado com `npx`.

As ferramentas de todos os servidores consomem contexto do modelo. Por isso, configure apenas os MCPs necessários para o projeto.

## Adicionando o Context7

O Context7 consulta documentação atualizada de bibliotecas e frameworks.

Isso ajuda o agente a conferir a documentação da tecnologia em vez de depender apenas de informações gerais.

### Configurando Context7 com uma chave em arquivo

O Context7 aceita uma chave de API, que pode aumentar os limites de uso.

Para não escrever a chave diretamente no `opencode.jsonc`, guarde-a em um arquivo separado na configuração pessoal do OpenCode.

Crie o arquivo `~/.config/opencode/.secrets/context7.key` e coloque nele somente a chave, sem aspas ou outros dados.

No Windows, o mesmo local fica dentro da pasta do usuário, por exemplo:

```text
C:\Users\SeuNome\.config\opencode\.secrets\context7.key
```

O OpenCode aceita referências `{file:...}` e resolve o prefixo `~/` para a pasta pessoal do usuário. Portanto, o mesmo caminho com til funciona nos dois sistemas.

Use esta configuração no `opencode.jsonc` global:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {file:~/.config/opencode/.secrets/context7.key}",
        },
      },
    },
  },
}
```

O OpenCode lê o conteúdo do arquivo e o insere no cabeçalho `Authorization` quando conecta ao Context7.

Como o OpenCode usa OAuth por padrão em servidores remotos, a configuração abaixo define `oauth: false` para indicar que este servidor será autenticado pelo cabeçalho com a chave.

> **Atenção:** `{file:...}` evita deixar a chave dentro do arquivo JSONC, mas não criptografa o arquivo. Mantenha-o na pasta pessoal, restrinja o acesso à sua conta e nunca o coloque no repositório do projeto.

## Adicionando o Playwright MCP

O Playwright MCP permite que o agente interaja com páginas web usando um navegador controlado pelo Playwright.

Ele pode navegar, consultar a estrutura acessível da página, preencher campos, clicar em elementos e ajudar a testar interfaces.

O Node.js e o npm instalados na aula anterior também fornecem o `npx`, que executa o pacote do servidor.

Adicione o servidor local ao projeto:

```powershell
opencode mcp add playwright -- cmd /c npx -y @playwright/mcp@latest --isolated
```

No Windows, `cmd /c` permite iniciar o executável de comando `npx` instalado pelo npm.

O parâmetro `--isolated` mantém os dados do navegador em memória, em vez de reutilizar um perfil persistente entre sessões.

O navegador necessário pode ser instalado com:

```powershell
npx @playwright/mcp@latest install-browser
```

O processo local do MCP é iniciado pelo OpenCode quando necessário.

## Uma configuração com os dois servidores

Também podemos registrar os servidores manualmente no `opencode.jsonc` do projeto.

O exemplo abaixo configura o Context7 usando o arquivo de chave e o Playwright MCP em modo isolado:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {file:~/.config/opencode/.secrets/context7.key}",
        },
      },
      "playwright": {
        "type": "local",
        "command": [
          "cmd",
          "/c",
          "npx",
          "-y",
          "@playwright/mcp@latest",
          "--isolated",
        ],
      },
    },
  },
}
```

Essa configuração não contém chaves de API.

Se preferir que os dois servidores fiquem disponíveis em todos os projetos, use a configuração global ou acrescente `--global` aos comandos `opencode mcp add`.

## Verificando a conexão

Confira o estado dos servidores:

```powershell
opencode mcp list
```

No OpenCode, execute `/mcps` para ver os servidores disponíveis e completar autenticações pendentes.

Depois de alterar manualmente um arquivo de configuração, execute:

```powershell
opencode reload
```

Se algum servidor não conectar, confirme a grafia da URL, a conexão com a internet e se o `npx` está disponível no terminal.

## Usando o Context7 em uma solicitação

Peça explicitamente ao agente para consultar a documentação relevante:

```text
Confira no Context7 a documentação atual do Angular sobre formulários reativos.
Depois compare a recomendação com o código deste projeto.
```

O Context7 disponibiliza ferramentas para localizar uma biblioteca e consultar seus documentos.

O agente ainda precisa selecionar a documentação adequada ao problema e interpretar corretamente a resposta.

## Usando o Playwright em uma solicitação

Com o servidor conectado, peça uma ação delimitada em uma página conhecida:

```text
Abra http://localhost:4200 e verifique se a página inicial carrega.
Não envie formulários nem faça alterações nos dados.
```

Também é possível solicitar uma verificação visual:

```text
Abra a página de login, confira os rótulos e a navegação por teclado.
Se encontrar problemas, descreva-os sem alterar o código.
```

O Playwright MCP controla um navegador real. Ele pode abrir páginas, clicar, preencher campos e interagir com o site.

## Permissões e segurança dos MCPs

Um servidor MCP amplia o que o agente consegue fazer.

Antes de conectá-lo, confira quem o mantém e quais ações ele oferece.

Considere que:

- Context7 envia consultas ao serviço remoto para buscar documentação;
- Playwright pode interagir com os sites que o agente abrir;
- resultados de ferramentas podem ser incluídos no contexto enviado ao modelo;
- modo isolado do navegador evita persistir o perfil, mas não transforma o MCP em uma barreira de segurança.

Não use o navegador automatizado em páginas com dados confidenciais ou sessões pessoais sem compreender os riscos.

Revise pedidos de permissão e limite os servidores às tarefas necessárias.

## Removendo ou desativando um servidor

Para desativar temporariamente um servidor, configure `disabled: true` na entrada correspondente:

```jsonc
{
  "mcp": {
    "servers": {
      "playwright": {
        "type": "local",
        "command": ["cmd", "/c", "npx", "-y", "@playwright/mcp@latest"],
        "disabled": true,
      },
    },
  },
}
```

Para removê-lo, apague sua entrada no arquivo de configuração onde foi registrado.

Desconectar um servidor em `/mcps` não remove sua configuração.

## Conclusão

As configurações globais ajudam a reutilizar preferências, enquanto as configurações do projeto registram opções específicas de uma aplicação.

Com MCP, o OpenCode pode consultar documentação pelo Context7 e interagir com páginas por meio do Playwright.

Escolha o escopo adequado, evite salvar segredos no projeto e confira as permissões e o estado da conexão.

## Referências

- [Configuração do OpenCode V2](https://opencode.ai/v2/docs/config/)
- [Servidores MCP no OpenCode V2](https://opencode.ai/v2/docs/mcp-servers/)
- [Context7: configuração de MCPs](https://context7.com/docs/resources/all-clients)
- [Servidor Playwright MCP](https://github.com/microsoft/playwright-mcp)
