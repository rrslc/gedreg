-- ============================================================
-- GEDREG — Criar usuário admin inicial
-- Execute no SQL Editor do Supabase UMA única vez
-- Senha padrão: Msb@2026  (troque após o primeiro login)
-- ============================================================

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
BEGIN
  -- Remove entradas anteriores com esse e-mail
  DELETE FROM auth.identities WHERE provider_id = 'raissa.caldas@msbbrasil.com';
  DELETE FROM auth.users     WHERE email        = 'raissa.caldas@msbbrasil.com';

  -- Cria o usuário no Supabase Auth
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'raissa.caldas@msbbrasil.com',
    crypt('Msb@2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"nome":"Raissa Caldas","perfil":"admin"}',
    false,
    '',
    ''
  );

  -- Cria a identidade de e-mail (obrigatório para login por senha)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_uid::text,
    v_uid,
    'raissa.caldas@msbbrasil.com',
    jsonb_build_object('sub', v_uid::text, 'email', 'raissa.caldas@msbbrasil.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Garante o perfil admin
  INSERT INTO public.profiles (id, nome, email, perfil)
  VALUES (v_uid, 'Raissa Caldas', 'raissa.caldas@msbbrasil.com', 'admin')
  ON CONFLICT (id) DO UPDATE
    SET nome = 'Raissa Caldas', perfil = 'admin';

END $$;
