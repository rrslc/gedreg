import { SC } from "../constants/status";
import { fmt, dv } from "../utils/date";

export default function DetailModal({ doc, isAdmin, onEdit, onClose }) {
  const dvv = dv(doc);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:1001}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:500}}>
        <div style={{background:"#1B3A5C",color:"#fff",padding:"13px 18px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14}}>Detalhes do Documento</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:16}}>×</button>
        </div>

        <div style={{padding:"16px 20px"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:6,lineHeight:1.3}}>{doc.descricao}</div>
          <span style={{background:SC[doc._st].bg,color:SC[doc._st].txt,padding:"3px 9px",borderRadius:5,fontSize:11,fontWeight:700,letterSpacing:"0.04em"}}>{SC[doc._st].label}</span>

          {doc.dataEmissao&&doc.dataValidade&&doc._pr && (() => {
            const start  = new Date(doc.dataEmissao);
            const end    = new Date(doc.dataValidade);
            const prazo  = new Date(doc._pr);
            const hoje2  = new Date();
            const total  = end - start;
            const todayPct = Math.min(100, Math.max(0, (hoje2 - start) / total * 100));
            const prazoPct = Math.max(0, (prazo - start) / total * 100);
            return (
              <div style={{marginTop:14,marginBottom:10}}>
                <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Linha do Tempo</div>
                <div style={{position:"relative",height:8,background:"#E2E8F0",borderRadius:4,overflow:"visible"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${todayPct}%`,background:todayPct>prazoPct?"#991B1B":"#15803D",borderRadius:4,transition:"width 0.3s"}}/>
                  <div title={`Prazo: ${fmt(doc._pr)}`} style={{position:"absolute",left:`${prazoPct}%`,top:-3,width:3,height:14,background:"#F59E0B",borderRadius:2,zIndex:2}}/>
                  <div title="Hoje" style={{position:"absolute",left:`calc(${todayPct}% - 5px)`,top:-4,width:8,height:16,background:"#374151",borderRadius:2,zIndex:3}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#94A3B8",marginTop:4,fontFamily:"monospace"}}>
                  <span>{fmt(doc.dataEmissao)}</span>
                  <span style={{color:"#F59E0B",fontWeight:700}}>▲ Prazo {fmt(doc._pr)}</span>
                  <span>{fmt(doc.dataValidade)}</span>
                </div>
              </div>
            );
          })()}

          <table style={{marginTop:10,width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
            {[
              ["Órgão",           doc.orgao],
              ["Base Legal",      doc.legislacaoBase],
              ["Emissão",         fmt(doc.dataEmissao)],
              ["Validade",        doc.dataValidade ? `${fmt(doc.dataValidade)} (${dvv} dias)` : "Indeterminada"],
              ["Prazo solicitação", doc.renovacaoAutomatica ? "Automática" : doc._pr ? `${fmt(doc._pr)} (${doc.prazoAntecedenciaDias} dias antes)` : "—"],
              ["Período renovação", doc.renovacaoPeriodo],
            ].map(([k,v])=>(
              <tr key={k} style={{borderBottom:"1px solid #F1F5F9"}}>
                <td style={{padding:"7px 0",fontWeight:700,color:"#64748B",fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",width:"38%"}}>{k}</td>
                <td style={{padding:"7px 0",color:"#1E293B"}}>{v||"—"}</td>
              </tr>
            ))}
          </table>

          {doc.observacao && (
            <div style={{marginTop:12,background:"#F8FAFC",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#475569",lineHeight:1.65,borderLeft:"3px solid #CBD5E1",whiteSpace:"pre-wrap"}}>
              {doc.observacao}
            </div>
          )}

          {(doc.checklistRenovacao||[]).length>0 && (
            <div style={{marginTop:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>
                Checklist de Renovação
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {doc.checklistRenovacao.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"6px 10px",borderRadius:6,background:i%2===0?"#F8FAFC":"#fff",border:"1px solid #F1F5F9"}}>
                    <span style={{background:"#1B3A5C",color:"#fff",borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px",flexShrink:0,marginTop:1}}>{i+1}</span>
                    <span style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.link && (
            <div style={{marginTop:10}}>
              <a href={doc.link} target="_blank" rel="noreferrer" style={{color:"#2563EB",fontSize:12,wordBreak:"break-all"}}>
                ↗ {doc.link}
              </a>
            </div>
          )}

          <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"flex-end"}}>
            {isAdmin && (
              <button onClick={()=>onEdit(doc)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#1B3A5C",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Editar</button>
            )}
            <button onClick={onClose} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"#fff",color:"#374151",fontSize:12,cursor:"pointer"}}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
