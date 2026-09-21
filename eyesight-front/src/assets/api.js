import axios from "axios";

console.log("🔥 API.JS FOI CARREGADO");

const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  console.log("🔥 INTERCEPTOR EXECUTOU");

  const token = localStorage.getItem("token");

  console.log("🔥 TOKEN EXISTE:", !!token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;