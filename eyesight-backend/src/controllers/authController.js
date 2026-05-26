const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcrypt');
const jwt              = require('jsonwebtoken');
const env              = require('../config/env');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// authController
// Responsável pelo cadastro e login de usuários.
//
// Fluxo de cadastro:
//   1. Valida os campos recebidos
//   2. Verifica se o email já está em uso
//   3. Gera o hash da senha com bcrypt
//   4. Insere o usuário no banco
//   5. Retorna o token JWT
//
// Fluxo de login:
//   1. Valida os campos recebidos
//   2. Busca o usuário pelo email
//   3. Compara a senha com o hash armazenado
//   4. Retorna o token JWT
// ─────────────────────────────────────────────────────────────

// Número de "rounds" do bcrypt.
// 10 é o padrão recomendado: seguro e rápido o suficiente.
const SALT_ROUNDS = 10;

// ── Gera o token JWT ──────────────────────────────────────────
// Separado em função para reutilizar no cadastro e no login.
function gerarToken(usuario) {
    return jwt.sign(
        {
            id:    usuario.pk_id_usuario,
            email: usuario.email_usuario,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn } // ex: '7d'
    );
}

// ── POST /auth/cadastro ───────────────────────────────────────
exports.cadastro = async (req, res) => {
    const { nome, email, senha } = req.body;

    // 1. Validação básica de campos obrigatórios
    if (!nome || !email || !senha) {
        return res.status(400).json({
            erro: 'Campos obrigatórios: nome, email, senha.',
        });
    }

    // 2. Validação de formato de email
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        return res.status(400).json({ erro: 'Formato de email inválido.' });
    }

    // 3. Senha mínima de 6 caracteres
    if (senha.length < 6) {
        return res.status(400).json({
            erro: 'A senha deve ter no mínimo 6 caracteres.',
        });
    }

    try {
        // 4. Verifica se o email já está cadastrado
        // findUnique retorna null se não encontrar — perfeito para checar duplicatas
        const emailEmUso = await prisma.usuarios.findUnique({
            where: { email_usuario: email },
        });

        if (emailEmUso) {
            return res.status(409).json({ erro: 'Este email já está cadastrado.' });
        }

        // 5. Gera o hash da senha
        // NUNCA armazene senha em texto puro.
        // bcrypt adiciona um "salt" aleatório automaticamente.
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        // 6. Insere o usuário no banco
        // prisma.usuarios.create() insere e já retorna o registro criado
        const novoUsuario = await prisma.usuarios.create({
            data: {
                nome_usuario:  nome,
                email_usuario: email,
                senha_hash:    senhaHash,
            },
        });

        // 7. Gera o token com os dados do usuário recém-criado
        const token = gerarToken(novoUsuario);

        return res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso.',
            token,
            usuario: {
                id:    novoUsuario.pk_id_usuario,
                nome:  novoUsuario.nome_usuario,
                email: novoUsuario.email_usuario,
            },
        });

    } catch (err) {
        console.error('[AUTH] Erro no cadastro:', err.message);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

// ── POST /auth/login ──────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    // 1. Validação de campos
    if (!email || !senha) {
        return res.status(400).json({
            erro: 'Campos obrigatórios: email, senha.',
        });
    }

    try {
        // 2. Busca o usuário pelo email
        // findUnique busca por campos únicos (email tem @unique no schema)
        const usuario = await prisma.usuarios.findUnique({
            where: { email_usuario: email },
        });

        // 3. Usuário não encontrado
        // Mensagem genérica intencional: não revela se o email existe ou não
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        // 4. Compara a senha enviada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        // 5. Gera e retorna o token
        const token = gerarToken(usuario);

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                id:    usuario.pk_id_usuario,
                nome:  usuario.nome_usuario,
                email: usuario.email_usuario,
            },
        });

    } catch (err) {
        console.error('[AUTH] Erro no login:', err.message);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

// ── GET /auth/me ──────────────────────────────────────────────
// Rota protegida — retorna os dados do usuário logado.
// O authMiddleware já validou o token e injetou req.usuario.
exports.me = async (req, res) => {
    return res.status(200).json({
        usuario: req.usuario,
    });
};