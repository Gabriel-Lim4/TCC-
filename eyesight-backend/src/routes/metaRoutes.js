import { Router }         from 'express';
import authMiddleware     from '../middlewares/authMiddleware.js';
import {
  iniciarConexao,
  callback,
  status,
  listarCampanhas,
  buscarInsightsCampanha,
  desconectar,
} from '../controllers/metaController.js';

const router = Router();

// Pública — o Meta redireciona o browser aqui, sem JWT
router.get('/callback', callback);

// Protegidas — exigem JWT válido
router.get('/conectar',                   authMiddleware, iniciarConexao);
router.get('/status',                     authMiddleware, status);
router.get('/campanhas',                  authMiddleware, listarCampanhas);
router.get('/campanhas/:id/insights',     authMiddleware, buscarInsightsCampanha);
router.delete('/desconectar',             authMiddleware, desconectar);

export default router;
