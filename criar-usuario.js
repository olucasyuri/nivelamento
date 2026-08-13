// Função serverless (roda na Vercel, nunca no navegador do usuário).
// Cria um novo login de colaborador. Só funciona se quem chamar
// estiver autenticado E marcado como administrador (is_admin = true).
//
// Variáveis de ambiente necessárias (configure em Vercel → Settings → Environment Variables):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY   (secreta — nunca prefixe com NEXT_PUBLIC_ ou exponha no front-end)

import { createClient } from '@supabase/supabase-js';

const DOMINIO_EMAIL = 'pitstop.local';
const SENHA_PADRAO = 'qaz@123';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente do Supabase não configuradas na Vercel.' });
  }

  // 1) confirma quem está chamando (token do colaborador logado)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Sessão ausente.' });
  }

  const supabaseComoUsuario = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: dadosUsuario, error: erroUsuario } = await supabaseComoUsuario.auth.getUser(token);
  if (erroUsuario || !dadosUsuario?.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2) confirma que quem está chamando é admin
  const { data: perfilSolicitante, error: erroPerfil } = await supabaseAdmin
    .from('perfis')
    .select('is_admin')
    .eq('id', dadosUsuario.user.id)
    .maybeSingle();

  if (erroPerfil || !perfilSolicitante?.is_admin) {
    return res.status(403).json({ error: 'Apenas administradores podem cadastrar novos colaboradores.' });
  }

  // 3) valida os dados recebidos
  const { nome, usuario, senha } = req.body || {};
  if (!nome || !usuario) {
    return res.status(400).json({ error: 'Informe nome e usuário.' });
  }

  const usuarioNormalizado = String(usuario).trim().toLowerCase().replace(/\s+/g, '.');
  const email = `${usuarioNormalizado}@${DOMINIO_EMAIL}`;
  const senhaFinal = senha && senha.length >= 6 ? senha : SENHA_PADRAO;

  // 4) cria o login
  const { data: novoUsuario, error: erroCriacao } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senhaFinal,
    email_confirm: true,
    user_metadata: { nome, usuario: usuarioNormalizado },
  });

  if (erroCriacao) {
    return res.status(400).json({ error: erroCriacao.message });
  }

  // 5) cria o perfil correspondente
  const { error: erroInserirPerfil } = await supabaseAdmin
    .from('perfis')
    .upsert({ id: novoUsuario.user.id, nome, usuario: usuarioNormalizado, is_admin: false }, { onConflict: 'id' });

  if (erroInserirPerfil) {
    return res.status(400).json({ error: erroInserirPerfil.message });
  }

  return res.status(200).json({
    ok: true,
    usuario: usuarioNormalizado,
    email,
    senha: senhaFinal,
  });
}
