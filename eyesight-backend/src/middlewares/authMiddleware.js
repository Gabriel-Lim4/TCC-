const jwt          = require('jsonwebtoken');
const env          = require('../config/env');
const { prisma }   = require('../config/database');

// ─────────────────────────────────────────────────────────────
// authMiddleware
// Executado ANTES de qualquer rota protegida.
// Verifica se o token JWT é válido e injeta o usuário na req.
//
// Uso nas rotas:
//   router.get('/metricas', authMiddleware, metricasController.listar);
// ─────────────────────────────────────────────────────────────

module.exports = async (req, res, next) => {
    // 1. Extrai o token do header Authorization
    // Formato esperado: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            erro: 'Token não fornecido. Faça login para continuar.',
        });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verifica assinatura e expiração do token
    let payload;
    try {
        payload = jwt.verify(token, env.jwt.secret);
    } catch (err) {
        const mensagem = err.name === 'TokenExpiredError'
            ? 'Token expirado. Faça login novamente.'
            : 'Token inválido.';

        return res.status(401).json({ erro: mensagem });
    }

    // 3. Confirma que o usuário ainda existe no banco
    // Cobre o caso de conta deletada após o token ser emitido
    const usuario = await prisma.usuarios.findUnique({
        where: { pk_id_usuario: payload.id },
    });

    if (!usuario) {
        return res.status(401).json({
            erro: 'Usuário não encontrado. Token inválido.',
        });
    }

    // 4. Injeta o usuário na requisição para os controllers usarem
    // Controllers acessam via: req.usuario.id, req.usuario.email
    req.usuario = {
        id:    usuario.pk_id_usuario,
        nome:  usuario.nome_usuario,
        email: usuario.email_usuario,
    };

    next();
};