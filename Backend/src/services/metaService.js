// src/services/metaService.js
// Placeholder — será implementado no próximo passo (OAuth Meta).
// ─────────────────────────────────────────────────────────────
// services/metaService.js
//
// Toda comunicação com a API do Meta fica aqui.
// O controller não conhece URLs, parâmetros ou estrutura de
// resposta da Graph API — ele só chama funções deste service.
//
// Por que separar em service?
// Se o Meta mudar a versão da API (v19 → v20), ou se você
// quiser trocar Axios por fetch nativo, você muda só aqui.
// O controller continua igual.
//
// Versão da API: sempre use uma versão fixa, não "latest".
// Isso evita quebras silenciosas quando o Meta faz atualizações.
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import env   from '../config/env.js';

// Versão da Graph API — mude aqui se precisar atualizar
const GRAPH_VERSION = 'v19.0';
const GRAPH_URL     = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ─────────────────────────────────────────────────────────────
// ETAPA 1 — OAuth: gerar a URL de autorização
//
// Quando o usuário clica em "Conectar Meta", ele precisa ser
// redirecionado para o Meta para autorizar o seu app.
// Esta função monta essa URL com os parâmetros corretos.
//
// O que cada parâmetro faz:
//
//   client_id    → identifica seu app para o Meta
//   redirect_uri → para onde o Meta vai redirecionar após a autorização
//                  PRECISA ser exatamente igual ao que está no app do Meta Developers
//   scope        → quais permissões você está pedindo:
//                    ads_read          → ler dados de anúncios
//                    ads_management    → necessário para insights
//                    read_insights     → ler métricas de campanhas
//                    business_management → acessar contas de negócio
//   response_type=code → o Meta vai retornar um "code" temporário
//                        (não o token ainda — isso é segurança)
//   state        → string aleatória para evitar CSRF
//                  (Cross-Site Request Forgery: impede que um site
//                   malicioso force o seu usuário a conectar uma conta)
// ─────────────────────────────────────────────────────────────
export function gerarUrlAutorizacao(state) {
  // URLSearchParams monta a query string corretamente,
  // fazendo encode de caracteres especiais automaticamente.
  // Sem isso, uma vírgula no scope quebraria a URL.
  const params = new URLSearchParams({
    client_id:     env.meta.appId,
    redirect_uri:  env.meta.redirectUri,
    scope:         'ads_read,ads_management,read_insights,business_management',
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────
// ETAPA 2 — OAuth: trocar o "code" por um access token
//
// Depois que o usuário autoriza, o Meta redireciona para
// /meta/callback?code=XXXXXXXXXXX
//
// Esse "code" é temporário (expira em minutos) e só pode ser
// usado UMA vez. Você precisa trocar por um access token real.
//
// Por que essa troca acontece no back-end e não no front?
// Porque ela exige o APP SECRET — que nunca pode ir ao browser.
// Fluxo seguro:
//   Meta → redireciona para /meta/callback (back-end)
//   Back-end → chama a API do Meta com o code + APP SECRET
//   Meta → retorna o access_token
//   Back-end → salva o token no banco
//
// O token retornado aqui é de curta duração (1-2 horas).
// Por isso chamamos trocarPorTokenLongo() logo depois.
// ─────────────────────────────────────────────────────────────
export async function trocarCodePorToken(code) {
  // Esta é uma chamada GET para a Graph API — não POST.
  // O Meta usa GET para troca de token (diferente do padrão OAuth2).
  const resposta = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
    params: {
      client_id:     env.meta.appId,
      client_secret: env.meta.appSecret,
      redirect_uri:  env.meta.redirectUri,
      code,
    },
  });

  // resposta.data tem: { access_token, token_type, expires_in }
  return resposta.data;
}

// ─────────────────────────────────────────────────────────────
// ETAPA 3 — Converter para Long-Lived Token (60 dias)
//
// O token de curta duração expira em ~1 hora.
// Isso seria péssimo para um painel que precisa de dados sempre.
//
// A solução é trocar por um Long-Lived Token que dura 60 dias.
// Em produção, você implementaria refresh automático antes de expirar.
//
// Como funciona a troca:
//   grant_type=fb_exchange_token → diz ao Meta "quero um token longo"
//   fb_exchange_token → o token curto que você quer trocar
//
// A resposta inclui expires_in em segundos.
// Calculamos a data de expiração para salvar no banco.
// ─────────────────────────────────────────────────────────────
export async function trocarPorTokenLongo(tokenCurto) {
  const resposta = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
    params: {
      grant_type:        'fb_exchange_token',
      client_id:         env.meta.appId,
      client_secret:     env.meta.appSecret,
      fb_exchange_token: tokenCurto,
    },
  });

  const { access_token, expires_in } = resposta.data;

  // expires_in vem em segundos. Convertemos para uma data absoluta
  // para salvar no banco e checar depois.
  // Ex: expires_in = 5184000 (60 dias em segundos)
  //     Date.now() = timestamp atual em ms
  //     * 1000 converte segundos para ms
  const expiraEm = new Date(Date.now() + expires_in * 1000);

  return { access_token, expiraEm };
}

// ─────────────────────────────────────────────────────────────
// ETAPA 4 — Buscar o Ad Account ID do usuário
//
// O Ad Account ID é o identificador da conta de anúncios do Meta.
// Ele tem o formato "act_123456789".
//
// Por que precisamos dele?
// Todas as chamadas de campanhas e insights usam o Ad Account ID,
// não o ID do usuário. São coisas diferentes:
//   User ID      → quem é o usuário (pessoa)
//   Ad Account ID → qual conta de anúncios você quer acessar
//
// Um usuário pode ter múltiplos ad accounts (ex: agências).
// Aqui pegamos apenas o primeiro — suficiente para o TCC.
// Em produção, você deixaria o usuário escolher qual conta usar.
// ─────────────────────────────────────────────────────────────
export async function buscarAdAccountId(accessToken) {
  const resposta = await axios.get(`${GRAPH_URL}/me/adaccounts`, {
    params: {
      fields:       'id,name,account_status',
      access_token: accessToken,
    },
  });

  // resposta.data.data é um array de ad accounts
  // data[0] pega o primeiro (mais comum ter apenas um)
  const contas = resposta.data.data;

  if (!contas || contas.length === 0) {
    throw new Error('Nenhuma conta de anúncios encontrada para este usuário.');
  }

  // O id já vem como "act_123456789" — formato que a API espera
  return contas[0].id;
}

// ─────────────────────────────────────────────────────────────
// ETAPA 5 — Buscar campanhas do Ad Account
//
// Com o Ad Account ID e o token, podemos pedir as campanhas.
//
// fields → quais campos queremos de volta.
// Não peça campos desnecessários — cada campo extra é dados
// que o Meta precisa processar e você precisa transferir.
//
// status → filtra apenas campanhas ativas e pausadas.
// DELETED e ARCHIVED poluem o painel sem valor para o usuário.
// ─────────────────────────────────────────────────────────────
export async function buscarCampanhas(adAccountId, accessToken) {
  const resposta = await axios.get(`${GRAPH_URL}/${adAccountId}/campaigns`, {
    params: {
      fields:       'id,name,status,objective,created_time',
      filtering:    JSON.stringify([{
        field:    'effective_status',
        operator: 'IN',
        value:    ['ACTIVE', 'PAUSED'],
      }]),
      access_token: accessToken,
    },
  });

  // .data.data → o Meta sempre retorna os resultados dentro de data.data
  // O primeiro .data é do Axios, o segundo é da estrutura da Graph API.
  return resposta.data.data;
}

// ─────────────────────────────────────────────────────────────
// ETAPA 6 — Buscar insights (métricas) de uma campanha
//
// Insights são os dados de performance: impressões, cliques, gasto...
//
// date_preset → período dos dados. 'last_30d' é o padrão do painel.
// Outras opções: 'today', 'yesterday', 'last_7d', 'last_90d'
//
// fields (métricas disponíveis):
//   impressions → quantas vezes o anúncio foi exibido
//   clicks      → quantos cliques recebeu
//   spend       → quanto foi gasto (em USD)
//   reach       → quantas pessoas únicas viram
//   ctr         → Click-Through Rate = cliques / impressões (%)
//   cpc         → Custo Por Clique = spend / clicks
//   cpm         → Custo Por Mil impressões
//   actions     → conversões, leads, etc (mais complexo)
//
// Começamos com os essenciais. Pode adicionar mais depois.
// ─────────────────────────────────────────────────────────────
export async function buscarInsights(campanhaId, accessToken, periodo = 'last_30d') {
  const resposta = await axios.get(`${GRAPH_URL}/${campanhaId}/insights`, {
    params: {
      fields:      'impressions,clicks,spend,reach,ctr,cpc,cpm',
      date_preset: periodo,
      access_token: accessToken,
    },
  });

  // Se não houver dados para o período, a Graph API retorna
  // data.data como array vazio — não lança erro.
  // Retornamos null para o controller saber que não há dados.
  const dados = resposta.data.data;
  return dados.length > 0 ? dados[0] : null;
}

// ─────────────────────────────────────────────────────────────
// Tratamento centralizado de erros da Graph API
//
// O Meta retorna erros com uma estrutura específica:
// {
//   error: {
//     message: "...",
//     type: "OAuthException",
//     code: 190,
//     fbtrace_id: "..."
//   }
// }
//
// Esta função extrai uma mensagem útil desse formato.
// Usada pelos controllers para retornar erros legíveis.
//
// Códigos importantes:
//   190 → token inválido ou expirado
//   100 → parâmetro inválido (ex: account_id errado)
//   200 → permissão negada (faltou scope na autorização)
//   4   → rate limit atingido (muitas chamadas por hora)
//   17  → rate limit de usuário
// ─────────────────────────────────────────────────────────────
export function extrairErroMeta(err) {
  const erroApi = err.response?.data?.error;

  if (!erroApi) {
    return { mensagem: 'Erro ao comunicar com a API do Meta.', codigo: null };
  }

  const mapa = {
    190: 'Token do Meta inválido ou expirado. Reconecte sua conta.',
    200: 'Permissão negada. Reconecte sua conta e autorize todas as permissões.',
    4:   'Muitas requisições ao Meta. Aguarde alguns minutos.',
    17:  'Limite de chamadas atingido. Tente novamente mais tarde.',
    100: 'Parâmetro inválido na chamada ao Meta.',
  };

  return {
    mensagem: mapa[erroApi.code] || erroApi.message || 'Erro desconhecido do Meta.',
    codigo:   erroApi.code,
    tipo:     erroApi.type,
  };
}
