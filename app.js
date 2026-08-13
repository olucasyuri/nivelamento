import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =========================================================
// CONFIGURAÇÃO — preencha com os dados do SEU projeto Supabase
// (Settings → API no painel do Supabase). A "anon key" é pública,
// pode ficar no front-end; NUNCA coloque a service_role key aqui.
// =========================================================
const SUPABASE_URL = 'https://kbibdhrcculvoxeymfwt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaWJkaHJjY3Vsdm94ZXltZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODgxODksImV4cCI6MjEwMTk2NDE4OX0.tAQRO4BvXoE_lwFgIZnDcycoJiO-eukc0D6NlQfqcp0';
const DOMINIO_EMAIL = 'pitstop.local'; // precisa bater com o usado no seed_usuarios.js

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- elementos ----------
const telaLogin = document.getElementById('tela-login');
const telaDashboard = document.getElementById('tela-dashboard');
const formLogin = document.getElementById('form-login');
const inputUsuario = document.getElementById('input-usuario');
const inputSenha = document.getElementById('input-senha');
const btnEntrar = document.getElementById('btn-entrar');
const loginErro = document.getElementById('login-erro');
const btnSair = document.getElementById('btn-sair');
const pilotoNome = document.getElementById('piloto-nome');
const listaTrilhas = document.getElementById('lista-trilhas');
const resumoTopicos = document.getElementById('resumo-topicos');
const gaugeValor = document.getElementById('gauge-valor');
const gaugePercentual = document.getElementById('gauge-percentual');

const btnAdmin = document.getElementById('btn-admin');
const painelAdmin = document.getElementById('painel-admin');
const tabelaAdmin = document.getElementById('tabela-admin');
const formNovoUsuario = document.getElementById('form-novo-usuario');
const adminNome = document.getElementById('admin-nome');
const adminUsuario = document.getElementById('admin-usuario');
const adminSenha = document.getElementById('admin-senha');
const btnCadastrar = document.getElementById('btn-cadastrar');
const adminFeedback = document.getElementById('admin-feedback');

const CIRCUNFERENCIA = 2 * Math.PI * 60; // r=60 no SVG do gauge

// ---------- estado ----------
let sessaoAtual = null;
let progressoPorTopico = new Map(); // topico_id -> { id, concluido }
let totalTopicosGlobal = 0;
let painelAdminCarregado = false;

// =========================================================
// LOGIN
// =========================================================
formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderErro();

  const usuario = inputUsuario.value.trim().toLowerCase();
  const senha = inputSenha.value;
  if (!usuario || !senha) return;

  definirCarregando(true);
  const email = `${usuario}@${DOMINIO_EMAIL}`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  definirCarregando(false);

  if (error) {
    mostrarErro('Usuário ou senha inválidos. Confira e tente novamente.');
    return;
  }

  sessaoAtual = data.session;
  await iniciarDashboard();
});

btnSair.addEventListener('click', async () => {
  await supabase.auth.signOut();
  sessaoAtual = null;
  telaDashboard.hidden = true;
  telaLogin.hidden = false;
  formLogin.reset();
});

function definirCarregando(carregando) {
  btnEntrar.disabled = carregando;
  btnEntrar.querySelector('span').textContent = carregando ? 'Entrando…' : 'Entrar no box';
}
function mostrarErro(msg) { loginErro.textContent = msg; loginErro.hidden = false; }
function esconderErro() { loginErro.hidden = true; }

// tenta restaurar sessão já existente (ex: recarregou a página)
async function verificarSessaoExistente() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    sessaoAtual = data.session;
    await iniciarDashboard();
  }
}

// =========================================================
// DASHBOARD
// =========================================================
async function iniciarDashboard() {
  telaLogin.hidden = true;
  telaDashboard.hidden = false;

  const userId = sessaoAtual.user.id;

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, usuario, is_admin')
    .eq('id', userId)
    .maybeSingle();

  pilotoNome.textContent = perfil?.nome ?? sessaoAtual.user.email;

  if (perfil?.is_admin) {
    btnAdmin.hidden = false;
  } else {
    btnAdmin.hidden = true;
    painelAdmin.hidden = true;
  }

  const [{ data: trilhas, error: erroTrilhas }, { data: progresso, error: erroProgresso }] = await Promise.all([
    supabase
      .from('trilhas')
      .select('id, titulo, descricao, ordem, topicos(id, titulo, url, ordem)')
      .order('ordem', { ascending: true }),
    supabase
      .from('progresso')
      .select('id, topico_id, concluido')
      .eq('usuario_id', userId),
  ]);

  if (erroTrilhas) {
    resumoTopicos.textContent = 'Não foi possível carregar as trilhas. Recarregue a página.';
    return;
  }

  progressoPorTopico = new Map();
  (progresso ?? []).forEach((p) => progressoPorTopico.set(p.topico_id, p));

  trilhas.forEach((t) => t.topicos.sort((a, b) => a.ordem - b.ordem));
  trilhas.sort((a, b) => a.ordem - b.ordem);

  totalTopicosGlobal = trilhas.reduce((soma, t) => soma + t.topicos.length, 0);

  renderizarTrilhas(trilhas);
  atualizarResumoGeral(trilhas);
}

// =========================================================
// PAINEL ADMIN
// =========================================================
btnAdmin.addEventListener('click', () => {
  const abrir = painelAdmin.hidden;
  painelAdmin.hidden = !abrir;
  if (abrir && !painelAdminCarregado) carregarPainelAdmin();
});

async function carregarPainelAdmin() {
  tabelaAdmin.innerHTML = '<p class="painel-geral__resumo">Carregando…</p>';

  const [{ data: perfis, error: erroPerfis }, { data: progressoTodos, error: erroProgresso }] = await Promise.all([
    supabase.from('perfis').select('id, nome, usuario, is_admin').order('nome', { ascending: true }),
    supabase.from('progresso').select('usuario_id, concluido').eq('concluido', true),
  ]);

  if (erroPerfis || erroProgresso) {
    tabelaAdmin.innerHTML = '<p class="painel-geral__resumo">Não foi possível carregar os dados. Confira se a migração de admin (003_admin.sql) foi executada.</p>';
    return;
  }

  const concluidosPorUsuario = new Map();
  (progressoTodos ?? []).forEach((p) => {
    concluidosPorUsuario.set(p.usuario_id, (concluidosPorUsuario.get(p.usuario_id) ?? 0) + 1);
  });

  tabelaAdmin.innerHTML = '';
  perfis.forEach((p) => {
    const concluidos = concluidosPorUsuario.get(p.id) ?? 0;
    const percentual = totalTopicosGlobal > 0 ? Math.round((concluidos / totalTopicosGlobal) * 100) : 0;

    const linha = document.createElement('div');
    linha.className = 'linha-admin';
    linha.innerHTML = `
      <span class="linha-admin__nome">${escapeHtml(p.nome)} <span class="linha-admin__usuario">@${escapeHtml(p.usuario)}</span></span>
      ${p.is_admin ? '<span class="linha-admin__badge-admin">admin</span>' : ''}
      <span class="linha-admin__barra"><span class="linha-admin__barra-preenchimento" style="width:${percentual}%"></span></span>
      <span class="linha-admin__percentual">${concluidos}/${totalTopicosGlobal} · ${percentual}%</span>
    `;
    tabelaAdmin.appendChild(linha);
  });

  painelAdminCarregado = true;
}

formNovoUsuario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  adminFeedback.hidden = true;

  const nome = adminNome.value.trim();
  const usuario = adminUsuario.value.trim();
  const senha = adminSenha.value.trim();
  if (!nome || !usuario) return;

  btnCadastrar.disabled = true;
  btnCadastrar.querySelector('span').textContent = 'Cadastrando…';

  try {
    const resposta = await fetch('/api/criar-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessaoAtual.access_token}`,
      },
      body: JSON.stringify({ nome, usuario, senha }),
    });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      adminFeedback.textContent = resultado.error ?? 'Erro ao cadastrar colaborador.';
      adminFeedback.hidden = false;
    } else {
      adminFeedback.style.color = 'var(--verde)';
      adminFeedback.textContent = `Colaborador "${resultado.usuario}" cadastrado! Senha: ${resultado.senha}`;
      adminFeedback.hidden = false;
      formNovoUsuario.reset();
      painelAdminCarregado = false;
      carregarPainelAdmin();
    }
  } catch (erro) {
    adminFeedback.textContent = 'Falha de conexão ao cadastrar. Tente novamente.';
    adminFeedback.hidden = false;
  } finally {
    btnCadastrar.disabled = false;
    btnCadastrar.querySelector('span').textContent = 'Cadastrar colaborador';
  }
});

function renderizarTrilhas(trilhas) {
  listaTrilhas.innerHTML = '';

  trilhas.forEach((trilha, indice) => {
    const total = trilha.topicos.length;
    const concluidos = trilha.topicos.filter((t) => progressoPorTopico.get(t.id)?.concluido).length;
    const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    const card = document.createElement('article');
    card.className = 'trilha';
    card.dataset.trilhaId = trilha.id;

    card.innerHTML = `
      <button type="button" class="trilha__cabecalho" aria-expanded="false">
        <span class="trilha__numero">BOX ${String(indice + 1).padStart(2, '0')}</span>
        <span class="trilha__texto">
          <p class="trilha__titulo">${escapeHtml(trilha.titulo)}</p>
          <p class="trilha__descricao">${escapeHtml(trilha.descricao ?? '')}</p>
        </span>
        <span class="trilha__medidor">
          <span class="trilha__barra"><span class="trilha__barra-preenchimento" style="width:${percentual}%"></span></span>
          <span class="trilha__percentual">${percentual}%</span>
        </span>
        <svg class="trilha__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="trilha__lista"></div>
    `;

    const listaEl = card.querySelector('.trilha__lista');
    trilha.topicos.forEach((topico) => listaEl.appendChild(criarLinhaTopico(topico, trilha, card)));

    card.querySelector('.trilha__cabecalho').addEventListener('click', () => {
      const aberta = card.classList.toggle('aberta');
      card.querySelector('.trilha__cabecalho').setAttribute('aria-expanded', String(aberta));
    });

    listaTrilhas.appendChild(card);
  });
}

function criarLinhaTopico(topico, trilha, card) {
  const linha = document.createElement('label');
  linha.className = 'topico';

  const jaConcluido = !!progressoPorTopico.get(topico.id)?.concluido;

  const linkHtml = topico.url
    ? `<a class="topico__link" href="${escapeHtml(topico.url)}" target="_blank" rel="noopener noreferrer">Abrir material →</a>`
    : `<span class="topico__sem-link">Material offline — solicite acesso ao time</span>`;

  linha.innerHTML = `
    <input type="checkbox" ${jaConcluido ? 'checked' : ''} />
    <span class="topico__texto">
      <p class="topico__titulo ${jaConcluido ? 'topico__titulo--concluido' : ''}">${escapeHtml(topico.titulo)}</p>
      ${linkHtml}
    </span>
  `;

  const checkbox = linha.querySelector('input');
  checkbox.addEventListener('change', async () => {
    checkbox.disabled = true;
    await alternarProgresso(topico, checkbox.checked);
    linha.querySelector('.topico__titulo').classList.toggle('topico__titulo--concluido', checkbox.checked);
    checkbox.disabled = false;
    atualizarMedidorTrilha(card, trilha);
    atualizarResumoGeral(null); // recalcula usando o cache já atualizado
  });

  return linha;
}

async function alternarProgresso(topico, concluido) {
  const userId = sessaoAtual.user.id;
  const existente = progressoPorTopico.get(topico.id);

  const registro = {
    usuario_id: userId,
    topico_id: topico.id,
    concluido,
    concluido_em: concluido ? new Date().toISOString() : null,
  };
  if (existente?.id) registro.id = existente.id;

  const { data, error } = await supabase
    .from('progresso')
    .upsert(registro, { onConflict: 'usuario_id,topico_id' })
    .select()
    .single();

  if (!error && data) {
    progressoPorTopico.set(topico.id, data);
  }
}

function atualizarMedidorTrilha(card, trilha) {
  const total = trilha.topicos.length;
  const concluidos = trilha.topicos.filter((t) => progressoPorTopico.get(t.id)?.concluido).length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  card.querySelector('.trilha__barra-preenchimento').style.width = `${percentual}%`;
  card.querySelector('.trilha__percentual').textContent = `${percentual}%`;
}

function atualizarResumoGeral(trilhasOpcional) {
  const trilhas = trilhasOpcional ?? Array.from(listaTrilhas.querySelectorAll('.trilha')).map((card) => ({
    topicos: Array.from(progressoPorTopico.keys()),
  }));

  // conta usando o cache global, que é a fonte confiável após qualquer toggle
  const todosTopicosIds = [...document.querySelectorAll('.trilha')].flatMap((card) =>
    [...card.querySelectorAll('.topico input[type="checkbox"]')]
  );

  const total = todosTopicosIds.length;
  const concluidos = todosTopicosIds.filter((el) => el.checked).length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  gaugeValor.style.strokeDashoffset = String(CIRCUNFERENCIA - (percentual / 100) * CIRCUNFERENCIA);
  gaugeValor.style.stroke = percentual >= 100 ? 'var(--verde)' : 'var(--laranja)';
  gaugePercentual.textContent = `${percentual}%`;
  resumoTopicos.textContent = `${concluidos} de ${total} materiais concluídos em todas as trilhas.`;
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

verificarSessaoExistente();
