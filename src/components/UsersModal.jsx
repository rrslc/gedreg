import { useState } from "react";
import { LS, IS } from "../styles/shared";
import { USER0 } from "../constants/defaults";
import { uid } from "../utils/docs";

export default function UsersModal({ users, onSave, onDelete, onClose, currentUserId }) {
  const [form, setForm]   = useState(null);
  const [delId, setDelId] = useState(null);
  const [erro, setErro]   = useState("");
  const [saving, setSaving] = useState(false);

  const abrirNovo = () => { setForm({ ...USER0, id: uid() }); setErro(""); };
  const abrirEdit = (u) => { setForm({ ...u, senha: "" }); setErro(""); };

  const salvarUser = async () => {
    setErro("");
    if (!form.nome.trim())  return setErro("Nome é obrigatório.");
    if (!form.email.trim()) return setErro("E-mail é obrigatório.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) return setErro("E-mail inválido.");

    const isNew = !users.find(u => u.id === form.id);
    if (isNew && !form.senha.trim()) return setErro("Senha é obrigatória para novo usuário.");

    setSaving(true);
    const err = await onSave({
      ...form,
      nome:  form.nome.trim(),
      email: form.email.trim().toLowerCase(),
    }, isNew);
    setSaving(false);
    if (err) return setErro(err);
    setForm(null);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",overflowY:"auto",zIndex:1100}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:600,marginTop:10,marginBottom:20,position:"relative"}}>
        <div style={{background:"#1B3A5C",color:"#fff",padding:"15px 20px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:15}}>
            {form ? (users.find(u=>u.id===form.id) ? "Editar Usuário" : "Novo Usuário") : "Gerenciar Usuários"}
          </div>
          <button onClick={()=>form?setForm(null):onClose()} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:18}}>×</button>
        </div>

        {!form ? (
          <div style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
              <button onClick={abrirNovo} style={{background:"#1B3A5C",color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Novo Usuário</button>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#F8FAFC",borderBottom:"2px solid #E2E8F0"}}>
                    {["Nome","E-mail","Perfil","Ações"].map((h,i)=>(
                      <th key={i} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"9px 10px",fontWeight:600,color:"#1E293B"}}>
                        {u.nome}
                        {u.id===currentUserId && <span style={{marginLeft:6,fontSize:10,color:"#64748B",fontWeight:400}}>(você)</span>}
                      </td>
                      <td style={{padding:"9px 10px",color:"#475569",fontSize:12}}>{u.email}</td>
                      <td style={{padding:"9px 10px"}}>
                        <span style={{background:u.perfil==="admin"?"#1B3A5C":"#475569",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>
                          {u.perfil==="admin"?"Admin":"Visualizador"}
                        </span>
                      </td>
                      <td style={{padding:"9px 10px"}}>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>abrirEdit(u)} style={{background:"#EEF2F7",color:"#1B3A5C",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>Editar</button>
                          {u.id!==currentUserId && (
                            <button onClick={()=>setDelId(u.id)} style={{background:"#FEE2E2",color:"#991B1B",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Excluir</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
              <button onClick={onClose} style={{padding:"7px 20px",borderRadius:8,border:"1px solid #E2E8F0",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Fechar</button>
            </div>
          </div>
        ) : (
          <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:13}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={LS}>Nome Completo *</label>
                <input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={IS} placeholder="Nome do usuário"/>
              </div>
              <div>
                <label style={LS}>E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value.toLowerCase()})}
                  style={IS}
                  placeholder="usuario@msbbrasil.com"
                />
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={LS}>{users.find(u=>u.id===form.id)?"Nova Senha (em branco = manter)":"Senha *"}</label>
                <input type="password" value={form.senha} onChange={e=>setForm({...form,senha:e.target.value})} style={IS} placeholder="Mínimo 6 caracteres"/>
              </div>
              <div>
                <label style={LS}>Perfil de Acesso</label>
                <select value={form.perfil} onChange={e=>setForm({...form,perfil:e.target.value})} style={IS}>
                  <option value="admin">Administrador (acesso total)</option>
                  <option value="viewer">Visualizador (somente leitura)</option>
                </select>
              </div>
            </div>
            {erro && <div style={{color:"#991B1B",fontSize:13,fontWeight:600,background:"#FEE2E2",padding:"8px 12px",borderRadius:7}}>{erro}</div>}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:"1px solid #E2E8F0"}}>
              <button onClick={()=>{setForm(null);setErro("");}} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #D1D5DB",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={salvarUser} disabled={saving} style={{padding:"8px 22px",borderRadius:8,border:"none",background:saving?"#94A3B8":"#1B3A5C",color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>
                {saving?"Salvando...":"Salvar Usuário"}
              </button>
            </div>
          </div>
        )}

        {delId && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200}}>
            <div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:340,width:"90%",margin:16}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:8}}>Excluir usuário?</div>
              <div style={{color:"#64748B",fontSize:13,marginBottom:20,lineHeight:1.6}}>Esta ação não pode ser desfeita. O usuário perderá o acesso imediatamente.</div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button onClick={()=>setDelId(null)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Cancelar</button>
                <button onClick={()=>{onDelete(delId);setDelId(null);}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#991B1B",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
