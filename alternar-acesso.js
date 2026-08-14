// Função serverless (Vercel). Ativa ou desativa o acesso de um colaborador
// (bane/desbane no Supabase Auth + marca ativo/inativo em public.perfis).
// Só funciona para quem estiver autenticado E marcado como is_admin = true.

import { createClient } from '@supabase/supabase-js';

// ~10 anos — na prática, um bloqueio permanente até alguém reativar
const DURACAO_BLOQUEIO = '87600h';

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
    return res.status(403).json({ error: 'Apenas administradores podem ativar/desativar acesso.' });
  }

  const { usuarioId, ativar } = req.body || {};
  if (!usuarioId || typeof ativar !== 'boolean') {
    return res.status(400).json({ error: 'Informe o colaborador e a ação (ativar/desativar).' });
  }

  if (usuarioId === dadosUsuario.user.id && !ativar) {
    return res.status(400).json({ error: 'Você não pode desativar o próprio acesso.' });
  }

  const { error: erroBan } = await supabaseAdmin.auth.admin.updateUserById(usuarioId, {
    ban_duration: ativar ? 'none' : DURACAO_BLOQUEIO,
  });
  if (erroBan) return res.status(400).json({ error: erroBan.message });

  const { error: erroPerfilUpdate } = await supabaseAdmin
    .from('perfis')
    .update({ ativo: ativar })
    .eq('id', usuarioId);
  if (erroPerfilUpdate) return res.status(400).json({ error: erroPerfilUpdate.message });

  return res.status(200).json({ ok: true, ativo: ativar });
}
