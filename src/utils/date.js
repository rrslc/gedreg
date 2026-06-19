export function calcPrazoDate(d) {
  if (!d.dataValidade || d.renovacaoAutomatica) return null;
  const v = new Date(d.dataValidade);
  v.setDate(v.getDate() - (d.prazoAntecedenciaDias || 60));
  return v.toISOString().slice(0, 10);
}

export function fmt(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function dv(d) {
  if (!d.dataValidade) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const val = new Date(d.dataValidade); val.setHours(0, 0, 0, 0);
  return Math.ceil((val - hoje) / 86400000);
}

export function dp(d) {
  const pr = calcPrazoDate(d);
  if (!pr) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(pr); prazo.setHours(0, 0, 0, 0);
  return Math.ceil((prazo - hoje) / 86400000);
}
