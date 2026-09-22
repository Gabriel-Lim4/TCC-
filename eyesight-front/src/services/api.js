import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
});

// Anexa o token em toda requisição (sem isso, rotas protegidas retornam 401)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Sessão expirada → volta pro login.
// Ignora: rotas públicas de /auth (exceto /auth/me) e o 401 "reconectar" do Meta.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const rotaPublica = url.startsWith("/auth/") && url !== "/auth/me";
    const erroMeta = error.response?.data?.acao === "reconectar";

    if (error.response?.status === 401 && !rotaPublica && !erroMeta) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
