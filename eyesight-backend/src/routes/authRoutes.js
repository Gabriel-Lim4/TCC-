const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────
// Rotas de autenticação
// Base: /auth  (definido no server.js)
//
// Públicas  → qualquer pessoa pode acessar
// Protegida → exige token JWT válido (authMiddleware)
// ─────────────────────────────────────────────────────────────

// Públicas
router.post('/cadastro', authController.cadastro);
router.post('/login',    authController.login);

// Protegida — retorna dados do usuário logado
router.get('/me', authMiddleware, authController.me);

module.exports = router;

