# Dossiê da Mulher Itaquaquecetubense

Portal público de indicadores da **Secretaria da Mulher** da Prefeitura de Itaquaquecetuba. Reúne, em uma consulta única, dados sobre violência contra a mulher, medidas protetivas e rede de atendimento, apresentados por tema a partir de um relatório em Power BI.

> **Status:** versão de apresentação. O relatório oficial ainda depende da validação das fontes pelas equipes responsáveis. Enquanto isso, o portal exibe um estado de preparação e nenhum número demonstrativo é apresentado como dado oficial.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Começando](#começando)
- [Scripts](#scripts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Build e publicação](#build-e-publicação)
- [Pontos de atenção](#pontos-de-atenção)

## Funcionalidades

- **Duas páginas, hospedagem estática:** início (`index.html`) com seis cartões temáticos e consulta (`indicadores.html`) com o painel e as informações sobre os dados.
- **Consulta por tema:** cada cartão abre a consulta com o tema escolhido (`indicadores.html?tema=saude`). Um tema desconhecido exibe o panorama geral.
- **Painel Power BI incorporado:** aceita um relatório geral e, opcionalmente, um relatório por tema, com tela cheia e link para abrir em outra aba. Somente URLs `https` em domínios `powerbi.com` são aceitas; qualquer outro valor é rejeitado com aviso.
- **Transparência:** seção "Sobre os dados" com fontes, atualização, privacidade e cuidados de interpretação.
- **Acessibilidade:** link "Pular para o conteúdo", foco visível em todos os elementos interativos, menu que fecha com `Esc` e respeito a `prefers-reduced-motion`.
- **Sem backend:** não há autenticação, cadastro de indicadores, cookies próprios nem ferramentas de rastreamento.

## Tecnologias

| Camada | Escolha |
| --- | --- |
| Interface | React 19, renderizado no cliente |
| Linguagem | TypeScript 5.9 em modo `strict` |
| Build | Vite 8 (multipágina, `base: './'`) |
| Estilos | CSS puro, sem framework |
| Pacotes | pnpm 10 |
| Publicação | GitHub Pages, a partir de `docs/` |

## Começando

### Abrir a versão pronta

Baixe em **Code → Download ZIP** e extraia todos os arquivos. Com o Node.js instalado, execute `abrir-site.cmd` no Windows. Em outros sistemas, execute `node scripts/serve.cjs` e acesse http://localhost:4173/.

O servidor usa `dist/` quando disponível e, caso contrário, a versão pronta em `docs/`. Para visualizar o site, não é necessário instalar dependências nem compilar.

### Desenvolver

Requisitos: **Node.js 22.12 ou superior** e **pnpm** (o projeto usa `pnpm-lock.yaml`; com o Corepack, `corepack enable` já seleciona a versão correta).

```sh
git clone https://github.com/viniruizz05/dossie-da-mulher.git
cd dossie-da-mulher
pnpm install
pnpm dev
```

O servidor de desenvolvimento fica em http://localhost:5173/.

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento com recarga automática. |
| `pnpm check` | Verificação de tipos com `tsc --noEmit`. |
| `pnpm build` | Verifica os tipos e gera o site estático em `dist/`. |
| `pnpm build:pages` | Executa o build e substitui o conteúdo de `docs/` pelo de `dist/`. |
| `pnpm preview` | Serve `dist/` com o Vite em http://localhost:4173/. |
| `pnpm serve` | Serve `dist/` ou, na sua ausência, `docs/`, usando apenas o Node. |

No Windows, o arquivo `abrir-site.cmd` inicia esse servidor local e abre o navegador. Ele exige apenas o Node.js instalado e a pasta `docs/` incluída no download (ou um build em `dist/`).

## Estrutura do projeto

```
src/
  main.tsx            ponto de entrada; escolhe a página pelo atributo data-page do HTML
  App.tsx             estrutura comum (cabeçalho, rodapé) e seleção da página
  pages/              composição de cada página (HomePage, IndicatorsPage)
  components/
    layout/           Brand, Header, Footer
    home/             seções da página inicial
    indicators/       painel Power BI, navegação por tema e "Sobre os dados"
    ui/               componentes de uso geral (Icon)
  config/site.ts      conteúdo do site, temas e configuração do Power BI
  lib/                lógica sem interface (validação da URL do Power BI)
  hooks/              usePageMotion, useScrollToHash
  styles/             folhas de estilo
public/               arquivos estáticos copiados para o build
scripts/              servidor local, abertura do site e publicação em docs/
docs/                 build publicado no GitHub Pages (gerado; não editar à mão)
```

## Configuração

Todo o conteúdo editável fica em [`src/config/site.ts`](src/config/site.ts). Preencha apenas com informações validadas pela equipe responsável.

### Informações do site

| Campo (`siteConfig`) | Uso |
| --- | --- |
| `source` | Fonte dos dados exibida no painel. |
| `referencePeriod` | Período de referência dos dados. |
| `lastUpdated` | Data oficial de atualização dos dados, no formato `AAAA-MM-DD`. Não é a data de publicação do site. |

### Relatório Power BI

1. Em `powerBIConfig.embedUrl`, informe a URL HTTPS oficial de incorporação. O relatório substitui automaticamente o estado de preparação.
2. Opcionalmente, informe uma URL por tema em `powerBIConfig.reportsByTopic`, usando os identificadores abaixo. Sem URL específica, o tema exibe o relatório geral com essa indicação.

| Identificador | Tema |
| --- | --- |
| `violencia` | Violência e proteção |
| `saude` | Saúde e cuidado |
| `educacao` | Educação e trabalho |
| `territorio` | Território e população |
| `participacao` | Participação e igualdade |
| `politicas` | Políticas e atendimento |

A atualização dos dados é configurada no próprio Power BI, conforme a fonte de origem, e não acontece em tempo real. Quando o relatório geral é usado para um tema, os filtros internos do Power BI é que delimitam a consulta.

## Build e publicação

O site é estático e usa caminhos relativos, então funciona tanto na raiz de um servidor quanto em um subcaminho, como o do GitHub Pages.

1. Em **Settings → Pages**, selecione **Deploy from a branch → `main` → `/docs`**.
2. A cada atualização, execute `pnpm build:pages` e envie as alterações, incluindo a pasta `docs/`.

O comando compila o projeto e recria `docs/` a partir de `dist/`. O arquivo `.nojekyll`, que evita o processamento do Jekyll, vem de `public/`.

## Pontos de atenção

- **`docs/` é versionado:** como o GitHub Pages publica essa pasta, o build fica no repositório. Se `pnpm build:pages` não for executado antes do envio, o site publicado fica defasado em relação ao código.
- **Fontes tipográficas:** DM Sans e Newsreader são carregadas do Google Fonts, o que gera uma requisição externa a cada visita.
- **Relatório incorporado:** o conteúdo do Power BI é servido pela Microsoft e segue as políticas dela, inclusive de cookies.
- **Licença:** o repositório ainda não define uma licença. Consulte a Secretaria da Mulher antes de reutilizar o código ou os materiais.
