---
slug: /tutoriais/dotnet-sdk
tags:
  - Tutoriais
  - SDK
---

O .NET SDK (Software Development Kit) é o conjunto de ferramentas que você instala na sua máquina para criar, compilar, testar e publicar aplicações .NET. Ele é diferente do .NET Runtime, que serve apenas para executar aplicações já compiladas.

O SDK é obrigatório na máquina de desenvolvimento e no ambiente de build (GitHub Actions, Azure Pipelines).

## Download e Instalação

![Página de Download do Dotnet SDK](./_assets/1_dotnet_sdk_dl.png)

Para baixar e instalar a última versão do .NET SDK, siga o link para a [página oficial de download da Microsoft](https://dotnet.microsoft.com/pt-br/download) e baixe o instalador (disponível para Windows/MacOS/Linux). Siga as instruções do instalador e após isso, o SDK já deve estar disponível para uso no sistema.

Para checar a instalação, em um emulador de terminal (Prompt de Comando, PowerShell, zsh, Bash) digite:

```sh
dotnet --version
```

Caso instalado corretamente, o SDK deverá devolver a versão atual instalada. Ex:

```sh
10.0.xx
```

A última versão do SDK também sempre estará disponível durante a instalação da IDE **Visual Studio**.
