# Pit Stop — Trilhas de Conhecimento

Plataforma web para o setor de suporte: cada colaborador faz login, vê as
trilhas de treinamento (baseadas no material que você já reuniu) e marca o
que já concluiu. Tudo fica salvo no Supabase, por usuário.

## O que tem aqui

```
pitstop-trilhas/
├── index.html          # tela de login + dashboard
├── style.css            # visual (tema "boxes de corrida")
├── app.js                # lógica: login, carregar trilhas, marcar progresso
├── schema.sql            # tabelas + segurança (RLS) + conteúdo das trilhas
└── seed/
    ├── seed_usuarios.js  # cria os 16 logins iniciais de uma vez
    ├── package.json
    └── .env.example
```

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com, crie uma conta (ou entre) e clique em **New project**.
2. Espere o projeto ficar pronto (leva ~2 min).
3. No menu lateral, vá em **SQL Editor** → **New query**, cole o conteúdo do
   arquivo `schema.sql` e clique em **Run**. Isso cria as 4 tabelas
   (`perfis`, `trilhas`, `topicos`, `progresso`), as regras de segurança e já
   insere todas as trilhas/materiais do seu documento.
4. Em **Settings → API**, anote dois valores que você vai usar:
   - **Project URL**
   - **anon public key**
   - **service_role key** (fica em "Project API keys" — é secreta, use só no passo 3)

## Passo 2 — Configurar o front-end

Abra `app.js` e troque as duas linhas do topo:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

pelos valores do seu projeto (URL e **anon key**, nunca a service_role aqui).

## Passo 3 — Criar os logins dos 16 colaboradores

O Supabase Auth pede e-mail, então cada usuário recebe um e-mail interno no
formato `usuario@pitstop.local` (não é um e-mail real, só um identificador —
ninguém troca mensagem por ele).

1. `cd seed`
2. `npm install`
3. Copie `.env.example` para `.env` e preencha:
   ```
   SUPABASE_URL=https://SEU-PROJETO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=a-service-role-key-do-passo-1
   ```
4. `node seed_usuarios.js`

Isso cria o login e o perfil de cada colaborador com a senha padrão
`qaz@123`. A lista de usuários (username de login) gerada é:

| Nome | Usuário para login |
|---|---|
| FÁBIO | `fabio` |
| DINIZ | `diniz` |
| HENRIQUE | `henrique` |
| TONY | `tony` |
| FABRICIA | `fabricia` |
| CAUE | `caue` |
| CAVALCANTE | `cavalcante` |
| SANTOS | `santos` |
| NANDA | `nanda` |
| GUILHERME | `guilherme` |
| MARLISSON | `marlisson` |
| RYAN | `ryan` |
| EMAUNEL* | `emaunel` |
| JONAS | `jonas` |
| MARIA FERNANDA | `maria.fernanda` |
| MAICON FELIPE | `maicon.felipe` |

\* confira se não é "EMANUEL" — ajuste em `seed/seed_usuarios.js` antes de
rodar, se precisar; o script não pode adivinhar acentos/grafia que não
vieram na lista.

**Recomendação:** peça para cada um trocar a senha no primeiro acesso. O
Supabase permite isso via `supabase.auth.updateUser({ password: novaSenha })`
— se quiser, no próximo passo eu adiciono um botão "trocar senha" no
dashboard.

## Passo 4 — Publicar o site

Qualquer hospedagem de arquivo estático serve, porque tudo aqui é
HTML/CSS/JS puro. As opções mais simples:

- **Netlify / Vercel (arraste e solte):** crie uma conta gratuita, arraste a
  pasta `pitstop-trilhas` (sem a pasta `seed`) no painel de deploy.
- **GitHub Pages:** suba `index.html`, `style.css` e `app.js` em um
  repositório e ative o Pages nas configurações.

Não precisa de servidor/back-end próprio — quem cuida de autenticação e
dados é o Supabase.

## Como funciona o progresso

- Cada trilha (`trilhas`) tem vários materiais (`topicos`), exatamente como
  no seu documento original (SPED, Tributação, Usabilidade Desktop/Web/PDV,
  Infra, Restaurante, Meu Carrinho, Vendas 360, Farmácia, Boletos).
- Ao marcar um checkbox, grava-se uma linha em `progresso` ligando aquele
  colaborador àquele material — por isso cada um só vê e edita o próprio
  progresso (garantido pelas políticas de RLS no `schema.sql`).
- O medidor circular no topo soma tudo; a barra de cada trilha soma só os
  materiais daquela trilha.

## Manutenção

- **Adicionar/editar material:** insira ou atualize linhas direto na tabela
  `topicos` pelo painel do Supabase (Table Editor) — o site reflete na hora,
  sem precisar mexer no código.
- **Adicionar um novo colaborador depois:** duplique um bloco no array
  `COLABORADORES` de `seed/seed_usuarios.js` e rode `node seed_usuarios.js`
  de novo (ele não duplica quem já existe, só falha silenciosamente para
  quem já tem conta — pode rodar de novo sem medo).
