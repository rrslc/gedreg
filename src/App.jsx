import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import { signIn, signOut } from "./services/auth";
import {
  fetchDocuments, upsertDocument, deleteDocument, seedDocuments,
  fetchProfiles, fetchAuditLog, insertAuditEntry,
  adminCreateUser, adminUpdateUser, adminDeleteUser,
} from "./services/database";
import { SC } from "./constants/status";
import { DOC0 } from "./constants/defaults";
import { DOCS0 } from "./data/seed";
import { calcStatus, uid } from "./utils/docs";
import { calcPrazoDate, dv, dp, fmt } from "./utils/date";
import { diffDocs } from "./utils/audit";
import LoginScreen    from "./components/LoginScreen";
import ApiConfigModal from "./components/ApiConfigModal";
import AuditModal     from "./components/AuditModal";
import UsersModal     from "./components/UsersModal";
import DocModal       from "./components/DocModal";
import DetailModal    from "./components/DetailModal";

const API_KEY_STORE = "msb-gedreg-apikey";

export default function App() {
  // ── Sessão e perfil (Supabase Auth) ─────────────────────────────────────────
  const [session, setSession]   = useState(null);
  const [profile, setProfile]   = useState(null); // { id, nome, email, perfil }

  // ── Dados ────────────────────────────────────────────────────────────────────
  const [docs, setDocs]   = useState([]);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);

  // ── Carregamento ─────────────────────────────────────────────────────────────
  const [ready, setReady]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroGlobal, setErroGlobal] = useState("");

  // ── UI ───────────────────────────────────────────────────────────────────────
  const [modalMode, setModalMode]         = useState(null);
  const [modalForm, setModalForm]         = useState(DOC0);
  const [filtro, setFiltro]               = useState("TODOS");
  const [aOpen, setAOpen]                 = useState(true);
  const [del, setDel]                     = useState(null);
  const [det, setDet]                     = useState(null);
  const [showAudit, setShowAudit]         = useState(false);
  const [showUsers, setShowUsers]         = useState(false);
  const [apiKey, setApiKey]               = useState("");
  const [showApiConfig, setShowApiConfig] = useState(false);

  // ── Carregar dados após login ─────────────────────────────────────────────────
  const loadData = useCallback(async (sess) => {
    setLoading(true);
    try {
      // Perfil do usuário logado
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sess.user.id)
        .single();
      setProfile({ ...prof, email: sess.user.email });

      // Documentos (com seed automático se banco estiver vazio)
      const docData = await fetchDocuments();
      if (docData.length === 0) {
        await seedDocuments(DOCS0);
        setDocs(DOCS0);
      } else {
        setDocs(docData);
      }

      // Lista de perfis (para admin)
      const profilesData = await fetchProfiles();
      setUsers(profilesData);

      // Chave de API da IA (local, não vai ao banco)
      setApiKey(localStorage.getItem(API_KEY_STORE) || "");
    } catch (err) {
      setErroGlobal("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  // ── Auth state ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadData(s);
      else setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadData(s);
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // ── Auditoria ────────────────────────────────────────────────────────────────
  const addAuditEntry = useCallback(async (acao, docId, docNome, detalhe) => {
    const entry = {
      id:       "a" + uid(),
      ts:       new Date().toISOString(),
      userId:   session?.user?.id || "",
      userName: profile?.nome || session?.user?.email || "",
      acao,
      docId:    docId   || "",
      docNome:  docNome || "",
      detalhe:  detalhe || "",
    };
    setAudit(prev => [entry, ...prev]);
    try { await insertAuditEntry(entry); } catch {}
  }, [session, profile]);

  // ── Login / Logout ───────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      await signIn(email, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await addAuditEntry("LOGOUT", "", "", "");
    await signOut();
    setProfile(null);
    setDocs([]);
    setUsers([]);
    setAudit([]);
    setReady(false);
  };

  const isAdmin = profile?.perfil === "admin";

  // ── Documentos ───────────────────────────────────────────────────────────────
  const abrirNovo = () => { setModalForm({ ...DOC0, id: uid() }); setModalMode("novo"); };
  const abrirEdit = (doc) => { setModalForm({ ...doc, checklistRenovacao: doc.checklistRenovacao || [] }); setModalMode("editar"); };

  const salvar = async (form) => {
    if (!form.descricao.trim()) return;
    const i = docs.findIndex(d => d.id === form.id);
    if (i >= 0) {
      const changes = diffDocs(docs[i], form);
      await addAuditEntry("EDITAR_DOC", form.id, form.descricao, changes.length ? changes : ["Nenhuma alteração detectada"]);
      setDocs(prev => { const n = [...prev]; n[i] = { ...form }; return n; });
    } else {
      await addAuditEntry("CRIAR_DOC", form.id, form.descricao, "Documento criado");
      setDocs(prev => [...prev, { ...form }]);
    }
    setModalMode(null);
    try { await upsertDocument(form); } catch (err) { setErroGlobal(err.message); }
  };

  const excluir = async (id) => {
    const doc = docs.find(d => d.id === id);
    if (doc) await addAuditEntry("EXCLUIR_DOC", id, doc.descricao, "Documento excluído permanentemente");
    setDocs(prev => prev.filter(d => d.id !== id));
    setDel(null);
    try { await deleteDocument(id); } catch (err) { setErroGlobal(err.message); }
  };

  const resetar = async () => {
    await addAuditEntry("RESTAURAR", "", "", "Dados restaurados para versão inicial importada da planilha");
    setDocs(DOCS0);
    setDel(null);
    try { await seedDocuments(DOCS0); } catch (err) { setErroGlobal(err.message); }
  };

  // ── Usuários ─────────────────────────────────────────────────────────────────
  const salvarUser = async (u, isNew) => {
    try {
      if (isNew) {
        await adminCreateUser(u);
      } else {
        await adminUpdateUser(u);
      }
      await addAuditEntry(
        isNew ? "CRIAR_USUARIO" : "EDITAR_USUARIO",
        u.id, u.nome,
        `Perfil: ${u.perfil === "admin" ? "Administrador" : "Visualizador"} | E-mail: ${u.email}`
      );
      const profilesData = await fetchProfiles();
      setUsers(profilesData);
      return null; // sem erro
    } catch (err) {
      return err.message; // retorna string de erro para o modal exibir
    }
  };

  const excluirUser = async (id) => {
    const u = users.find(x => x.id === id);
    if (u) await addAuditEntry("EXCLUIR_USUARIO", id, u.nome, `E-mail: ${u.email}`);
    try {
      await adminDeleteUser(id);
      setUsers(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      setErroGlobal(err.message);
    }
  };

  const handleOpenAudit = async () => {
    try {
      const auditData = await fetchAuditLog();
      setAudit(auditData);
    } catch {}
    setShowAudit(true);
  };

  // ── Guard: Supabase não configurado ─────────────────────────────────────────
  if (!supabaseConfigured) return (
    <div style={{minHeight:"100vh",background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,'Segoe UI',system-ui,sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:16,boxShadow:"0 4px 32px rgba(0,0,0,0.12)",width:"100%",maxWidth:480,overflow:"hidden"}}>
        <div style={{background:"#1B3A5C",padding:"24px",textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:22,fontWeight:800}}>GEDREG</div>
          <div style={{fontSize:12,opacity:0.55,marginTop:4}}>MSB Produtos Médicos</div>
        </div>
        <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"#FEF3C7",borderRadius:8,padding:"12px 14px",borderLeft:"3px solid #F59E0B",fontSize:13,color:"#92400E",lineHeight:1.7}}>
            <strong>Configuração necessária</strong><br/>
            Crie o arquivo <code style={{background:"#FDE68A",padding:"1px 5px",borderRadius:3}}>.env</code> na pasta do projeto com as credenciais do Supabase:
          </div>
          <div style={{background:"#1E293B",borderRadius:8,padding:"12px 16px",fontFamily:"monospace",fontSize:12,color:"#E2E8F0",lineHeight:2}}>
            <div style={{color:"#94A3B8"}}># .env</div>
            <div>VITE_SUPABASE_URL=https://xxxx.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=eyJhbGci...</div>
          </div>
          <div style={{fontSize:12,color:"#64748B",lineHeight:1.7}}>
            Obtenha essas credenciais em <strong>app.supabase.com</strong> → seu projeto → <em>Project Settings → API</em>.
          </div>
          <button onClick={()=>window.location.reload()} style={{background:"#1B3A5C",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            Recarregar após configurar
          </button>
        </div>
      </div>
    </div>
  );

  // ── Guards de render ─────────────────────────────────────────────────────────
  if (!ready || loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#EEF2F7",color:"#1B3A5C",fontSize:16,flexDirection:"column",gap:12}}>
      <div style={{fontSize:22,fontWeight:700}}>GEDREG</div>
      <div style={{fontSize:14,opacity:0.6}}>Carregando...</div>
    </div>
  );

  if (!session) return <LoginScreen onLogin={login} />;

  // ── Estado derivado ──────────────────────────────────────────────────────────
  const enr = docs.map(d => ({ ...d, _st: calcStatus(d), _pr: calcPrazoDate(d) }));

  const cnt = {
    tot: docs.length,
    ime: enr.filter(d => ["VENCIDO","ATRASADO","CRITICO"].includes(d._st)).length,
    ate: enr.filter(d => ["ATENCAO","ALERTA"].includes(d._st)).length,
    reg: enr.filter(d => d._st === "REGULAR").length,
    sem: enr.filter(d => ["AUTOMATICO","INDETERMINADO"].includes(d._st)).length,
  };

  const alertas = enr
    .filter(d => ["VENCIDO","ATRASADO","CRITICO","ATENCAO"].includes(d._st))
    .sort((a, b) => SC[b._st].pri - SC[a._st].pri);

  const filtrado = enr
    .filter(d => filtro === "TODOS" || d._st === filtro)
    .sort((a, b) => {
      const pa = SC[a._st]?.pri ?? 0, pb = SC[b._st]?.pri ?? 0;
      if (pb !== pa) return pb - pa;
      return (dv(a) ?? 9999) - (dv(b) ?? 9999);
    });

  const hoje = new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });

  return (
    <div style={{fontFamily:"Inter,'Segoe UI',system-ui,sans-serif",background:"#EEF2F7",minHeight:"100vh"}}>

      {/* BANNER DE ERRO GLOBAL */}
      {erroGlobal && (
        <div style={{background:"#FEE2E2",color:"#991B1B",padding:"10px 22px",fontSize:13,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Erro: {erroGlobal}</span>
          <button onClick={()=>setErroGlobal("")} style={{background:"none",border:"none",color:"#991B1B",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:"#1B3A5C",color:"#fff",padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.4}}>
            GEDREG <span style={{fontWeight:300,opacity:0.55,fontSize:13}}>— MSB Produtos Médicos</span>
          </div>
          <div style={{fontSize:11,opacity:0.6,marginTop:2}}>Gestão de Documentos Regulatórios Obrigatórios</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{fontSize:11,opacity:0.6,textAlign:"right"}}>
            <div>Referência</div>
            <div style={{fontWeight:600,opacity:0.9,fontSize:13}}>{hoje}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"6px 12px",lineHeight:1.4}}>
            <div style={{fontSize:12,fontWeight:600}}>{profile?.nome || profile?.email}</div>
            <div style={{fontSize:10,opacity:0.55,textTransform:"uppercase",letterSpacing:"0.05em"}}>
              {profile?.perfil === "admin" ? "Admin" : "Visualizador"}
            </div>
          </div>
          {isAdmin && (
            <>
              <button onClick={()=>setShowApiConfig(true)} title="Configurar análise com IA"
                style={{background:apiKey?"rgba(245,158,11,0.18)":"rgba(255,255,255,0.1)",color:apiKey?"#FCD34D":"rgba(255,255,255,0.7)",border:`1px solid ${apiKey?"#F59E0B":"transparent"}`,borderRadius:7,padding:"7px 13px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {apiKey ? "IA ✓" : "IA"}
              </button>
              <button onClick={handleOpenAudit}
                style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:7,padding:"7px 13px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Auditoria
              </button>
              <button onClick={()=>setShowUsers(true)}
                style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:7,padding:"7px 13px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Usuários
              </button>
              <button onClick={abrirNovo}
                style={{background:"#F59E0B",color:"#fff",border:"none",borderRadius:8,padding:"8px 15px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                + Novo Documento
              </button>
            </>
          )}
          <button onClick={logout}
            style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,padding:"7px 13px",fontSize:12,cursor:"pointer"}}>
            Sair
          </button>
        </div>
      </div>

      <div style={{padding:"18px 22px",maxWidth:1440,margin:"0 auto"}}>

        {/* CARDS RESUMO */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
          {[
            {label:"Total cadastrado", val:cnt.tot, bg:"#1B3A5C", sub:"documentos"},
            {label:"Ação imediata",    val:cnt.ime, bg:"#991B1B", sub:"vencido / crítico"},
            {label:"Requer atenção",   val:cnt.ate, bg:"#92400E", sub:"atenção / alerta"},
            {label:"Regulares",        val:cnt.reg, bg:"#14532D", sub:"sem pendências"},
            {label:"Sem vencimento",   val:cnt.sem, bg:"#374151", sub:"automático / indef."},
          ].map((c,i)=>(
            <div key={i} style={{background:c.bg,color:"#fff",borderRadius:12,padding:"14px 15px"}}>
              <div style={{fontSize:38,fontWeight:800,lineHeight:1}}>{c.val}</div>
              <div style={{fontSize:11,fontWeight:700,marginTop:6,opacity:0.9,textTransform:"uppercase",letterSpacing:"0.04em",lineHeight:1.3}}>{c.label}</div>
              <div style={{fontSize:10,opacity:0.55,marginTop:2}}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* PAINEL DE ALERTAS */}
        {alertas.length > 0 && (
          <div style={{background:"#fffbf0",border:"1px solid #FCD34D",borderRadius:12,marginBottom:18,overflow:"hidden"}}>
            <div onClick={()=>setAOpen(v=>!v)} style={{padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <span style={{fontWeight:700,color:"#92400E",fontSize:13}}>
                ⚠  DOCUMENTOS COM PENDÊNCIA DE RENOVAÇÃO ({alertas.length})
              </span>
              <span style={{color:"#92400E",fontSize:14,userSelect:"none"}}>{aOpen?"▲":"▼"}</span>
            </div>
            {aOpen && alertas.map((doc, idx) => {
              const s = SC[doc._st], dvv = dv(doc), dpp = dp(doc);
              return (
                <div key={doc.id} style={{borderTop:"1px solid #FDE68A",padding:"9px 16px",display:"flex",alignItems:"center",gap:10,background:idx%2===0?"#fffbf0":"#fff9e8"}}>
                  <span style={{background:s.bg,color:s.txt,padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:700,whiteSpace:"nowrap",minWidth:126,textAlign:"center",letterSpacing:"0.04em"}}>
                    {s.label}
                  </span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:"#1E293B",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.descricao}</div>
                    <div style={{fontSize:11,color:"#64748B",marginTop:1}}>{doc.orgao} · {doc.legislacaoBase}</div>
                  </div>
                  <div style={{textAlign:"right",fontSize:12,flexShrink:0,lineHeight:1.5}}>
                    {doc._st==="VENCIDO"  && <b style={{color:"#991B1B",display:"block"}}>Vencido há {Math.abs(dvv)} dia{Math.abs(dvv)!==1?"s":""}</b>}
                    {doc._st==="ATRASADO" && <><b style={{color:"#9A3412",display:"block"}}>Prazo venceu há {Math.abs(dpp)} dia{Math.abs(dpp)!==1?"s":""}</b><span style={{color:"#64748B"}}>Doc. válido até {fmt(doc.dataValidade)} ({dvv}d)</span></>}
                    {doc._st==="CRITICO"  && <><b style={{color:"#C2410C",display:"block"}}>Prazo em {dpp} dia{dpp!==1?"s":""}</b><span style={{color:"#64748B"}}>Válido até {fmt(doc.dataValidade)}</span></>}
                    {doc._st==="ATENCAO"  && <><b style={{color:"#B45309",display:"block"}}>Prazo em {dpp} dias</b><span style={{color:"#64748B"}}>Válido até {fmt(doc.dataValidade)}</span></>}
                  </div>
                  {isAdmin && (
                    <button onClick={()=>abrirEdit(doc)} style={{background:"#1B3A5C",color:"#fff",border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,cursor:"pointer",flexShrink:0}}>Editar</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* FILTROS */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {["TODOS",...Object.keys(SC)].map(f => {
            const count = f==="TODOS" ? docs.length : enr.filter(d=>d._st===f).length;
            const s = SC[f];
            const active = filtro === f;
            return (
              <button key={f} onClick={()=>setFiltro(f)} style={{
                padding:"5px 11px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",
                background:active?(f==="TODOS"?"#1B3A5C":s.bg):"#fff",
                color:active?"#fff":"#64748B",
                border:`1px solid ${active?"transparent":"#E2E8F0"}`,
              }}>
                {f==="TODOS" ? `Todos (${count})` : `${s.label} (${count})`}
              </button>
            );
          })}
        </div>

        {/* TABELA */}
        <div style={{background:"#fff",borderRadius:12,overflow:"hidden",border:"1px solid #E2E8F0"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
              <thead>
                <tr style={{background:"#F8FAFC",borderBottom:"2px solid #E2E8F0"}}>
                  {["Documento / Base Legal","Órgão","Emissão","Validade","Prazo Solicitação","Dias Validade","Status","Ações"].map((h,i)=>(
                    <th key={i} style={{padding:"9px 11px",textAlign:i>=2&&i<=5?"center":"left",fontSize:10,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrado.map((doc, idx) => {
                  const s = SC[doc._st], dvv = dv(doc), dpp = dp(doc);
                  return (
                    <tr key={doc.id} style={{borderBottom:"1px solid #F1F5F9",background:idx%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"9px 11px",maxWidth:280}}>
                        <div style={{fontWeight:600,color:"#1E293B",lineHeight:1.3}}>{doc.descricao}</div>
                        {doc.legislacaoBase && <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{doc.legislacaoBase}</div>}
                      </td>
                      <td style={{padding:"9px 11px",maxWidth:190}}>
                        <div style={{fontSize:11.5,color:"#475569",lineHeight:1.3}}>{doc.orgao||"—"}</div>
                      </td>
                      <td style={{padding:"9px 11px",textAlign:"center",fontFamily:"monospace",fontSize:12,color:"#64748B",whiteSpace:"nowrap"}}>
                        {fmt(doc.dataEmissao)}
                      </td>
                      <td style={{padding:"9px 11px",textAlign:"center",fontFamily:"monospace",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:dvv!==null&&dvv<60?"#991B1B":"#1E293B"}}>
                        {fmt(doc.dataValidade)}
                        {dvv!==null&&dvv<90&&dvv>=0 && <div style={{fontSize:9,color:"#C2410C",fontFamily:"sans-serif",fontWeight:700,marginTop:1}}>em {dvv}d</div>}
                        {dvv!==null&&dvv<0           && <div style={{fontSize:9,color:"#991B1B",fontFamily:"sans-serif",fontWeight:700,marginTop:1}}>há {Math.abs(dvv)}d</div>}
                      </td>
                      <td style={{padding:"9px 11px",textAlign:"center",whiteSpace:"nowrap"}}>
                        {doc.renovacaoAutomatica
                          ? <span style={{fontSize:11,color:"#6B7280",fontStyle:"italic"}}>Automática</span>
                          : doc._pr
                            ? <div>
                                <div style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:dpp!==null&&dpp<0?"#991B1B":dpp!==null&&dpp<=30?"#C2410C":"#1E293B"}}>
                                  {fmt(doc._pr)}
                                </div>
                                {dpp!==null && <div style={{fontSize:9,fontWeight:700,color:dpp<0?"#991B1B":dpp<=30?"#C2410C":dpp<=60?"#B45309":"#94A3B8",marginTop:1}}>
                                  {dpp<0?`${Math.abs(dpp)}d atrás`:`em ${dpp}d`}
                                </div>}
                                <div style={{fontSize:9,color:"#CBD5E1",marginTop:1}}>{doc.prazoAntecedenciaDias}d antes</div>
                              </div>
                            : <span style={{color:"#94A3B8"}}>—</span>
                        }
                      </td>
                      <td style={{padding:"9px 11px",textAlign:"center"}}>
                        {dvv !== null
                          ? <span style={{fontWeight:800,fontSize:15,color:dvv<0?"#991B1B":dvv<60?"#C2410C":"#15803D"}}>{dvv<0?`−${Math.abs(dvv)}`:dvv}</span>
                          : <span style={{color:"#94A3B8",fontSize:18}}>∞</span>
                        }
                      </td>
                      <td style={{padding:"9px 11px"}}>
                        <span style={{background:s.bg,color:s.txt,padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:700,whiteSpace:"nowrap",letterSpacing:"0.04em"}}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{padding:"9px 11px"}}>
                        <div style={{display:"flex",gap:5,flexWrap:"nowrap"}}>
                          {doc.link && <a href={doc.link} target="_blank" rel="noreferrer" title="Abrir portal" style={{background:"#EEF2F7",color:"#1B3A5C",borderRadius:5,padding:"4px 7px",fontSize:11,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>↗</a>}
                          <button onClick={()=>setDet(doc)} title="Detalhes" style={{background:"#EEF2F7",color:"#1B3A5C",border:"none",borderRadius:5,padding:"4px 7px",fontSize:11,cursor:"pointer"}}>ℹ</button>
                          {isAdmin && (
                            <>
                              <button onClick={()=>abrirEdit(doc)} style={{background:"#EEF2F7",color:"#1B3A5C",border:"none",borderRadius:5,padding:"4px 7px",fontSize:11,cursor:"pointer",fontWeight:600}}>Editar</button>
                              <button onClick={()=>setDel(doc.id)} title="Excluir" style={{background:"#FEE2E2",color:"#991B1B",border:"none",borderRadius:5,padding:"4px 7px",fontSize:11,cursor:"pointer"}}>✕</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtrado.length === 0 && (
                  <tr><td colSpan={8} style={{padding:28,textAlign:"center",color:"#94A3B8",fontSize:13}}>Nenhum documento para o filtro selecionado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LEGENDA + RESTAURAR */}
        <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:"#94A3B8",fontWeight:700,marginRight:3,textTransform:"uppercase"}}>Legenda:</span>
            {Object.entries(SC).map(([k,s])=>(
              <span key={k} style={{background:s.bg,color:s.txt,padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:"0.04em"}}>{s.label}</span>
            ))}
          </div>
          {isAdmin && (
            <button onClick={()=>setDel("__RESET__")} style={{background:"none",border:"1px dashed #CBD5E1",color:"#94A3B8",borderRadius:4,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>
              Restaurar dados iniciais
            </button>
          )}
        </div>

        {/* NOTA LEGAL */}
        <div style={{marginTop:14,padding:"10px 14px",background:"#F0F4F8",borderRadius:8,borderLeft:"3px solid #94A3B8",fontSize:11,color:"#64748B",lineHeight:1.7}}>
          <strong>Critérios de alerta fundamentados em legislação vigente:</strong> CONAMA 237/97 Art. 18 § único (LU — 120 dias) · RDC 665/2022 / ISO 13485 (CBPF — 120 dias) · RDC 848/2024 / ANVISA (CLF — 60 dias) · VISA Municipal (Alvará Sanitário — 120 dias) · FISPROCEM/PCBA (Certidão Pol. Civil — 30 dias) · Demais prazos baseados em boas práticas regulatórias.
          <br/>
          <strong>ATRASADO:</strong> prazo para protocolar a renovação já venceu, mas o documento ainda está vigente. Requer ação imediata para evitar gap de cobertura documental.
        </div>
      </div>

      {/* MODAL ADD/EDIT */}
      {modalMode && (
        <DocModal
          mode={modalMode}
          initialForm={modalForm}
          apiKey={apiKey}
          onSave={salvar}
          onClose={()=>setModalMode(null)}
          onOpenApiConfig={()=>{ setModalMode(null); setShowApiConfig(true); }}
        />
      )}

      {/* MODAL DETALHES */}
      {det && (
        <DetailModal
          doc={det}
          isAdmin={isAdmin}
          onEdit={(doc)=>{ abrirEdit(doc); setDet(null); }}
          onClose={()=>setDet(null)}
        />
      )}

      {/* CONFIRMAR EXCLUSÃO / RESET */}
      {del && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1002}}>
          <div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:360,width:"90%"}}>
            <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:8}}>
              {del==="__RESET__" ? "Restaurar dados iniciais?" : "Excluir documento?"}
            </div>
            <div style={{color:"#64748B",fontSize:13,marginBottom:20,lineHeight:1.6}}>
              {del==="__RESET__"
                ? "Todos os dados no banco serão substituídos pelos 11 documentos originais. Esta ação não pode ser desfeita."
                : "Este documento será removido permanentemente do banco de dados."}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setDel(null)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>del==="__RESET__" ? resetar() : excluir(del)}
                style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#991B1B",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {del==="__RESET__" ? "Restaurar" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO IA */}
      {showApiConfig && (
        <ApiConfigModal
          savedKey={apiKey}
          onSave={key => { localStorage.setItem(API_KEY_STORE, key); setApiKey(key); setShowApiConfig(false); }}
          onClose={()=>setShowApiConfig(false)}
        />
      )}

      {/* MODAL AUDITORIA */}
      {showAudit && <AuditModal audit={audit} onClose={()=>setShowAudit(false)} />}

      {/* MODAL USUÁRIOS */}
      {showUsers && (
        <UsersModal
          users={users}
          onSave={salvarUser}
          onDelete={excluirUser}
          onClose={()=>setShowUsers(false)}
          currentUserId={session?.user?.id}
        />
      )}

    </div>
  );
}
