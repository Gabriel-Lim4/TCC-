import { Router }     from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import {
  iniciarConexao,
  callback,
  status,
  listarCampanhas,
  buscarInsightsCampanha,
  desconectar,
  resumoInsights,
} from '../controllers/metaController.js';

const router = Router();

router.get('/callback',                 callback);

router.get('/conectar',                 authMiddleware, iniciarConexao);
router.get('/status',                     authMiddleware, rateLimiter.meta, status);
router.get('/campanhas',                  authMiddleware, rateLimiter.meta, listarCampanhas);
router.get('/campanhas/:id/insights',     authMiddleware, rateLimiter.meta, buscarInsightsCampanha);
router.get('/insights/resumo',            authMiddleware, rateLimiter.meta, resumoInsights);
router.delete('/desconectar',             authMiddleware, rateLimiter.strict, desconectar);

export default router;