import { Router } from 'express';
import {
  cadastro,
  login,
  me,
  verificarEmail,
  reenviarVerificacao,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cadastro',              cadastro);
router.post('/login',                 login);
router.get('/verificar-email',        verificarEmail);
router.post('/reenviar-verificacao',  reenviarVerificacao);
router.get('/me',                     authMiddleware, me);

export default router;
