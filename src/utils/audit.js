export const ACTION_LABELS = {
  LOGIN:           { label: "Login",             color: "#15803D" },
  LOGOUT:          { label: "Logout",            color: "#374151" },
  CRIAR_DOC:       { label: "Criou documento",   color: "#1D4ED8" },
  EDITAR_DOC:      { label: "Editou documento",  color: "#B45309" },
  EXCLUIR_DOC:     { label: "Excluiu documento", color: "#991B1B" },
  RESTAURAR:       { label: "Restaurou dados",   color: "#7C3AED" },
  CRIAR_USUARIO:   { label: "Criou usuário",     color: "#0891B2" },
  EDITAR_USUARIO:  { label: "Editou usuário",    color: "#B45309" },
  EXCLUIR_USUARIO: { label: "Excluiu usuário",   color: "#991B1B" },
};

const FIELD_LABELS = {
  descricao:             "Descrição",
  orgao:                 "Órgão",
  dataEmissao:           "Emissão",
  dataValidade:          "Validade",
  prazoAntecedenciaDias: "Antecedência (dias)",
  renovacaoPeriodo:      "Período de renovação",
  renovacaoAutomatica:   "Renovação automática",
  legislacaoBase:        "Base legal",
  link:                  "Link",
  observacao:            "Observações",
};

export function diffDocs(before, after) {
  return Object.entries(FIELD_LABELS)
    .filter(([k]) => {
      const bv = before[k] == null || before[k] === "" ? null : before[k];
      const av = after[k]  == null || after[k]  === "" ? null : after[k];
      return String(bv) !== String(av);
    })
    .map(([k, label]) => {
      if (k === "renovacaoAutomatica")
        return `${label}: ${before[k] ? "Sim" : "Não"} → ${after[k] ? "Sim" : "Não"}`;
      const bs = before[k] == null || before[k] === "" ? "—" : String(before[k]);
      const as = after[k]  == null || after[k]  === "" ? "—" : String(after[k]);
      return `${label}: "${bs}" → "${as}"`;
    });
}
