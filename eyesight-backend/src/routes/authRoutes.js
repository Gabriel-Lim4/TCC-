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

router.post('/cadastro',              cadastro);
router.post('/login',                 login);
router.post('/refresh', rateLimiter.api, refresh);
router.post('/logout', authMiddleware, logout);
router.post('/alterar-senha', authMiddleware, rateLimiter.strict, alterarSenha);
router.post('/reenviar-verificacao',  reenviarVerificacao);
router.post('/esqueci-senha',         esqueciSenha);
router.post('/redefinir-senha',       redefinirSenha);
router.get('/me',                     authMiddleware, me);
router.put('/me',                     authMiddleware, atualizarPerfil);
router.get('/me/contas',              authMiddleware, minhasContas);

export default router;
