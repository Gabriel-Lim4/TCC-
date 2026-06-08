// ─────────────────────────────────────────────────────────────
// controllers/authController.js
// POST /auth/cadastro | POST /auth/login | GET /auth/me
// ─────────────────────────────────────────────────────────────

import { prisma } from '../config/database.js';
import bcrypt     from 'bcrypt';
import jwt        from 'jsonwebtoken';
import env        from '../config/env.js';

const SALT_ROUNDS = 10;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.pk_id_usuario, email: usuario.email_usuario },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

// ── POST /auth/cadastro ──────────────────────────────────────
export async function cadastro(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha)
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha.' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ erro: 'Formato de email inválido.' });

  if (senha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

  try {
    const emailEmUso = await prisma.usuarios.findUnique({ where: { email_usuario: email } });
    if (emailEmUso)
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });

    const senhaHash    = await bcrypt.hash(senha, SALT_ROUNDS);
    const novoUsuario  = await prisma.usuarios.create({
      data: { nome_usuario: nome, email_usuario: email, senha_hash: senhaHash },
    });

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
}

// ── POST /auth/login ─────────────────────────────────────────
export async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ erro: 'Campos obrigatórios: email, senha.' });

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { email_usuario: email } });

    // Mensagem genérica para os dois casos — evita user enumeration
    if (!usuario)
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta)
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });

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
}

// ── GET /auth/me ─────────────────────────────────────────────
// authMiddleware já validou e injetou req.usuario — só devolve.
export async function me(req, res) {
  return res.status(200).json({ usuario: req.usuario });
}
