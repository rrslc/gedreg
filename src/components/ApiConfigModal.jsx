import { useState } from "react";
import { LS, IS } from "../styles/shared";

export default function ApiConfigModal({ savedKey, onSave, onClose }) {
  const [key, setKey]         = useState(savedKey);
  const [visible, setVisible] = useState(false);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:1200}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:480,overflow:"hidden"}}>
        <div style={{background:"#1B3A5C",color:"#fff",padding:"15px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>Configurar IA — Chave de API</div>
            <div style={{fontSize:11,opacity:0.55,marginTop:1}}>Anthropic (Claude)</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"#EFF6FF",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#1E40AF",lineHeight:1.7,borderLeft:"3px solid #3B82F6"}}>
            <strong>Como obter a chave:</strong><br/>
            Acesse <strong>console.anthropic.com</strong> → crie uma conta gratuita → vá em <em>API Keys</em> → clique em <em>Create Key</em>.<br/>
            A chave fica salva apenas neste navegador (localStorage) e é usada somente para análise de documentos.
          </div>
          <div>
            <label style={LS}>Chave de API (sk-ant-...)</label>
            <div style={{display:"flex",gap:8}}>
              <input
                type={visible?"text":"password"}
                value={key}
                onChange={e=>setKey(e.target.value)}
                style={{...IS,flex:1,fontFamily:"monospace",fontSize:12}}
                placeholder="sk-ant-api03-..."
              />
              <button onClick={()=>setVisible(v=>!v)} style={{padding:"8px 12px",borderRadius:7,border:"1px solid #D1D5DB",background:"#F8FAFC",cursor:"pointer",fontSize:14}}>
                {visible?"🙈":"👁"}
              </button>
            </div>
          </div>
          {savedKey && (
            <div style={{fontSize:12,color:"#15803D",fontWeight:600}}>✓ Chave configurada anteriormente</div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:"1px solid #E2E8F0"}}>
            <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #D1D5DB",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Cancelar</button>
            <button
              onClick={()=>onSave(key.trim())}
              disabled={!key.trim()}
              style={{padding:"8px 22px",borderRadius:8,border:"none",background:key.trim()?"#1B3A5C":"#94A3B8",color:"#fff",fontSize:13,fontWeight:700,cursor:key.trim()?"pointer":"not-allowed"}}
            >
              Salvar Chave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
