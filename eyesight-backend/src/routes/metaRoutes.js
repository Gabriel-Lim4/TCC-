import { Router }     from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
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
router.get('/status',                   authMiddleware, status);
router.get('/campanhas',                authMiddleware, listarCampanhas);
router.get('/campanhas/:id/insights',   authMiddleware, buscarInsightsCampanha);
router.get('/insights/resumo',          authMiddleware, resumoInsights);
router.delete('/desconectar',           authMiddleware, desconectar);

export default router;