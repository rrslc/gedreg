import { useState, useRef } from "react";
import { LS, IS } from "../styles/shared";
import { PERIODOS } from "../constants/status";
import { fmt, calcPrazoDate } from "../utils/date";
import { analyzeDocument } from "../services/aiAnalysis";

export default function DocModal({ mode, initialForm, apiKey, onSave, onClose, onOpenApiConfig }) {
  const [form, setForm]               = useState(initialForm);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeOk, setAnalyzeOk]     = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [novoChecklist, setNovoChecklist] = useState("");
  const fileInputRef      = useRef(null);
  const checklistInputRef = useRef(null);

  const resetUpload = () => { setUploadedFile(null); setAnalyzeError(""); setAnalyzeOk(false); };

  const addChecklistItem = () => {
    const item = novoChecklist.trim();
    if (!item) return;
    setForm(prev => ({ ...prev, checklistRenovacao: [...(prev.checklistRenovacao||[]), item] }));
    setNovoChecklist("");
    checklistInputRef.current?.focus();
  };

  const removeChecklistItem = (i) => {
    setForm(prev => ({ ...prev, checklistRenovacao: prev.checklistRenovacao.filter((_,j)=>j!==i) }));
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !apiKey) return;
    setAnalyzing(true); setAnalyzeError(""); setAnalyzeOk(false);
    try {
      const data = await analyzeDocument(uploadedFile, apiKey);
      setForm(prev => ({
        ...prev,
        descricao:             data.descricao             || prev.descricao,
        orgao:                 data.orgao                 || prev.orgao,
        dataEmissao:           data.dataEmissao           || prev.dataEmissao,
        dataValidade:          data.dataValidade          ?? prev.dataValidade,
        legislacaoBase:        data.legislacaoBase        || prev.legislacaoBase,
        prazoAntecedenciaDias: data.prazoAntecedenciaDias || prev.prazoAntecedenciaDias,
        renovacaoAutomatica:   data.renovacaoAutomatica   ?? prev.renovacaoAutomatica,
        observacao:            data.observacao            || prev.observacao,
        checklistRenovacao:    Array.isArray(data.checklistRenovacao) && data.checklistRenovacao.length
                                 ? data.checklistRenovacao
                                 : (prev.checklistRenovacao || []),
      }));
      setAnalyzeOk(true);
      resetUpload();
    } catch (err) {
      setAnalyzeError(err.message || "Erro ao analisar. Verifique a chave de API e tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",overflowY:"auto",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,marginTop:10,marginBottom:20}}>
        <div style={{background:"#1B3A5C",color:"#fff",padding:"15px 20px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>{mode==="novo"?"Novo Documento":"Editar Documento"}</div>
            <div style={{fontSize:11,opacity:0.55,marginTop:1}}>GEDREG — MSB Produtos Médicos</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:18}}>×</button>
        </div>

        <div style={{padding:20,display:"flex",flexDirection:"column",gap:13}}>
          {/* SEÇÃO IA */}
          <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>
              Analisar documento com IA {!apiKey && <span style={{color:"#F59E0B",fontWeight:400,textTransform:"none",letterSpacing:0}}> — configure a chave de API primeiro</span>}
            </div>

            {!apiKey ? (
              <button onClick={onOpenApiConfig}
                style={{background:"#F59E0B",color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Configurar Chave de API
              </button>
            ) : (
              <>
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f){setUploadedFile(f);setAnalyzeOk(false);setAnalyzeError("");}}}
                  onClick={()=>fileInputRef.current?.click()}
                  style={{border:`2px dashed ${dragOver?"#1B3A5C":"#CBD5E1"}`,borderRadius:8,padding:"14px",textAlign:"center",cursor:"pointer",background:dragOver?"#EEF2F7":"#fff",transition:"all 0.15s",marginBottom:8}}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={e=>{const f=e.target.files[0];if(f){setUploadedFile(f);setAnalyzeOk(false);setAnalyzeError("");}}}
                    style={{display:"none"}}/>
                  {uploadedFile
                    ? <div style={{fontSize:13,color:"#1E293B",fontWeight:600}}>
                        📄 {uploadedFile.name}
                        <span style={{fontSize:11,color:"#64748B",fontWeight:400,marginLeft:6}}>({(uploadedFile.size/1024).toFixed(0)} KB)</span>
                      </div>
                    : <div>
                        <div style={{fontSize:13,color:"#64748B"}}>📄 Arraste o documento ou <u>clique para selecionar</u></div>
                        <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>PDF, JPG, PNG, WEBP — máx. 5 MB</div>
                      </div>
                  }
                </div>

                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <button onClick={handleAnalyze} disabled={!uploadedFile||analyzing}
                    style={{background:(!uploadedFile||analyzing)?"#94A3B8":"#1B3A5C",color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:(!uploadedFile||analyzing)?"not-allowed":"pointer"}}>
                    {analyzing ? "Analisando..." : "Analisar com IA"}
                  </button>
                  {analyzing   && <span style={{fontSize:12,color:"#64748B"}}>Aguarde, processando o documento...</span>}
                  {analyzeOk   && <span style={{fontSize:12,color:"#15803D",fontWeight:600}}>✓ Campos preenchidos automaticamente. Revise antes de salvar.</span>}
                  {analyzeError && <span style={{fontSize:12,color:"#991B1B",fontWeight:600}}>✗ {analyzeError}</span>}
                </div>
              </>
            )}
          </div>

          <div>
            <label style={LS}>Descrição do Documento *</label>
            <input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} style={IS} placeholder="Ex: Alvará de Funcionamento"/>
          </div>
          <div>
            <label style={LS}>Órgão Responsável</label>
            <input value={form.orgao} onChange={e=>setForm({...form,orgao:e.target.value})} style={IS} placeholder="Ex: ANVISA, Prefeitura Municipal, CBMBA..."/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={LS}>Data de Emissão</label>
              <input type="date" value={form.dataEmissao} onChange={e=>setForm({...form,dataEmissao:e.target.value})} style={IS}/>
            </div>
            <div>
              <label style={LS}>Período de Renovação</label>
              <select value={form.renovacaoPeriodo} onChange={e=>setForm({...form,renovacaoPeriodo:e.target.value})} style={IS}>
                {PERIODOS.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={LS}>Data de Validade</label>
              <input type="date" value={form.dataValidade||""} onChange={e=>setForm({...form,dataValidade:e.target.value||null})} style={IS}/>
            </div>
            <div>
              <label style={LS}>Antecedência para Alerta (dias)</label>
              <input type="number" value={form.prazoAntecedenciaDias} min={1} max={365}
                onChange={e=>setForm({...form,prazoAntecedenciaDias:parseInt(e.target.value)||60})} style={IS}/>
              {form.dataValidade&&!form.renovacaoAutomatica && (
                <div style={{fontSize:10,color:"#2563EB",marginTop:3,fontWeight:600}}>
                  Prazo calculado: {fmt(calcPrazoDate(form))}
                </div>
              )}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={LS}>Base Legal</label>
              <input value={form.legislacaoBase} onChange={e=>setForm({...form,legislacaoBase:e.target.value})} style={IS} placeholder="Ex: RDC 665/2022, CONAMA 237/97..."/>
            </div>
            <div>
              <label style={LS}>Link / Portal</label>
              <input value={form.link} onChange={e=>setForm({...form,link:e.target.value})} style={IS} placeholder="https://..."/>
            </div>
          </div>

          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#374151",fontWeight:600}}>
            <input type="checkbox" checked={form.renovacaoAutomatica} onChange={e=>setForm({...form,renovacaoAutomatica:e.target.checked})} style={{width:16,height:16}}/>
            Renovação automática (dispensa protocolo manual de renovação)
          </label>

          <div>
            <label style={LS}>Observações / Procedimentos de Renovação</label>
            <textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} rows={3}
              style={{...IS,resize:"vertical",fontFamily:"inherit"}} placeholder="Contatos, procedimentos específicos, informações adicionais..."/>
          </div>

          {/* CHECKLIST DE RENOVAÇÃO */}
          <div>
            <label style={LS}>Checklist de Renovação</label>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",border:"1px solid #E2E8F0",display:"flex",flexDirection:"column",gap:6}}>
              {(form.checklistRenovacao||[]).length===0 && (
                <div style={{fontSize:12,color:"#94A3B8",fontStyle:"italic"}}>Nenhum passo cadastrado ainda.</div>
              )}
              {(form.checklistRenovacao||[]).map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,background:"#fff",borderRadius:6,padding:"6px 10px",border:"1px solid #E2E8F0"}}>
                  <span style={{color:"#1B3A5C",fontWeight:700,fontSize:11,marginTop:1,flexShrink:0}}>{String(i+1).padStart(2,"0")}.</span>
                  <span style={{flex:1,fontSize:12.5,color:"#374151",lineHeight:1.5}}>{item}</span>
                  <button onClick={()=>removeChecklistItem(i)} title="Remover"
                    style={{background:"none",border:"none",color:"#CBD5E1",cursor:"pointer",fontSize:14,padding:0,flexShrink:0,lineHeight:1}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <input
                  ref={checklistInputRef}
                  value={novoChecklist}
                  onChange={e=>setNovoChecklist(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addChecklistItem())}
                  placeholder="Ex: Protocolar requerimento no portal ANVISA..."
                  style={{...IS,fontSize:12,flex:1}}
                />
                <button onClick={addChecklistItem} disabled={!novoChecklist.trim()}
                  style={{background:novoChecklist.trim()?"#1B3A5C":"#E2E8F0",color:novoChecklist.trim()?"#fff":"#94A3B8",border:"none",borderRadius:7,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:novoChecklist.trim()?"pointer":"not-allowed",flexShrink:0}}>
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:"1px solid #E2E8F0"}}>
            <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #D1D5DB",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>onSave(form)} disabled={!form.descricao.trim()}
              style={{padding:"8px 22px",borderRadius:8,border:"none",background:form.descricao.trim()?"#1B3A5C":"#94A3B8",color:"#fff",fontSize:13,fontWeight:700,cursor:form.descricao.trim()?"pointer":"not-allowed"}}>
              Salvar Documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
