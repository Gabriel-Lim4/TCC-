// ─────────────────────────────────────────────────────────────
 // error.js — classes de erro personalizadas e middleware
 // ─────────────────────────────────────────────────────────────

 export default function errorHandler(err, req, res, next) {
  console.error('[ERROR] Falha na requisição.');

  const statusCode = err.statusCode || 500;

  // Evitar vazar detalhes internos em produção
  const message = statusCode >= 500
    ? 'Erro interno do servidor.'
    : err.message;

  const response = {
    erro: message,
    codigo: err.isValidationError ? 'VALIDATION_ERROR' : err.constructor?.name || 'ERROR',
  };

  // Adicionar detalhes de validação se houver
  if (err.isValidationError && err.errors.length) {
    response.erros = err.errors;
  }

  // Adicionar contexto da requisição (sem dados sensíveis)
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    erro: `Rota '${req.path}' não encontrada.`,
    codigo: 'NOT_FOUND',
  });
}

// Classes de erro para uso em controllers e middlewares
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') || `${statusCode}`.startsWith('5')
      ? 'error'
      : 'invalid';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.isValidationError = true;
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado.`, 404);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado.') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Não autorizado.') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados.') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Limite de taxa excedido.') {
    super(message, 429);
  }
}