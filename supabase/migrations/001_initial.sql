-- ============================================================
-- GEDREG — Schema inicial
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- Tabela de perfis (complementa o auth.users do Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id      UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome    TEXT  NOT NULL DEFAULT '',
  email   TEXT  NOT NULL DEFAULT '',
  perfil  TEXT  NOT NULL DEFAULT 'viewer' CHECK (perfil IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS public.documents (
  id                      TEXT PRIMARY KEY,
  descricao               TEXT NOT NULL DEFAULT '',
  orgao                   TEXT DEFAULT '',
  data_emissao            DATE,
  data_validade           DATE,
  prazo_antecedencia_dias INTEGER NOT NULL DEFAULT 60,
  renovacao_periodo       TEXT DEFAULT '1 ano',
  renovacao_automatica    BOOLEAN NOT NULL DEFAULT false,
  observacao              TEXT DEFAULT '',
  link                    TEXT DEFAULT '',
  legislacao_base         TEXT DEFAULT '',
  checklist_renovacao     JSONB NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de trilha de auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         TEXT PRIMARY KEY,
  ts         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name  TEXT DEFAULT '',
  acao       TEXT NOT NULL,
  doc_id     TEXT DEFAULT '',
  doc_nome   TEXT DEFAULT '',
  detalhe    JSONB DEFAULT '""'
);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: usuários autenticados podem ler todos
CREATE POLICY "Authenticated read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Profiles: usuário atualiza o próprio perfil
CREATE POLICY "User updates own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Profiles: trigger pode inserir
CREATE POLICY "Allow profile insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Documents: todos autenticados podem CRUD
CREATE POLICY "Authenticated manage documents" ON public.documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit: autenticados leem e inserem
CREATE POLICY "Authenticated read audit" ON public.audit_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert audit" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── Trigger: criar perfil ao criar usuário no Auth ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
