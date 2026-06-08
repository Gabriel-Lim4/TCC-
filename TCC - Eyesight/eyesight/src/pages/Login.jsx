import "../styles/Login.css";
import React, { useState } from "react";
import logo from "../assets/Logo.png";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // ajuste o caminho conforme sua estrutura

function Login() {
  const navigate = useNavigate();

  const [isCadastro, setIsCadastro] = useState(false);

  // --- Campos ---
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // --- Feedback ---
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------
  async function handleLogin() {
    setErro("");

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/login", { email, senha });

      // Salva o token caso o backend retorne um
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/app/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "E-mail ou senha incorretos.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // CADASTRO
  // -------------------------------------------------------
  async function handleCadastro() {
    setErro("");

    if (!nome || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/cadastro", { nome, email, senha });

      // Após cadastrar, volta para login
      setIsCadastro(false);
      setErro("");
      setNome("");
      setSenha("");
      setConfirmarSenha("");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erro ao cadastrar. Tente novamente.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // Limpa erros ao trocar de modo
  // -------------------------------------------------------
  function trocarModo(paraCadastro) {
    setErro("");
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setIsCadastro(paraCadastro);
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className={`login-container ${isCadastro ? "cadastro-mode" : ""}`}>

      {/* PAINEL ESQUERDO */}
      <div className="left-side">
        <div className="login-header">
          <div className="logo-box">
            <img src={logo} alt="logo" />
          </div>
          <h1>EYESIGHT</h1>
          <p>Marketing Metrics</p>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div className="right-side">
        <div className="login-box">

          <h2>{isCadastro ? "Cadastrar" : "Entrar"}</h2>

          {/* Mensagem de erro */}
          {erro && <p className="erro-msg">{erro}</p>}

          {/* Campo Nome — só no cadastro */}
          {isCadastro && (
            <>
              <label>Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </>
          )}

          {/* E-mail */}
          <label>E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Senha */}
          <label>Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {/* Confirmar Senha — só no cadastro */}
          {isCadastro && (
            <>
              <label>Confirmar Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </>
          )}

          {/* Esqueceu a senha — só no login */}
          {!isCadastro && (
            <span className="forgot">Esqueceu a senha?</span>
          )}

          {/* Botão principal */}
          <button
            className="btn-login"
            disabled={loading}
            onClick={isCadastro ? handleCadastro : handleLogin}
          >
            {loading
              ? "Aguarde..."
              : isCadastro
              ? "Cadastrar"
              : "Entrar →"}
          </button>

          <div className="divider">
            <span>ou</span>
          </div>

          {/* Troca entre Login / Cadastro */}
          {!isCadastro ? (
            <p className="register">
              Não tem uma conta?{" "}
              <span onClick={() => trocarModo(true)}>Cadastre-se</span>
            </p>
          ) : (
            <p className="register">
              Já possui conta?{" "}
              <span onClick={() => trocarModo(false)}>Entrar</span>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;
