// ─────────────────────────────────────────────────────────────
// routes/googleRoutes.js
//
// Rotas do Google Ads.
// Todas exigem autenticação via JWT do Supabase.
// Rate limiting aplicado em endpoints de alto tráfego.
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import {
  iniciarConexaoGoogle,
  callbackGoogle,
  status,
  listarCampanhasGoogle,
  buscarInsightsCampanhaGoogle,
  desconectarGoogle,
} from '../controllers/googleController.js';

const router = Router();

router.get('/callback',                 callbackGoogle);
router.get('/conectar',                 authMiddleware, iniciarConexaoGoogle);
router.get('/status',                   authMiddleware, rateLimiter.api, status);
router.get('/campanhas',                authMiddleware, rateLimiter.api, listarCampanhasGoogle);
router.get('/campanhas/:id/insights',   authMiddleware, rateLimiter.api, buscarInsightsCampanhaGoogle);
router.delete('/desconectar',           authMiddleware, rateLimiter.strict, desconectarGoogle);

export default router;