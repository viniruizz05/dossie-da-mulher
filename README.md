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

Os testes usam um banco temporário e dados sintéticos, verificando autenticação, proteção de escrita, rascunhos, publicação, persistência, validação, conflitos, retirada e exclusão. Execute o build antes dos testes.

## Dados e hospedagem

O servidor Node usa SQLite em `data/dossie.sqlite`. Contas, hashes de senha, sessões e indicadores ficam nesse arquivo, fora dos diretórios públicos. `DATA_DIR` permite escolher outro diretório persistente. **Não envie `data/`, arquivos SQLite, senhas ou `.env` ao GitHub.**

Para publicação, será necessário um servidor Node 24+ com disco persistente e HTTPS. O GitHub armazena o código; **GitHub Pages sozinho não executa o login nem o banco de dados**. Não use o disco temporário de uma função serverless para esse SQLite. A hospedagem ainda precisa ser definida.

Variáveis de produção:

| Variável | Uso |
| --- | --- |
| `NODE_ENV=production` | Ativa cookies de sessão Secure e exige origem HTTPS. |
| `APP_ORIGIN=https://seu-dominio` | Origem pública exata, sem barra final, usada para proteger as gravações. |
| `HOST=0.0.0.0` | Escuta na interface da hospedagem, atrás de proxy HTTPS. Localmente, o padrão é `127.0.0.1`. |
| `PORT` | Porta do servidor, padrão 4173. |
| `DATA_DIR` | Caminho para o volume persistente do banco. |

Execute o build e inicie com `pnpm start`. O servidor entrega a interface e a API na mesma origem. Sessões duram oito horas; senhas usam scrypt com salt individual; gravações exigem sessão, origem autorizada e token CSRF. O login limita tentativas por endereço de conexão; atrás de um proxy, a proteção pode agrupar os visitantes no endereço do proxy. Configure limites adicionais na infraestrutura quando a hospedagem for definida.

Faça backup da pasta `data/` com o servidor parado, incluindo os arquivos auxiliares SQLite. Restaure no diretório configurado em `DATA_DIR`. Não compartilhe esse backup publicamente. A recuperação de acesso é feita pelo comando de redefinição no servidor; não há envio automático de e-mails.

O comando `pnpm build:pages` atualiza os arquivos compilados em `docs/` para distribuição. A aplicação completa deve ser executada pelo servidor Node, mesmo quando os arquivos dessa pasta estiverem disponíveis.

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
