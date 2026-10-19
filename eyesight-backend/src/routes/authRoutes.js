import { Router } from 'express';
import rateLimiter from '../middlewares/rateLimiter.js';
import {
  cadastro,
  refresh,
  logout,
  alterarSenha,
  login,
  me,
  atualizarPerfil,
  reenviarVerificacao,
  esqueciSenha,
  redefinirSenha,
  minhasContas,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cadastro', rateLimiter.email, rateLimiter.auth, cadastro);
router.post('/login', rateLimiter.auth, login);
router.post('/refresh', rateLimiter.refresh, refresh);
router.post('/logout', authMiddleware, logout);
router.post('/alterar-senha', authMiddleware, rateLimiter.strict, alterarSenha);
router.post('/reenviar-verificacao', rateLimiter.email, reenviarVerificacao);
router.post('/esqueci-senha', rateLimiter.email, esqueciSenha);
router.post('/redefinir-senha', rateLimiter.auth, redefinirSenha);
router.get('/me',                     authMiddleware, me);
router.put('/me',                     authMiddleware, atualizarPerfil);
router.get('/me/contas',              authMiddleware, minhasContas);

export default router;
