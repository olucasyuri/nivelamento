// =========================================================
// PIT STOP | Criação em massa dos usuários iniciais
// =========================================================
// Este script usa a SERVICE ROLE KEY (secreta, nunca exponha no
// front-end) para criar os logins de autenticação no Supabase e
// popular a tabela public.perfis.
//
// COMO USAR:
//   1) cd seed
//   2) npm install
//   3) copie .env.example para .env e preencha as 2 variáveis
//   4) node seed_usuarios.js
// =========================================================

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SENHA_PADRAO = 'qaz@123';
const DOMINIO_EMAIL = 'pitstop.local'; // domínio fictício, só usado internamente pelo Supabase Auth

// nome de exibição -> usuário de login (sem acento, minúsculo)
const COLABORADORES = [
  { nome: 'FÁBIO',           usuario: 'fabio' },
  { nome: 'DINIZ',           usuario: 'diniz' },
  { nome: 'HENRIQUE',        usuario: 'henrique' },
  { nome: 'TONY',            usuario: 'tony' },
  { nome: 'FABRICIA',        usuario: 'fabricia' },
  { nome: 'CAUE',            usuario: 'caue' },
  { nome: 'CAVALCANTE',      usuario: 'cavalcante' },
  { nome: 'SANTOS',          usuario: 'santos' },
  { nome: 'NANDA',           usuario: 'nanda' },
  { nome: 'GUILHERME',       usuario: 'guilherme' },
  { nome: 'MARLISSON',       usuario: 'marlisson' },
  { nome: 'RYAN',            usuario: 'ryan' },
  { nome: 'EMANUEL',         usuario: 'emanuel' }, // confira se não é "EMANUEL"
  { nome: 'JONAS',           usuario: 'jonas' },
  { nome: 'MARIA FERNANDA',  usuario: 'maria.fernanda' },
  { nome: 'MAICON FELIPE',   usuario: 'maicon.felipe' },
];

async function run() {
  console.log(`Criando ${COLABORADORES.length} colaboradores...\n`);

  for (const c of COLABORADORES) {
    const email = `${c.usuario}@${DOMINIO_EMAIL}`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: SENHA_PADRAO,
      email_confirm: true,
      user_metadata: { nome: c.nome, usuario: c.usuario },
    });

    if (error) {
      console.error(`✗ ${c.usuario} — erro ao criar login: ${error.message}`);
      continue;
    }

    const userId = data.user.id;

    const { error: perfilError } = await supabase
      .from('perfis')
      .upsert({ id: userId, nome: c.nome, usuario: c.usuario }, { onConflict: 'id' });

    if (perfilError) {
      console.error(`✗ ${c.usuario} — login criado, mas falhou ao gravar perfil: ${perfilError.message}`);
      continue;
    }

    console.log(`✓ ${c.usuario} (${c.nome}) — login: ${email}`);
  }

  console.log('\nConcluído. Senha padrão para todos: ' + SENHA_PADRAO);
  console.log('Recomende a cada colaborador trocar a senha no primeiro acesso.');
}

run();
