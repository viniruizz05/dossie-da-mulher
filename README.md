# Dossiê da Mulher Itaquaquecetubense

Portal público de indicadores para a Secretaria da Mulher de Itaquaquecetuba, desenvolvido com React, TypeScript, Vite e CSS.

## Páginas

- **Início** (`index.html`): apresentação e seis cartões temáticos.
- **Indicadores** (`indicadores.html`): consulta ao Power BI, seleção de tema e informações sobre os dados.

Os links são relativos e funcionam no servidor local e no caminho do GitHub Pages. Os cartões abrem a página de consulta com o tema selecionado. Essa seleção identifica o contexto; quando há apenas um relatório geral, seus filtros devem ser usados dentro do Power BI.

## Executar

Requer Node.js 22.12 ou superior.

```sh
npm install
npm run dev
```

## Verificar e compilar

```sh
npm run check
npm run build
```

A compilação gera o site estático em `dist/`. Para visualizar essa versão localmente, execute `node serve.cjs` e acesse http://localhost:4173/.

## Configurar o Power BI

Edite `src/config/site.ts` e preencha `powerBIConfig.embedUrl` com a URL HTTPS oficial de incorporação. No mesmo arquivo, configure as fontes e a data de atualização dos dados.

Para relatórios separados por tema, informe as URLs em `powerBIConfig.reportsByTopic`, usando os identificadores definidos em `topics`, por exemplo `saude` ou `violencia`. Se não houver URL específica, será exibido o relatório geral com essa indicação. Sem URL configurada, a página apresenta o estado de preparação.

Enquanto o relatório não estiver disponível, o portal exibe uma mensagem de preparação. A atualização dos dados deve ser configurada no Power BI, conforme a fonte utilizada. O site não implementa autenticação nem cadastro de indicadores.

## GitHub Pages

Os arquivos de publicação estão em `docs/`. Em Settings → Pages, selecione **Deploy from a branch → main → /docs → Save**.

Ao atualizar o código, execute `npm run build`, copie o conteúdo de `dist/` para `docs/`, mantenha `docs/.nojekyll` e envie as alterações.


