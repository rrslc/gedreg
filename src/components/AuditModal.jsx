import { useState } from "react";
import { IS } from "../styles/shared";
import { ACTION_LABELS } from "../utils/audit";
import { fmtTs } from "../utils/date";

export default function AuditModal({ audit, onClose }) {
  const [filtroAcao, setFiltroAcao] = useState("TODOS");
  const [filtroUser, setFiltroUser] = useState("TODOS");

  const users = [...new Set(audit.map(a=>a.userName))].filter(Boolean).sort();
  const acoes = [...new Set(audit.map(a=>a.acao))].filter(Boolean).sort();

  const filtered = audit
    .filter(a => filtroAcao==="TODOS" || a.acao===filtroAcao)
    .filter(a => filtroUser==="TODOS" || a.userName===filtroUser);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",overflowY:"auto",zIndex:1100}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:960,marginTop:10,marginBottom:20}}>
        <div style={{background:"#1B3A5C",color:"#fff",padding:"15px 20px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>Trilha de Auditoria</div>
            <div style={{fontSize:11,opacity:0.55,marginTop:1}}>{audit.length} registros no total</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:18}}>×</button>
        </div>

        <div style={{padding:"12px 20px",borderBottom:"1px solid #E2E8F0",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <select value={filtroAcao} onChange={e=>setFiltroAcao(e.target.value)} style={{...IS,width:"auto",fontSize:12}}>
            <option value="TODOS">Todas as ações</option>
            {acoes.map(a=><option key={a} value={a}>{ACTION_LABELS[a]?.label||a}</option>)}
          </select>
          <select value={filtroUser} onChange={e=>setFiltroUser(e.target.value)} style={{...IS,width:"auto",fontSize:12}}>
            <option value="TODOS">Todos os usuários</option>
            {users.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
          <span style={{fontSize:11,color:"#94A3B8",marginLeft:4}}>
            {filtered.length} registro{filtered.length!==1?"s":""} exibido{filtered.length!==1?"s":""}
          </span>
        </div>

        <div style={{overflowX:"auto",maxHeight:"62vh",overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,zIndex:1}}>
              <tr style={{background:"#F8FAFC",borderBottom:"2px solid #E2E8F0"}}>
                {["Data / Hora","Usuário","Ação","Documento","Detalhes"].map((h,i)=>(
                  <th key={i} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={5} style={{padding:28,textAlign:"center",color:"#94A3B8",fontSize:13}}>Nenhum registro encontrado.</td></tr>
              )}
              {filtered.map((a,i)=>{
                const ac = ACTION_LABELS[a.acao];
                return (
                  <tr key={a.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"8px 12px",whiteSpace:"nowrap",fontFamily:"monospace",fontSize:11,color:"#64748B"}}>{fmtTs(a.ts)}</td>
                    <td style={{padding:"8px 12px",fontWeight:600,color:"#1E293B",whiteSpace:"nowrap"}}>{a.userName||"—"}</td>
                    <td style={{padding:"8px 12px",whiteSpace:"nowrap"}}>
                      <span style={{background:ac?.color||"#374151",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>
                        {ac?.label||a.acao}
                      </span>
                    </td>
                    <td style={{padding:"8px 12px",color:"#374151",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.docNome||"—"}</td>
                    <td style={{padding:"8px 12px",color:"#64748B",fontSize:11,maxWidth:320}}>
                      {Array.isArray(a.detalhe)
                        ? a.detalhe.map((item,j)=>(
                            <div key={j} style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:300,lineHeight:1.6}}>{item}</div>
                          ))
                        : (a.detalhe||"—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{padding:"12px 20px",borderTop:"1px solid #E2E8F0",display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"7px 20px",borderRadius:8,border:"1px solid #E2E8F0",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
