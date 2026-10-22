# Dossiê da Mulher Itaquaquecetubense

Portal de indicadores com consulta pública e área administrativa. Os gráficos são gerados pelo próprio site. A equipe cadastra os dados manualmente, confere uma prévia, salva rascunhos e publica quando as informações estiverem validadas.

## Abrir o projeto

Requer **Node.js 24 ou superior**. Baixe o ZIP, extraia todos os arquivos e execute `abrir-site.cmd` no Windows. O servidor usa a compilação em `dist/` ou a versão pronta em `docs/`, sem instalar dependências para consultar o site.

Em outros sistemas:

```sh
node scripts/serve.cjs
```

Abra http://localhost:4173/ para o portal e http://localhost:4173/admin.html para a administração.

## Configurar acesso

Execute `configurar-acesso.cmd` no Windows ou:

```sh
node scripts/create-admin.cjs
```

Informe o e-mail e uma senha de pelo menos 12 caracteres no terminal. A senha não aparece na tela. Não existe senha padrão nem cadastro público. Para redefinir a senha de uma conta, execute o comando com `--reset`; as sessões anteriores dessa conta serão encerradas. É possível criar contas separadas para os responsáveis.

## Cadastrar e publicar

1. Entre na área administrativa e selecione **Novo indicador**.
2. Preencha título, tema, unidade e tipo de gráfico (linhas ou barras).
3. Inclua os registros: período (`AAAA` ou `AAAA-MM`), região, série e valor. A mesma combinação de período, região e série não pode se repetir. Use a mesma unidade em todas as séries e não misture períodos anuais com mensais no mesmo indicador.
4. Informe a fonte; acrescente link e critérios de leitura quando disponíveis.
5. Confira a prévia e salve um rascunho ou publique.

Rascunhos são privados. Editar um indicador publicado não altera a versão pública até uma nova publicação. É possível retirar uma publicação e preservar o rascunho ou excluir o indicador. O histórico registra as alterações e seu responsável. Alterações concorrentes são detectadas para evitar sobrescrever a edição de outra pessoa.

A consulta pública permite selecionar tema, pesquisar indicadores, filtrar região e período, ativar séries, consultar valores no gráfico, ler a tabela e baixar CSV. A página verifica novas publicações a cada minuto e ao voltar à janela. Períodos sem registro são lacunas; não são convertidos em zero. Nenhum indicador ou dado fictício é publicado automaticamente.

## Desenvolver e verificar

```sh
pnpm install
pnpm serve
```

Em outro terminal:

```sh
pnpm dev
```

O Vite encaminha `/api` para o servidor em `127.0.0.1:4173`.

```sh
pnpm check
pnpm build
pnpm test
```

Os testes usam bancos temporários, PostgreSQL local com autenticação simulada e um provedor HTTP simulado. Verificam autenticação, proteção de escrita, rascunhos, publicação, persistência, validação, conflitos, retirada e exclusão. Não substituem a conferência no Supabase e na Vercel reais. Execute o build antes dos testes.

## Dados e hospedagem

A versão em nuvem utiliza Vercel para a interface e API, e Supabase para autenticação e dados. Consulte [DEPLOYMENT.md](DEPLOYMENT.md) para configurar o projeto, autorizar responsáveis e verificar a publicação. A configuração real do Supabase e as verificações no ambiente publicado ainda são necessárias.

A API pública entrega somente indicadores publicados. Rascunhos e alterações exigem conta editorial autorizada; as permissões também são verificadas no banco por RLS. Credenciais de demonstração e o banco local não são enviados à nuvem. Cookies de sessão em nuvem duram no máximo uma hora e exigem novo login ao expirar.

Sem SUPABASE_URL, o servidor local continua usando SQLite em `data/dossie.sqlite`, com sessões de oito horas. O comando de criação de conta descrito acima é exclusivo desse modo local. Não envie `data/`, arquivos SQLite, senhas ou `.env` ao GitHub. A função da Vercel nunca usa o SQLite como alternativa.

O comando `pnpm build:pages` atualiza a interface compilada em `docs/`. GitHub Pages sozinho não executa a API nem o login.

## Estrutura

```text
src/pages/AdminPage.tsx                    login e edição
src/components/indicators/                gráficos e consulta pública
src/lib/data.ts                           cliente da API e exportação CSV
scripts/serve.cjs                         servidor HTTP
scripts/api.cjs                           autenticação e publicação
scripts/database.cjs                      persistência e senhas
scripts/create-admin.cjs                  criação e recuperação de acesso
data/                                    dados privados; não versionar
docs/                                    interface compilada para distribuição
```

Cadastre apenas informações agregadas e validadas. Dados pessoais não devem ser inseridos nos campos livres. As fontes, unidades e critérios são responsabilidade da equipe que publica. O repositório não define licença de reutilização dos materiais.

