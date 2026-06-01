// ─────────────────────────────────────────────────────────────
// routes/metaRoutes.js
//
// Define as rotas do módulo Meta e quem as protege.
//
// Prefixo /meta vem do server.js:
//   app.use('/meta', metaRoutes)
//
// Rotas públicas (sem authMiddleware):
//   GET /meta/callback → recebe redirecionamento do Meta OAuth
//     Por que pública? O Meta redireciona o browser do usuário
//     para cá — o browser não tem como enviar o JWT nesse momento.
//
// Rotas protegidas (com authMiddleware):
//   Todas as outras — exigem o usuário autenticado.
// ─────────────────────────────────────────────────────────────

import { Router }          from 'express';
import authMiddleware      from '../middlewares/authMiddleware.js';
import {
  iniciarConexao,
  callback,
  status,
  listarCampanhas,
  buscarInsightsCampanha,
  desconectar,
} from '../controllers/metaController.js';

const router = Router();

// ── Pública ───────────────────────────────────────────────────
// Recebe o redirecionamento do Meta após o usuário autorizar
router.get('/callback', callback);

// ── Protegidas (JWT obrigatório) ──────────────────────────────
// Gera a URL de autorização do Meta para o front redirecionar
router.get('/conectar',                       authMiddleware, iniciarConexao);

// Verifica se o usuário já tem conta Meta vinculada
router.get('/status',                         authMiddleware, status);

// Lista campanhas e sincroniza com o banco
router.get('/campanhas',                      authMiddleware, listarCampanhas);

// Métricas de uma campanha específica
// :id → id externo da campanha no Meta
// ?periodo → opcional, ex: ?periodo=last_7d
router.get('/campanhas/:id/insights',         authMiddleware, buscarInsightsCampanha);

// Remove a conta Meta vinculada
router.delete('/desconectar',                 authMiddleware, desconectar);

export default router;
