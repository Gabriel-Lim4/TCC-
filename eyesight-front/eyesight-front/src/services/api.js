// ─────────────────────────────────────────────────────────────
// services/api.js — instância única do Axios
//
// Toda comunicação com o back-end passa por aqui.
// Nunca importe axios diretamente nas páginas.
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

const api = axios.create({
  // VITE_API_URL vem do arquivo .env na raiz do projeto.
  // Em desenvolvimento: crie um .env com VITE_API_URL=http://localhost:3333
  // Em produção:        configure a variável no Vercel/Railway com a URL real.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de requisição ────────────────────────────────
// Executado ANTES de cada requisição sair.
// Lê o token do localStorage e injeta no header Authorization.
// Sem isso, todas as rotas protegidas (meta, metricas, etc)
// retornariam 401 — porque o back-end exige o JWT.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de resposta ──────────────────────────────────
// Executado DEPOIS de cada resposta chegar.
// Se o back retornar 401 (token expirado ou inválido),
// limpa o localStorage e manda o usuário para o login.
// Isso cobre o caso do token de 7 dias expirar enquanto
// o usuário está usando o sistema.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
