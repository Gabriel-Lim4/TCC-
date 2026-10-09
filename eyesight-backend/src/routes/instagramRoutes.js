// ─────────────────────────────────────────────────────────────
// routes/instagramRoutes.js
//
// Rotas do Instagram (via Graph API com token Meta).
// Todas exigem autenticação JWT.
// ─────────────────────────────────────────────────────────────

import { Router }     from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import rateLimiter    from '../middlewares/rateLimiter.js';
import {
  statusInstagram,
  metricasInstagram,
} from '../controllers/instagramController.js';

const router = Router();

router.get('/status',   authMiddleware, rateLimiter.api,    statusInstagram);
router.get('/metricas', authMiddleware, rateLimiter.api,    metricasInstagram);

export default router;
