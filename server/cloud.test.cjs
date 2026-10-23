const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { handleCloudApi } = require('./cloud.cjs');
const listen = server => new Promise(resolve => server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`)));
const close = server => new Promise(resolve=>server.close(resolve));
test('API cloud: cookies, autenticação verificada, origem, CSRF e falha fechada',async()=>{
  let editorEnabled=true; let loginCount=0;
  const mock=http.createServer(async(req,res)=>{
    assert.equal(req.headers.apikey,'sb_publishable_test');
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const input=chunks.length?JSON.parse(Buffer.concat(chunks)):{};
    const token=req.headers.authorization?.replace('Bearer ','');
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    if(req.url.startsWith('/auth/v1/token')){loginCount++;return input.password==='correta'?send(200,{access_token:input.email==='viewer@example.invalid'?'viewer.token':'editor.token',refresh_token:'NAO_PODE_SAIR',expires_in:3600}):send(400,{error:'invalid_credentials'});}
    if(req.url==='/auth/v1/user')return ['editor.token','viewer.token'].includes(token)?send(200,{id:token,email:'user@example.invalid',email_confirmed_at:'2026-10-22'}):send(401,{});
    if(req.url==='/rest/v1/rpc/dossie_editor_access')return send(200,token==='editor.token'&&editorEnabled);
    if(req.url==='/rest/v1/rpc/dossie_list_public')return send(200,[]);
    if(req.url==='/rest/v1/rpc/dossie_list_admin')return token==='editor.token'&&editorEnabled?send(200,[]):send(403,{});
    if(req.url.startsWith('/auth/v1/logout'))return send(200,{});
    return send(404,{});
  });
  process.env.NODE_ENV='test';process.env.SUPABASE_URL=await listen(mock);process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';process.env.SESSION_SECRET=randomBytes(32).toString('base64url');
  const {default:adminHandler}=await import('../api/admin.js');
  const api=http.createServer((req,res)=>void (req.url.startsWith('/api/admin')?adminHandler(req,res):handleCloudApi(req,res,new URL(req.url,'http://localhost').pathname)));
  const base=await listen(api);process.env.APP_ORIGIN=base;
  let cookie='',csrf='';
  const request=async(path,method='GET',data,extra={})=>{const response=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...extra},body:data?JSON.stringify(data):undefined});return{response,data:await response.json()};};
  try{
    assert.equal((await request('session')).data.user,null);
    assert.deepEqual((await request('indicators')).data.indicators,[]);
    assert.equal((await request('admin/indicators')).response.status,401);
    assert.equal((await request('login','POST',{email:'e',password:'correta'},{Origin:'https://atacante.example'})).response.status,403);assert.equal(loginCount,0);
    assert.equal((await request('login','POST',{email:'e',password:'errada'})).response.status,401);
    assert.equal((await request('login','POST',{email:'viewer@example.invalid',password:'correta'})).response.status,403);
    const login=await request('login','POST',{email:'e',password:'correta'});assert.equal(login.response.status,200);
    const setCookie=login.response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);assert.match(setCookie,/Max-Age=3600/);
    assert.ok(!JSON.stringify(login.data).includes('editor.token'));assert.ok(!JSON.stringify(login.data).includes('NAO_PODE_SAIR'));
    cookie=setCookie.split(';')[0];csrf=login.data.csrf;
    assert.equal((await request('admin/indicators')).response.status,200);
    assert.equal((await request('admin?__dossie_path=indicators')).response.status,200);
    assert.equal((await request('admin?__dossie_path=../login','POST',{})).response.status,404);
    assert.equal((await request('logout','POST',{}, {'X-CSRF-Token':'f'.repeat(64)})).response.status,403);
    assert.equal((await request('logout','POST',{}, {'X-CSRF-Token':'á'.repeat(64)})).response.status,403);
    editorEnabled=false;assert.equal((await request('admin/indicators')).response.status,401);editorEnabled=true;
    assert.equal((await request('logout','POST',{})).response.status,200);
    assert.equal((await request('session','GET',undefined,{Cookie:'dossie_cloud_access=token-falso'})).data.user,null);
    process.env.APP_ORIGIN='https://site.example';
    const secure=await request('login','POST',{email:'e',password:'correta'},{Origin:'https://site.example'});assert.match(secure.response.headers.get('set-cookie'),/; Secure/);
    process.env.SUPABASE_PUBLISHABLE_KEY='sb_secret_proibida';
    assert.equal((await request('indicators')).response.status,503);
    delete process.env.SUPABASE_PUBLISHABLE_KEY;assert.equal((await request('indicators')).response.status,503);
  }finally{await close(api);await close(mock);}
});
