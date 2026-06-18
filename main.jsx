import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://qmdpyoqbjhtgfcborwgd.supabase.co'
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZHB5b3Fiamh0Z2ZjYm9yd2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTM0MjQsImV4cCI6MjA5Njg2OTQyNH0.nNzm_SNesIyxi3hzIR64CEw3ztHBrUzisyGjVaRJufc'
const supa = createClient(SUPA_URL, SUPA_ANON)
const FN = n => `${SUPA_URL}/functions/v1/${n}`

const G = {
  verde:'#14502F', verde2:'#1E6E43', verdeClaro:'#E3EFE7',
  fundo:'#EDF0EA', painel:'#FFFFFF', tinta:'#20231D',
  cinza:'#6B7066', traco:'#D7DBD2', ambar:'#B45309', ambarClaro:'#FCF3E3',
  vermelho:'#B3372B', vermelhoClaro:'#FAE9E7', papel:'#FFFEF9',
}

// ── Design tokens mobile-first ──────────────────────────────────────────────
const S = {
  // layout
  safe: { paddingBottom: 'env(safe-area-inset-bottom, 16px)' },
  // typography
  display: { fontFamily:"'Bricolage Grotesque',sans-serif" },
  mono: { fontFamily:"'IBM Plex Mono',monospace" },
  // componentes
  card: { background:G.painel, borderRadius:14, padding:'16px', marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,.06)' },
  h2: { fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:17, marginBottom:2, color:G.tinta },
  dica: { color:G.cinza, fontSize:13, marginBottom:12, lineHeight:1.4 },
  // inputs — fonte 16px evita zoom automático no iOS
  input: { width:'100%', border:`1.5px solid ${G.traco}`, borderRadius:10, padding:'13px 14px', fontFamily:'inherit', fontSize:16, background:G.papel, color:G.tinta, outline:'none', WebkitAppearance:'none' },
  select: { width:'100%', appearance:'none', WebkitAppearance:'none', border:`1.5px solid ${G.traco}`, borderRadius:10, padding:'13px 14px', fontFamily:'inherit', fontSize:16, background:G.papel, color:G.tinta, outline:'none' },
  label: { display:'block', fontSize:12, color:G.cinza, fontWeight:700, marginBottom:5, marginTop:12, letterSpacing:'.03em' },
  // botões — mín 48px de altura (padrão touch)
  btn: (bg=G.verde, fg='#fff') => ({ display:'block', width:'100%', background:bg, color:fg, border:'none', borderRadius:12, padding:'15px 0', fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', marginTop:10, minHeight:48, WebkitTapHighlightColor:'transparent' }),
  btnSm: (bg=G.verdeClaro, fg=G.verde) => ({ background:bg, color:fg, border:'none', borderRadius:8, padding:'9px 14px', fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', minHeight:36, WebkitTapHighlightColor:'transparent' }),
  // feedbacks
  erro: { background:G.vermelhoClaro, color:G.vermelho, borderRadius:10, padding:'12px 14px', fontSize:14, marginTop:10, lineHeight:1.4 },
  ok: { background:G.verdeClaro, color:G.verde, borderRadius:10, padding:'12px 14px', fontSize:14, marginTop:10, lineHeight:1.4 },
  alerta: { background:G.ambarClaro, borderLeft:`4px solid ${G.ambar}`, borderRadius:'0 10px 10px 0', padding:'11px 13px', marginTop:10, fontSize:14, lineHeight:1.4 },
  // tabela
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:G.cinza, textAlign:'left', padding:'6px 4px', borderBottom:`1px solid ${G.traco}` },
  td: { padding:'9px 4px', borderBottom:`1px solid #EDEFEA`, verticalAlign:'middle' },
  badge: cor => ({ background:cor+'22', color:cor, borderRadius:4, padding:'2px 7px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }),
  msgZap: { background:G.verdeClaro, borderRadius:10, padding:14, marginTop:14, whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.5 },
  zona: { border:`2px dashed ${G.traco}`, borderRadius:12, padding:'24px 14px', textAlign:'center', background:G.papel, cursor:'pointer', display:'block' },
  painelMargem: baixa => ({ background:baixa?G.ambar:G.verde, color:'#fff', borderRadius:12, padding:16, marginTop:14, textAlign:'center' }),
}

const brl = v => Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const pf = v => parseFloat(String(v).replace(',','.'))||0
const esc = s => String(s??'')

function converter(qtd,de,para){
  de=(de||'').toLowerCase(); para=(para||'').toLowerCase()
  if(de===para) return qtd
  const m={g:.001,kg:1}, v={ml:.001,l:1}
  if(de in m && para in m) return qtd*(m[de]/m[para])
  if(de in v && para in v) return qtd*(v[de]/v[para])
  return null
}

// ── Seletor de cliente (modal mobile-friendly) ───────────────────────────────
function SeletorCliente({ clientes, clienteId, onChange }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const cliente = clientes.find(c => c.id === clienteId)
  const filtrados = clientes.filter(c =>
    c.nome_negocio.toLowerCase().includes(busca.toLowerCase()) ||
    c.nome_dono.toLowerCase().includes(busca.toLowerCase()))

  return (
    <>
      <button onClick={() => setAberto(true)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,.15)', border:'none', borderRadius:10,
        padding:'10px 14px', color:'#fff', cursor:'pointer', width:'100%',
        fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:14,
        minHeight:44, WebkitTapHighlightColor:'transparent'
      }}>
        <span>{cliente ? `${cliente.nome_negocio}` : 'Selecionar cliente'}</span>
        <span style={{fontSize:18, opacity:.8}}>⌄</span>
      </button>

      {aberto && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', flexDirection:'column' }}>
          <div onClick={() => setAberto(false)} style={{ flex:1, background:'rgba(0,0,0,.5)' }} />
          <div style={{ background:G.painel, borderRadius:'20px 20px 0 0', padding:'0 0 env(safe-area-inset-bottom,16px)', maxHeight:'75vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 16px 8px', borderBottom:`1px solid ${G.traco}` }}>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:16, marginBottom:10 }}>Selecionar cliente</div>
              <input
                autoFocus
                style={{ ...S.input, marginTop:0 }}
                placeholder="Buscar por nome..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {filtrados.map(c => (
                <button key={c.id} onClick={() => { onChange(c.id); setAberto(false); setBusca('') }}
                  style={{ display:'block', width:'100%', textAlign:'left', background: c.id===clienteId ? G.verdeClaro : 'none',
                    border:'none', borderBottom:`1px solid ${G.traco}`, padding:'14px 16px', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                  <div style={{ fontWeight:700, fontSize:15, color:G.tinta }}>{c.nome_negocio}</div>
                  <div style={{ fontSize:13, color:G.cinza, marginTop:2 }}>{c.nome_dono} · <span style={S.badge(c.status==='ativo'?G.verde2:G.cinza)}>{c.status}</span></div>
                </button>
              ))}
              {filtrados.length === 0 && <div style={{ padding:20, color:G.cinza, textAlign:'center', fontSize:14 }}>Nenhum cliente encontrado</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ clientes, clienteId, setClienteId, consultor, onLogout }) {
  return (
    <div style={{ background:G.verde, padding:'12px 14px 10px', paddingTop:'max(12px, env(safe-area-inset-top))' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ ...S.display, fontWeight:800, fontSize:18, color:'#fff', letterSpacing:'-.02em' }}>
          Gestor de Bolso
          <small style={{ ...S.mono, fontSize:9, opacity:.7, letterSpacing:'.14em', display:'block', marginTop:1 }}>PAINEL DO CONSULTOR</small>
        </div>
        <button onClick={onLogout} style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'none', borderRadius:8, padding:'7px 12px', fontSize:13, fontWeight:700, cursor:'pointer', minHeight:36 }}>Sair</button>
      </div>
      <SeletorCliente clientes={clientes} clienteId={clienteId} onChange={setClienteId} />
    </div>
  )
}

// ── NavBar inferior ───────────────────────────────────────────────────────────
const ABAS_CONSULTOR = [
  { id:'visita', icon:'📋', label:'Visita' },
  { id:'despesas', icon:'💸', label:'Despesas' },
  { id:'nota', icon:'🧾', label:'Nota' },
  { id:'caixa', icon:'💬', label:'Caixa' },
  { id:'produto', icon:'➕', label:'Produto' },
  { id:'cliente_view', icon:'📊', label:'Cliente' },
  { id:'mais', icon:'☰', label:'Mais' },
]
const ABAS_DONO = [
  ...ABAS_CONSULTOR.slice(0,4),
  { id:'cockpit', icon:'🏦', label:'Cockpit' },
  { id:'mais', icon:'☰', label:'Mais' },
]

function NavBar({ aba, setAba, ehDono }) {
  const abas = ehDono ? ABAS_DONO : ABAS_CONSULTOR
  return (
    <div style={{
      display:'flex', background:G.painel, borderTop:`1px solid ${G.traco}`,
      paddingBottom:'env(safe-area-inset-bottom, 8px)', position:'sticky', bottom:0, zIndex:9
    }}>
      {abas.map(a => (
        <button key={a.id} onClick={() => setAba(a.id)} style={{
          flex:1, background:'none', border:'none', borderTop: aba===a.id ? `2px solid ${G.verde2}` : '2px solid transparent',
          padding:'8px 4px 6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          color: aba===a.id ? G.verde2 : G.cinza, WebkitTapHighlightColor:'transparent', minHeight:52
        }}>
          <span style={{ fontSize:20 }}>{a.icon}</span>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.02em' }}>{a.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Menu "Mais" (sheet) ───────────────────────────────────────────────────────
function MenuMais({ setAba, ehDono, onLogout }) {
  const itens = [
    { id:'novo_cliente', icon:'👤', label:'Novo cliente' },
    { id:'equipe', icon:'👥', label:'Equipe', dono:true },
  ].filter(i => !i.dono || ehDono)

  return (
    <div style={{ ...S.card, marginTop:0 }}>
      <div style={S.h2}>Menu</div>
      {itens.map(i => (
        <button key={i.id} onClick={() => setAba(i.id)} style={{
          display:'flex', alignItems:'center', gap:14, width:'100%', background:'none',
          border:'none', borderBottom:`1px solid ${G.traco}`, padding:'16px 0', cursor:'pointer',
          fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:16, color:G.tinta,
          WebkitTapHighlightColor:'transparent'
        }}>
          <span style={{ fontSize:24 }}>{i.icon}</span>
          <span>{i.label}</span>
          <span style={{ marginLeft:'auto', color:G.cinza, fontSize:20 }}>›</span>
        </button>
      ))}
    </div>
  )
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function Login() {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  async function loginGoogle() {
    setCarregando(true); setErro('')
    const { error } = await supa.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:window.location.origin } })
    if (error) { setErro(error.message); setCarregando(false) }
  }
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:G.fundo, padding:20 }}>
      <div style={{ background:G.painel, borderRadius:20, padding:'40px 28px', maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ ...S.display, fontWeight:800, fontSize:28, color:G.verde, marginBottom:4 }}>Gestor de Bolso</div>
        <div style={{ color:G.cinza, fontSize:15, marginBottom:36 }}>Painel do Consultor</div>
        <button onClick={loginGoogle} disabled={carregando} style={{ ...S.btn(), display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {carregando ? 'Entrando…' : 'Entrar com Google'}
        </button>
        {erro && <div style={S.erro}>{erro}</div>}
        <div style={{ color:G.cinza, fontSize:12, marginTop:20, lineHeight:1.5 }}>Apenas consultores autorizados têm acesso.</div>
      </div>
    </div>
  )
}

// ── Hook consultor ────────────────────────────────────────────────────────────
function useConsultor(user) {
  const [consultor, setConsultor] = useState(null)
  useEffect(() => {
    if (!user) return
    supa.from('consultores').select('*').eq('auth_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setConsultor(data); return }
        supa.from('consultores').update({ auth_user_id: user.id }).eq('email', user.email).select().maybeSingle()
          .then(({ data: d2 }) => setConsultor(d2))
      })
  }, [user])
  return consultor
}

// ── chamarFn (autenticado) ────────────────────────────────────────────────────
async function chamarFn(fn, payload) {
  const { data: { session } } = await supa.auth.getSession()
  const r = await fetch(FN(fn), {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${session?.access_token ?? SUPA_ANON}` },
    body: JSON.stringify(payload)
  })
  return r.json().catch(() => ({ erro:'Resposta inválida' }))
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [session, setSession] = useState(undefined)
  const [aba, setAba] = useState('nota')
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [catalogo, setCatalogo] = useState({ insumos:[], produtos:[] })

  useEffect(() => {
    supa.auth.getSession().then(({ data:{ session:s } }) => setSession(s))
    const { data:{ subscription } } = supa.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const consultor = useConsultor(session?.user)
  const ehDono = consultor?.papel === 'dono'

  async function carregarClientes() {
    let q = supa.from('clientes').select('id,nome_dono,nome_negocio,plano,status,consultor_id').order('nome_negocio')
    if (!ehDono && consultor) q = q.eq('consultor_id', consultor.id)
    const { data } = await q
    setClientes(data ?? [])
    if (!clienteId && data?.length) setClienteId(data[0].id)
  }

  async function carregarCatalogo(cid) {
    if (!cid) return
    const [ins, prods] = await Promise.all([
      supa.from('insumos').select('id,nome,unidade,estoque_atual,preco_unitario_atual').eq('cliente_id', cid).order('nome'),
      supa.from('produtos').select('id,nome,preco_venda,custo_unitario').eq('cliente_id', cid).eq('ativo', true).order('nome'),
    ])
    setCatalogo({ insumos: ins.data??[], produtos: prods.data??[] })
  }

  useEffect(() => { if (consultor) carregarClientes() }, [consultor])
  useEffect(() => { if (clienteId) carregarCatalogo(clienteId) }, [clienteId])

  async function logout() { await supa.auth.signOut() }

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:G.cinza, fontSize:15 }}>Carregando…</div>
  )
  if (!session) return <Login />
  if (!consultor) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', padding:24, textAlign:'center' }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Acesso não autorizado</div>
        <div style={{ color:G.cinza, fontSize:14, marginBottom:20 }}>Seu e-mail ({session.user.email}) não está cadastrado como consultor.</div>
        <button onClick={logout} style={S.btn(G.cinza)}>Sair</button>
      </div>
    </div>
  )

  const recarregar = () => { carregarClientes(); carregarCatalogo(clienteId) }
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const todasAbas = [
    { id:'nota',         icon:'🧾', label:'Nota' },
    { id:'caixa',        icon:'💬', label:'Caixa' },
    { id:'produto',      icon:'➕', label:'Produto' },
    { id:'cliente_view', icon:'📊', label:'Cliente' },
    { id:'despesas',     icon:'💸', label:'Despesas' },
    { id:'visita',       icon:'📋', label:'Visita' },
    { id:'novo_cliente', icon:'👤', label:'Novo Cliente' },
    ...(ehDono ? [{ id:'cockpit', icon:'🏦', label:'Cockpit' }, { id:'dre', icon:'📈', label:'DRE' }, { id:'equipe', icon:'👥', label:'Equipe' }] : []),
  ]

  const conteudo = <>
    {aba==='nota'         && <TabNota clienteId={clienteId} catalogo={catalogo} recarregar={recarregar} />}
    {aba==='caixa'        && <TabCaixa clienteId={clienteId} catalogo={catalogo} recarregar={recarregar} />}
    {aba==='produto'      && <TabProduto clienteId={clienteId} catalogo={catalogo} recarregar={recarregar} />}
    {aba==='cliente_view' && <TabClienteView clienteId={clienteId} />}
    {aba==='cockpit'      && ehDono && <TabCockpit />}
    {aba==='dre' && <TabDRE clienteId={clienteId} clientes={clientes} />}
    {aba==='novo_cliente' && <TabNovoCliente consultor={consultor} recarregar={carregarClientes} setClienteId={setClienteId} setAba={setAba} />}
    {aba==='equipe'       && ehDono && <TabEquipe recarregar={carregarClientes} />}
    {aba==='visita'       && <TabVisita clienteId={clienteId} consultor={consultor} />}
    {aba==='despesas'     && <TabDespesas clienteId={clienteId} />}
    {aba==='mais'         && <MenuMais setAba={setAba} ehDono={ehDono} onLogout={logout} />}
    <div style={{ height:16 }} />
  </>

  // ── LAYOUT DESKTOP (≥ 768px) ─────────────────────────────────────────────
  if (!isMobile) return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:G.fundo }}>
      {/* Header desktop */}
      <div style={{ background:G.verde, color:'#fff', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexShrink:0 }}>
        <div style={{ ...S.display, fontWeight:800, fontSize:20, letterSpacing:'-.02em', whiteSpace:'nowrap' }}>
          Gestor de Bolso
          <small style={{ ...S.mono, fontSize:10, opacity:.7, letterSpacing:'.14em', display:'block' }}>PAINEL DO CONSULTOR</small>
        </div>
        <div style={{ flex:1, maxWidth:400 }}>
          <SeletorCliente clientes={clientes} clienteId={clienteId} onChange={id=>{ setClienteId(id); carregarCatalogo(id) }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <span style={{ fontSize:13, opacity:.8 }}>{consultor?.nome}</span>
          <button onClick={logout} style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontSize:13, fontWeight:700 }}>Sair</button>
        </div>
      </div>

      {/* Body: sidebar + conteúdo */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{ width:220, background:G.painel, borderRight:`1px solid ${G.traco}`, overflowY:'auto', flexShrink:0, paddingTop:8 }}>
          {todasAbas.map(a => (
            <button key={a.id} onClick={()=>setAba(a.id)} style={{
              display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left',
              background: aba===a.id ? G.verdeClaro : 'none',
              borderLeft: aba===a.id ? `3px solid ${G.verde2}` : '3px solid transparent',
              border:'none', borderLeftStyle:'solid', borderLeftWidth:3, borderLeftColor: aba===a.id ? G.verde2 : 'transparent',
              padding:'12px 18px', cursor:'pointer', color: aba===a.id ? G.verde : G.tinta,
              fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight: aba===a.id ? 700 : 500, fontSize:14,
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
          {/* Separador + info consultor */}
          <div style={{ margin:'16px 0', borderTop:`1px solid ${G.traco}` }} />
          <div style={{ padding:'8px 18px', fontSize:12, color:G.cinza }}>
            <div style={{ fontWeight:700, marginBottom:2 }}>{consultor?.nome}</div>
            <div style={{ ...S.badge(consultor?.papel==='dono'?G.verde2:G.cinza), fontSize:10 }}>{consultor?.papel}</div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px', background:G.fundo }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            {conteudo}
          </div>
        </div>
      </div>
    </div>
  )

  // ── LAYOUT MOBILE (< 768px) ───────────────────────────────────────────────
  const abasMobile = [
    { id:'nota',   icon:'🧾', label:'Nota' },
    { id:'caixa',  icon:'💬', label:'Caixa' },
    { id:'produto',icon:'➕', label:'Produto' },
    { id:'cliente_view', icon:'📊', label:'Cliente' },
    ...(ehDono ? [{ id:'cockpit', icon:'🏦', label:'Cockpit' }] : []),
    { id:'mais',   icon:'☰',  label:'Mais' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:G.fundo }}>
      <Header clientes={clientes} clienteId={clienteId} setClienteId={id=>{ setClienteId(id); carregarCatalogo(id) }} consultor={consultor} onLogout={logout} />
      <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 0' }}>
        {conteudo}
      </div>
      <div style={{ display:'flex', background:G.painel, borderTop:`1px solid ${G.traco}`, paddingBottom:'env(safe-area-inset-bottom,8px)', position:'sticky', bottom:0, zIndex:9 }}>
        {abasMobile.map(a => (
          <button key={a.id} onClick={()=>setAba(a.id)} style={{
            flex:1, background:'none', border:'none', borderTop: aba===a.id?`2px solid ${G.verde2}`:'2px solid transparent',
            padding:'8px 4px 6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            color: aba===a.id?G.verde2:G.cinza, minHeight:52
          }}>
            <span style={{ fontSize:20 }}>{a.icon}</span>
            <span style={{ fontSize:10, fontWeight:700 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ABAS
// ══════════════════════════════════════════════════════════════════════════════

// ── Tab Nota ──────────────────────────────────────────────────────────────────
function TabNota({ clienteId, catalogo, recarregar }) {
  const [modo, setModo] = useState('foto')
  const [fotoB64, setFotoB64] = useState(null)
  const [fotoTipo, setFotoTipo] = useState('image/jpeg')
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [notaRows, setNotaRows] = useState([])
  const [fornecedor, setFornecedor] = useState('')
  const [dataCompra, setDataCompra] = useState('')

  function handleFoto(e) {
    const f = e.target.files[0]; if (!f) return
    setErro('')
    const img = new Image()
    img.onload = () => {
      try {
        const MAX=1568, sc=Math.min(1,MAX/Math.max(img.width,img.height))
        const cv=document.createElement('canvas'); cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc)
        cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height)
        const u=cv.toDataURL('image/jpeg',.85); setFotoB64(u.split(',')[1]); setFotoTipo('image/jpeg')
      } catch(err){ setErro('Erro ao preparar imagem: '+err.message) }
      finally{ URL.revokeObjectURL(img.src) }
    }
    img.src=URL.createObjectURL(f)
  }

  async function processar() {
    if (!clienteId) return setErro('Selecione o cliente.')
    if (!fotoB64) return setErro('Escolha a foto primeiro.')
    setErro(''); setProcessando(true)
    const d = await chamarFn('processar-nota', { cliente_id:clienteId, image_base64:fotoB64, media_type:fotoTipo })
    setProcessando(false)
    if (d.erro) return setErro(d.erro)
    setResultado(d); recarregar()
  }

  async function lancarManual() {
    if (!clienteId) return setErro('Selecione o cliente.')
    if (!notaRows.length) return setErro('Adicione ao menos um item.')
    const itens = []
    for (const r of notaRows) {
      const q=pf(r.quantidade), vu=pf(r.valor_unitario)
      if (!(q>0)||!(vu>=0)) return setErro('Preencha quantidade e valor de todos os itens.')
      if (r.sel==='__novo__') { if (!r.nome.trim()) return setErro('Dê nome ao insumo.'); itens.push({ insumo_novo:{nome:r.nome.trim(),unidade:r.unidade}, quantidade:q, unidade:r.unidade, valor_unitario:vu, categoria:'cmv' }) }
      else if (r.sel==='__despesa__') itens.push({ descricao:r.descricao||'Despesa', quantidade:q, valor_unitario:vu, categoria:'despesa_operacional' })
      else { const ins=catalogo.insumos.find(x=>x.id===r.sel); itens.push({ insumo_id:r.sel, quantidade:q, unidade:ins?.unidade, valor_unitario:vu, categoria:'cmv' }) }
    }
    setErro(''); setProcessando(true)
    const d = await chamarFn('lancar-nota-manual', { cliente_id:clienteId, fornecedor:fornecedor||null, data_compra:dataCompra||null, itens })
    setProcessando(false)
    if (d.erro) return setErro(d.erro)
    setResultado(d); setNotaRows([]); setFornecedor(''); setDataCompra(''); recarregar()
  }

  const addRow = () => setNotaRows(p=>[...p,{sel:'__novo__',nome:'',unidade:'kg',quantidade:'',valor_unitario:'',descricao:''}])
  const updRow = (i,f,v) => setNotaRows(p=>p.map((r,j)=>j===i?{...r,[f]:v}:r))
  const remRow = i => setNotaRows(p=>p.filter((_,j)=>j!==i))

  return (
    <div>
      <div style={S.card}>
        <div style={S.h2}>Nota de compra</div>
        <ModoSwitch modo={modo} setModo={m=>{ setModo(m); if(m==='manual'&&!notaRows.length) addRow() }} opcoes={[['foto','📷 Foto'],['manual','✍️ Manual']]} />

        {modo==='foto' && <>
          <label style={S.zona}>
            {fotoB64
              ? <img src={`data:${fotoTipo};base64,${fotoB64}`} alt="Nota" style={{maxWidth:'100%',maxHeight:220,borderRadius:8}} />
              : <><div style={{fontSize:36,marginBottom:8}}>📷</div><div style={{color:G.cinza,fontSize:15}}>Toque para fotografar ou escolher</div></>
            }
            <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{display:'none'}} />
          </label>
          <button onClick={processar} disabled={!fotoB64||processando} style={S.btn()}>{processando?'Processando…':'Processar nota'}</button>
        </>}

        {modo==='manual' && <>
          <label style={S.label}>Fornecedor (opcional)</label>
          <input style={S.input} value={fornecedor} onChange={e=>setFornecedor(e.target.value)} placeholder="Ex: Atacadão Central" />
          <label style={S.label}>Data da compra (opcional)</label>
          <input type="date" style={S.input} value={dataCompra} onChange={e=>setDataCompra(e.target.value)} />
          {notaRows.map((r,i) => (
            <div key={i} style={{border:`1px solid ${G.traco}`,borderRadius:12,padding:12,marginTop:10,background:G.papel,position:'relative'}}>
              <button onClick={()=>remRow(i)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:G.vermelho,fontSize:22,cursor:'pointer',padding:4}}>×</button>
              <label style={S.label}>Item</label>
              <select style={S.select} value={r.sel} onChange={e=>updRow(i,'sel',e.target.value)}>
                <option value="__novo__">➕ Novo insumo…</option>
                <option value="__despesa__">💡 Despesa (sem estoque)</option>
                {catalogo.insumos.map(x=><option key={x.id} value={x.id}>{x.nome} ({x.unidade})</option>)}
              </select>
              {r.sel==='__novo__' && <>
                <label style={S.label}>Nome do insumo</label>
                <input style={S.input} value={r.nome} onChange={e=>updRow(i,'nome',e.target.value)} placeholder="Ex: Farinha" />
                <label style={S.label}>Unidade</label>
                <select style={S.select} value={r.unidade} onChange={e=>updRow(i,'unidade',e.target.value)}>
                  {['kg','g','l','ml','un','dz'].map(u=><option key={u}>{u}</option>)}
                </select>
              </>}
              {r.sel==='__despesa__' && <>
                <label style={S.label}>Descrição</label>
                <input style={S.input} value={r.descricao} onChange={e=>updRow(i,'descricao',e.target.value)} placeholder="Ex: Material de limpeza" />
              </>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
                <div><label style={S.label}>Quantidade</label><input type="number" inputMode="decimal" style={S.input} value={r.quantidade} onChange={e=>updRow(i,'quantidade',e.target.value)} /></div>
                <div><label style={S.label}>R$ unitário</label><input type="number" inputMode="decimal" style={S.input} value={r.valor_unitario} onChange={e=>updRow(i,'valor_unitario',e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button onClick={addRow} style={{...S.btn(G.verdeClaro,G.verde),marginTop:10}}>+ Adicionar item</button>
          <button onClick={lancarManual} disabled={processando} style={S.btn()}>{processando?'Lançando…':'Lançar nota'}</button>
        </>}

        {erro && <div style={S.erro}>{erro}</div>}
      </div>
      {resultado && <ResultadoNota d={resultado} />}
    </div>
  )
}

function ResultadoNota({ d }) {
  const [copiado, setCopiado] = useState(false)
  const msg = `Recebi sua nota${d.fornecedor?' do '+d.fornecedor:''}! 🧾\n${d.qtd_itens} itens, total ${brl(d.valor_total)}.\nSeus custos já foram atualizados. 👍${(d.alertas_pendentes??[]).map(a=>'\n\n⚠️ '+a.mensagem).join('')}`
  async function copiar(){ try{await navigator.clipboard.writeText(msg)}catch{}; setCopiado(true); setTimeout(()=>setCopiado(false),1600) }
  return (
    <div style={S.card}>
      <div style={S.h2}>✅ Nota processada</div>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Item</th><th style={{...S.th,textAlign:'right'}}>Total</th><th style={S.th}></th>
      </tr></thead><tbody>
        {(d.itens??[]).map((it,i)=><tr key={i}>
          <td style={S.td}>{it.quantidade} {it.unidade} {it.descricao}</td>
          <td style={{...S.td,textAlign:'right',...S.mono}}>{brl(it.valor_total)}</td>
          <td style={S.td}><span style={S.badge(it.categoria==='cmv'?G.verde2:G.cinza)}>{it.categoria==='cmv'?'CMV':'DESP'}</span></td>
        </tr>)}
      </tbody></table>
      {(d.alertas_pendentes??[]).map((a,i)=><div key={i} style={S.alerta}>⚠️ {a.mensagem}</div>)}
      <div style={S.msgZap}>{msg}</div>
      <button onClick={copiar} style={S.btn()}>{copiado?'Copiado ✓':'Copiar p/ WhatsApp'}</button>
    </div>
  )
}

// ── Tab Caixa ─────────────────────────────────────────────────────────────────
function TabCaixa({ clienteId, catalogo, recarregar }) {
  const [modo, setModo] = useState('texto')
  const [texto, setTexto] = useState('')
  const [vendaRows, setVendaRows] = useState([])
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [ultimaVenda, setUltimaVenda] = useState(null)

  async function registrar(payload) {
    setErro(''); setProcessando(true)
    const d = await chamarFn('registrar-venda', payload)
    setProcessando(false)
    if (d.erro) return setErro(d.erro)
    setUltimaVenda(payload); setResultado(d); recarregar()
    if (d.ok) setTexto('')
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.h2}>Fechamento de caixa</div>
        <ModoSwitch modo={modo} setModo={m=>{ setModo(m); if(m==='manual'&&!vendaRows.length) setVendaRows([{produto_id:catalogo.produtos[0]?.id||'',quantidade:''}]) }} opcoes={[['texto','💬 Texto'],['manual','✍️ Manual']]} />

        {modo==='texto' && <>
          <textarea style={{...S.input,minHeight:96,resize:'none',marginTop:10}} value={texto} onChange={e=>setTexto(e.target.value)} placeholder='"vendi 50 coxinhas e 20 refri"' />
          <button onClick={()=>registrar({cliente_id:clienteId,texto})} disabled={processando||!texto.trim()} style={S.btn()}>{processando?'Registrando…':'Registrar fechamento'}</button>
        </>}

        {modo==='manual' && <>
          {vendaRows.map((r,i)=>(
            <div key={i} style={{border:`1px solid ${G.traco}`,borderRadius:12,padding:12,marginTop:10,background:G.papel,position:'relative'}}>
              <button onClick={()=>setVendaRows(p=>p.filter((_,j)=>j!==i))} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:G.vermelho,fontSize:22,cursor:'pointer',padding:4}}>×</button>
              <label style={S.label}>Produto</label>
              <select style={S.select} value={r.produto_id} onChange={e=>setVendaRows(p=>p.map((x,j)=>j===i?{...x,produto_id:e.target.value}:x))}>
                {catalogo.produtos.map(p=><option key={p.id} value={p.id}>{p.nome} — {brl(p.preco_venda)}</option>)}
              </select>
              <label style={S.label}>Quantidade</label>
              <input type="number" inputMode="decimal" style={S.input} value={r.quantidade} onChange={e=>setVendaRows(p=>p.map((x,j)=>j===i?{...x,quantidade:e.target.value}:x))} />
            </div>
          ))}
          <button onClick={()=>setVendaRows(p=>[...p,{produto_id:catalogo.produtos[0]?.id||'',quantidade:''}])} style={{...S.btn(G.verdeClaro,G.verde),marginTop:10}}>+ Adicionar produto</button>
          <button onClick={()=>registrar({cliente_id:clienteId,itens:vendaRows.filter(r=>r.produto_id&&pf(r.quantidade)>0).map(r=>({produto_id:r.produto_id,quantidade:pf(r.quantidade)}))})} disabled={processando} style={S.btn()}>{processando?'Registrando…':'Registrar fechamento'}</button>
        </>}

        {erro && <div style={S.erro}>{erro}</div>}
      </div>
      {resultado && <ResultadoVenda d={resultado} onForcar={()=>registrar({...ultimaVenda,forcar:true})} />}
    </div>
  )
}

function ResultadoVenda({ d, onForcar }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar(){ try{await navigator.clipboard.writeText(d.mensagem_whatsapp)}catch{}; setCopiado(true); setTimeout(()=>setCopiado(false),1600) }
  if (!d.ok) return (
    <div style={S.card}>
      <div style={S.h2}>{d.motivo==='estoque_insuficiente'?'⚠️ Faltou nota de compra':'⚠️ Não reconhecido'}</div>
      <div style={S.msgZap}>{d.mensagem_whatsapp}</div>
      <button onClick={copiar} style={S.btn()}>{copiado?'Copiado ✓':'Copiar p/ WhatsApp'}</button>
      {d.motivo==='estoque_insuficiente' && <button onClick={onForcar} style={S.btn(G.ambar)}>Lançar mesmo assim</button>}
    </div>
  )
  const r = d.resultado_dia??{}
  return (
    <div style={S.card}>
      <div style={S.h2}>{d.forcado?'⚡ Lançado (forçado)':'✅ Venda registrada'}</div>
      <table style={S.table}><tbody>
        {(d.itens_registrados??[]).map((l,i)=><tr key={i}><td style={S.td}>{l.replace('• ','')}</td></tr>)}
        <tr><td style={{...S.td,paddingTop:12,fontWeight:700}}>Receita do dia</td><td style={{...S.td,textAlign:'right',...S.mono,paddingTop:12}}>{brl(r.receita)}</td></tr>
        <tr><td style={S.td}>Lucro bruto</td><td style={{...S.td,textAlign:'right',...S.mono,color:G.verde,fontWeight:700}}>{brl(r.lucro_bruto)}</td></tr>
      </tbody></table>
      {(d.alertas_pendentes??[]).map((a,i)=><div key={i} style={S.alerta}>⚠️ {a.mensagem}</div>)}
      <div style={S.msgZap}>{d.mensagem_whatsapp}</div>
      <button onClick={copiar} style={S.btn()}>{copiado?'Copiado ✓':'Copiar p/ WhatsApp'}</button>
    </div>
  )
}

// ── Tab Produto ───────────────────────────────────────────────────────────────
function TabProduto({ clienteId, catalogo, recarregar }) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [tipo, setTipo] = useState('producao')
  const [receita, setReceita] = useState([])
  const [revPreco, setRevPreco] = useState('')
  const [revUnidade, setRevUnidade] = useState('un')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [margem, setMargem] = useState(null)
  const [editandoId, setEditandoId] = useState(null)

  const addIng = () => setReceita(p=>[...p,{sel:catalogo.insumos[0]?.id||'__novo__',nome:'',unidadeNova:'kg',quantidade:'',unidade:'g',preco:''}])
  const updIng = (i,f,v) => setReceita(p=>p.map((r,j)=>j===i?{...r,[f]:v}:r))

  useEffect(()=>{
    const pv=pf(preco)
    if(tipo==='revenda'){const pc=pf(revPreco); if(pv>0&&pc>0) setMargem({custo:pc,pct:((pv-pc)/pv*100).toFixed(0)}); else setMargem(null); return}
    let custo=0,falta=false
    for(const r of receita){const q=pf(r.quantidade); if(!(q>0)) continue; let p=0,ub=r.unidade
      if(r.sel==='__novo__'){p=pf(r.preco);ub=r.unidadeNova;if(!p){falta=true;continue}}
      else{const ins=catalogo.insumos.find(x=>x.id===r.sel);if(!ins)continue;p=Number(ins.preco_unitario_atual);ub=ins.unidade;if(!p){falta=true;continue}}
      const qb=converter(q,r.unidade,ub); if(qb!==null) custo+=qb*p; else falta=true
    }
    if(receita.some(r=>pf(r.quantidade)>0)) setMargem({custo,pct:pv>0?((pv-custo)/pv*100).toFixed(0):null,incompleto:falta})
    else setMargem(null)
  },[nome,preco,tipo,receita,revPreco,revUnidade,catalogo])

  async function salvar(){
    if(!clienteId||!nome.trim()||!(pf(preco)>0)) return setMsg({erro:'Preencha nome e preço de venda.'})
    const payload={cliente_id:clienteId,produto_id:editandoId,nome:nome.trim(),preco_venda:pf(preco),tipo}
    if(tipo==='revenda'){payload.preco_compra=pf(revPreco);payload.unidade_compra=revUnidade}
    else{
      const r=[]
      for(const x of receita){const q=pf(x.quantidade);if(!(q>0))continue
        if(x.sel==='__novo__'){if(!x.nome.trim()) return setMsg({erro:'Dê nome ao insumo.'});r.push({insumo_novo:{nome:x.nome.trim(),unidade:x.unidadeNova,preco:pf(x.preco)||0},quantidade:q,unidade:x.unidade})}
        else r.push({insumo_id:x.sel,quantidade:q,unidade:x.unidade})
      }
      if(!r.length) return setMsg({erro:'Adicione ao menos um ingrediente.'})
      payload.receita=r
    }
    setSalvando(true);setMsg(null)
    const d=await chamarFn('cadastrar-produto',payload); setSalvando(false)
    if(d.erro) return setMsg({erro:d.erro})
    const p=d.produto
    setMsg({ok:`✓ ${nome} salvo!${p?` Custo ${brl(p.custo_unitario)} · margem ${Number(p.margem_pct).toFixed(0)}%`:''}`})
    setNome('');setPreco('');setRevPreco('');setReceita([]);setEditandoId(null);recarregar()
  }

  async function editar(prod){
    setEditandoId(prod.id);setNome(prod.nome);setPreco(String(prod.preco_venda))
    const{data:ficha}=await supa.from('ficha_tecnica_itens').select('insumo_id,quantidade_por_unidade,insumos(nome,unidade,preco_unitario_atual)').eq('produto_id',prod.id)
    const ehRev=ficha?.length===1&&Math.abs(ficha[0].quantidade_por_unidade-1)<1e-9&&ficha[0].insumos?.nome===prod.nome
    if(ehRev){setTipo('revenda');setRevPreco(String(ficha[0].insumos.preco_unitario_atual));setRevUnidade(ficha[0].insumos.unidade||'un')}
    else{setTipo('producao');setReceita((ficha??[]).map(f=>({sel:f.insumo_id,nome:'',unidadeNova:'kg',quantidade:f.quantidade_por_unidade,unidade:f.insumos?.unidade||'un',preco:''})))}
  }

  return(
    <div>
      <div style={S.card}>
        <div style={S.h2}>{editandoId?'Editar produto':'Cadastrar produto'}</div>
        <label style={S.label}>Nome</label>
        <input style={S.input} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Coxinha" />
        <label style={S.label}>Preço de venda (R$)</label>
        <input type="number" inputMode="decimal" style={S.input} value={preco} onChange={e=>setPreco(e.target.value)} placeholder="0,00" />
        <label style={S.label}>Tipo</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:6}}>
          {[['producao','👩‍🍳 Eu que faço'],['revenda','📦 Compro pronto']].map(([v,l])=>(
            <button key={v} onClick={()=>{setTipo(v);if(v==='producao'&&!receita.length)addIng()}} style={{border:`1.5px solid ${tipo===v?G.verde2:G.traco}`,background:tipo===v?G.verdeClaro:G.papel,color:tipo===v?G.verde:G.cinza,borderRadius:12,padding:'12px 8px',cursor:'pointer',fontWeight:tipo===v?700:400,fontSize:14,minHeight:48}}>{l}</button>
          ))}
        </div>

        {tipo==='producao'&&<>
          <label style={{...S.label,marginTop:14}}>Receita — por unidade</label>
          {receita.map((r,i)=>(
            <div key={i} style={{border:`1px solid ${G.traco}`,borderRadius:12,padding:12,marginTop:8,background:G.papel,position:'relative'}}>
              <button onClick={()=>setReceita(p=>p.filter((_,j)=>j!==i))} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:G.vermelho,fontSize:22,cursor:'pointer',padding:4}}>×</button>
              <label style={S.label}>Ingrediente</label>
              <select style={S.select} value={r.sel} onChange={e=>updIng(i,'sel',e.target.value)}>
                {catalogo.insumos.map(x=><option key={x.id} value={x.id}>{x.nome} ({x.unidade})</option>)}
                <option value="__novo__">➕ Novo insumo…</option>
              </select>
              {r.sel==='__novo__'&&<>
                <label style={S.label}>Nome</label>
                <input style={S.input} value={r.nome} onChange={e=>updIng(i,'nome',e.target.value)} />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div><label style={S.label}>Compra em</label><select style={S.select} value={r.unidadeNova} onChange={e=>updIng(i,'unidadeNova',e.target.value)}>{['kg','g','l','ml','un','dz'].map(u=><option key={u}>{u}</option>)}</select></div>
                  <div><label style={S.label}>Preço est. (R$)</label><input type="number" inputMode="decimal" style={S.input} value={r.preco} onChange={e=>updIng(i,'preco',e.target.value)} placeholder="0,00" /></div>
                </div>
              </>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
                <div><label style={S.label}>Quantidade</label><input type="number" inputMode="decimal" style={S.input} value={r.quantidade} onChange={e=>updIng(i,'quantidade',e.target.value)} /></div>
                <div><label style={S.label}>Medida</label><select style={S.select} value={r.unidade} onChange={e=>updIng(i,'unidade',e.target.value)}>{['g','kg','ml','l','un','dz'].map(u=><option key={u}>{u}</option>)}</select></div>
              </div>
            </div>
          ))}
          <button onClick={addIng} style={{...S.btn(G.verdeClaro,G.verde),marginTop:10}}>+ Adicionar ingrediente</button>
        </>}

        {tipo==='revenda'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
          <div><label style={S.label}>Preço de compra (R$)</label><input type="number" inputMode="decimal" style={S.input} value={revPreco} onChange={e=>setRevPreco(e.target.value)} /></div>
          <div><label style={S.label}>Unidade</label><select style={S.select} value={revUnidade} onChange={e=>setRevUnidade(e.target.value)}>{['un','dz','kg','l'].map(u=><option key={u}>{u}</option>)}</select></div>
        </div>}

        {margem&&<div style={S.painelMargem(Number(margem.pct)<30)}>
          <div style={{...S.display,fontWeight:800,fontSize:28}}>{margem.pct!==null?`${margem.pct}%`:`R$ ${margem.custo.toFixed(2)}`}</div>
          <div style={{fontSize:14,opacity:.9,marginTop:4}}>{margem.pct!==null?`Custa ${brl(margem.custo)} · lucra ${brl(pf(preco)-margem.custo)} por unidade`:'de margem'}{margem.incompleto?' · informe preço dos insumos novos':''}</div>
        </div>}

        <button onClick={salvar} disabled={salvando} style={S.btn()}>{salvando?'Salvando…':'Salvar produto'}</button>
        {msg?.erro&&<div style={S.erro}>{msg.erro}</div>}
        {msg?.ok&&<div style={S.ok}>{msg.ok}</div>}
      </div>

      {catalogo.produtos.length>0&&<div style={S.card}>
        <div style={S.h2}>Produtos</div>
        {catalogo.produtos.map(p=>(
          <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div><div style={{fontWeight:700,fontSize:15}}>{p.nome}</div><div style={{fontSize:13,color:G.cinza,...S.mono}}>Venda {brl(p.preco_venda)} · Custo {brl(p.custo_unitario)}</div></div>
            <button onClick={()=>editar(p)} style={S.btnSm()}>Editar</button>
          </div>
        ))}
      </div>}
    </div>
  )
}

// ── Tab Cliente (visão) ───────────────────────────────────────────────────────
function TabClienteView({ clienteId }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function carregar(){
    if(!clienteId) return
    setCarregando(true)
    const [margens,insumos,resultado,alertas]=await Promise.all([
      supa.from('vw_margem_produtos').select('produto,preco_venda,custo_unitario,margem_pct').eq('cliente_id',clienteId).order('margem_pct'),
      supa.from('insumos').select('nome,unidade,estoque_atual,preco_unitario_atual').eq('cliente_id',clienteId).order('nome'),
      supa.from('vw_resultado_diario').select('data_venda,receita,cmv,lucro_bruto').eq('cliente_id',clienteId).order('data_venda',{ascending:false}).limit(7),
      supa.from('alertas').select('id,tipo,mensagem').eq('cliente_id',clienteId).eq('enviado',false).order('criado_em',{ascending:false}),
    ])
    setDados({margens:margens.data??[],insumos:insumos.data??[],resultado:resultado.data??[],alertas:alertas.data??[]})
    setCarregando(false)
  }
  useEffect(()=>{carregar()},[clienteId])

  async function marcarEnviados(){
    await supa.from('alertas').update({enviado:true,enviado_em:new Date().toISOString()}).eq('cliente_id',clienteId).eq('enviado',false)
    carregar()
  }

  if(!dados) return <div style={S.card}><button onClick={carregar} style={S.btn()}>Carregar</button></div>

  return(
    <div>
      <div style={{textAlign:'right',marginBottom:8}}>
        <button onClick={carregar} disabled={carregando} style={S.btnSm()}>{carregando?'Atualizando…':'↻ Atualizar'}</button>
      </div>

      <div style={S.card}>
        <div style={S.h2}>Margens</div>
        {dados.margens.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div style={{fontWeight:600,fontSize:15}}>{m.produto}</div>
            <div style={{textAlign:'right'}}>
              <div style={{...S.mono,fontWeight:700,fontSize:15,color:Number(m.margem_pct)<30?G.vermelho:G.verde}}>{Number(m.margem_pct).toFixed(1)}%</div>
              <div style={{fontSize:12,color:G.cinza,...S.mono}}>Custo {brl(m.custo_unitario)}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.h2}>Estoque</div>
        {dados.insumos.map((i,idx)=>(
          <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div style={{fontSize:14}}>{i.nome}</div>
            <div style={{textAlign:'right'}}>
              <div style={{...S.mono,fontWeight:700,color:Number(i.estoque_atual)<0?G.vermelho:G.tinta}}>{Number(i.estoque_atual).toLocaleString('pt-BR')} {i.unidade}</div>
              <div style={{fontSize:12,color:G.cinza,...S.mono}}>{brl(i.preco_unitario_atual)}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.h2}>Resultado · 7 dias</div>
        {dados.resultado.map((r,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div style={{fontSize:13,color:G.cinza}}>{r.data_venda}</div>
            <div style={{textAlign:'right'}}>
              <div style={{...S.mono,fontWeight:700,color:G.verde}}>{brl(r.lucro_bruto)}</div>
              <div style={{fontSize:12,color:G.cinza,...S.mono}}>Receita {brl(r.receita)}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.h2}>Alertas</div>
        {dados.alertas.length===0
          ? <div style={{color:G.cinza,fontSize:13,fontStyle:'italic'}}>Nenhum alerta pendente.</div>
          : <>{dados.alertas.map((a,i)=><div key={i} style={S.alerta}>⚠️ {a.mensagem}</div>)}
             <button onClick={marcarEnviados} style={S.btn()}>Marcar como enviados</button></>
        }
      </div>
    </div>
  )
}

// ── Tab Cockpit ───────────────────────────────────────────────────────────────
function TabCockpit(){
  const [dados,setDados]=useState(null)
  useEffect(()=>{ supa.from('vw_cockpit_dono').select('*').then(({data})=>setDados(data??[])) },[])
  if(!dados) return <div style={S.card}>Carregando…</div>
  const mrr=dados.reduce((s,d)=>s+Number(d.mrr),0)
  const ativos=dados.reduce((s,d)=>s+Number(d.clientes_ativos),0)
  const total=dados.reduce((s,d)=>s+Number(d.total_clientes),0)
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
        {[['MRR',brl(mrr)],['Ativos',ativos],['Total',total]].map(([l,v])=>(
          <div key={l} style={{...S.card,textAlign:'center',marginBottom:0,padding:'14px 8px'}}>
            <div style={{fontSize:11,color:G.cinza,marginBottom:4,fontWeight:700}}>{l}</div>
            <div style={{...S.display,fontWeight:800,fontSize:20,color:G.verde}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.h2}>Por consultor</div>
        {dados.map((d,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{d.consultor}</div>
              <div style={{fontSize:12,color:G.cinza,marginTop:2}}>{d.clientes_ativos} ativos · {d.inadimplentes} inad.</div>
            </div>
            <div style={{...S.mono,fontWeight:700,color:G.verde,fontSize:15}}>{brl(d.mrr)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab Novo Cliente ──────────────────────────────────────────────────────────
function TabNovoCliente({consultor,recarregar,setClienteId,setAba}){
  const [dono,setDono]=useState('')
  const [negocio,setNegocio]=useState('')
  const [whats,setWhats]=useState('')
  const [plano,setPlano]=useState('pe_na_calcada')
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState(null)
  const MEN={pe_na_calcada:99,balcao_e_estufa:250,lanchonete_estruturada:500}
  async function salvar(){
    if(!dono.trim()||!negocio.trim()||!whats.trim()) return setMsg({erro:'Preencha todos os campos.'})
    setSalvando(true);setMsg(null)
    const{data,error}=await supa.from('clientes').insert({nome_dono:dono.trim(),nome_negocio:negocio.trim(),telefone_whatsapp:whats.replace(/\D/g,''),plano,mensalidade:MEN[plano],status:'piloto',consultor_id:consultor?.id}).select('id,nome_negocio').single()
    setSalvando(false)
    if(error) return setMsg({erro:error.code==='23505'?'Já existe um cliente com esse WhatsApp.':error.message})
    setMsg({ok:`✓ ${data.nome_negocio} cadastrado!`})
    setDono('');setNegocio('');setWhats('')
    await recarregar(); setClienteId(data.id); setAba('produto')
  }
  return(
    <div style={S.card}>
      <div style={S.h2}>Novo cliente</div>
      <div style={S.dica}>Depois de cadastrar, você será direcionado para cadastrar os produtos.</div>
      <label style={S.label}>Nome do dono</label><input style={S.input} value={dono} onChange={e=>setDono(e.target.value)} placeholder="Ex: Maria" />
      <label style={S.label}>Nome do negócio</label><input style={S.input} value={negocio} onChange={e=>setNegocio(e.target.value)} placeholder="Ex: Salgados da Maria" />
      <label style={S.label}>WhatsApp (só números, com DDD)</label><input type="tel" inputMode="numeric" style={S.input} value={whats} onChange={e=>setWhats(e.target.value)} placeholder="Ex: 5511999998888" />
      <label style={S.label}>Plano</label>
      <select style={S.select} value={plano} onChange={e=>setPlano(e.target.value)}>
        <option value="pe_na_calcada">Pé na Calçada (R$ 99)</option>
        <option value="balcao_e_estufa">Balcão e Estufa (R$ 250)</option>
        <option value="lanchonete_estruturada">Lanchonete Estruturada (R$ 500)</option>
      </select>
      <button onClick={salvar} disabled={salvando} style={S.btn()}>{salvando?'Cadastrando…':'Cadastrar cliente'}</button>
      {msg?.erro&&<div style={S.erro}>{msg.erro}</div>}
      {msg?.ok&&<div style={S.ok}>{msg.ok}</div>}
    </div>
  )
}

// ── Tab Equipe ────────────────────────────────────────────────────────────────
function TabEquipe({recarregar}){
  const [consultores,setConsultores]=useState([])
  const [clientes,setClientes]=useState([])
  const [nome,setNome]=useState('')
  const [email,setEmail]=useState('')
  const [papel,setPapel]=useState('consultor')
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState(null)
  const [carteiraSel,setCarteiraSel]=useState(null)
  const [movendo,setMovendo]=useState(false)

  async function carregar(){
    const[c,cl]=await Promise.all([
      supa.from('consultores').select('id,nome,email,papel,ativo').order('nome'),
      supa.from('clientes').select('id,nome_negocio,nome_dono,status,consultor_id').order('nome_negocio'),
    ])
    setConsultores(c.data??[]);setClientes(cl.data??[])
  }
  useEffect(()=>{carregar()},[])

  async function adicionar(){
    if(!nome.trim()||!email.trim()) return setMsg({erro:'Preencha nome e e-mail.'})
    setSalvando(true);setMsg(null)
    const{error}=await supa.from('consultores').insert({nome:nome.trim(),email:email.trim().toLowerCase(),papel,ativo:true})
    setSalvando(false)
    if(error) return setMsg({erro:error.message})
    setMsg({ok:`✓ ${nome} adicionado. Login disponível via Google.`})
    setNome('');setEmail('');carregar();recarregar()
  }

  async function reatribuir(clienteId,novoConsultorId){
    setMovendo(true)
    await supa.from('clientes').update({consultor_id:novoConsultorId||null}).eq('id',clienteId)
    await carregar();recarregar();setMovendo(false)
  }

  async function toggleAtivo(c){ await supa.from('consultores').update({ativo:!c.ativo}).eq('id',c.id); carregar() }

  const carteira = carteiraSel ? clientes.filter(c=>c.consultor_id===carteiraSel) : []
  const semConsultor = clientes.filter(c=>!c.consultor_id)
  const consultorSel = consultores.find(c=>c.id===carteiraSel)

  return(
    <div>
      <div style={S.card}>
        <div style={S.h2}>Adicionar consultor</div>
        <label style={S.label}>Nome</label><input style={S.input} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: João Silva" />
        <label style={S.label}>E-mail Google</label><input type="email" style={S.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="joao@gmail.com" />
        <label style={S.label}>Papel</label>
        <select style={S.select} value={papel} onChange={e=>setPapel(e.target.value)}>
          <option value="consultor">Consultor (vê só a carteira)</option>
          <option value="dono">Dono (vê tudo + cockpit)</option>
        </select>
        <button onClick={adicionar} disabled={salvando} style={S.btn()}>{salvando?'Adicionando…':'Adicionar consultor'}</button>
        {msg?.erro&&<div style={S.erro}>{msg.erro}</div>}
        {msg?.ok&&<div style={S.ok}>{msg.ok}</div>}
      </div>

      {semConsultor.length>0&&<div style={{...S.card,border:`2px solid ${G.ambar}`}}>
        <div style={{...S.h2,color:G.ambar}}>⚠️ Sem consultor ({semConsultor.length})</div>
        {semConsultor.map(cl=>(
          <div key={cl.id} style={{padding:'10px 0',borderBottom:`1px solid ${G.traco}`}}>
            <div style={{fontWeight:700,marginBottom:6}}>{cl.nome_negocio} — {cl.nome_dono}</div>
            <select disabled={movendo} value="" onChange={e=>reatribuir(cl.id,e.target.value)} style={S.select}>
              <option value="">— atribuir a —</option>
              {consultores.filter(c=>c.ativo).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        ))}
      </div>}

      <div style={S.card}>
        <div style={S.h2}>Equipe</div>
        {consultores.map(c=>{
          const qtd=clientes.filter(cl=>cl.consultor_id===c.id).length
          const aberto=carteiraSel===c.id
          return(
            <div key={c.id}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',borderBottom:`1px solid ${G.traco}`}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{c.nome}</div>
                  <div style={{fontSize:12,color:G.cinza,marginTop:2}}>{c.email} · <span style={S.badge(c.papel==='dono'?G.verde2:G.cinza)}>{c.papel}</span> · {qtd} cliente{qtd!==1?'s':''}</div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button onClick={()=>setCarteiraSel(aberto?null:c.id)} style={S.btnSm(aberto?G.verde:G.verdeClaro,aberto?'#fff':G.verde)}>{aberto?'Fechar':'Carteira'}</button>
                  <button onClick={()=>toggleAtivo(c)} style={S.btnSm(c.ativo?G.vermelhoClaro:G.verdeClaro,c.ativo?G.vermelho:G.verde)}>{c.ativo?'Desativar':'Ativar'}</button>
                </div>
              </div>
              {aberto&&<div style={{background:G.fundo,borderRadius:10,padding:'10px 0',margin:'8px 0'}}>
                <div style={{fontSize:12,color:G.cinza,fontWeight:700,padding:'0 4px 8px'}}>{consultorSel?.nome?.toUpperCase()} — CARTEIRA</div>
                {carteira.length===0
                  ? <div style={{color:G.cinza,fontSize:13,fontStyle:'italic',padding:'0 4px'}}>Nenhum cliente.</div>
                  : carteira.map(cl=>(
                    <div key={cl.id} style={{background:G.painel,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{cl.nome_negocio} <span style={{...S.badge(cl.status==='ativo'?G.verde2:G.cinza),fontSize:10}}>{cl.status}</span></div>
                      <select disabled={movendo} value={cl.consultor_id??''} onChange={e=>reatribuir(cl.id,e.target.value)} style={{...S.select,padding:'9px 12px',fontSize:14}}>
                        <option value="">— sem consultor —</option>
                        {consultores.filter(c=>c.ativo).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  ))
                }
              </div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente auxiliar: alternador de modo ───────────────────────────────────
function ModoSwitch({modo,setModo,opcoes}){
  return(
    <div style={{display:'flex',gap:6,background:G.fundo,borderRadius:10,padding:4,marginBottom:14}}>
      {opcoes.map(([v,l])=>(
        <button key={v} onClick={()=>setModo(v)} style={{flex:1,background:modo===v?'#fff':'none',color:modo===v?G.verde:G.cinza,border:'none',borderRadius:7,padding:'9px 4px',cursor:'pointer',fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:14,boxShadow:modo===v?'0 1px 3px rgba(0,0,0,.08)':'none',minHeight:40,WebkitTapHighlightColor:'transparent'}}>{l}</button>
      ))}
    </div>
  )
}

// ── Render ────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(<App />)

// ── Tab Visita (plano de ação) ────────────────────────────────────────────────
export function TabVisita({ clienteId, consultor }) {
  const [anotacoes, setAnotacoes] = useState('')
  const [gerando, setGerando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [planoEditado, setPlanoEditado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [verHistorico, setVerHistorico] = useState(false)

  useEffect(() => {
    if (!clienteId) return
    supa.from('visitas').select('id,data_visita,anotacoes,plano_acao,enviado,criado_em')
      .eq('cliente_id', clienteId).order('data_visita', { ascending: false }).limit(5)
      .then(({ data }) => setHistorico(data ?? []))
  }, [clienteId, resultado])

  async function gerarPlano() {
    if (!clienteId) return setErro('Selecione o cliente.')
    if (!anotacoes.trim()) return setErro('Escreva suas observações da visita.')
    setErro(''); setGerando(true); setResultado(null)
    const d = await chamarFn('gerar-plano-acao', { cliente_id: clienteId, consultor_id: consultor?.id, anotacoes })
    setGerando(false)
    if (d.erro) return setErro(d.erro)
    setResultado(d); setPlanoEditado(d.plano)
  }

  async function enviarWhatsApp() {
    if (!resultado) return
    setEnviando(true)
    // reconstrói a mensagem com o plano possivelmente editado
    const emojis = { 'hoje': '🔴', 'essa semana': '🟡', 'esse mês': '🟢' }
    let msg = `${planoEditado.saudacao}\n\n`
    planoEditado.passos.forEach((p, i) => {
      msg += `${emojis[p.urgencia] ?? '📌'} *Passo ${i+1}: ${p.titulo}*\n${p.descricao}\n\n`
    })
    msg += planoEditado.encerramento
    // envia
    const d = await chamarFn('gerar-plano-acao', { cliente_id: clienteId, consultor_id: consultor?.id, anotacoes, enviar_whatsapp: true })
    setEnviando(false)
    if (d.erro) return setErro(d.erro)
    setResultado({ ...resultado, enviado: true })
  }

  async function copiar(txt) { try { await navigator.clipboard.writeText(txt) } catch {} }

  const emojisUrg = { 'hoje': '🔴', 'essa semana': '🟡', 'esse mês': '🟢' }

  return (
    <div>
      <div style={S.card}>
        <div style={S.h2}>📋 Plano de visita</div>
        <div style={S.dica}>Anote o que observou no negócio. A IA vai cruzar com os dados financeiros e gerar o plano de ação.</div>
        <label style={S.label}>Observações da visita</label>
        <textarea
          style={{ ...S.input, minHeight: 140, resize: 'none' }}
          value={anotacoes}
          onChange={e => setAnotacoes(e.target.value)}
          placeholder={'Ex: cliente reclama do preço da muçarela. Percebi que fritam salgado demais de manhã e sobra no fim do dia. Atendente não oferece o combo. Margem do X-tudo parece baixa.'}
        />
        <button onClick={gerarPlano} disabled={gerando || !anotacoes.trim()} style={S.btn()}>
          {gerando ? '⏳ Gerando plano…' : '✨ Gerar plano de ação'}
        </button>
        {erro && <div style={S.erro}>{erro}</div>}
      </div>

      {resultado && planoEditado && (
        <div style={S.card}>
          <div style={{ ...S.h2, marginBottom: 4 }}>Plano gerado</div>
          <div style={{ fontSize: 13, color: G.cinza, marginBottom: 12 }}>
            Contexto usado: receita 30d {resultado.contexto_usado?.receita_30d} · lucro {resultado.contexto_usado?.lucro_30d}
            {resultado.contexto_usado?.produtos_baixa_margem?.length > 0 && ` · Baixa margem: ${resultado.contexto_usado.produtos_baixa_margem.join(', ')}`}
          </div>

          {/* Saudação */}
          <label style={S.label}>Saudação</label>
          <input style={S.input} value={planoEditado.saudacao}
            onChange={e => setPlanoEditado(p => ({ ...p, saudacao: e.target.value }))} />

          {/* Passos */}
          {planoEditado.passos.map((passo, i) => (
            <div key={i} style={{ border: `1px solid ${G.traco}`, borderRadius: 12, padding: 14, marginTop: 12, background: G.papel }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ ...S.badge(passo.urgencia === 'hoje' ? G.vermelho : passo.urgencia === 'essa semana' ? G.ambar : G.verde), fontSize: 12 }}>
                  {emojisUrg[passo.urgencia]} {passo.urgencia}
                </span>
                <button onClick={() => setPlanoEditado(p => ({ ...p, passos: p.passos.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: G.cinza, cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
              <label style={S.label}>Título do passo</label>
              <input style={S.input} value={passo.titulo}
                onChange={e => setPlanoEditado(p => ({ ...p, passos: p.passos.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x) }))} />
              <label style={S.label}>Descrição</label>
              <textarea style={{ ...S.input, minHeight: 72, resize: 'none' }} value={passo.descricao}
                onChange={e => setPlanoEditado(p => ({ ...p, passos: p.passos.map((x, j) => j === i ? { ...x, descricao: e.target.value } : x) }))} />
              <label style={S.label}>Urgência</label>
              <select style={S.select} value={passo.urgencia}
                onChange={e => setPlanoEditado(p => ({ ...p, passos: p.passos.map((x, j) => j === i ? { ...x, urgencia: e.target.value } : x) }))}>
                <option value="hoje">🔴 Hoje</option>
                <option value="essa semana">🟡 Essa semana</option>
                <option value="esse mês">🟢 Esse mês</option>
              </select>
            </div>
          ))}

          {/* Encerramento */}
          <label style={{ ...S.label, marginTop: 14 }}>Encerramento</label>
          <input style={S.input} value={planoEditado.encerramento}
            onChange={e => setPlanoEditado(p => ({ ...p, encerramento: e.target.value }))} />

          {/* Preview da mensagem */}
          <div style={{ ...S.msgZap, marginTop: 16 }}>
            {planoEditado.saudacao + '\n\n'}
            {planoEditado.passos.map((p, i) => `${emojisUrg[p.urgencia] ?? '📌'} Passo ${i + 1}: ${p.titulo}\n${p.descricao}\n\n`).join('')}
            {planoEditado.encerramento}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <button onClick={() => copiar(
              planoEditado.saudacao + '\n\n' +
              planoEditado.passos.map((p, i) => `${emojisUrg[p.urgencia] ?? '📌'} Passo ${i + 1}: ${p.titulo}\n${p.descricao}\n\n`).join('') +
              planoEditado.encerramento
            )} style={S.btn(G.verdeClaro, G.verde)}>Copiar</button>
            <button onClick={enviarWhatsApp} disabled={enviando || resultado.enviado} style={S.btn(resultado.enviado ? G.cinza : G.verde)}>
              {resultado.enviado ? '✓ Enviado' : enviando ? 'Enviando…' : 'Enviar WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* Histórico de visitas */}
      {historico.length > 0 && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.h2}>Visitas anteriores</div>
            <button onClick={() => setVerHistorico(v => !v)} style={S.btnSm()}>{verHistorico ? 'Ocultar' : 'Ver'}</button>
          </div>
          {verHistorico && historico.map(v => (
            <div key={v.id} style={{ borderTop: `1px solid ${G.traco}`, paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700 }}>{v.data_visita}</span>
                <span style={S.badge(v.enviado ? G.verde2 : G.cinza)}>{v.enviado ? 'Enviado' : 'Rascunho'}</span>
              </div>
              <div style={{ fontSize: 13, color: G.cinza, marginBottom: 8 }}>{v.anotacoes?.slice(0, 100)}{v.anotacoes?.length > 100 ? '…' : ''}</div>
              {v.plano_acao?.passos?.map((p, i) => (
                <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: `1px solid ${G.traco}` }}>
                  {emojisUrg[p.urgencia] ?? '📌'} <strong>{p.titulo}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Relatórios manuais */}
      <RelatorioManual clienteId={clienteId} />
    </div>
  )
}

function RelatorioManual({ clienteId }) {
  const [enviando, setEnviando] = useState(null)
  const [msgs, setMsgs] = useState({})

  async function dispararRelatorio(tipo) {
    if (!clienteId) return
    setEnviando(tipo); setMsgs({})
    const fn = tipo === 'semanal' ? 'relatorio-semanal' : 'relatorio-mensal'
    const d = await chamarFn(fn, { cliente_id: clienteId })
    setEnviando(null)
    if (d.erro) setMsgs({ [tipo]: '❌ ' + d.erro })
    else setMsgs({ [tipo]: d.resultados?.[0]?.sem_vendas ? '⚠️ Sem vendas registradas' : '✅ Enviado com sucesso!' })
  }

  return (
    <div style={S.card}>
      <div style={S.h2}>📊 Disparar relatório</div>
      <div style={S.dica}>Envia o relatório agora pelo WhatsApp, sem esperar o envio automático.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div>
          <button onClick={() => dispararRelatorio('semanal')} disabled={enviando === 'semanal'} style={S.btn(G.verde2)}>
            {enviando === 'semanal' ? 'Enviando…' : '📅 Semanal'}
          </button>
          {msgs.semanal && <div style={{ fontSize: 13, marginTop: 6, textAlign: 'center' }}>{msgs.semanal}</div>}
        </div>
        <div>
          <button onClick={() => dispararRelatorio('mensal')} disabled={enviando === 'mensal'} style={S.btn(G.verde)}>
            {enviando === 'mensal' ? 'Enviando…' : '📆 Mensal'}
          </button>
          {msgs.mensal && <div style={{ fontSize: 13, marginTop: 6, textAlign: 'center' }}>{msgs.mensal}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Tab Despesas ──────────────────────────────────────────────────────────────
export function TabDespesas({ clienteId }) {
  const agora = new Date()
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [ano, setAno] = useState(agora.getFullYear())
  const [despesas, setDespesas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState({ descricao:'', valor:'', pago_em: agora.toISOString().slice(0,10) })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState(null)

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  async function carregar() {
    if (!clienteId) return
    setCarregando(true)
    const { data } = await supa.from('despesas_fixas')
      .select('id,descricao,valor,pago_em,origem,criado_em')
      .eq('cliente_id', clienteId).eq('mes', mes).eq('ano', ano)
      .order('criado_em', { ascending: false })
    setDespesas(data ?? [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [clienteId, mes, ano])

  async function adicionar() {
    if (!clienteId) return setMsg({ erro: 'Selecione o cliente.' })
    if (!form.descricao.trim() || !(pf(form.valor) > 0)) return setMsg({ erro: 'Preencha descrição e valor.' })
    setSalvando(true); setMsg(null)
    const { error } = await supa.from('despesas_fixas').insert({
      cliente_id: clienteId, descricao: form.descricao.trim(),
      valor: pf(form.valor), mes, ano, pago_em: form.pago_em || null, origem: 'manual'
    })
    setSalvando(false)
    if (error) return setMsg({ erro: error.message })
    setMsg({ ok: `✓ ${form.descricao} lançada!` })
    setForm({ descricao:'', valor:'', pago_em: agora.toISOString().slice(0,10) })
    carregar()
  }

  async function excluir(id) {
    await supa.from('despesas_fixas').delete().eq('id', id)
    carregar()
  }

  const total = despesas.reduce((s, d) => s + Number(d.valor), 0)

  return (
    <div>
      {/* Navegação mês */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', ...S.card, marginBottom:12 }}>
        <button onClick={() => { const d = mes===1?{m:12,a:ano-1}:{m:mes-1,a:ano}; setMes(d.m); setAno(d.a) }}
          style={{ ...S.btnSm(), minWidth:40, textAlign:'center' }}>‹</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ ...S.display, fontWeight:700, fontSize:16 }}>{MESES[mes-1]} {ano}</div>
          <div style={{ fontSize:13, color:G.cinza, marginTop:2 }}>Total: {brl(total)}</div>
        </div>
        <button onClick={() => { const d = mes===12?{m:1,a:ano+1}:{m:mes+1,a:ano}; setMes(d.m); setAno(d.a) }}
          style={{ ...S.btnSm(), minWidth:40, textAlign:'center' }}>›</button>
      </div>

      {/* Lançar despesa manual */}
      <div style={S.card}>
        <div style={S.h2}>Lançar despesa</div>
        <div style={S.dica}>Aluguel, energia, salário, maquininha, internet, seguro…</div>
        <label style={S.label}>Descrição</label>
        <input style={S.input} value={form.descricao} onChange={e => setForm(f=>({...f,descricao:e.target.value}))} placeholder="Ex: Aluguel, Salário Maria, Energia elétrica" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><label style={S.label}>Valor (R$)</label>
            <input type="number" inputMode="decimal" style={S.input} value={form.valor} onChange={e => setForm(f=>({...f,valor:e.target.value}))} placeholder="0,00" /></div>
          <div><label style={S.label}>Data do pagamento</label>
            <input type="date" style={S.input} value={form.pago_em} onChange={e => setForm(f=>({...f,pago_em:e.target.value}))} /></div>
        </div>
        <button onClick={adicionar} disabled={salvando} style={S.btn()}>{salvando?'Lançando…':'Lançar despesa'}</button>
        {msg?.erro && <div style={S.erro}>{msg.erro}</div>}
        {msg?.ok  && <div style={S.ok}>{msg.ok}</div>}
      </div>

      {/* Lista do mês */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={S.h2}>Despesas de {MESES[mes-1]}</div>
          <button onClick={carregar} style={S.btnSm()}>{carregando?'…':'↻'}</button>
        </div>
        {despesas.length === 0
          ? <div style={{ color:G.cinza, fontSize:13, fontStyle:'italic' }}>Nenhuma despesa lançada neste mês.</div>
          : <>
            {despesas.map(d => (
              <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:`1px solid ${G.traco}` }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:15 }}>{d.descricao}</div>
                  <div style={{ fontSize:12, color:G.cinza, marginTop:2 }}>
                    {d.pago_em ? `Pago em ${d.pago_em}` : 'Sem data'}
                    {' · '}<span style={S.badge(d.origem==='whatsapp'?G.verde2:G.cinza)}>{d.origem}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ ...S.mono, fontWeight:700, color:G.vermelho, fontSize:15 }}>{brl(d.valor)}</div>
                  <button onClick={() => excluir(d.id)} style={{ background:'none', border:'none', color:G.cinza, cursor:'pointer', fontSize:18, padding:4 }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontWeight:700 }}>
              <span>Total</span>
              <span style={{ ...S.mono, color:G.vermelho }}>{brl(total)}</span>
            </div>
          </>
        }
      </div>
    </div>
  )
}

// ── Tab DRE ───────────────────────────────────────────────────────────────────
export function TabDRE({ clienteId, clientes }) {
  const cliente = clientes.find(c => c.id === clienteId)
  const agora = new Date()
  const [periodo, setPeriodo] = useState('mensal')
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [ano, setAno] = useState(agora.getFullYear())
  const [dre, setDre] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  // Bloqueia se não for plano estruturada
  if (cliente && cliente.plano !== 'lanchonete_estruturada') {
    return (
      <div style={{ ...S.card, textAlign:'center', padding:32 }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
        <div style={{ ...S.display, fontWeight:800, fontSize:18, marginBottom:8, color:G.tinta }}>DRE disponível no plano Lanchonete Estruturada</div>
        <div style={{ color:G.cinza, fontSize:14, lineHeight:1.5, marginBottom:20 }}>
          A Demonstração do Resultado do Exercício com plano de contas completo está disponível para clientes do plano <strong>Lanchonete Estruturada (R$ 500–700/mês)</strong>.
        </div>
        <div style={{ ...S.badge(G.ambar), display:'inline-block', fontSize:13, padding:'6px 14px' }}>
          Plano atual: {cliente.plano?.replace('_',' ')}
        </div>
      </div>
    )
  }

  async function carregar() {
    if (!clienteId) return
    setErro(''); setCarregando(true)
    const d = await chamarFn('gerar-dre', { cliente_id: clienteId, periodo, mes, ano, recategorizar: true })
    setCarregando(false)
    if (d.erro) return setErro(d.erro)
    setDre(d.dre)
  }
  useEffect(() => { if (clienteId) carregar() }, [clienteId, periodo, mes, ano])

  const Linha = ({ label, valor, varPct, destaque, negrito, negativo, indent }) => {
    const cor = varPct !== undefined && varPct !== null ? (varPct >= 0 ? G.verde2 : G.vermelho) : null
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${G.traco}`, paddingLeft: indent ? 16 : 0, background: destaque ? G.verdeClaro : 'transparent', borderRadius: destaque ? 8 : 0 }}>
        <span style={{ fontSize: negrito ? 15 : 14, fontWeight: negrito ? 700 : 400, color: negativo ? G.vermelho : G.tinta }}>{label}</span>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ ...S.mono, fontWeight: negrito ? 700 : 500, fontSize: negrito ? 15 : 14, color: negativo ? G.vermelho : destaque ? G.verde : G.tinta }}>
            {negativo && valor > 0 ? '-' : ''}{brl(valor)}
          </div>
          {varPct !== null && varPct !== undefined && (
            <div style={{ fontSize:11, color: cor, fontWeight:600 }}>
              {varPct >= 0 ? '▲' : '▼'} {Math.abs(varPct)}%
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Controles */}
      <div style={{ ...S.card, marginBottom:12 }}>
        <div style={S.h2}>📈 DRE — Demonstrativo de Resultado</div>
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          {['mensal','trimestral','anual'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{ ...S.btnSm(periodo===p?G.verde:G.verdeClaro, periodo===p?'#fff':G.verde), flex:'1 1 auto', textTransform:'capitalize' }}>{p}</button>
          ))}
        </div>
        {periodo === 'mensal' && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
            <button onClick={() => { const m=mes===1?{m:12,a:ano-1}:{m:mes-1,a:ano}; setMes(m.m); setAno(m.a) }} style={S.btnSm()}>‹</button>
            <div style={{ flex:1, textAlign:'center', fontWeight:700 }}>{MESES[mes-1]} {ano}</div>
            <button onClick={() => { const m=mes===12?{m:1,a:ano+1}:{m:mes+1,a:ano}; setMes(m.m); setAno(m.a) }} style={S.btnSm()}>›</button>
          </div>
        )}
        {periodo === 'anual' && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
            <button onClick={() => setAno(a => a-1)} style={S.btnSm()}>‹</button>
            <div style={{ flex:1, textAlign:'center', fontWeight:700 }}>{ano}</div>
            <button onClick={() => setAno(a => a+1)} style={S.btnSm()}>›</button>
          </div>
        )}
      </div>

      {erro && <div style={S.erro}>{erro}</div>}
      {carregando && <div style={{ ...S.card, textAlign:'center', color:G.cinza }}>Calculando DRE…</div>}

      {dre && !carregando && <>
        {/* Período */}
        <div style={{ textAlign:'center', color:G.cinza, fontSize:13, marginBottom:12 }}>
          {dre.label_atual} · comparando com {dre.label_anterior}
        </div>

        {/* DRE principal */}
        <div style={S.card}>
          <Linha label="Receita Bruta"    valor={dre.atual.receita_bruta}    varPct={dre.comparativo.receita_bruta_var}   negrito />
          <Linha label="(-) CMV"          valor={dre.atual.cmv}              negativo indent />
          <Linha label="= Lucro Bruto"    valor={dre.atual.lucro_bruto}      varPct={dre.comparativo.lucro_bruto_var}     negrito destaque />
          <div style={{ fontSize:12, color:G.cinza, padding:'4px 0 8px', textAlign:'right' }}>
            Margem bruta: {dre.atual.margem_bruta_pct}%
          </div>

          <div style={{ fontSize:12, color:G.cinza, fontWeight:700, padding:'8px 0 4px', letterSpacing:'.05em' }}>DESPESAS OPERACIONAIS</div>
          {[
            ['(-) Pessoal',     dre.atual.despesas.pessoal],
            ['(-) Ocupação',    dre.atual.despesas.ocupacao],
            ['(-) Utilidades',  dre.atual.despesas.utilidades],
            ['(-) Financeiro',  dre.atual.despesas.financeiro],
            ['(-) Marketing',   dre.atual.despesas.marketing],
            ['(-) Impostos',    dre.atual.despesas.impostos],
            ['(-) Outros',      dre.atual.despesas.outros],
          ].map(([l, v]) => <Linha key={l} label={l} valor={v} negativo={v > 0} indent />)}
          <Linha label="Total despesas"   valor={dre.atual.despesas.total}   varPct={dre.comparativo.total_despesas_var}  negrito negativo={dre.atual.despesas.total > 0} />

          <div style={{ marginTop:8 }}>
            <Linha label="= Lucro Líquido" valor={dre.atual.lucro_liquido}   varPct={dre.comparativo.lucro_liquido_var}   negrito destaque />
          </div>
          <div style={{ fontSize:13, color:G.cinza, padding:'6px 0', textAlign:'right' }}>
            Margem líquida: <strong style={{ color: dre.atual.margem_liquida_pct >= 0 ? G.verde : G.vermelho }}>{dre.atual.margem_liquida_pct}%</strong>
            {dre.comparativo.margem_liquida_var !== null && (
              <span style={{ marginLeft:8, color: dre.comparativo.margem_liquida_var >= 0 ? G.verde2 : G.vermelho, fontSize:11 }}>
                {dre.comparativo.margem_liquida_var >= 0 ? '▲' : '▼'} {Math.abs(dre.comparativo.margem_liquida_var)} pp
              </span>
            )}
          </div>
        </div>

        {/* Comparativo */}
        <div style={S.card}>
          <div style={S.h2}>Comparativo com {dre.label_anterior}</div>
          <table style={S.table}><thead><tr>
            <th style={S.th}></th>
            <th style={{ ...S.th, textAlign:'right' }}>{dre.label_atual}</th>
            <th style={{ ...S.th, textAlign:'right' }}>{dre.label_anterior}</th>
          </tr></thead><tbody>
            {[
              ['Receita Bruta',  dre.atual.receita_bruta,  dre.anterior.receita_bruta],
              ['Lucro Bruto',    dre.atual.lucro_bruto,    dre.anterior.lucro_bruto],
              ['Despesas',       dre.atual.despesas.total, dre.anterior.total_despesas],
              ['Lucro Líquido',  dre.atual.lucro_liquido,  dre.anterior.lucro_liquido],
            ].map(([l, a, b]) => (
              <tr key={l}>
                <td style={S.td}>{l}</td>
                <td style={{ ...S.td, textAlign:'right', ...S.mono, fontWeight:700 }}>{brl(a)}</td>
                <td style={{ ...S.td, textAlign:'right', ...S.mono, color:G.cinza }}>{brl(b)}</td>
              </tr>
            ))}
            <tr>
              <td style={S.td}>Margem líquida</td>
              <td style={{ ...S.td, textAlign:'right', ...S.mono, fontWeight:700, color: dre.atual.margem_liquida_pct >= 0 ? G.verde : G.vermelho }}>{dre.atual.margem_liquida_pct}%</td>
              <td style={{ ...S.td, textAlign:'right', ...S.mono, color:G.cinza }}>{dre.anterior.margem_liquida_pct}%</td>
            </tr>
          </tbody></table>
        </div>

        {/* Série mensal (trimestral/anual) */}
        {dre.serie_mensal && dre.serie_mensal.length > 0 && (
          <div style={S.card}>
            <div style={S.h2}>Evolução mensal</div>
            <table style={S.table}><thead><tr>
              <th style={S.th}>Mês</th>
              <th style={{ ...S.th, textAlign:'right' }}>Receita</th>
              <th style={{ ...S.th, textAlign:'right' }}>L. Bruto</th>
              <th style={{ ...S.th, textAlign:'right' }}>L. Líquido</th>
            </tr></thead><tbody>
              {dre.serie_mensal.map((m, i) => (
                <tr key={i}>
                  <td style={S.td}>{m.mes}</td>
                  <td style={{ ...S.td, textAlign:'right', ...S.mono }}>{brl(m.receita_bruta)}</td>
                  <td style={{ ...S.td, textAlign:'right', ...S.mono }}>{brl(m.lucro_bruto)}</td>
                  <td style={{ ...S.td, textAlign:'right', ...S.mono, fontWeight:700, color: m.lucro_liquido >= 0 ? G.verde : G.vermelho }}>{brl(m.lucro_liquido)}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </>}
    </div>
  )
}
