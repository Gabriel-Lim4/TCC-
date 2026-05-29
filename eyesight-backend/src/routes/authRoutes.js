// ─────────────────────────────────────────────────────────────
// routes/authRoutes.js
//
// Define QUAIS URLs existem e QUAL controller responde cada uma.
// O prefixo /auth vem do server.js:
//   app.use('/auth', authRoutes)
//
// Então:
//   router.post('/cadastro') → responde em POST /auth/cadastro
//   router.post('/login')    → responde em POST /auth/login
//   router.get('/me')        → responde em GET  /auth/me
//
// authMiddleware na rota /me significa:
//   Express executa: authMiddleware → me (nessa ordem)
//   Se o middleware chamar next(), vai para o controller.
//   Se retornar res.status(401), o controller nunca é chamado.
// ─────────────────────────────────────────────────────────────

import { Router }                      from 'express';
import { cadastro, login, me }         from '../controllers/authController.js';
import authMiddleware                  from '../middlewares/authMiddleware.js';

const router = Router();

// Públicas — qualquer pessoa pode acessar
router.post('/cadastro', cadastro);
router.post('/login',    login);

// Protegida — exige token JWT válido
router.get('/me', authMiddleware, me);

export default router;
