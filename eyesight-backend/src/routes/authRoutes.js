import { Router } from 'express';
import {
  cadastro,
  login,
  me,
  reenviarVerificacao,
  esqueciSenha,
  redefinirSenha,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cadastro',              cadastro);
router.post('/login',                 login);
router.post('/reenviar-verificacao',  reenviarVerificacao);
router.post('/esqueci-senha',         esqueciSenha);
router.post('/redefinir-senha',       redefinirSenha);
router.get('/me',                     authMiddleware, me);

export default router;
