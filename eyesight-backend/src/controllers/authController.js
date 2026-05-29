// ─────────────────────────────────────────────────────────────
// controllers/authController.js
//
// O controller é responsável por:
//   1. Receber a requisição (req)
//   2. Chamar a lógica de negócio (serviços, banco)
//   3. Devolver a resposta (res)
//
// Ele NÃO deve conter lógica complexa de negócio —
// isso vai para services. Aqui fica a orquestração.
//
// Rotas que usa:
//   POST /auth/cadastro  → exports.cadastro
//   POST /auth/login     → exports.login
//   GET  /auth/me        → exports.me  (protegida pelo authMiddleware)
// ─────────────────────────────────────────────────────────────

import { prisma } from '../config/database.js';
import bcrypt     from 'bcrypt';
import jwt        from 'jsonwebtoken';
import env        from '../config/env.js';

// Número de rounds do bcrypt.
// Cada round DOBRA o tempo de processamento.
// 10 rounds ≈ 65ms por hash — seguro e aceitável para login.
// 14 rounds ≈ 1s — muito lento para uma API.
// Nunca use menos de 10 em produção.
const SALT_ROUNDS = 10;

// ── Função auxiliar: gera o token JWT ───────────────────────
// Separada em função para não repetir código no cadastro e login.
//
// jwt.sign() cria um token com:
//   payload  → dados que ficam DENTRO do token (visíveis ao decodificar)
//   secret   → chave secreta para assinar (só o servidor conhece)
//   options  → configurações como expiração
//
// ⚠️  NUNCA coloque senha, cartão de crédito ou dados sensíveis
//     no payload — ele é apenas Base64, não criptografado.
//     Qualquer pessoa pode decodificar, mas não pode FALSIFICAR
//     sem o secret.
function gerarToken(usuario) {
  return jwt.sign(
    {
      id:    usuario.pk_id_usuario,
      email: usuario.email_usuario,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

// ── POST /auth/cadastro ──────────────────────────────────────
export async function cadastro(req, res) {
  const { nome, email, senha } = req.body;

  // Validação de campos obrigatórios
  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: nome, email, senha.',
    });
  }

  // Validação de formato de email via regex
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValido) {
    return res.status(400).json({ erro: 'Formato de email inválido.' });
  }

  // Senha mínima — validação básica. Em produção, considere
  // exigir letras maiúsculas, números e símbolos.
  if (senha.length < 6) {
    return res.status(400).json({
      erro: 'A senha deve ter no mínimo 6 caracteres.',
    });
  }

  try {
    // findUnique retorna null se não encontrar — perfeito para
    // verificar duplicatas sem lançar exceção.
    const emailEmUso = await prisma.usuarios.findUnique({
      where: { email_usuario: email },
    });

    if (emailEmUso) {
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    }

    // bcrypt.hash() gera o hash da senha com salt aleatório.
    // O salt é armazenado DENTRO do hash resultante — você não
    // precisa guardá-lo separado. bcrypt.compare() sabe extraí-lo.
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const novoUsuario = await prisma.usuarios.create({
      data: {
        nome_usuario:  nome,
        email_usuario: email,
        senha_hash:    senhaHash,
      },
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

  if (!email || !senha) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: email, senha.',
    });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email_usuario: email },
    });

    // Mensagem genérica intencional para ambos os casos
    // (usuário não existe E senha errada).
    // Isso evita "user enumeration" — um atacante não consegue
    // saber se um email está cadastrado ou não pelo erro retornado.
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    // bcrypt.compare() compara a senha em texto com o hash.
    // Internamente, extrai o salt do hash e refaz o processo.
    // Retorna true/false — nunca lança exceção em caso de senha errada.
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

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
// Rota protegida — o authMiddleware já validou o token
// e injetou req.usuario antes de chegar aqui.
// Esse controller só precisa devolver o que já está na req.
export async function me(req, res) {
  return res.status(200).json({ usuario: req.usuario });
}
