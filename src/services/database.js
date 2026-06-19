import { supabase } from "../lib/supabase";

// ── Mapeamento de campos (camelCase JS ↔ snake_case SQL) ──────────────────────

function docFromRow(row) {
  return {
    id:                     row.id,
    descricao:              row.descricao              ?? "",
    orgao:                  row.orgao                  ?? "",
    dataEmissao:            row.data_emissao           ?? "",
    dataValidade:           row.data_validade          ?? null,
    prazoAntecedenciaDias:  row.prazo_antecedencia_dias ?? 60,
    renovacaoPeriodo:       row.renovacao_periodo      ?? "1 ano",
    renovacaoAutomatica:    row.renovacao_automatica   ?? false,
    observacao:             row.observacao             ?? "",
    link:                   row.link                   ?? "",
    legislacaoBase:         row.legislacao_base        ?? "",
    checklistRenovacao:     row.checklist_renovacao    ?? [],
  };
}

function docToRow(doc) {
  return {
    id:                      doc.id,
    descricao:               doc.descricao,
    orgao:                   doc.orgao,
    data_emissao:            doc.dataEmissao   || null,
    data_validade:           doc.dataValidade  || null,
    prazo_antecedencia_dias: doc.prazoAntecedenciaDias,
    renovacao_periodo:       doc.renovacaoPeriodo,
    renovacao_automatica:    doc.renovacaoAutomatica,
    observacao:              doc.observacao,
    link:                    doc.link,
    legislacao_base:         doc.legislacaoBase,
    checklist_renovacao:     doc.checklistRenovacao,
    updated_at:              new Date().toISOString(),
  };
}

// ── Documentos ────────────────────────────────────────────────────────────────

export async function fetchDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("descricao");
  if (error) throw error;
  return data.map(docFromRow);
}

export async function upsertDocument(doc) {
  const { error } = await supabase
    .from("documents")
    .upsert(docToRow(doc), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteDocument(id) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function seedDocuments(docs) {
  const { error } = await supabase
    .from("documents")
    .upsert(docs.map(docToRow), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

// ── Perfis ────────────────────────────────────────────────────────────────────

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data; // { id, nome, email, perfil, created_at }
}

export async function updateProfile(id, updates) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  if (error) throw error;
}

// ── Trilha de auditoria ───────────────────────────────────────────────────────

function auditFromRow(row) {
  return {
    id:       row.id,
    ts:       row.ts,
    userId:   row.user_id   ?? "",
    userName: row.user_name ?? "",
    acao:     row.acao,
    docId:    row.doc_id    ?? "",
    docNome:  row.doc_nome  ?? "",
    detalhe:  row.detalhe   ?? "",
  };
}

export async function fetchAuditLog() {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("ts", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data.map(auditFromRow);
}

export async function insertAuditEntry(entry) {
  const { error } = await supabase.from("audit_log").insert({
    id:        entry.id,
    ts:        entry.ts,
    user_id:   entry.userId   || null,
    user_name: entry.userName,
    acao:      entry.acao,
    doc_id:    entry.docId,
    doc_nome:  entry.docNome,
    detalhe:   entry.detalhe,
  });
  if (error) throw error;
}

// ── Gerenciamento de usuários (via Edge Function) ─────────────────────────────

async function callAdminUsers(action, userData) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, userData },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const adminCreateUser = (userData) => callAdminUsers("create", userData);
export const adminUpdateUser = (userData) => callAdminUsers("update", userData);
export const adminDeleteUser = (id)       => callAdminUsers("delete", { id });
