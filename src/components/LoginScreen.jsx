import { useState } from "react";
import { LS, IS } from "../styles/shared";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const ok = await onLogin(email.trim(), senha);
    if (!ok) setErro("E-mail ou senha inválidos.");
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,'Segoe UI',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:16,boxShadow:"0 4px 32px rgba(0,0,0,0.12)",width:"100%",maxWidth:380,overflow:"hidden"}}>
        <div style={{background:"#1B3A5C",padding:"28px",textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.5}}>GEDREG</div>
          <div style={{fontSize:12,opacity:0.65,marginTop:4}}>Gestão de Documentos Regulatórios</div>
          <div style={{fontSize:11,opacity:0.4,marginTop:2}}>MSB Produtos Médicos</div>
        </div>
        <form onSubmit={submit} style={{padding:"26px 28px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={LS}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              style={IS}
              placeholder="raissa@msbbrasil.com"
              autoFocus
              autoComplete="email"
            />
          </div>
          <div>
            <label style={LS}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e=>setSenha(e.target.value)}
              style={IS}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {erro && (
            <div style={{background:"#FEE2E2",color:"#991B1B",fontSize:13,fontWeight:600,borderRadius:7,padding:"8px 12px",textAlign:"center"}}>
              {erro}
            </div>
          )}
          <button type="submit" disabled={loading||!email||!senha} style={{
            background:(loading||!email||!senha)?"#94A3B8":"#1B3A5C",
            color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:14,
            fontWeight:700,cursor:(loading||!email||!senha)?"not-allowed":"pointer",marginTop:2,
          }}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
