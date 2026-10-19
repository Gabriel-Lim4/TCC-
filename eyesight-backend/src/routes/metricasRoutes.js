// ─────────────────────────────────────────────────────────────
// routes/metricasRoutes.js
//
// Rotas do dashboard de métricas.
// Todas exigem autenticação via JWT do Supabase.
// Rate limiting aplicado em endpoints de alto tráfego.
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import {
  listarCampanhas,
  detalharCampanha,
  metricasGerais,
  resumoUnificado,
} from '../controllers/metricasController.js';
import { analytics, syncAnalytics, exportAnalytics, saveAlertSettings } from '../controllers/analyticsController.js';
import rateLimit from 'express-rate-limit';

const router = Router();

router.get('/campanhas', authMiddleware, rateLimiter.api, listarCampanhas);
router.get('/campanhas/:id', authMiddleware, rateLimiter.api, detalharCampanha);
router.get('/geral', authMiddleware, rateLimiter.api, metricasGerais);
router.get('/resumo', authMiddleware, rateLimiter.api, resumoUnificado);
router.get('/analytics', authMiddleware, rateLimiter.api, analytics);
router.post('/sincronizar', authMiddleware, rateLimit({ windowMs: 60000, limit: 5, keyGenerator: req => String(req.usuario.id), standardHeaders: true, legacyHeaders: false, message: { erro: 'Aguarde um minuto antes de sincronizar novamente.' } }), syncAnalytics);
router.put('/alertas', authMiddleware, rateLimiter.strict, saveAlertSettings);
router.get('/exportar', authMiddleware, rateLimiter.api, exportAnalytics);

export default router;
