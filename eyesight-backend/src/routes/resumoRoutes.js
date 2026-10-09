import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../middlewares/authMiddleware.js';
import { cancelar, enviarTeste } from '../controllers/resumoController.js';

const router = Router();

// Exemplo para a própria conta: 3 por hora por usuário.
const testLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: req => String(req.usuario.id), standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Você já pediu exemplos demais. Tente de novo em até 1 hora.' } });
// Cancelamento é público: limite por IP.
const cancelLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Tente de novo mais tarde.' } });

router.post('/teste', authMiddleware, testLimit, enviarTeste);
router.post('/cancelar', cancelLimit, cancelar);
export default router;
