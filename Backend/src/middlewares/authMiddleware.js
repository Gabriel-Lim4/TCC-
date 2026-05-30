// ─────────────────────────────────────────────────────────────
// middlewares/authMiddleware.js
//
// O que é um middleware no Express?
// É uma função que fica entre a requisição e o controller.
// Toda rota protegida passa por aqui antes de chegar ao handler.
//
// Fluxo:
//   Requisição → authMiddleware → Controller (se autorizado)
//                              ↓
//                         res.status(401) (se não autorizado)
//
// Uso nas rotas:
//   router.get('/me', authMiddleware, authController.me)
//   O Express executa os argumentos da esquerda para direita.
// ─────────────────────────────────────────────────────────────

import jwt        from 'jsonwebtoken';
import env        from '../config/env.js';
import { prisma } from '../config/database.js';

export default async (req, res, next) => {

  // ── 1. Extrai o token do header Authorization ────────────────
  // O padrão HTTP para autenticação Bearer é:
  //   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  //
  // startsWith('Bearer ') — note o espaço após Bearer.
  // É parte do padrão RFC 6750 e evita tokens que começam
  // com a palavra "Bearer" por coincidência.
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      erro: 'Token não fornecido. Faça login para continuar.',
    });
  }

  // split(' ') transforma "Bearer abc123" em ["Bearer", "abc123"]
  // [1] pega o segundo elemento — o token em si.
  const token = authHeader.split(' ')[1];

  // ── 2. Try/catch externo — captura erros inesperados ─────────
  // Cobre: banco fora do ar, erro interno do Prisma,
  // qualquer exceção que não previmos.
  // NUNCA deixa um erro vazar sem tratamento em produção.
  try {

    // ── 3. Try/catch interno — verifica o JWT ────────────────────
    // jwt.verify() LANÇA uma exceção se o token for inválido.
    // Ele NÃO retorna null — por isso precisa de try/catch próprio.
    //
    // Por que dois try/catch e não um só?
    // Porque queremos mensagens de erro DIFERENTES para cada situação:
    //   - Token inválido/malformado → 401 com mensagem específica
    //   - Banco caiu               → 500 com mensagem genérica
    // Com um único catch, precisaríamos checar err.name para distinguir
    // — código mais frágil e difícil de manter.
    //
    // Erros possíveis do jwt.verify():
    //   JsonWebTokenError  → assinatura inválida ou token malformado
    //   TokenExpiredError  → passou do tempo de expiração (ex: 7d)
    //   NotBeforeError     → token tem campo "nbf" no futuro (raro)
    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (jwtErr) {
      const mensagem = jwtErr.name === 'TokenExpiredError'
        ? 'Token expirado. Faça login novamente.'
        : 'Token inválido.';

      return res.status(401).json({ erro: mensagem });
    }

    // ── 4. Confirma que o usuário ainda existe no banco ──────────
    // Por que ir ao banco se o token já é válido?
    //
    // Cenário real: usuário tem token válido por 7 dias.
    // No dia 3, um admin deleta a conta ou a empresa cancela
    // o plano. Sem essa checagem, ele continuaria com acesso
    // pelos próximos 4 dias.
    //
    // select: {} — pede só os campos necessários.
    // NUNCA traga senha_hash ou dados sensíveis para a memória
    // sem necessidade. Princípio do menor privilégio.
    const usuario = await prisma.usuarios.findUnique({
      where:  { pk_id_usuario: payload.id },
      select: {
        pk_id_usuario: true,
        nome_usuario:  true,
        email_usuario: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        erro: 'Usuário não encontrado. Token inválido.',
      });
    }

    // ── 5. Injeta o usuário na requisição ────────────────────────
    // req é o objeto da requisição HTTP.
    // Ao adicionar req.usuario, qualquer controller que vem depois
    // deste middleware na cadeia tem acesso aos dados do usuário
    // sem precisar decodificar o token de novo.
    //
    // É como passar um bilhete adiante na fila.
    req.usuario = {
      id:    usuario.pk_id_usuario,
      nome:  usuario.nome_usuario,
      email: usuario.email_usuario,
    };

    // ── 6. Passa para o próximo da cadeia ────────────────────────
    // next() diz ao Express: "terminei minha parte, pode continuar".
    // Sem next(), a requisição trava aqui — o cliente fica esperando
    // para sempre até o timeout.
    next();

  } catch (err) {
    // Erro inesperado — loga internamente, nunca expõe detalhes ao cliente.
    // err.message pode conter nomes de tabelas, queries, IPs internos —
    // informações valiosas para um atacante.
    console.error('[AUTH MIDDLEWARE] Erro inesperado:', err);

    return res.status(500).json({
      erro: 'Erro interno na autenticação. Tente novamente.',
    });
  }
};
