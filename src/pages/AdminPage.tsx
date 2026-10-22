import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Brand } from '../components/layout/Brand';
import { Icon } from '../components/ui/Icon';
import { IndicatorChart } from '../components/indicators/IndicatorChart';
import { topics } from '../config/site';
import { api, ApiError, date } from '../lib/data';
import type { Indicator, Point } from '../lib/data';

type Session = { user: { email: string } | null; csrf: string | null };
type Editable = Omit<Indicator, 'points'> & { points: (Omit<Point, 'value'> & { value: string })[] };
type Audit = { action: string; email: string; created_at: string; indicator_id: string };
const blank = (): Editable => ({ title: '', topic: 'violencia', unit: 'registros', description: '', source: '', sourceUrl: '', methodology: '', chartType: 'line', points: [] });
const edit = (item: Indicator): Editable => ({ ...item, points: item.points.map(p => ({ ...p, value: String(p.value) })) });
const statusLabel = (status?: string) => status === 'published' ? 'Publicado' : status === 'changed' ? 'Alterações em rascunho' : 'Rascunho';
const actions: Record<string, string> = { create: 'Rascunho criado', edit: 'Rascunho atualizado', publish: 'Indicador publicado', unpublish: 'Publicação retirada', delete: 'Indicador excluído' };
function numeric(draft: Editable): Indicator {
  if (draft.points.some(p => !p.value.trim() || !Number.isFinite(Number(p.value)))) throw Error('Preencha todos os valores. Use 0 apenas quando o valor informado pela fonte for zero.');
  return { ...draft, points: draft.points.map(p => ({ ...p, value: Number(p.value) })) };
}

export function AdminPage() {
  const [session, setSession] = useState<Session>({ user: null, csrf: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [items, setItems] = useState<Indicator[]>([]);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [tab, setTab] = useState<'indicators' | 'history'>('indicators');
  const [events, setEvents] = useState<Audit[]>([]);
  const [search, setSearch] = useState(''); const [topic, setTopic] = useState('');
  const [preview, setPreview] = useState<Indicator | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  function handleError(e: unknown) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); if (e instanceof ApiError && e.status === 401) setSession({ user: null, csrf: null }); }
  const refresh = async () => { const result = await api<{ indicators: Indicator[] }>('admin/indicators'); setItems(result.indicators); };
  useEffect(() => { let active = true; api<Session>('session').then(value => { if (active) setSession(value); }).catch(e => { if (active) handleError(e); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (session.user) void refresh().catch(handleError); }, [session.user]);
  useEffect(() => { if (tab === 'history' && session.user) api<{ events: Audit[] }>('admin/audit').then(result => setEvents(result.events)).catch(handleError); }, [tab, session.user]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  useEffect(() => { if (error) document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center' }); }, [error]);
  function update<K extends keyof Editable>(key: K, value: Editable[K]) { setDraft(old => old ? { ...old, [key]: value } : old); setDirty(true); setPreview(null); setMessage(''); }
  function open(item: Indicator | null) { if (dirty && !window.confirm('Há alterações sem salvar. Deseja descartá-las?')) return; setDraft(item ? edit(item) : blank()); setDirty(false); setError(''); setMessage(''); setConfirmDelete(false); setPreview(null); setTab('indicators'); }
  function back() { if (dirty && !window.confirm('Há alterações sem salvar. Deseja descartá-las?')) return; setDraft(null); setDirty(false); setPreview(null); setConfirmDelete(false); }
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const value = await api<Session>('login', 'POST', { email, password }); setSession(value); setPassword(''); }
    catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function logout() {
    if (dirty && !window.confirm('Você tem alterações sem salvar. Deseja sair?')) return;
    setBusy(true); setError('');
    try { await api('logout', 'POST', {}, session.csrf!); setSession({ user: null, csrf: null }); setDraft(null); setDirty(false); setItems([]); setMessage(''); }
    catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const publish = (event.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement && ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === 'publish';
    setBusy(true);
    try {
      const data = numeric(draft!);
      const result = await api<{ indicator: Indicator }>(`admin/indicators${draft?.id ? '/' + draft.id : ''}`, draft?.id ? 'PUT' : 'POST', { ...data, publish }, session.csrf!);
      setDraft(edit(result.indicator)); setDirty(false); setPreview(null);
      setMessage(publish ? 'Indicador publicado. Os dados já estão disponíveis para consulta.' : 'Rascunho salvo. A versão pública permanece como estava.');
      await refresh();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function remove(unpublish = false) {
    if (!draft?.id) return; setBusy(true); setError('');
    try {
      const result = await api<{ indicator?: Indicator }>(`admin/indicators/${draft.id}`, unpublish ? 'PUT' : 'DELETE', { revision: draft.revision, unpublish }, session.csrf!);
      setDirty(false); setConfirmDelete(false); setPreview(null);
      setDraft(result.indicator ? edit(result.indicator) : null);
      setMessage(unpublish ? 'Indicador retirado da consulta pública. O rascunho foi preservado.' : 'Indicador excluído.');
      await refresh();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  const filtered = items.filter(item => (!topic || item.topic === topic) && item.title.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const publishedCount = items.filter(item => item.status !== 'draft').length;
  return <div className="admin-page">
    <a className="skip-link" href="#admin-content">Pular para o conteúdo</a>
    <header className="admin-header"><div className="container"><Brand /><a href="./indicadores.html" className="text-link">Ver o site <Icon name="arrow" size={17} /></a></div></header>
    {loading ? <main id="admin-content" className="container admin-loading" role="status">Verificando acesso…</main> : !session.user ? <main id="admin-content" className="admin-login-layout container">
      <div className="admin-welcome"><p className="eyebrow">ÁREA ADMINISTRATIVA</p><h1>Dados que informam.<br /><em>Gestão que transforma.</em></h1><p>Um espaço para organizar, revisar e publicar os indicadores das mulheres da nossa cidade.</p><div className="admin-welcome-steps"><span><Icon name="layers" />Cadastre os dados</span><span><Icon name="chart" />Confira a prévia</span><span><Icon name="check" />Publique no portal</span></div></div>
      <section className="admin-login-card" aria-labelledby="login-title"><span className="login-icon"><Icon name="shield" size={25} /></span><h2 id="login-title">Acesso da equipe</h2><p>Entre para cuidar dos indicadores do portal.</p><form onSubmit={login}><fieldset disabled={busy}><label>E-mail<input type="email" required autoComplete="username" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" /></label><label>Senha<div className="password-field"><input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" maxLength={200} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></label><button className="admin-primary" type="submit">{busy ? 'Entrando…' : 'Entrar na área administrativa'}<Icon name="arrow" size={18} /></button></fieldset></form>{error && <p className="form-message form-error" role="alert">{error}</p>}<p className="login-help">Acesso reservado à equipe responsável. Para criar ou recuperar uma conta, solicite ao responsável pelo servidor a configuração do acesso.</p></section>
    </main> : <main id="admin-content" className="container admin-workspace">
      <div className="admin-page-heading"><div><p className="eyebrow">ÁREA ADMINISTRATIVA</p><h1>Painel de gestão</h1><p>Organize os dados. Confira. Publique.</p></div><div className="admin-account"><span>{session.user.email}</span><button className="quiet-button" disabled={busy} onClick={logout}>Sair da conta</button></div></div>
      {error && <p className="form-message form-error" role="alert">{error}</p>}{message && <p className="form-message form-success" role="status"><Icon name="check" size={18} />{message}</p>}
      {!draft ? <>
        <div className="admin-stats"><div><span>Indicadores cadastrados</span><strong>{items.length}</strong></div><div><span>Com versão publicada</span><strong>{publishedCount}</strong></div><div><span>Rascunhos e alterações</span><strong>{items.filter(item => item.status !== 'published').length}</strong></div></div>
        <div className="admin-section-toolbar"><nav aria-label="Seções da gestão"><button aria-current={tab === 'indicators' ? 'page' : undefined} onClick={() => setTab('indicators')}>Indicadores</button><button aria-current={tab === 'history' ? 'page' : undefined} onClick={() => setTab('history')}>Histórico</button></nav><button className="admin-primary" onClick={() => open(null)}>+ Novo indicador</button></div>
        {tab === 'history' ? <section className="admin-list"><h2>Atividade recente</h2>{!events.length ? <p className="admin-empty">As publicações e alterações aparecerão aqui.</p> : <ul className="audit-list">{events.map((event, index) => <li key={index}><Icon name="clock" size={18} /><div><strong>{actions[event.action] || event.action}</strong><span>{event.email} · {date(event.created_at)} · {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><small>{items.find(item => item.id === event.indicator_id)?.title || 'Indicador removido'}</small></div></li>)}</ul>}</section> : <section className="admin-list" aria-label="Indicadores cadastrados"><div className="admin-list-filters"><label className="indicator-search"><span className="sr-only">Buscar indicador</span><input type="search" placeholder="Buscar indicador" value={search} onChange={e => setSearch(e.target.value)} /></label><label><span className="sr-only">Filtrar tema</span><select value={topic} onChange={e => setTopic(e.target.value)}><option value="">Todos os temas</option>{topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label></div>
          {!filtered.length ? <div className="admin-empty"><Icon name="chart" size={35} /><h2>{items.length ? 'Nenhum resultado' : 'Seu primeiro indicador começa aqui'}</h2><p>{items.length ? 'Tente outro nome ou tema.' : 'Cadastre os valores e a fonte. A publicação acontece só quando você decidir.'}</p>{!items.length && <button className="admin-primary" onClick={() => open(null)}>Criar indicador</button>}</div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th scope="col">Indicador</th><th scope="col">Situação</th><th scope="col">Atualizado em</th><th scope="col"><span className="sr-only">Ação</span></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.title}</strong><span>{topics.find(t => t.id === item.topic)?.title} · {item.points.length} registros</span></td><td><span className={`publication-status publication-status--${item.status}`}>{statusLabel(item.status)}</span></td><td>{date(item.updatedAt)}</td><td><button className="outline-button" onClick={() => open(item)}>Editar<span className="sr-only"> {item.title}</span></button></td></tr>)}</tbody></table></div>}
        </section>}
      </> : <>
        <button className="admin-back quiet-button" disabled={busy} onClick={back}>← Voltar aos indicadores</button>
        <form onSubmit={save} className="indicator-editor"><fieldset disabled={busy}>
          <div className="editor-title"><div><p className="data-overline">{draft.id ? 'EDITAR INDICADOR' : 'NOVO INDICADOR'}</p><h2>{draft.title || 'O que vamos apresentar?'}</h2></div><span className={`publication-status publication-status--${dirty ? 'changed' : draft.status || 'draft'}`}>{dirty ? 'Alterações sem salvar' : statusLabel(draft.status)}</span></div>
          <section className="editor-section"><div className="editor-section-heading"><span>01</span><div><h3>Sobre o indicador</h3><p>Um título claro ajuda a população a entender o dado.</p></div></div><div className="editor-grid">
            <label className="field-wide">Título<input required maxLength={120} value={draft.title} onChange={e => update('title', e.target.value)} placeholder="Ex.: Atendimentos da rede de proteção" /></label>
            <label>Tema<select value={draft.topic} onChange={e => update('topic', e.target.value)}>{topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
            <label>Unidade de medida<input required maxLength={40} value={draft.unit} onChange={e => update('unit', e.target.value)} placeholder="Ex.: atendimentos ou %" /></label>
            <label className="field-wide">Descrição breve<textarea maxLength={600} rows={2} value={draft.description} onChange={e => update('description', e.target.value)} placeholder="Explique em uma frase o que o indicador mostra." /></label>
            <label>Tipo de gráfico<select value={draft.chartType} onChange={e => update('chartType', e.target.value as 'line' | 'bar')}><option value="line">Linhas · acompanhar a evolução</option><option value="bar">Barras · comparar valores</option></select></label>
          </div></section>
          <section className="editor-section"><div className="editor-section-heading"><span>02</span><div><h3>Valores e períodos</h3><p>Use AAAA ou AAAA-MM. Cada série representa um grupo comparável, na mesma unidade.</p></div></div>
            <div className="editor-guidance"><Icon name="info" size={17} /><p>Inclua somente dados agregados. Não cadastre nomes, documentos ou informações que identifiquem pessoas. Ausência de registro é diferente de zero.</p></div>
            <div className="table-scroll"><table className="editable-table"><caption className="sr-only">Registros do indicador</caption><thead><tr><th scope="col">Período</th><th scope="col">Região</th><th scope="col">Série</th><th scope="col">Valor</th><th scope="col"><span className="sr-only">Remover</span></th></tr></thead><tbody>{draft.points.map((point, index) => <tr key={index}>{(['period', 'region', 'series', 'value'] as const).map(key => <td key={key}><input aria-label={`${({ period: 'Período', region: 'Região', series: 'Série', value: 'Valor' })[key]}, registro ${index + 1}`} required type={key === 'value' ? 'number' : 'text'} min={key === 'value' ? 0 : undefined} step={key === 'value' ? 'any' : undefined} maxLength={key === 'period' ? 7 : key === 'region' ? 80 : 60} value={point[key]} placeholder={key === 'period' ? '2026-01' : key === 'value' ? '0' : ''} onChange={e => update('points', draft.points.map((p, i) => i === index ? { ...p, [key]: e.target.value } : p))} /></td>)}<td><button type="button" className="remove-row" aria-label={`Remover registro ${index + 1}`} onClick={() => update('points', draft.points.filter((_, i) => i !== index))}><Icon name="close" size={17} /></button></td></tr>)}</tbody></table></div>
            {!draft.points.length && <p className="editor-no-rows">Nenhum valor cadastrado. Adicione o primeiro registro.</p>}
            <button className="outline-button" type="button" disabled={draft.points.length >= 500} onClick={() => { const previous = draft.points.at(-1); update('points', [...draft.points, { period: '', region: previous?.region || 'Itaquaquecetuba', series: previous?.series || 'Total', value: '' }]); }}>+ Adicionar registro</button>
            <p className="field-help">Até 500 registros e 6 séries por indicador. Não misture dados anuais e mensais no mesmo gráfico.</p>
          </section>
          <section className="editor-section"><div className="editor-section-heading"><span>03</span><div><h3>Fonte e contexto</h3><p>Informações que tornam a consulta confiável.</p></div></div><div className="editor-grid"><label className="field-wide">Fonte dos dados <span className="field-optional">· obrigatória para publicar</span><input maxLength={200} value={draft.source} onChange={e => update('source', e.target.value)} placeholder="Instituição e nome da base utilizada" /></label><label className="field-wide">Link da fonte <span className="field-optional">· opcional</span><input type="url" maxLength={500} value={draft.sourceUrl} onChange={e => update('sourceUrl', e.target.value)} placeholder="https://" /></label><label className="field-wide">Como interpretar <span className="field-optional">· opcional</span><textarea rows={3} maxLength={1200} value={draft.methodology} onChange={e => update('methodology', e.target.value)} placeholder="Explique a cobertura, critérios de cálculo e cuidados na comparação." /></label></div></section>
          <div className="editor-actions"><button type="button" className="outline-button" onClick={() => { setError(''); try { setPreview(numeric(draft)); } catch (e) { handleError(e); } }}>Conferir prévia</button><div><button className="outline-button" type="submit" value="draft">{busy ? 'Salvando…' : 'Salvar rascunho'}</button><button className="admin-primary" type="submit" value="publish">Publicar indicador <Icon name="arrow" size={17} /></button></div></div>
        </fieldset></form>
        {preview && <div className="editor-preview"><div className="preview-notice"><Icon name="info" size={17} />Prévia privada. Estes dados só ficam públicos após a publicação.</div><IndicatorChart indicator={preview} preview key={JSON.stringify(preview)} /></div>}
        {draft.id && <div className="admin-danger-zone"><p>Gerenciar publicação</p>{draft.publishedAt && <button className="quiet-button" disabled={busy || dirty} onClick={() => { if (window.confirm('Retirar este indicador da consulta pública? O rascunho será preservado.')) void remove(true); }}>Retirar do site</button>}{confirmDelete ? <div role="alert"><span>Excluir este indicador e sua publicação?</span><button disabled={busy} className="danger-button" onClick={() => remove()}>Sim, excluir</button><button className="quiet-button" onClick={() => setConfirmDelete(false)}>Cancelar</button></div> : <button className="quiet-button danger-text" disabled={busy || dirty} onClick={() => setConfirmDelete(true)}>Excluir indicador</button>}<small>Salve ou descarte alterações pendentes antes de retirar ou excluir.</small></div>}
      </>}
    </main>}
    <footer className="admin-footer container">Dossiê da Mulher · Secretaria da Mulher de Itaquaquecetuba</footer>
  </div>;
}
