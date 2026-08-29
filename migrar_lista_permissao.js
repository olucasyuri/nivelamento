// =========================================================
// PIT STOP | Migração única: de "aberto pra todos por padrão"
// para "lista de permissão" (só vê quem for marcado)
// =========================================================
// ANTES desta mudança: um material sem nenhuma linha em
// topico_atribuicoes era visível a todo mundo.
// DEPOIS desta mudança: um material só é visível a quem tiver
// uma linha em topico_atribuicoes.
//
// Se você publicar o app.js novo sem rodar isso antes, todo
// material que hoje é "aberto" desaparece pra todo mundo no
// mesmo instante.
//
// O que este script faz: para cada material que HOJE está aberto
// (zero atribuições), cria uma atribuição pra cada colaborador
// atual — ou seja, congela "quem já via, continua vendo" como
// ponto de partida. Materiais que já tinham atribuição específica
// (ex: Ferramentas → só Samuel) não são tocados.
//
// COMO USAR:
//   1) copie .env.example para .env e preencha (mesmas credenciais
//      do seed_usuarios.js)
//   2) node migrar_lista_permissao.js
//   3) rode ANTES de publicar o app.js atualizado
//   4) pode rodar de novo sem medo — não duplica nada
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

async function run() {
  const { data: perfis, error: erroPerfis } = await supabase.from('perfis').select('id, nome');
  if (erroPerfis) { console.error('Erro ao buscar colaboradores:', erroPerfis.message); process.exit(1); }

  const { data: topicos, error: erroTopicos } = await supabase.from('topicos').select('id, titulo, trilha_id');
  if (erroTopicos) { console.error('Erro ao buscar materiais:', erroTopicos.message); process.exit(1); }

  const { data: atribuicoesExistentes, error: erroAtrib } = await supabase.from('topico_atribuicoes').select('topico_id');
  if (erroAtrib) { console.error('Erro ao buscar atribuições existentes:', erroAtrib.message); process.exit(1); }

  const topicosComAtribuicao = new Set((atribuicoesExistentes ?? []).map((a) => a.topico_id));
  const topicosAbertos = (topicos ?? []).filter((t) => !topicosComAtribuicao.has(t.id));

  console.log(`${perfis.length} colaboradores encontrados.`);
  console.log(`${topicos.length} materiais no total.`);
  console.log(`${topicosAbertos.length} materiais estão "abertos" hoje (sem nenhuma atribuição) — serão liberados pra todos os colaboradores atuais.`);
  console.log(`${topicos.length - topicosAbertos.length} materiais já têm atribuição específica — não serão tocados.\n`);

  if (topicosAbertos.length === 0) {
    console.log('Nada a fazer. Todos os materiais já têm atribuições definidas.');
    return;
  }

  const linhasParaInserir = [];
  topicosAbertos.forEach((topico) => {
    perfis.forEach((p) => linhasParaInserir.push({ topico_id: topico.id, colaborador_id: p.id }));
  });

  console.log(`Inserindo ${linhasParaInserir.length} atribuições...`);

  // insere em lotes de 500 pra não estourar limite de payload
  const TAMANHO_LOTE = 500;
  for (let i = 0; i < linhasParaInserir.length; i += TAMANHO_LOTE) {
    const lote = linhasParaInserir.slice(i, i + TAMANHO_LOTE);
    const { error } = await supabase.from('topico_atribuicoes').upsert(lote, { onConflict: 'topico_id,colaborador_id', ignoreDuplicates: true });
    if (error) {
      console.error(`✗ Erro no lote ${i / TAMANHO_LOTE + 1}:`, error.message);
      console.error('  Se o erro for sobre "onConflict" / constraint, veja a nota no final deste arquivo.');
      process.exit(1);
    }
  }

  console.log('\n✓ Migração concluída. Todos os materiais que estavam abertos continuam visíveis pra todo mundo, exatamente como antes.');
  console.log('Agora é só ir no perfil de cada colaborador e desmarcar o que ele não deveria mais ver.');
}

run();

// NOTA: este script usa upsert com onConflict em (topico_id, colaborador_id).
// Se a tabela topico_atribuicoes não tiver essa constraint única, rode antes
// no SQL Editor do Supabase:
//   alter table topico_atribuicoes
//     add constraint topico_atribuicoes_topico_colaborador_key
//     unique (topico_id, colaborador_id);
