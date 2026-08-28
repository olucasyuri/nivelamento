// Função serverless (Vercel). Redefine a senha de um colaborador.
// Só funciona para quem estiver autenticado E marcado como is_admin = true.
// Mesmas variáveis de ambiente de api/criar-usuario.js.

import { createClient } from '@supabase/supabase-js';

const SENHA_PADRAO = 'qaz@123';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente do Supabase não configuradas na Vercel.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sessão ausente.' });

  const supabaseComoUsuario = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: dadosUsuario, error: erroUsuario } = await supabaseComoUsuario.auth.getUser(token);
  if (erroUsuario || !dadosUsuario?.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: perfilSolicitante, error: erroPerfil } = await supabaseAdmin
    .from('perfis')
    .select('is_admin')
    .eq('id', dadosUsuario.user.id)
    .maybeSingle();

  if (erroPerfil || !perfilSolicitante?.is_admin) {
    return res.status(403).json({ error: 'Apenas administradores podem redefinir senhas.' });
  }

  const { usuarioId, senha } = req.body || {};
  if (!usuarioId) return res.status(400).json({ error: 'Informe o colaborador.' });

  const senhaFinal = senha && senha.length >= 6 ? senha : SENHA_PADRAO;

  const { error: erroAtualizar } = await supabaseAdmin.auth.admin.updateUserById(usuarioId, {
    password: senhaFinal,
  });

  if (erroAtualizar) {
    return res.status(400).json({ error: erroAtualizar.message });
  }

  return res.status(200).json({ ok: true, senha: senhaFinal });
}
