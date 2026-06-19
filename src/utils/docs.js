import { calcPrazoDate } from "./date";

export function calcStatus(d) {
  if (d.renovacaoAutomatica) return "AUTOMATICO";
  if (!d.dataValidade) return "INDETERMINADO";
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const val = new Date(d.dataValidade); val.setHours(0, 0, 0, 0);
  const dvv = Math.ceil((val - hoje) / 86400000);
  if (dvv < 0) return "VENCIDO";
  const pr = new Date(calcPrazoDate(d)); pr.setHours(0, 0, 0, 0);
  const dpp = Math.ceil((pr - hoje) / 86400000);
  if (dpp < 0) return "ATRASADO";
  if (dpp <= 30) return "CRITICO";
  if (dpp <= 60) return "ATENCAO";
  if (dpp <= 120) return "ALERTA";
  return "REGULAR";
}

export function uid() {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
