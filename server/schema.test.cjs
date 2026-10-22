const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  const editor = '11111111-1111-4111-8111-111111111111';
  const visitor = '22222222-2222-4222-8222-222222222222';
  const editorSession = '33333333-3333-4333-8333-333333333333';
  const visitorSession = '44444444-4444-4444-8444-444444444444';
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
    insert into auth.users values('${editor}','editor@example.invalid'),('${visitor}','visitor@example.invalid');
    insert into auth.sessions values('${editorSession}','${editor}'),('${visitorSession}','${visitor}');`);
  await db.exec(fs.readFileSync(require('node:path').join(__dirname,'../supabase/setup.sql'),'utf8'));
  await db.exec(`insert into dossie_private.editors(user_id) values('${editor}');`);
  const asRole = async (role, claims, run) => {
    await db.query('select set_config($1,$2,false)', ['request.jwt.claims',JSON.stringify(claims)]);
    await db.exec('set role '+role);
    try { return await run(); } finally { await db.exec('reset role'); }
  };
  const forbidden = async fn => { let denied=false;try{await fn()}catch{denied=true}assert.ok(denied,'Operação deveria ter sido recusada'); };
  const doc = {title:'Indicador de teste',unit:'registros',description:'Sintético',source:'Fonte teste',sourceUrl:'',methodology:'Teste',topic:'saude',chartType:'line',points:[{period:'2025',series:'Total',region:'Município',value:7}]};
  const call = (id,revision,action,data) => db.query('select public.dossie_mutate($1::uuid,$2::integer,$3::text,$4::jsonb) as result',[id,revision,action,data===null?null:JSON.stringify(data)]).then(r=>r.rows[0].result);
  const editorClaims={sub:editor,session_id:editorSession,email:'editor@example.invalid'};
  let record;
  await asRole('anon',{},async()=>{
    assert.deepEqual((await db.query('select public.dossie_list_public() as value')).rows[0].value,[]);
    await forbidden(()=>db.query('select * from public.dossie_drafts'));
    await forbidden(()=>db.query('select * from dossie_private.editors'));
    await forbidden(()=>call(null,null,'publish',doc));
  });console.log('PASS: anônimo não lê rascunhos nem altera dados.');
  await asRole('authenticated',{sub:visitor,session_id:visitorSession,email:'visitor@example.invalid',user_metadata:{admin:true}},async()=>{
    assert.equal((await db.query('select public.dossie_editor_access() as allowed')).rows[0].allowed,false);
    await forbidden(()=>call(null,null,'publish',doc));
    await forbidden(()=>db.query('insert into dossie_private.editors(user_id) values($1)',[visitor]));
    assert.equal((await db.query('select * from public.dossie_drafts')).rows.length,0);
  });console.log('PASS: conta comum e metadados forjados não dão acesso editorial.');
  await asRole('authenticated',editorClaims,async()=>{
    record=await call(null,null,'save',doc); assert.equal(record.status,'draft');
    assert.deepEqual((await db.query('select public.dossie_list_public() as value')).rows[0].value,[]);
    record=await call(record.id,record.revision,'publish',doc); assert.equal(record.status,'published');
    record=await call(record.id,record.revision,'save',{...doc,title:'Rascunho alterado'}); assert.equal(record.status,'changed');
    await forbidden(()=>call(record.id,1,'publish',doc));
    await forbidden(()=>call(null,null,'publish',{...doc,source:''}));
    await forbidden(()=>call(null,null,'publish',{...doc,points:[doc.points[0],doc.points[0]]}));
    await forbidden(()=>call(null,null,'save',{...doc,secret:'campo indevido'}));
    await forbidden(()=>db.query('delete from dossie_private.audit'));
  });console.log('PASS: publicação, rascunhos, conflito, validação e auditoria protegida.');
  await asRole('anon',{},async()=>{
    const rows=(await db.query('select public.dossie_list_public() as value')).rows[0].value;
    assert.equal(rows.length,1);assert.equal(rows[0].data.title,doc.title);assert.equal(rows[0].revision,undefined);
  });console.log('PASS: público lê somente a versão publicada.');
  await db.query('update dossie_private.editors set enabled=false where user_id=$1',[editor]);
  await asRole('authenticated',editorClaims,async()=>{await forbidden(()=>call(record.id,record.revision,'delete',null));});
  await db.query('update dossie_private.editors set enabled=true where user_id=$1',[editor]);
  await db.query('delete from auth.sessions where id=$1',[editorSession]);
  await asRole('authenticated',editorClaims,async()=>{assert.equal((await db.query('select public.dossie_editor_access() as allowed')).rows[0].allowed,false);await forbidden(()=>call(record.id,record.revision,'delete',null));});
  console.log('PASS: revogação editorial e encerramento da sessão bloqueiam tokens antigos.');
  await db.close();
})().catch(e=>{console.error(e);process.exitCode=1});
