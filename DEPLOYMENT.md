# Publicar com Vercel e Supabase

Esta versão prepara a API e o banco para hospedagem em nuvem. As etapas abaixo permitem configurar ou reproduzir o ambiente na conta responsável pelo portal. O endereço público é https://dossie-da-mulher.vercel.app/.

## 1. Criar e configurar o Supabase

Crie um projeto na sua organização do Supabase e guarde a senha do banco em um gerenciador de senhas. Não envie senhas ou chaves administrativas ao repositório.

No SQL Editor do projeto novo, execute `supabase/setup.sql`. Ele cria tabelas, regras de acesso, funções de publicação e histórico. O arquivo foi testado com PostgreSQL local (PGlite), simulando as funções de autenticação; ainda é necessário conferir os resultados e os advisors de segurança no projeto real. Não execute este arquivo em um banco com dados existentes sem revisar e fazer backup.

Em Authentication, desative novos cadastros públicos e login anônimo. Crie ou convide a conta responsável, com e-mail confirmado e senha forte exclusiva. Não reutilize a conta de demonstração local. Configure o endereço do site como `https://dossie-da-mulher.vercel.app` e o serviço de e-mail antes de depender de convites ou recuperação de senha.

Depois de criar a conta, conceda permissão pelo SQL Editor, substituindo o e-mail:

```sql
insert into dossie_private.editors(user_id)
select id from auth.users
where lower(email) = lower('responsavel@exemplo.com')
on conflict (user_id) do update set enabled = true;

select u.email, e.enabled
from dossie_private.editors e
join auth.users u on u.id = e.user_id;
```

A consulta deve mostrar somente as pessoas autorizadas. Criar uma conta no Auth, sozinho, não concede acesso ao administrativo. Para retirar uma autorização, defina `enabled = false` nessa tabela. As próximas operações serão recusadas, inclusive com um token emitido anteriormente.

## 2. Configurar a Vercel

Em Project Settings > Environment Variables, adicione para Production:

| Nome | Valor |
| --- | --- |
| SUPABASE_URL | URL HTTPS do projeto, sem barra final |
| SUPABASE_PUBLISHABLE_KEY | Chave publicável iniciada por `sb_publishable_` |
| APP_ORIGIN | `https://dossie-da-mulher.vercel.app` |
| SESSION_SECRET | Segredo aleatório exclusivo com pelo menos 43 caracteres |

Gere o segredo no seu terminal com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` e copie diretamente para a Vercel. Não o publique nem envie por mensagens. Não use `VITE_` nesses nomes. A aplicação não precisa da chave `service_role` nem de chave secreta administrativa do Supabase.

Use Node.js 24, preset Vite, build `pnpm build` e saída `dist`. O arquivo `vercel.json` configura a função de API e os cabeçalhos. Publique esta versão do código e faça um novo deployment depois de salvar as variáveis. Um deployment anterior não recebe variáveis novas automaticamente.

Não coloque Preview em contato com o banco de produção. Para testar uma branch, use um projeto Supabase separado e ajuste APP_ORIGIN para a origem exata e estável desse ambiente. Não use curingas para liberar origens.

## 3. Conferir antes de usar com dados reais

- `/api/session` deve responder JSON com usuário nulo sem login, sem erro 404/503.
- `/api/indicators` deve responder uma lista vazia enquanto não houver publicação.
- Confirme que um visitante e uma conta sem autorização não conseguem consultar rascunhos nem gravar dados.
- Entre com a conta autorizada, salve um rascunho e confira que não aparece publicamente. Publique, consulte em outra sessão e depois retire a publicação de teste.
- Confira validação de dados, conflitos entre edições, histórico e encerramento da sessão.
- Rode os advisors de segurança do Supabase e revise políticas, permissões, funções e schemas expostos. Exponha apenas `public`; mantenha `dossie_private` fora dos schemas da Data API.
- Configure limites de tentativas de login na infraestrutura e os limites do Supabase Auth. No ambiente dossie-da-mulher da Vercel, a regra de login permite 10 requisições por IP em uma janela de 60 segundos e retorna 429 ao exceder. Essa regra pertence à infraestrutura: recrie-a no firewall ao configurar outro projeto, pois um clone do repositório não a transfere.
- Ative MFA nas contas dos provedores. O login editorial desta versão usa e-mail e senha; um segundo fator no aplicativo ainda não está implementado.
- Defina backup, restauração, responsáveis e monitoramento conforme os planos contratados. Não há garantia de disponibilidade contínua incluída neste código.

## Como a segurança funciona

A Vercel conversa com o Supabase pela API oficial. O navegador recebe um cookie de sessão HttpOnly, Secure e SameSite Strict; gravações também conferem origem e token CSRF. A API valida a conta junto ao Auth, e o banco verifica a autorização editorial e a existência da sessão. As tabelas usam RLS. Rascunhos ficam separados dos dados publicados, e triggers registram alterações no histórico.

A sessão em nuvem dura no máximo uma hora, sem renovação automática: depois é necessário entrar novamente. A recuperação de acesso deve ser feita pelo administrador do Supabase; o portal ainda não possui uma tela própria para isso. Nenhuma conta, senha ou indicador fictício é transferido do banco local.

## Desenvolvimento local

Sem SUPABASE_URL, `node scripts/serve.cjs` continua usando o SQLite local. Esse modo serve para desenvolvimento e não é a persistência da Vercel. O comando de criar administrador local não cria usuários no Supabase.

A função em `api/[...path].js` sempre usa o modo Supabase e recusa o acesso se a configuração estiver incompleta. Não existe retorno automático ao login local em produção.


