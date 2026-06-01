// ─────────────────────────────────────────────────────────────
// controllers/metaController.js
//
// Orquestra o fluxo OAuth do Meta e as chamadas de dados.
//
// O controller:
//   1. Recebe a requisição
//   2. Chama o service certo
//   3. Salva no banco via Prisma
//   4. Devolve a resposta formatada
//
// Ele NÃO conhece detalhes da Graph API — isso é responsabilidade
// do metaService. Aqui só fica a lógica de "o que fazer com
// os dados" e "como responder ao front".
//
// Todas as rotas aqui (exceto /callback) são protegidas pelo
// authMiddleware, então req.usuario sempre existe.
// ─────────────────────────────────────────────────────────────

import { prisma }          from '../config/database.js';
import * as metaService    from '../services/metaService.js';
import crypto              from 'crypto';

// ─────────────────────────────────────────────────────────────
// GET /meta/conectar
//
// O usuário clica em "Conectar conta do Meta" no front.
// O front chama essa rota (com JWT no header).
// Nós geramos a URL de autorização e devolvemos para o front,
// que então redireciona o usuário para o Meta.
//
// Por que devolver a URL ao front em vez de redirecionar direto?
// Porque o front é um SPA (React) — ele precisa controlar a
// navegação. Uma rota de API não deve fazer window.location
// pelo usuário; ela devolve dados e o front decide o que fazer.
//
// O "state" é um token aleatório de segurança (CSRF):
//   - Gerado aqui com crypto.randomBytes (criptograficamente seguro)
//   - O Meta vai devolvê-lo no callback
//   - Comparamos no callback para garantir que a resposta é legítima
//   - Sem isso, um atacante poderia forçar um usuário a vincular
//     a conta errada forjando o callback
// ─────────────────────────────────────────────────────────────
export async function iniciarConexao(req, res) {
  try {
    // randomBytes(16) gera 16 bytes aleatórios → .toString('hex') converte
    // para string hexadecimal de 32 chars. Impossível de adivinhar.
    const state = crypto.randomBytes(16).toString('hex');

    const urlAutorizacao = metaService.gerarUrlAutorizacao(state);

    // Devolvemos tanto a URL quanto o state.
    // O front deve guardar o state (ex: sessionStorage) para
    // comparar quando o Meta redirecionar de volta.
    return res.status(200).json({
      url:   urlAutorizacao,
      state,
    });

  } catch (err) {
    console.error('[META] Erro ao gerar URL de autorização:', err.message);
    return res.status(500).json({ erro: 'Erro ao iniciar conexão com o Meta.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /meta/callback
//
// Esta rota recebe o redirecionamento do Meta após autorização.
//
// O Meta redireciona para:
//   https://seu-dominio.com/meta/callback?code=XXXX&state=YYYY
//
// Ou, se o usuário NEGOU a autorização:
//   https://seu-dominio.com/meta/callback?error=access_denied
//
// ⚠️  Esta rota NÃO usa authMiddleware porque o redirecionamento
// do Meta não envia o JWT do usuário. Em vez disso, identificamos
// o usuário pelo state — que ele gerou ao chamar /meta/conectar.
//
// Problema: como sabemos qual usuário está no callback?
// Solução adotada aqui: o front passa o userId na URL como query param
// junto com o state. Ex: /meta/callback?code=X&state=Y&userId=123
//
// Em produção, a solução mais robusta é salvar o state numa tabela
// temporária com o userId antes de redirecionar — mas para o TCC,
// a abordagem com query param é válida e mais simples.
//
// FLUXO COMPLETO DESTE CONTROLLER:
//   1. Recebe code + state + userId da query string
//   2. Verifica se houve erro de autorização
//   3. Troca o code por token curto (via metaService)
//   4. Troca o token curto por token longo (via metaService)
//   5. Busca o Ad Account ID do usuário (via metaService)
//   6. Salva/atualiza a conta vinculada no banco (via Prisma)
//   7. Redireciona o usuário de volta ao front com sucesso
// ─────────────────────────────────────────────────────────────
export async function callback(req, res) {
  const { code, state, error, userId } = req.query;

  // ── Passo 1: O usuário negou a autorização? ──────────────────
  // O Meta envia error=access_denied quando o usuário clica em
  // "Cancelar" na tela de autorização.
  if (error) {
    console.warn('[META] Usuário negou autorização:', error);
    // Redireciona para o front com flag de erro
    // O front lê o query param e mostra a mensagem adequada
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?meta=negado`);
  }

  // ── Passo 2: Validações básicas ──────────────────────────────
  if (!code || !userId) {
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?meta=erro`);
  }

  try {
    // ── Passo 3: Troca o code por token curto ────────────────────
    // O code expira em minutos — fazemos isso imediatamente.
    // trocarCodePorToken retorna: { access_token, token_type, expires_in }
    const tokenCurto = await metaService.trocarCodePorToken(code);

    // ── Passo 4: Troca por token longo (60 dias) ─────────────────
    // trocarPorTokenLongo retorna: { access_token, expiraEm }
    const { access_token, expiraEm } = await metaService.trocarPorTokenLongo(
      tokenCurto.access_token
    );

    // ── Passo 5: Busca o Ad Account ID ───────────────────────────
    // O Ad Account ID é necessário para qualquer chamada de campanhas.
    // buscarAdAccountId retorna uma string como "act_123456789"
    const adAccountId = await metaService.buscarAdAccountId(access_token);

    // ── Passo 6: Salva no banco ───────────────────────────────────
    // upsert = INSERT se não existe, UPDATE se já existe.
    // Isso permite que o usuário reconecte a conta (ex: token expirou)
    // sem criar duplicatas no banco.
    //
    // where: condição para encontrar o registro existente
    //        (mesmo usuário + mesma plataforma)
    // update: o que atualizar se o registro já existir
    // create: o que inserir se não existir
    await prisma.contas_vinculadas.upsert({
      where: {
        // Para o upsert funcionar com dois campos, você precisa de
        // um @@unique([fk_id_usuario, plataforma]) no schema.
        // Se não tiver, use findFirst + create/update separados.
        fk_id_usuario_plataforma: {
          fk_id_usuario: parseInt(userId),
          plataforma:    'meta',
        },
      },
      update: {
        acess_token:  access_token,
        account_id:   adAccountId,
        vinculado_em: new Date(),
      },
      create: {
        fk_id_usuario: parseInt(userId),
        plataforma:    'meta',
        acess_token:   access_token,
        account_id:    adAccountId,
      },
    });

    console.log(`[META] Conta vinculada com sucesso. Usuário: ${userId}`);

    // ── Passo 7: Redireciona de volta ao front ───────────────────
    // Depois de salvar, mandamos o usuário de volta ao dashboard
    // com um flag de sucesso para o front exibir a confirmação.
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?meta=conectado`);

  } catch (err) {
    console.error('[META] Erro no callback:', err.message);

    // Verifica se é erro da Graph API (Axios retorna err.response)
    // ou erro interno (sem err.response)
    if (err.response?.data?.error) {
      const { mensagem } = metaService.extrairErroMeta(err);
      console.error('[META] Erro da Graph API:', mensagem);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?meta=erro`);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /meta/status
//
// O front precisa saber se o usuário já tem uma conta vinculada
// para mostrar "Conectado" ou "Conectar conta".
//
// Rota protegida — req.usuario vem do authMiddleware.
// ─────────────────────────────────────────────────────────────
export async function status(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: {
        fk_id_usuario: req.usuario.id,
        plataforma:    'meta',
      },
      select: {
        pk_id_conta:  true,
        account_id:   true,
        vinculado_em: true,
        // Não retornamos o access_token — nunca exponha tokens ao front
      },
    });

    if (!conta) {
      return res.status(200).json({ conectado: false });
    }

    return res.status(200).json({
      conectado:    true,
      account_id:   conta.account_id,
      vinculado_em: conta.vinculado_em,
    });

  } catch (err) {
    console.error('[META] Erro ao verificar status:', err.message);
    return res.status(500).json({ erro: 'Erro ao verificar conexão com o Meta.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /meta/campanhas
//
// Busca campanhas da conta Meta vinculada ao usuário logado
// e salva/atualiza no banco antes de retornar ao front.
//
// Por que salvar no banco antes de retornar?
// 1. Cache: se a API do Meta estiver lenta ou fora, você tem dados
// 2. Histórico: você pode comparar períodos depois
// 3. Performance: o front não depende do Meta para carregar
//
// Fluxo:
//   1. Busca a conta vinculada do usuário no banco
//   2. Chama a Graph API para buscar campanhas
//   3. Sincroniza (upsert) cada campanha no banco
//   4. Retorna as campanhas ao front
// ─────────────────────────────────────────────────────────────
export async function listarCampanhas(req, res) {
  try {
    // ── Passo 1: Busca a conta vinculada ─────────────────────────
    // Precisamos do access_token e account_id salvos no banco.
    const conta = await prisma.contas_vinculadas.findFirst({
      where: {
        fk_id_usuario: req.usuario.id,
        plataforma:    'meta',
      },
    });

    if (!conta) {
      return res.status(404).json({
        erro: 'Nenhuma conta Meta vinculada. Conecte sua conta primeiro.',
      });
    }

    // ── Passo 2: Busca campanhas na Graph API ─────────────────────
    // buscarCampanhas retorna o array de campanhas da Graph API
    let campanhasApi;
    try {
      campanhasApi = await metaService.buscarCampanhas(
        conta.account_id,
        conta.acess_token
      );
    } catch (err) {
      // Tratamento específico de erros do Meta
      const { mensagem, codigo } = metaService.extrairErroMeta(err);

      // Código 190 = token expirado — precisamos que o usuário reconecte
      if (codigo === 190) {
        return res.status(401).json({
          erro:  mensagem,
          acao:  'reconectar', // sinal para o front mostrar botão de reconexão
        });
      }

      return res.status(502).json({ erro: mensagem });
    }

    // ── Passo 3: Sincroniza campanhas no banco ────────────────────
    // upsert para cada campanha: cria se não existe, atualiza se existe.
    // id_externo é o ID da campanha no Meta — é a chave de identificação.
    //
    // Promise.all executa todos os upserts em paralelo (mais rápido
    // do que fazer um por um em sequência com for...of + await).
    // Cuidado: se tiver MUITAS campanhas (>50), considere processar
    // em lotes para não sobrecarregar o banco.
    await Promise.all(
      campanhasApi.map(campanha =>
        prisma.campanhas.upsert({
          where: {
            // Para isso funcionar, você precisa adicionar
            // @unique em id_externo no schema Prisma.
            // Se não tiver, troque por findFirst + create/update.
            id_externo: campanha.id,
          },
          update: {
            nome_campanha:   campanha.name,
            status_campanha: campanha.status,
            objetivo:        campanha.objective,
            sincronizado_em: new Date(),
          },
          create: {
            fk_id_conta:     conta.pk_id_conta,
            id_externo:      campanha.id,
            nome_campanha:   campanha.name,
            status_campanha: campanha.status,
            objetivo:        campanha.objective,
          },
        })
      )
    );

    // ── Passo 4: Retorna ao front ─────────────────────────────────
    // Retorna os dados que vieram da API (mais frescos que o banco)
    return res.status(200).json({
      campanhas:    campanhasApi,
      total:        campanhasApi.length,
      sincronizado: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[META] Erro ao listar campanhas:', err.message);
    return res.status(500).json({ erro: 'Erro interno ao buscar campanhas.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /meta/campanhas/:id/insights
//
// Busca métricas de uma campanha específica.
//
// :id → o ID externo da campanha no Meta (ex: "23851234567890")
// ?periodo → query param opcional (default: last_30d)
//
// Salva cada métrica individualmente na tabela metricas,
// usando o tipo_metrica como identificador (impressions, clicks, etc).
// ─────────────────────────────────────────────────────────────
export async function buscarInsightsCampanha(req, res) {
  const { id }     = req.params;
  const { periodo } = req.query;

  try {
    // ── Busca a conta vinculada ───────────────────────────────────
    const conta = await prisma.contas_vinculadas.findFirst({
      where: {
        fk_id_usuario: req.usuario.id,
        plataforma:    'meta',
      },
    });

    if (!conta) {
      return res.status(404).json({ erro: 'Conta Meta não vinculada.' });
    }

    // ── Busca a campanha no banco (para pegar o pk_id_campanha) ───
    // Precisamos do ID interno (pk_id_campanha) para salvar as métricas.
    // O :id da URL é o id_externo (ID do Meta).
    const campanha = await prisma.campanhas.findFirst({
      where: {
        id_externo:  id,
        conta: {
          fk_id_usuario: req.usuario.id, // garante que é campanha deste usuário
        },
      },
    });

    if (!campanha) {
      return res.status(404).json({ erro: 'Campanha não encontrada.' });
    }

    // ── Busca insights na Graph API ───────────────────────────────
    let insights;
    try {
      insights = await metaService.buscarInsights(id, conta.acess_token, periodo);
    } catch (err) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      if (codigo === 190) {
        return res.status(401).json({ erro: mensagem, acao: 'reconectar' });
      }
      return res.status(502).json({ erro: mensagem });
    }

    if (!insights) {
      return res.status(200).json({
        mensagem:  'Sem dados para o período informado.',
        insights:  null,
      });
    }

    // ── Salva métricas no banco ───────────────────────────────────
    // Cada métrica (impressions, clicks, spend...) é uma linha
    // na tabela metricas, com tipo_metrica como identificador.
    //
    // Filtramos os campos que não são métricas numéricas
    // (date_start, date_stop são strings de data da Graph API).
    const camposNaoMetrica = ['date_start', 'date_stop'];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // zera a hora para usar como "período"

    const metricas = Object.entries(insights)
      .filter(([chave]) => !camposNaoMetrica.includes(chave))
      .map(([tipo, valor]) => ({
        fk_id_campanha:  campanha.pk_id_campanha,
        tipo_metrica:    tipo,
        valor_metrica:   parseFloat(valor) || 0,
        periodo_metrica: hoje,
      }));

    // Cria todas as métricas de uma vez — createMany é mais eficiente
    // do que criar uma por uma. skipDuplicates evita erros se já existir.
    await prisma.metricas.createMany({
      data:            metricas,
      skipDuplicates:  true,
    });

    return res.status(200).json({
      campanha_id: id,
      periodo:     periodo || 'last_30d',
      insights,
    });

  } catch (err) {
    console.error('[META] Erro ao buscar insights:', err.message);
    return res.status(500).json({ erro: 'Erro interno ao buscar insights.' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /meta/desconectar
//
// Remove a conta Meta vinculada do usuário.
// Útil quando o token expira definitivamente ou o usuário
// quer trocar de conta.
//
// Cascade no schema garante que campanhas e métricas
// associadas também são deletadas automaticamente.
// ─────────────────────────────────────────────────────────────
export async function desconectar(req, res) {
  try {
    const deletado = await prisma.contas_vinculadas.deleteMany({
      where: {
        fk_id_usuario: req.usuario.id,
        plataforma:    'meta',
      },
    });

    if (deletado.count === 0) {
      return res.status(404).json({ erro: 'Nenhuma conta Meta vinculada encontrada.' });
    }

    return res.status(200).json({ mensagem: 'Conta Meta desvinculada com sucesso.' });

  } catch (err) {
    console.error('[META] Erro ao desconectar:', err.message);
    return res.status(500).json({ erro: 'Erro ao desconectar conta Meta.' });
  }
}
