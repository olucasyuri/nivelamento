import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =========================================================
// CONFIGURAÇÃO — preencha com os dados do SEU projeto Supabase
// (Settings → API no painel do Supabase). A "anon key" é pública,
// pode ficar no front-end; NUNCA coloque a service_role key aqui.
// =========================================================
const SUPABASE_URL = 'https://kbibdhrcculvoxeymfwt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaWJkaHJjY3Vsdm94ZXltZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODgxODksImV4cCI6MjEwMTk2NDE4OX0.tAQRO4BvXoE_lwFgIZnDcycoJiO-eukc0D6NlQfqcp0';
const DOMINIO_EMAIL = 'pitstop.local'; // precisa bater com o usado no seed_usuarios.js
const STORAGE_BUCKET = 'materiais'; // bucket criado pelo sql/2026-08-topico-anexos.sql
const TAMANHO_MAX_ARQUIVO = 50 * 1024 * 1024; // 50MB

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
const btnContinuar = document.getElementById('btn-continuar');
const toastCelebracao = document.getElementById('toast-celebracao');
const toastTexto = document.getElementById('toast-texto');

const btnAdmin = document.getElementById('btn-admin');
const painelAdmin = document.getElementById('painel-admin');
const tabelaAdmin = document.getElementById('tabela-admin');
const formNovoUsuario = document.getElementById('form-novo-usuario');
const adminNome = document.getElementById('admin-nome');
const adminUsuario = document.getElementById('admin-usuario');
const adminSenha = document.getElementById('admin-senha');
const btnCadastrar = document.getElementById('btn-cadastrar');
const adminFeedback = document.getElementById('admin-feedback');

const formNovaTrilha = document.getElementById('form-nova-trilha');
const trilhaTitulo = document.getElementById('trilha-titulo');
const trilhaDescricao = document.getElementById('trilha-descricao');
const btnNovaTrilha = document.getElementById('btn-nova-trilha');
const trilhaFeedback = document.getElementById('trilha-feedback');

const formNovoTopico = document.getElementById('form-novo-topico');
const topicoTrilhaSelect = document.getElementById('topico-trilha');
const topicoTitulo = document.getElementById('topico-titulo');
const topicoLiberarTodos = document.getElementById('topico-liberar-todos');
const topicoAnexosLista = document.getElementById('topico-anexos-lista');
const btnAddAnexoLink = document.getElementById('btn-add-anexo-link');
const btnAddAnexoArquivo = document.getElementById('btn-add-anexo-arquivo');
const btnNovoTopico = document.getElementById('btn-novo-topico');
const topicoFeedback = document.getElementById('topico-feedback');

const canvasEvolucao = document.getElementById('grafico-evolucao');
const canvasTrilhas = document.getElementById('grafico-trilhas');
const visaoColaborador = document.getElementById('visao-colaborador');

const kpiMedia = document.getElementById('kpi-media');
const kpiDestaque = document.getElementById('kpi-destaque');
const kpiAtrasada = document.getElementById('kpi-atrasada');
const kpiSemana = document.getElementById('kpi-semana');

const filtroColaborador = document.getElementById('filtro-colaborador');
const ordenarColaborador = document.getElementById('ordenar-colaborador');
const colaboradoresFeedback = document.getElementById('colaboradores-feedback');

const trilhaPrazo = document.getElementById('trilha-prazo');
const gerenciarTrilhasEl = document.getElementById('gerenciar-trilhas');

const modalColaborador = document.getElementById('modal-colaborador');
const modalColaboradorFundo = document.getElementById('modal-colaborador-fundo');
const colabNome = document.getElementById('colab-nome');
const colabUsuario = document.getElementById('colab-usuario');
const colabBadges = document.getElementById('colab-badges');
const colabChecklist = document.getElementById('colab-checklist');
const colabAtribuicoesLista = document.getElementById('colab-atribuicoes-lista');
const btnColabResetarSenha = document.getElementById('btn-colab-resetar-senha');
const btnColabAlternarAcesso = document.getElementById('btn-colab-alternar-acesso');
const btnColabAlternarAdmin = document.getElementById('btn-colab-alternar-admin');
const colabAcoesFeedback = document.getElementById('colab-acoes-feedback');
const btnFecharColaborador = document.getElementById('btn-fechar-colaborador');

const btnTrocarSenha = document.getElementById('btn-trocar-senha');
const modalSenha = document.getElementById('modal-senha');
const modalSenhaFundo = document.getElementById('modal-senha-fundo');
const formTrocarSenha = document.getElementById('form-trocar-senha');
const novaSenhaInput = document.getElementById('nova-senha');
const confirmarSenhaInput = document.getElementById('confirmar-senha');
const btnCancelarSenha = document.getElementById('btn-cancelar-senha');
const btnSalvarSenha = document.getElementById('btn-salvar-senha');
const senhaFeedback = document.getElementById('senha-feedback');

const CIRCUNFERENCIA = 2 * Math.PI * 60; // r=60 no SVG do gauge

// ---------- estado ----------
let sessaoAtual = null;
let progressoPorTopico = new Map(); // topico_id -> { id, concluido }
let totalTopicosGlobal = 0;
let trilhasGlobais = []; // lista completa de trilhas+tópicos, usada pelo painel admin
let trilhasVisiveis = []; // mesma lista, já filtrada pelos materiais restritos do colaborador logado
let painelAdminCarregado = false;
let graficoEvolucao = null;
let graficoTrilhas = null;
let adminPerfisCache = [];
let adminProgressoCache = [];
let colaboradorAberto = null;

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

// =========================================================
// TROCAR SENHA
// =========================================================
btnTrocarSenha.addEventListener('click', () => abrirModalSenha());
btnCancelarSenha.addEventListener('click', () => fecharModalSenha());
modalSenhaFundo.addEventListener('click', () => fecharModalSenha());

function abrirModalSenha() {
  formTrocarSenha.reset();
  senhaFeedback.hidden = true;
  modalSenha.hidden = false;
  novaSenhaInput.focus();
}

function fecharModalSenha() {
  modalSenha.hidden = true;
}

formTrocarSenha.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  senhaFeedback.hidden = true;

  const novaSenha = novaSenhaInput.value;
  const confirmarSenha = confirmarSenhaInput.value;

  if (novaSenha.length < 6) {
    senhaFeedback.style.color = '';
    senhaFeedback.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
    senhaFeedback.hidden = false;
    return;
  }
  if (novaSenha !== confirmarSenha) {
    senhaFeedback.style.color = '';
    senhaFeedback.textContent = 'As senhas não coincidem. Confira e tente de novo.';
    senhaFeedback.hidden = false;
    return;
  }

  btnSalvarSenha.disabled = true;
  btnSalvarSenha.querySelector('span').textContent = 'Salvando…';

  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  btnSalvarSenha.disabled = false;
  btnSalvarSenha.querySelector('span').textContent = 'Salvar nova senha';

  if (error) {
    senhaFeedback.style.color = '';
    senhaFeedback.textContent = error.message ?? 'Não foi possível trocar a senha. Tente novamente.';
    senhaFeedback.hidden = false;
    return;
  }

  senhaFeedback.style.color = 'var(--verde)';
  senhaFeedback.textContent = 'Senha alterada com sucesso!';
  senhaFeedback.hidden = false;
  setTimeout(fecharModalSenha, 1500);
});

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
    btnAdmin.textContent = painelAdmin.hidden ? 'Painel Admin' : 'Minhas trilhas';
  } else {
    btnAdmin.hidden = true;
    painelAdmin.hidden = true;
    visaoColaborador.hidden = false;
  }

  const [{ data: trilhas, error: erroTrilhas }, { data: progresso, error: erroProgresso }] = await Promise.all([
    supabase
      .from('trilhas')
      .select('id, titulo, descricao, prazo, ordem, topicos(id, titulo, url, ordem, topico_anexos(id, titulo, url, tipo, ordem), topico_atribuicoes(id, colaborador_id))')
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
  trilhas.forEach((t) => t.topicos.forEach((top) => (top.topico_anexos ?? []).sort((a, b) => a.ordem - b.ordem)));
  trilhas.sort((a, b) => a.ordem - b.ordem);

  totalTopicosGlobal = trilhas.reduce((soma, t) => soma + t.topicos.length, 0);
  trilhasGlobais = trilhas;
  preencherSelectDeTrilhas(trilhas);

  // Modelo de lista de permissão: um tópico só aparece se o colaborador
  // estiver explicitamente marcado em topico_atribuicoes. Sem marcação
  // nenhuma = ninguém vê (nem precisa ter "atribuição vazia" como sinal
  // de "aberto pra todos" — isso não existe mais).
  trilhasVisiveis = trilhas.map((t) => ({
    ...t,
    topicos: t.topicos.filter((topico) =>
      (topico.topico_atribuicoes ?? []).some((a) => a.colaborador_id === userId)
    ),
  }));

  renderizarTrilhas(trilhasVisiveis);
  atualizarResumoGeral(trilhasVisiveis);
}

function preencherSelectDeTrilhas(trilhas) {
  topicoTrilhaSelect.innerHTML = trilhas
    .map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.titulo)}</option>`)
    .join('');
}

// =========================================================
// PAINEL ADMIN
// =========================================================
btnAdmin.addEventListener('click', () => {
  const abrirAdmin = painelAdmin.hidden; // true = está fechado, vai abrir agora
  painelAdmin.hidden = !abrirAdmin;
  visaoColaborador.hidden = abrirAdmin;
  btnAdmin.textContent = abrirAdmin ? 'Minhas trilhas' : 'Painel Admin';
  if (abrirAdmin && !painelAdminCarregado) carregarPainelAdmin();
});

async function carregarPainelAdmin() {
  tabelaAdmin.innerHTML = '<p class="painel-geral__resumo">Carregando…</p>';
  colaboradoresFeedback.hidden = true;

  const [{ data: perfis, error: erroPerfis }, { data: progressoTodos, error: erroProgresso }] = await Promise.all([
    supabase.from('perfis').select('id, nome, usuario, is_admin, ativo').order('nome', { ascending: true }),
    supabase.from('progresso').select('usuario_id, topico_id, concluido, concluido_em').eq('concluido', true),
  ]);

  if (erroPerfis || erroProgresso) {
    tabelaAdmin.innerHTML = '';
    colaboradoresFeedback.textContent = 'Não foi possível carregar os dados. Confira se as migrações 003, 004 e 006 foram executadas.';
    colaboradoresFeedback.hidden = false;
    return;
  }

  adminPerfisCache = perfis ?? [];
  adminProgressoCache = progressoTodos ?? [];

  renderizarKpis();
  renderizarTabelaAdmin();
  renderizarGerenciarTrilhas();

  const totalColaboradores = adminPerfisCache.length;
  renderizarGraficoEvolucao(adminProgressoCache, totalColaboradores);
  renderizarGraficoTrilhas(adminProgressoCache, totalColaboradores);

  painelAdminCarregado = true;
}

// ---------- estatísticas por colaborador (reutilizadas pela tabela, KPIs e modal) ----------
function calcularEstatisticasColaboradores() {
  const concluidosPorUsuario = new Map(); // usuario_id -> count
  const ultimaAtividadePorUsuario = new Map(); // usuario_id -> data mais recente (string ISO)

  adminProgressoCache.forEach((p) => {
    concluidosPorUsuario.set(p.usuario_id, (concluidosPorUsuario.get(p.usuario_id) ?? 0) + 1);
    if (p.concluido_em) {
      const atual = ultimaAtividadePorUsuario.get(p.usuario_id);
      if (!atual || p.concluido_em > atual) ultimaAtividadePorUsuario.set(p.usuario_id, p.concluido_em);
    }
  });

  const seteDiasAtrasMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return adminPerfisCache.map((p) => {
    const concluidos = concluidosPorUsuario.get(p.id) ?? 0;
    const percentual = totalTopicosGlobal > 0 ? Math.round((concluidos / totalTopicosGlobal) * 100) : 0;
    const ultimaAtividade = ultimaAtividadePorUsuario.get(p.id) ?? null;
    const ultimaAtividadeMs = ultimaAtividade ? new Date(ultimaAtividade).getTime() : null;
    const parado = percentual < 100 && (ultimaAtividadeMs === null || ultimaAtividadeMs < seteDiasAtrasMs);
    const diasParado = ultimaAtividadeMs
      ? Math.floor((Date.now() - ultimaAtividadeMs) / (24 * 60 * 60 * 1000))
      : null;

    return { ...p, concluidos, percentual, ultimaAtividade, parado, diasParado };
  });
}

function renderizarKpis() {
  const estatisticas = calcularEstatisticasColaboradores();

  const media = estatisticas.length > 0
    ? Math.round(estatisticas.reduce((soma, e) => soma + e.percentual, 0) / estatisticas.length)
    : 0;
  kpiMedia.textContent = `${media}%`;

  const destaque = [...estatisticas].sort((a, b) => b.percentual - a.percentual)[0];
  kpiDestaque.textContent = destaque ? `${destaque.nome} · ${destaque.percentual}%` : '—';

  const totalColaboradores = adminPerfisCache.length;
  const topicoParaTrilha = new Map();
  trilhasGlobais.forEach((t) => t.topicos.forEach((top) => topicoParaTrilha.set(top.id, t.id)));
  const concluidosPorTrilha = new Map();
  adminProgressoCache.forEach((p) => {
    const trilhaId = topicoParaTrilha.get(p.topico_id);
    if (!trilhaId) return;
    concluidosPorTrilha.set(trilhaId, (concluidosPorTrilha.get(trilhaId) ?? 0) + 1);
  });
  const trilhasComPercentual = trilhasGlobais
    .filter((t) => t.topicos.length > 0)
    .map((t) => {
      const possivel = t.topicos.length * totalColaboradores;
      const concluidos = concluidosPorTrilha.get(t.id) ?? 0;
      return { titulo: t.titulo, percentual: possivel > 0 ? Math.round((concluidos / possivel) * 100) : 0 };
    })
    .sort((a, b) => a.percentual - b.percentual);
  kpiAtrasada.textContent = trilhasComPercentual[0] ? `${trilhasComPercentual[0].titulo} · ${trilhasComPercentual[0].percentual}%` : '—';

  const seteDiasAtrasMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const concluidosSemana = adminProgressoCache.filter(
    (p) => p.concluido_em && new Date(p.concluido_em).getTime() >= seteDiasAtrasMs
  ).length;
  kpiSemana.textContent = String(concluidosSemana);
}

function renderizarTabelaAdmin() {
  const termo = filtroColaborador.value.trim().toLowerCase();
  const ordenacao = ordenarColaborador.value;

  let estatisticas = calcularEstatisticasColaboradores();

  if (termo) {
    estatisticas = estatisticas.filter(
      (e) => e.nome.toLowerCase().includes(termo) || e.usuario.toLowerCase().includes(termo)
    );
  }

  if (ordenacao === 'progresso-desc') estatisticas.sort((a, b) => b.percentual - a.percentual);
  else if (ordenacao === 'progresso-asc') estatisticas.sort((a, b) => a.percentual - b.percentual);
  else estatisticas.sort((a, b) => a.nome.localeCompare(b.nome));

  tabelaAdmin.innerHTML = '';

  if (estatisticas.length === 0) {
    tabelaAdmin.innerHTML = '<p class="painel-geral__resumo">Nenhum colaborador encontrado.</p>';
    return;
  }

  estatisticas.forEach((e) => {
    const linha = document.createElement('div');
    linha.className = `linha-admin${e.ativo === false ? ' linha-admin--inativo' : ''}`;
    linha.innerHTML = `
      <span class="linha-admin__nome">${escapeHtml(e.nome)} <span class="linha-admin__usuario">@${escapeHtml(e.usuario)}</span></span>
      ${e.is_admin ? '<span class="linha-admin__badge-admin">admin</span>' : ''}
      ${e.ativo === false ? '<span class="linha-admin__badge-inativo">inativo</span>' : ''}
      ${e.parado && e.ativo !== false ? `<span class="linha-admin__badge-parado">${e.diasParado === null ? 'sem começar' : `parado há ${e.diasParado}d`}</span>` : ''}
      <span class="linha-admin__barra"><span class="linha-admin__barra-preenchimento" style="width:${e.percentual}%"></span></span>
      <span class="linha-admin__percentual">${e.concluidos}/${totalTopicosGlobal} · ${e.percentual}%</span>
    `;
    linha.addEventListener('click', () => abrirModalColaborador(e));
    tabelaAdmin.appendChild(linha);
  });
}

filtroColaborador.addEventListener('input', () => renderizarTabelaAdmin());
ordenarColaborador.addEventListener('change', () => renderizarTabelaAdmin());

// =========================================================
// MODAL: DETALHE DO COLABORADOR
// =========================================================
btnFecharColaborador.addEventListener('click', () => fecharModalColaborador());
modalColaboradorFundo.addEventListener('click', () => fecharModalColaborador());

function abrirModalColaborador(colaborador) {
  colaboradorAberto = colaborador;
  colabAcoesFeedback.hidden = true;

  colabNome.textContent = colaborador.nome;
  colabUsuario.textContent = `@${colaborador.usuario}`;

  colabBadges.innerHTML = `
    ${colaborador.is_admin ? '<span class="linha-admin__badge-admin">admin</span>' : ''}
    ${colaborador.ativo === false ? '<span class="linha-admin__badge-inativo">inativo</span>' : ''}
    ${colaborador.parado && colaborador.ativo !== false ? `<span class="linha-admin__badge-parado">${colaborador.diasParado === null ? 'sem começar' : `parado há ${colaborador.diasParado}d`}</span>` : ''}
  `;

  const souEu = colaborador.id === sessaoAtual.user.id;
  btnColabAlternarAcesso.textContent = colaborador.ativo === false ? 'Ativar acesso' : 'Desativar acesso';
  btnColabAlternarAcesso.disabled = souEu;
  btnColabAlternarAcesso.title = souEu ? 'Você não pode desativar o próprio acesso.' : '';
  btnColabAlternarAdmin.textContent = colaborador.is_admin ? 'Remover admin' : 'Tornar admin';
  btnColabAlternarAdmin.disabled = souEu;
  btnColabAlternarAdmin.title = souEu ? 'Você não pode alterar seu próprio nível de acesso por aqui.' : '';

  const concluidosDoColaborador = new Set(
    adminProgressoCache.filter((p) => p.usuario_id === colaborador.id).map((p) => p.topico_id)
  );

  colabChecklist.innerHTML = trilhasGlobais.map((trilha) => `
    <p class="checklist-trilha__titulo">${escapeHtml(trilha.titulo)}</p>
    ${trilha.topicos.map((topico) => {
      const feito = concluidosDoColaborador.has(topico.id);
      return `
        <div class="checklist-item ${feito ? 'checklist-item--feito' : 'checklist-item--pendente'}">
          <span class="checklist-item__marca">${feito ? '✓' : '○'}</span>
          <span>${escapeHtml(topico.titulo)}</span>
        </div>
      `;
    }).join('')}
  `).join('');

  renderizarAtribuicoesColaborador();

  modalColaborador.hidden = false;
}

// ---------- o que este colaborador pode assistir (lista de permissão completa) ----------
function renderizarAtribuicoesColaborador() {
  if (!colaboradorAberto) return;

  if (trilhasGlobais.every((t) => t.topicos.length === 0)) {
    colabAtribuicoesLista.innerHTML = '<p class="atribuicoes-colab-lista__vazio">Nenhum material cadastrado ainda.</p>';
    return;
  }

  colabAtribuicoesLista.innerHTML = '';

  trilhasGlobais.forEach((trilha) => {
    if (trilha.topicos.length === 0) return;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'checklist-trilha__cabecalho';

    const titulo = document.createElement('p');
    titulo.className = 'checklist-trilha__titulo';
    titulo.textContent = trilha.titulo;

    const btnTodaTrilha = document.createElement('button');
    btnTodaTrilha.type = 'button';
    btnTodaTrilha.className = 'link-acao';
    const todosMarcadosNaTrilha = trilha.topicos.every((topico) =>
      (topico.topico_atribuicoes ?? []).some((a) => a.colaborador_id === colaboradorAberto.id)
    );
    btnTodaTrilha.textContent = todosMarcadosNaTrilha ? 'Desmarcar trilha' : 'Marcar trilha toda';
    btnTodaTrilha.addEventListener('click', () => alternarTrilhaInteira(trilha, !todosMarcadosNaTrilha));

    cabecalho.append(titulo, btnTodaTrilha);
    colabAtribuicoesLista.appendChild(cabecalho);

    trilha.topicos.forEach((topico) => {
      const marcado = (topico.topico_atribuicoes ?? []).some((a) => a.colaborador_id === colaboradorAberto.id);

      const item = document.createElement('label');
      item.className = 'atribuicao-colab-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = marcado;
      checkbox.addEventListener('change', () => alternarAtribuicaoColaborador(topico, checkbox));

      const span = document.createElement('span');
      span.textContent = topico.titulo;

      item.append(checkbox, span);
      colabAtribuicoesLista.appendChild(item);
    });
  });
}

// Marca/desmarca este colaborador num material — salva na hora, sem
// precisar de botão "salvar" separado.
async function alternarAtribuicaoColaborador(topico, checkbox) {
  checkbox.disabled = true;

  if (checkbox.checked) {
    const { data, error } = await supabase
      .from('topico_atribuicoes')
      .insert({ topico_id: topico.id, colaborador_id: colaboradorAberto.id })
      .select()
      .single();
    if (error) {
      alert(error.message ?? 'Erro ao liberar material.');
      checkbox.checked = false;
    } else {
      topico.topico_atribuicoes = [...(topico.topico_atribuicoes ?? []), { id: data.id, colaborador_id: colaboradorAberto.id }];
    }
  } else {
    const { error } = await supabase
      .from('topico_atribuicoes')
      .delete()
      .eq('topico_id', topico.id)
      .eq('colaborador_id', colaboradorAberto.id);
    if (error) {
      alert(error.message ?? 'Erro ao remover acesso.');
      checkbox.checked = true;
    } else {
      topico.topico_atribuicoes = (topico.topico_atribuicoes ?? []).filter((a) => a.colaborador_id !== colaboradorAberto.id);
    }
  }

  checkbox.disabled = false;
}

// Marca ou desmarca de uma vez todos os materiais de uma trilha para o
// colaborador aberto — evita clicar item por item quando ele deve ver
// (ou não ver) uma trilha inteira.
async function alternarTrilhaInteira(trilha, marcarTodos) {
  colabAtribuicoesLista.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.disabled = true));

  for (const topico of trilha.topicos) {
    const jaTem = (topico.topico_atribuicoes ?? []).some((a) => a.colaborador_id === colaboradorAberto.id);
    if (marcarTodos && !jaTem) {
      const { data, error } = await supabase
        .from('topico_atribuicoes')
        .insert({ topico_id: topico.id, colaborador_id: colaboradorAberto.id })
        .select()
        .single();
      if (!error) topico.topico_atribuicoes = [...(topico.topico_atribuicoes ?? []), { id: data.id, colaborador_id: colaboradorAberto.id }];
    } else if (!marcarTodos && jaTem) {
      const { error } = await supabase
        .from('topico_atribuicoes')
        .delete()
        .eq('topico_id', topico.id)
        .eq('colaborador_id', colaboradorAberto.id);
      if (!error) topico.topico_atribuicoes = (topico.topico_atribuicoes ?? []).filter((a) => a.colaborador_id !== colaboradorAberto.id);
    }
  }

  renderizarAtribuicoesColaborador();
}

function fecharModalColaborador() {
  modalColaborador.hidden = true;
  colaboradorAberto = null;
}

btnColabResetarSenha.addEventListener('click', async () => {
  if (!colaboradorAberto) return;
  colabAcoesFeedback.hidden = true;

  const confirmar = confirm(`Redefinir a senha de ${colaboradorAberto.nome} para a senha padrão (qaz@123)?`);
  if (!confirmar) return;

  btnColabResetarSenha.disabled = true;
  try {
    const resposta = await fetch('/api/redefinir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessaoAtual.access_token}` },
      body: JSON.stringify({ usuarioId: colaboradorAberto.id }),
    });
    const resultado = await resposta.json();

    colabAcoesFeedback.style.color = resposta.ok ? 'var(--verde)' : '';
    colabAcoesFeedback.textContent = resposta.ok
      ? `Senha redefinida para: ${resultado.senha}`
      : (resultado.error ?? 'Erro ao redefinir senha.');
    colabAcoesFeedback.hidden = false;
  } catch {
    colabAcoesFeedback.style.color = '';
    colabAcoesFeedback.textContent = 'Falha de conexão. Tente novamente.';
    colabAcoesFeedback.hidden = false;
  } finally {
    btnColabResetarSenha.disabled = false;
  }
});

btnColabAlternarAcesso.addEventListener('click', async () => {
  if (!colaboradorAberto) return;
  colabAcoesFeedback.hidden = true;

  const vaiAtivar = colaboradorAberto.ativo === false;
  const acao = vaiAtivar ? 'reativar o acesso de' : 'desativar o acesso de';
  if (!confirm(`Tem certeza que quer ${acao} ${colaboradorAberto.nome}?`)) return;

  btnColabAlternarAcesso.disabled = true;
  try {
    const resposta = await fetch('/api/alternar-acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessaoAtual.access_token}` },
      body: JSON.stringify({ usuarioId: colaboradorAberto.id, ativar: vaiAtivar }),
    });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      colabAcoesFeedback.style.color = '';
      colabAcoesFeedback.textContent = resultado.error ?? 'Erro ao alterar acesso.';
      colabAcoesFeedback.hidden = false;
      return;
    }

    colaboradorAberto.ativo = vaiAtivar;
    painelAdminCarregado = false;
    await carregarPainelAdmin();
    abrirModalColaborador({ ...colaboradorAberto });
  } catch {
    colabAcoesFeedback.style.color = '';
    colabAcoesFeedback.textContent = 'Falha de conexão. Tente novamente.';
    colabAcoesFeedback.hidden = false;
  } finally {
    btnColabAlternarAcesso.disabled = false;
  }
});

btnColabAlternarAdmin.addEventListener('click', async () => {
  if (!colaboradorAberto) return;
  colabAcoesFeedback.hidden = true;

  const vaiVirarAdmin = !colaboradorAberto.is_admin;
  const acao = vaiVirarAdmin ? 'dar acesso de administrador a' : 'remover o acesso de administrador de';
  if (!confirm(`Tem certeza que quer ${acao} ${colaboradorAberto.nome}?`)) return;

  btnColabAlternarAdmin.disabled = true;
  const { error } = await supabase.from('perfis').update({ is_admin: vaiVirarAdmin }).eq('id', colaboradorAberto.id);
  btnColabAlternarAdmin.disabled = false;

  if (error) {
    colabAcoesFeedback.style.color = '';
    colabAcoesFeedback.textContent = error.message ?? 'Erro ao alterar nível de acesso.';
    colabAcoesFeedback.hidden = false;
    return;
  }

  colaboradorAberto.is_admin = vaiVirarAdmin;
  painelAdminCarregado = false;
  await carregarPainelAdmin();
  abrirModalColaborador({ ...colaboradorAberto });
});

function renderizarGraficoEvolucao(progressoConcluido, totalColaboradores) {
  const totalPossivel = totalTopicosGlobal * totalColaboradores;

  // agrupa por dia (yyyy-mm-dd) quantos materiais foram concluídos
  const porDia = new Map();
  progressoConcluido.forEach((p) => {
    if (!p.concluido_em) return;
    const dia = p.concluido_em.slice(0, 10);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  });

  const dias = [...porDia.keys()].sort();
  let acumulado = 0;
  const pontos = dias.map((dia) => {
    acumulado += porDia.get(dia);
    const percentual = totalPossivel > 0 ? Math.round((acumulado / totalPossivel) * 1000) / 10 : 0;
    return { dia, percentual };
  });

  if (graficoEvolucao) graficoEvolucao.destroy();

  if (pontos.length === 0) {
    desenharGraficoVazio(canvasEvolucao, 'Ainda não há materiais concluídos para mostrar evolução.');
    return;
  }

  graficoEvolucao = new Chart(canvasEvolucao, {
    type: 'line',
    data: {
      labels: pontos.map((p) => formatarDataCurta(p.dia)),
      datasets: [{
        label: '% concluído pela equipe',
        data: pontos.map((p) => p.percentual),
        borderColor: '#e5482b',
        backgroundColor: 'rgba(229, 72, 43, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#e5482b',
      }],
    },
    options: optionsBaseGrafico('% concluído (acumulado)'),
  });
}

function renderizarGraficoTrilhas(progressoConcluido, totalColaboradores) {
  const topicoParaTrilha = new Map();
  trilhasGlobais.forEach((t) => t.topicos.forEach((top) => topicoParaTrilha.set(top.id, t.id)));

  const concluidosPorTrilha = new Map();
  progressoConcluido.forEach((p) => {
    const trilhaId = topicoParaTrilha.get(p.topico_id);
    if (!trilhaId) return;
    concluidosPorTrilha.set(trilhaId, (concluidosPorTrilha.get(trilhaId) ?? 0) + 1);
  });

  const dados = trilhasGlobais.map((t) => {
    const possivel = t.topicos.length * totalColaboradores;
    const concluidos = concluidosPorTrilha.get(t.id) ?? 0;
    const percentual = possivel > 0 ? Math.round((concluidos / possivel) * 1000) / 10 : 0;
    return { titulo: t.titulo, percentual };
  });

  if (graficoTrilhas) graficoTrilhas.destroy();

  if (dados.length === 0) {
    desenharGraficoVazio(canvasTrilhas, 'Nenhuma trilha cadastrada ainda.');
    return;
  }

  graficoTrilhas = new Chart(canvasTrilhas, {
    type: 'bar',
    data: {
      labels: dados.map((d) => d.titulo),
      datasets: [{
        label: '% médio concluído',
        data: dados.map((d) => d.percentual),
        backgroundColor: '#e5482b',
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    },
    options: optionsBaseGrafico('% concluído (média da equipe)'),
  });
}

function optionsBaseGrafico(rotuloEixoY) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#8b919b', callback: (v) => `${v}%` },
        grid: { color: '#2a2e37' },
        title: { display: true, text: rotuloEixoY, color: '#8b919b' },
      },
      x: {
        ticks: { color: '#8b919b', autoSkip: true, maxRotation: 40, minRotation: 0 },
        grid: { display: false },
      },
    },
  };
}

function desenharGraficoVazio(canvas, mensagem) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#8b919b';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(mensagem, 10, 30);
}

function formatarDataCurta(isoData) {
  const [ano, mes, dia] = isoData.split('-');
  return `${dia}/${mes}`;
}

function slugify(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =========================================================
// GERENCIAR TRILHAS E TÓPICOS (acordeão + leitura/edição + busca)
// =========================================================
const buscaTreinamentos = document.getElementById('busca-treinamentos');
let gerenciarAbertas = new Set(); // ids de trilha com o acordeão expandido
let gerenciarTrilhaEditando = null; // id da trilha cujo cabeçalho está em modo edição
let gerenciarTopicoEditando = null; // id do tópico cuja linha está em modo edição

const iconeChevron = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const iconeEditar = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-3 .6.6-3 7-7Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
const iconeExcluir = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5 5 13a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const iconeAbrir = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6.5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5M9.5 2.5H13.5V6.5M13 3 7.5 8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderizarGerenciarTrilhas() {
  const termo = buscaTreinamentos.value.trim().toLowerCase();

  const trilhasFiltradas = termo
    ? trilhasGlobais.filter((t) =>
        t.titulo.toLowerCase().includes(termo) ||
        t.topicos.some((top) => top.titulo.toLowerCase().includes(termo))
      )
    : trilhasGlobais;

  if (trilhasGlobais.length === 0) {
    gerenciarTrilhasEl.innerHTML = '<p class="painel-geral__resumo">Nenhuma trilha cadastrada ainda.</p>';
    return;
  }
  if (trilhasFiltradas.length === 0) {
    gerenciarTrilhasEl.innerHTML = '<p class="painel-geral__resumo">Nenhum resultado para essa busca.</p>';
    return;
  }

  const hoje = new Date().toISOString().slice(0, 10);

  gerenciarTrilhasEl.innerHTML = trilhasFiltradas.map((trilha) => {
    const atrasada = trilha.prazo && trilha.prazo < hoje;
    const aberta = gerenciarAbertas.has(trilha.id) || (termo && trilha.topicos.some((top) => top.titulo.toLowerCase().includes(termo)));
    const editandoTrilha = gerenciarTrilhaEditando === trilha.id;

    return `
    <div class="gerenciar-trilha ${aberta ? 'gerenciar-trilha--aberta' : ''}" data-trilha-id="${escapeHtml(trilha.id)}">
      <div class="gerenciar-trilha__cabecalho" data-acao="toggle-trilha">
        ${editandoTrilha ? `
          <div class="gerenciar-trilha__campos" data-campos-trilha>
            <input class="gerenciar-trilha__campo-titulo" data-campo="titulo" type="text" value="${escapeHtml(trilha.titulo)}" />
            <input class="gerenciar-trilha__campo-descricao" data-campo="descricao" type="text" value="${escapeHtml(trilha.descricao ?? '')}" placeholder="Descrição" />
            <input class="gerenciar-trilha__campo-prazo" data-campo="prazo" type="date" value="${trilha.prazo ?? ''}" />
          </div>
        ` : `
          <div class="gerenciar-trilha__info">
            <p class="gerenciar-trilha__titulo">${escapeHtml(trilha.titulo)} ${atrasada ? '<span class="badge-atrasada">atrasada</span>' : ''}</p>
            <p class="gerenciar-trilha__meta">${trilha.topicos.length} material(is)${trilha.prazo ? ` · prazo ${formatarDataBR(trilha.prazo)}` : ''}</p>
          </div>
        `}
        <div class="gerenciar-trilha__acoes">
          ${editandoTrilha ? `
            <button type="button" class="botao--icone" data-acao="salvar-trilha" title="Salvar">${iconeCheck()}</button>
            <button type="button" class="botao--icone" data-acao="cancelar-trilha" title="Cancelar">${iconeX()}</button>
          ` : `
            <button type="button" class="botao--icone" data-acao="editar-trilha" title="Editar">${iconeEditar}</button>
            <button type="button" class="botao--icone botao--icone-perigo" data-acao="excluir-trilha" title="Excluir">${iconeExcluir}</button>
            <span class="gerenciar-trilha__chevron">${iconeChevron}</span>
          `}
        </div>
      </div>

      <div class="gerenciar-trilha__topicos">
        ${trilha.topicos.map((topico) => {
          const editandoTopico = gerenciarTopicoEditando === topico.id;
          const anexos = topico.topico_anexos ?? [];
          return `
          <div class="gerenciar-topico__linha" data-topico-id="${escapeHtml(topico.id)}">
            ${editandoTopico ? `
              <input class="gerenciar-topico__campo-titulo" data-campo="titulo" type="text" value="${escapeHtml(topico.titulo)}" />
              <div class="gerenciar-topico__anexos-edit" data-topico-anexos-edit></div>
              <div class="gerenciar-topico__acoes">
                <button type="button" class="botao--icone" data-acao="salvar-topico" title="Salvar">${iconeCheck()}</button>
                <button type="button" class="botao--icone" data-acao="cancelar-topico" title="Cancelar">${iconeX()}</button>
              </div>
            ` : `
              <span class="gerenciar-topico__titulo">${escapeHtml(topico.titulo)}</span>
              ${(() => {
                const qtd = (topico.topico_atribuicoes ?? []).length;
                const totalColab = adminPerfisCache.length;
                if (qtd === 0) {
                  return `<span class="gerenciar-topico__badge-invisivel" title="Ninguém foi marcado pra ver este material — ele está invisível pra todo mundo. Marque quem pode ver no perfil de cada colaborador.">⚠ ninguém vê</span>`;
                }
                if (totalColab > 0 && qtd >= totalColab) {
                  return `<span class="gerenciar-topico__badge-todos" title="Todos os colaboradores cadastrados podem ver este material">✓ todos veem</span>`;
                }
                return `<span class="gerenciar-topico__badge-restrito" title="Visível só para colaboradores específicos — gerencie quem vê no perfil de cada colaborador">🔒 ${qtd}</span>`;
              })()}
              ${anexos.length > 0
                ? `<span class="gerenciar-topico__anexos-view">${anexos.map((anexo) =>
                    `<a class="gerenciar-topico__link" href="${escapeHtml(anexo.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(anexo.titulo || 'Abrir material')}">${iconeAbrir}</a>`
                  ).join('')}</span>`
                : '<span class="gerenciar-topico__sem-link">sem link</span>'}
              <div class="gerenciar-topico__acoes">
                <button type="button" class="botao--icone" data-acao="editar-topico" title="Editar">${iconeEditar}</button>
                <button type="button" class="botao--icone botao--icone-perigo" data-acao="excluir-topico" title="Excluir">${iconeExcluir}</button>
              </div>
            `}
          </div>
        `;
        }).join('')}
      </div>
    </div>
  `;
  }).join('');

  montarAnexosEdicao();
}

// Popula a área de anexos do material que está em edição (não dá pra ir
// direto no template acima porque <input type="file"> perde o arquivo
// selecionado sempre que o HTML é regerado via innerHTML).
function montarAnexosEdicao() {
  if (!gerenciarTopicoEditando) return;
  const container = gerenciarTrilhasEl.querySelector(
    `.gerenciar-topico__linha[data-topico-id="${gerenciarTopicoEditando}"] [data-topico-anexos-edit]`
  );
  if (!container) return;

  const topicoAtual = trilhasGlobais.flatMap((t) => t.topicos).find((t) => t.id === gerenciarTopicoEditando);
  if (!topicoAtual) return;

  container.innerHTML = '';

  (topicoAtual.topico_anexos ?? []).forEach((anexo) => {
    const linha = document.createElement('div');
    linha.className = 'anexo-linha anexo-linha--existente';
    linha.dataset.anexoId = anexo.id;
    const nome = anexo.titulo || (anexo.tipo === 'arquivo' ? 'Arquivo' : 'Link');

    const label = document.createElement('span');
    label.className = 'anexo-linha__label';
    label.textContent = nome + ' ';
    const link = document.createElement('a');
    link.href = anexo.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'abrir';
    label.appendChild(link);

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'botao--icone anexo-remover';
    btnRemover.title = 'Remover';
    btnRemover.innerHTML = iconeX();
    btnRemover.addEventListener('click', () => linha.remove());

    linha.append(label, btnRemover);
    container.appendChild(linha);
  });

  const botoes = document.createElement('div');
  botoes.className = 'anexos-lista__botoes';

  const btnLink = document.createElement('button');
  btnLink.type = 'button';
  btnLink.className = 'botao botao--fantasma';
  btnLink.textContent = '+ Adicionar link';
  btnLink.addEventListener('click', () => container.insertBefore(criarLinhaAnexoNovo('link'), botoes));

  const btnArquivo = document.createElement('button');
  btnArquivo.type = 'button';
  btnArquivo.className = 'botao botao--fantasma';
  btnArquivo.textContent = '+ Anexar arquivo';
  btnArquivo.addEventListener('click', () => container.insertBefore(criarLinhaAnexoNovo('arquivo'), botoes));

  botoes.append(btnLink, btnArquivo);
  container.appendChild(botoes);
}

function iconeCheck() {
  return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function iconeX() {
  return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
}
function formatarDataBR(isoData) {
  const [ano, mes, dia] = isoData.split('-');
  return `${dia}/${mes}/${ano}`;
}

buscaTreinamentos.addEventListener('input', () => renderizarGerenciarTrilhas());

gerenciarTrilhasEl.addEventListener('click', async (evento) => {
  const alvoAcao = evento.target.closest('[data-acao]');
  if (!alvoAcao) return;
  const acao = alvoAcao.dataset.acao;

  // ---------- alternar acordeão ----------
  if (acao === 'toggle-trilha') {
    if (evento.target.closest('button, a, input')) return; // não conflita com botões/links dentro do cabeçalho
    const bloco = alvoAcao.closest('.gerenciar-trilha');
    const trilhaId = bloco.dataset.trilhaId;
    if (gerenciarAbertas.has(trilhaId)) gerenciarAbertas.delete(trilhaId);
    else gerenciarAbertas.add(trilhaId);
    renderizarGerenciarTrilhas();
    return;
  }

  // ---------- editar/cancelar (só troca modo, sem ir ao banco) ----------
  if (acao === 'editar-trilha') {
    gerenciarTrilhaEditando = alvoAcao.closest('.gerenciar-trilha').dataset.trilhaId;
    gerenciarAbertas.add(gerenciarTrilhaEditando);
    renderizarGerenciarTrilhas();
    return;
  }
  if (acao === 'cancelar-trilha') {
    gerenciarTrilhaEditando = null;
    renderizarGerenciarTrilhas();
    return;
  }
  if (acao === 'editar-topico') {
    gerenciarTopicoEditando = alvoAcao.closest('.gerenciar-topico__linha').dataset.topicoId;
    renderizarGerenciarTrilhas();
    return;
  }
  if (acao === 'cancelar-topico') {
    gerenciarTopicoEditando = null;
    renderizarGerenciarTrilhas();
    return;
  }

  // ---------- salvar/excluir trilha ----------
  if (acao === 'salvar-trilha' || acao === 'excluir-trilha') {
    const bloco = alvoAcao.closest('.gerenciar-trilha');
    const trilhaId = bloco.dataset.trilhaId;

    if (acao === 'excluir-trilha') {
      const trilha = trilhasGlobais.find((t) => t.id === trilhaId);
      if (!confirm(`Excluir a trilha "${trilha?.titulo}" e todos os seus ${trilha?.topicos.length ?? 0} materiais? Isso também apaga o progresso já registrado nela.`)) return;

      const { error } = await supabase.from('trilhas').delete().eq('id', trilhaId);
      if (error) { alert(error.message ?? 'Erro ao excluir trilha.'); return; }
      gerenciarAbertas.delete(trilhaId);
    } else {
      const titulo = bloco.querySelector('[data-campo="titulo"]').value.trim();
      const descricao = bloco.querySelector('[data-campo="descricao"]').value.trim();
      const prazo = bloco.querySelector('[data-campo="prazo"]').value || null;
      if (!titulo) { alert('O título não pode ficar vazio.'); return; }

      const { error } = await supabase
        .from('trilhas')
        .update({ titulo, descricao: descricao || null, prazo })
        .eq('id', trilhaId);
      if (error) { alert(error.message ?? 'Erro ao salvar trilha.'); return; }
      gerenciarTrilhaEditando = null;
    }

    await iniciarDashboard();
    painelAdmin.hidden = false;
    visaoColaborador.hidden = true;
    btnAdmin.textContent = 'Minhas trilhas';
    painelAdminCarregado = false;
    await carregarPainelAdmin();
    return;
  }

  // ---------- salvar/excluir tópico ----------
  if (acao === 'salvar-topico' || acao === 'excluir-topico') {
    const linha = alvoAcao.closest('.gerenciar-topico__linha');
    const topicoId = linha.dataset.topicoId;

    if (acao === 'excluir-topico') {
      if (!confirm('Excluir este material? Isso também apaga o progresso já registrado nele.')) return;
      const { error } = await supabase.from('topicos').delete().eq('id', topicoId);
      if (error) { alert(error.message ?? 'Erro ao excluir material.'); return; }
    } else {
      const titulo = linha.querySelector('[data-campo="titulo"]').value.trim();
      if (!titulo) { alert('O título não pode ficar vazio.'); return; }

      const anexosContainer = linha.querySelector('[data-topico-anexos-edit]');
      const topicoAtual = trilhasGlobais.flatMap((t) => t.topicos).find((t) => t.id === topicoId);
      const idsOriginais = (topicoAtual?.topico_anexos ?? []).map((a) => a.id);
      const idsMantidos = new Set(
        Array.from(anexosContainer.querySelectorAll('.anexo-linha--existente')).map((el) => el.dataset.anexoId)
      );
      const idsParaRemover = idsOriginais.filter((id) => !idsMantidos.has(id));

      const { error } = await supabase.from('topicos').update({ titulo }).eq('id', topicoId);
      if (error) { alert(error.message ?? 'Erro ao salvar material.'); return; }

      if (idsParaRemover.length > 0) {
        const { error: erroRemover } = await supabase.from('topico_anexos').delete().in('id', idsParaRemover);
        if (erroRemover) alert(erroRemover.message ?? 'Erro ao remover algum anexo.');
      }

      const { inseridos, erros } = await processarAnexosNovos(anexosContainer, topicoId, idsMantidos.size + 1);
      if (inseridos.length > 0) {
        const { error: erroInserir } = await supabase.from('topico_anexos').insert(inseridos);
        if (erroInserir) erros.push(erroInserir.message ?? 'Erro ao salvar um dos anexos novos.');
      }

      if (erros.length > 0) alert(erros.join(' '));
    }

    gerenciarTopicoEditando = null;
    await iniciarDashboard();
    painelAdmin.hidden = false;
    visaoColaborador.hidden = true;
    btnAdmin.textContent = 'Minhas trilhas';
    painelAdminCarregado = false;
    await carregarPainelAdmin();
  }
});

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

formNovaTrilha.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  trilhaFeedback.hidden = true;

  const titulo = trilhaTitulo.value.trim();
  const descricao = trilhaDescricao.value.trim();
  const prazo = trilhaPrazo.value || null;
  if (!titulo) return;

  const id = slugify(titulo);
  const ordem = trilhasGlobais.length + 1;

  btnNovaTrilha.disabled = true;
  btnNovaTrilha.querySelector('span').textContent = 'Criando…';

  const { error } = await supabase.from('trilhas').insert({ id, titulo, descricao: descricao || null, prazo, ordem });

  btnNovaTrilha.disabled = false;
  btnNovaTrilha.querySelector('span').textContent = 'Criar trilha';

  if (error) {
    trilhaFeedback.style.color = '';
    trilhaFeedback.textContent = error.code === '23505'
      ? 'Já existe uma trilha com um título muito parecido. Tente um título diferente.'
      : (error.message ?? 'Erro ao criar trilha.');
    trilhaFeedback.hidden = false;
    return;
  }

  trilhaFeedback.style.color = 'var(--verde)';
  trilhaFeedback.textContent = `Trilha "${titulo}" criada!`;
  trilhaFeedback.hidden = false;
  formNovaTrilha.reset();

  await iniciarDashboard();
  painelAdmin.hidden = false;
  visaoColaborador.hidden = true;
  btnAdmin.textContent = 'Minhas trilhas';
  painelAdminCarregado = false;
  await carregarPainelAdmin();
});

// =========================================================
// ANEXOS (links e arquivos de um material) — usado tanto no
// formulário "Novo material" quanto na edição de um material existente.
// =========================================================

// Detecta caminhos de arquivo local/rede que NÃO funcionam num navegador
// de outra pessoa (ex: C:\Pasta\arquivo.pdf ou \\servidor\pasta\arquivo.pdf).
function pareceCaminhoLocal(valor) {
  const v = valor.trim();
  return /^[a-zA-Z]:[\\/]/.test(v) || v.startsWith('\\\\') || v.toLowerCase().startsWith('file://');
}

// Valida/normaliza um link colado pelo admin. Retorna { ok: true, url } ou
// { ok: false, motivo } com uma mensagem explicando o que corrigir.
function normalizarUrlAnexo(valor) {
  const v = valor.trim();
  if (!v) return { ok: false, motivo: '' };
  if (pareceCaminhoLocal(v)) {
    return {
      ok: false,
      motivo: `"${v}" parece ser um caminho de arquivo do seu computador ou da rede local — isso não abre no navegador de outra pessoa. Use o botão "Anexar arquivo" para enviar o arquivo de verdade.`,
    };
  }
  if (/^https?:\/\//i.test(v)) return { ok: true, url: v };
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v)) return { ok: true, url: `https://${v}` };
  return {
    ok: false,
    motivo: `"${v}" não parece um link válido. Cole um endereço começando com https:// ou use "Anexar arquivo".`,
  };
}

// Envia um arquivo para o bucket de Storage e devolve a URL pública dele.
async function uploadArquivoAnexo(file, topicoId) {
  if (file.size > TAMANHO_MAX_ARQUIVO) {
    return { ok: false, motivo: `"${file.name}" tem mais de 50MB — envie um arquivo menor ou use um link (Google Drive, etc).` };
  }
  const nomeSeguro = file.name.replace(/[^\w.\-]+/g, '_');
  const caminho = `topicos/${topicoId}/${Date.now()}-${nomeSeguro}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(caminho, file, { upsert: false });
  if (error) {
    return {
      ok: false,
      motivo: `Falha ao enviar "${file.name}": ${error.message}${error.message?.includes('Bucket not found') ? ' — o bucket "materiais" ainda não foi criado no Supabase (rode sql/2026-08-topico-anexos.sql).' : ''}`,
    };
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(caminho);
  return { ok: true, url: data.publicUrl };
}

// Cria a linha de UM anexo ainda não salvo (link ou arquivo), com botão de remover.
function criarLinhaAnexoNovo(tipo) {
  const linha = document.createElement('div');
  linha.className = 'anexo-linha anexo-linha--novo';
  linha.dataset.tipo = tipo;

  const campoTitulo = document.createElement('input');
  campoTitulo.type = 'text';
  campoTitulo.className = 'anexo-titulo';
  campoTitulo.placeholder = tipo === 'link' ? 'Nome do link (opcional)' : 'Nome do arquivo (opcional)';

  const campoValor = document.createElement('input');
  if (tipo === 'link') {
    campoValor.type = 'text';
    campoValor.className = 'anexo-url';
    campoValor.placeholder = 'https://...';
  } else {
    campoValor.type = 'file';
    campoValor.className = 'anexo-arquivo';
  }

  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.className = 'botao--icone anexo-remover';
  btnRemover.title = 'Remover';
  btnRemover.innerHTML = iconeX();
  btnRemover.addEventListener('click', () => linha.remove());

  linha.append(campoTitulo, campoValor, btnRemover);
  return linha;
}

// Percorre as linhas .anexo-linha--novo de um container, valida/faz upload
// de cada uma e devolve { inseridos, erros } prontos para inserir no banco.
async function processarAnexosNovos(container, topicoId, ordemInicial = 1) {
  const erros = [];
  const inseridos = [];
  let ordem = ordemInicial;

  for (const linha of container.querySelectorAll('.anexo-linha--novo')) {
    const tipo = linha.dataset.tipo;
    const tituloValor = linha.querySelector('.anexo-titulo').value.trim() || null;

    if (tipo === 'link') {
      const bruto = linha.querySelector('.anexo-url').value.trim();
      if (!bruto) continue;
      const resultado = normalizarUrlAnexo(bruto);
      if (!resultado.ok) { if (resultado.motivo) erros.push(resultado.motivo); continue; }
      inseridos.push({ topico_id: topicoId, titulo: tituloValor, url: resultado.url, tipo: 'link', ordem: ordem++ });
    } else {
      const file = linha.querySelector('.anexo-arquivo').files[0];
      if (!file) continue;
      const resultado = await uploadArquivoAnexo(file, topicoId);
      if (!resultado.ok) { erros.push(resultado.motivo); continue; }
      inseridos.push({ topico_id: topicoId, titulo: tituloValor || file.name, url: resultado.url, tipo: 'arquivo', ordem: ordem++ });
    }
  }

  return { inseridos, erros };
}

btnAddAnexoLink.addEventListener('click', () => topicoAnexosLista.appendChild(criarLinhaAnexoNovo('link')));
btnAddAnexoArquivo.addEventListener('click', () => topicoAnexosLista.appendChild(criarLinhaAnexoNovo('arquivo')));

formNovoTopico.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  topicoFeedback.hidden = true;

  const trilhaId = topicoTrilhaSelect.value;
  const titulo = topicoTitulo.value.trim();
  if (!trilhaId || !titulo) return;

  const trilha = trilhasGlobais.find((t) => t.id === trilhaId);
  const ordem = (trilha?.topicos.length ?? 0) + 1;

  btnNovoTopico.disabled = true;
  btnNovoTopico.querySelector('span').textContent = 'Adicionando…';

  const { data: novoTopico, error } = await supabase
    .from('topicos')
    .insert({ trilha_id: trilhaId, titulo, ordem })
    .select()
    .single();

  if (error) {
    btnNovoTopico.disabled = false;
    btnNovoTopico.querySelector('span').textContent = 'Adicionar material';
    topicoFeedback.style.color = '';
    topicoFeedback.textContent = error.message ?? 'Erro ao adicionar material.';
    topicoFeedback.hidden = false;
    return;
  }

  const { inseridos, erros } = await processarAnexosNovos(topicoAnexosLista, novoTopico.id);
  if (inseridos.length > 0) {
    const { error: erroAnexos } = await supabase.from('topico_anexos').insert(inseridos);
    if (erroAnexos) erros.push(erroAnexos.message ?? 'Erro ao salvar um dos anexos.');
  }

  // Sem isso, o material nasce sem ninguém marcado e fica invisível pra
  // todo mundo (modelo é lista de permissão). Se o checkbox estiver
  // marcado, já libera pra todos os colaboradores atuais.
  if (topicoLiberarTodos.checked && adminPerfisCache.length > 0) {
    const linhas = adminPerfisCache.map((p) => ({ topico_id: novoTopico.id, colaborador_id: p.id }));
    const { error: erroAtribuicoes } = await supabase.from('topico_atribuicoes').insert(linhas);
    if (erroAtribuicoes) erros.push(erroAtribuicoes.message ?? 'Erro ao liberar o material para todos.');
  }

  btnNovoTopico.disabled = false;
  btnNovoTopico.querySelector('span').textContent = 'Adicionar material';

  if (erros.length > 0) {
    topicoFeedback.style.color = '';
    topicoFeedback.textContent = `Material "${titulo}" foi criado, mas: ${erros.join(' ')}`;
    topicoFeedback.hidden = false;
  } else {
    topicoFeedback.style.color = 'var(--verde)';
    topicoFeedback.textContent = `Material "${titulo}" adicionado!`;
    topicoFeedback.hidden = false;
  }

  formNovoTopico.reset();
  topicoAnexosLista.innerHTML = '';

  await iniciarDashboard();
  painelAdmin.hidden = false;
  visaoColaborador.hidden = true;
  btnAdmin.textContent = 'Minhas trilhas';
  painelAdminCarregado = false;
  await carregarPainelAdmin();
});

function renderizarTrilhas(trilhas) {
  listaTrilhas.innerHTML = '';
  const hoje = new Date().toISOString().slice(0, 10);
  const trilhasVisiveis = trilhas.filter((t) => t.topicos.length > 0);

  trilhasVisiveis.forEach((trilha, indice) => {
    const total = trilha.topicos.length;
    const concluidos = trilha.topicos.filter((t) => progressoPorTopico.get(t.id)?.concluido).length;
    const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    const atrasada = trilha.prazo && trilha.prazo < hoje && percentual < 100;

    const card = document.createElement('article');
    card.className = `trilha ${classeEstadoTrilha(percentual)}`;
    card.dataset.trilhaId = trilha.id;

    card.innerHTML = `
      <button type="button" class="trilha__cabecalho" aria-expanded="false">
        <span class="trilha__numero">BOX ${String(indice + 1).padStart(2, '0')}</span>
        <span class="trilha__texto">
          <p class="trilha__titulo">${escapeHtml(trilha.titulo)} ${percentual >= 100 ? '<span class="trilha__badge-concluida">✓ concluída</span>' : ''}</p>
          <p class="trilha__descricao">${escapeHtml(trilha.descricao ?? '')}</p>
          ${trilha.prazo ? `<p class="trilha__prazo ${atrasada ? 'trilha__prazo--atrasado' : ''}">${atrasada ? 'Prazo vencido' : 'Prazo'}: ${formatarDataBR(trilha.prazo)}</p>` : ''}
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

  atualizarBotaoContinuar(trilhas);
}

function classeEstadoTrilha(percentual) {
  if (percentual >= 100) return 'trilha--concluida';
  if (percentual > 0) return 'trilha--em-andamento';
  return 'trilha--nao-iniciada';
}

// ---------- ícone por tipo de material, a partir da URL ----------
function iconePorMaterial(url) {
  if (!url) return { icone: '', rotulo: 'Abrir material' };
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return {
      icone: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M6.8 6.3v3.4l3-1.7-3-1.7Z" fill="currentColor"/></svg>',
      rotulo: 'Assistir vídeo',
    };
  }
  if (u.includes('docs.google.com/presentation')) {
    return {
      icone: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 14.5h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      rotulo: 'Ver apresentação',
    };
  }
  return {
    icone: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5.5L12.5 4.5V14a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M9.5 1.5V4.5H12.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    rotulo: 'Abrir artigo',
  };
}

function criarLinhaTopico(topico, trilha, card) {
  const linha = document.createElement('label');
  linha.className = 'topico';
  linha.dataset.topicoId = topico.id;

  const jaConcluido = !!progressoPorTopico.get(topico.id)?.concluido;
  const anexos = topico.topico_anexos ?? [];

  const linksHtml = anexos.length > 0
    ? `<span class="topico__links">${anexos.map((anexo) => {
        const { icone, rotulo } = iconePorMaterial(anexo.url);
        const nome = anexo.titulo ? escapeHtml(anexo.titulo) : rotulo;
        return `<a class="topico__link" href="${escapeHtml(anexo.url)}" target="_blank" rel="noopener noreferrer">${icone}${nome} →</a>`;
      }).join('')}</span>`
    : `<span class="topico__sem-link">Material offline — solicite acesso ao time</span>`;

  linha.innerHTML = `
    <input type="checkbox" ${jaConcluido ? 'checked' : ''} />
    <span class="topico__texto">
      <p class="topico__titulo ${jaConcluido ? 'topico__titulo--concluido' : ''}">${escapeHtml(topico.titulo)}</p>
      ${linksHtml}
    </span>
  `;

  // A linha inteira é um <label> (pra clicar em qualquer lugar marcar o
  // checkbox). Sem isto, clicar num link também aciona o toggle do
  // checkbox e, em vários navegadores, o clique no link parece "não fazer
  // nada" — por isso os materiais pareciam não abrir.
  linha.querySelectorAll('.topico__link').forEach((a) => {
    a.addEventListener('click', (evento) => evento.stopPropagation());
  });

  const checkbox = linha.querySelector('input');
  checkbox.addEventListener('change', async () => {
    const totalTrilha = trilha.topicos.length;
    const concluidosAntes = trilha.topicos.filter((t) => progressoPorTopico.get(t.id)?.concluido).length;
    const estavaCompleta = totalTrilha > 0 && concluidosAntes === totalTrilha;

    checkbox.disabled = true;
    await alternarProgresso(topico, checkbox.checked);
    linha.querySelector('.topico__titulo').classList.toggle('topico__titulo--concluido', checkbox.checked);
    checkbox.disabled = false;
    atualizarMedidorTrilha(card, trilha);
    atualizarResumoGeral(null); // recalcula usando o cache já atualizado
    atualizarBotaoContinuar(trilhasVisiveis);

    const concluidosDepois = trilha.topicos.filter((t) => progressoPorTopico.get(t.id)?.concluido).length;
    const estaCompleta = totalTrilha > 0 && concluidosDepois === totalTrilha;
    if (!estavaCompleta && estaCompleta) mostrarCelebracao(trilha.titulo);
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

  card.classList.remove('trilha--concluida', 'trilha--em-andamento', 'trilha--nao-iniciada');
  card.classList.add(classeEstadoTrilha(percentual));

  const tituloEl = card.querySelector('.trilha__titulo');
  const jaTemBadge = tituloEl.querySelector('.trilha__badge-concluida');
  if (percentual >= 100 && !jaTemBadge) {
    tituloEl.insertAdjacentHTML('beforeend', ' <span class="trilha__badge-concluida">✓ concluída</span>');
  } else if (percentual < 100 && jaTemBadge) {
    jaTemBadge.remove();
  }
}

// =========================================================
// ATALHO "CONTINUAR DE ONDE PAREI"
// =========================================================
function atualizarBotaoContinuar(trilhas) {
  const proximo = encontrarProximoPendente(trilhas);
  btnContinuar.hidden = !proximo;
}

function encontrarProximoPendente(trilhas) {
  for (const trilha of trilhas) {
    const pendente = trilha.topicos.find((t) => !progressoPorTopico.get(t.id)?.concluido);
    if (pendente) return { trilha, topico: pendente };
  }
  return null;
}

btnContinuar.addEventListener('click', () => {
  const proximo = encontrarProximoPendente(trilhasVisiveis);
  if (!proximo) return;

  const card = listaTrilhas.querySelector(`.trilha[data-trilha-id="${CSS.escape(proximo.trilha.id)}"]`);
  if (!card) return;

  if (!card.classList.contains('aberta')) {
    card.classList.add('aberta');
    card.querySelector('.trilha__cabecalho').setAttribute('aria-expanded', 'true');
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('trilha--destacada');
  setTimeout(() => card.classList.remove('trilha--destacada'), 2800);

  const linhaTopico = card.querySelector(`.topico[data-topico-id="${CSS.escape(proximo.topico.id)}"]`);
  if (linhaTopico) {
    linhaTopico.classList.add('topico--destacado');
    setTimeout(() => linhaTopico.classList.remove('topico--destacado'), 2800);
  }
});

// =========================================================
// CELEBRAÇÃO AO CONCLUIR UMA TRILHA
// =========================================================
let temporizadorToast = null;
function mostrarCelebracao(tituloTrilha) {
  toastTexto.textContent = `Trilha concluída: ${tituloTrilha}!`;
  toastCelebracao.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => { toastCelebracao.hidden = true; }, 3200);
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
