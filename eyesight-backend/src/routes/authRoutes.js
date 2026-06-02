import { Router }              from 'express';
import { cadastro, login, me } from '../controllers/authController.js';
import authMiddleware          from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cadastro', cadastro);
router.post('/login',    login);
router.get('/me',        authMiddleware, me);

export default router;
