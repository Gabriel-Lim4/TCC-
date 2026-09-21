import "../styles/Login.css";
import "../styles/variables.css";
import React, { useState } from "react";
import logo from "../assets/logo.svg";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function extrairMensagemErro(err, fallback) {
  return (
    err.response?.data?.erro ||
    err.response?.data?.message ||
    err.response?.data?.error ||
    fallback
  );
}

function Login() {
  const navigate = useNavigate();

  const [isCadastro, setIsCadastro] = useState(false);
  const [aguardandoVerificacao, setAguardandoVerificacao] = useState(false);
  const [emailPendente, setEmailPendente] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function handleLogin() {
    setErro("");
    setSucesso("");

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", { email, senha });

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/app/dashboard");
    } catch (err) {
      const msg = extrairMensagemErro(err, "E-mail ou senha incorretos.");
      setErro(msg);

      if (err.response?.data?.requerVerificacao) {
        setAguardandoVerificacao(true);
        setEmailPendente(err.response?.data?.email || email);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastro() {
    setErro("");
    setSucesso("");

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

      await api.post("/auth/cadastro", { nome, email, senha });

      setAguardandoVerificacao(true);
      setEmailPendente(email);
      setIsCadastro(false);
      setSucesso(`Enviamos um e-mail de confirmação para ${email}. Clique no link para ativar sua conta.`);
      setNome("");
      setSenha("");
      setConfirmarSenha("");
    } catch (err) {
      setErro(extrairMensagemErro(err, "Erro ao cadastrar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviarVerificacao() {
    const emailAlvo = emailPendente || email;
    if (!emailAlvo) {
      setErro("Informe seu e-mail para reenviar a confirmação.");
      return;
    }

    try {
      setReenviando(true);
      setErro("");
      await api.post("/auth/reenviar-verificacao", { email: emailAlvo });
      setSucesso("Se o e-mail estiver pendente, enviamos um novo link de confirmação.");
    } catch (err) {
      setErro(extrairMensagemErro(err, "Erro ao reenviar e-mail."));
    } finally {
      setReenviando(false);
    }
  }

  function trocarModo(paraCadastro) {
    setErro("");
    setSucesso("");
    setAguardandoVerificacao(false);
    setEmailPendente("");
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setIsCadastro(paraCadastro);
  }

  return (
    <div className="login-page">
      <div className={`login-container ${isCadastro ? "cadastro-mode" : ""}`}>
        <div className="left-side">
          <span className="brand-circle brand-circle-1" aria-hidden="true" />
          <span className="brand-circle brand-circle-2" aria-hidden="true" />
          <span className="brand-circle brand-circle-3" aria-hidden="true" />

          <div className="login-header">
            <div className="logo-box">
              <img src={logo} alt="logo" />
            </div>
            <h1>EYESIGHT</h1>
            <p>Marketing Metrics</p>
          </div>
        </div>

        <div className="right-side">
          <div className="login-box">
            {aguardandoVerificacao ? (
              <>
                <h2>Confirme seu e-mail</h2>
                {sucesso && <p className="sucesso-msg">{sucesso}</p>}
                {erro && <p className="erro-msg">{erro}</p>}
                <p className="info-msg">
                  Abra o e-mail enviado para <strong>{emailPendente || email}</strong> e clique no link de confirmação.
                </p>
                <button
                  className="btn-login btn-secondary"
                  disabled={reenviando}
                  onClick={handleReenviarVerificacao}
                >
                  {reenviando ? "Enviando..." : "Reenviar e-mail"}
                </button>
                <button className="btn-login" onClick={() => trocarModo(false)}>
                  Já confirmei — tentar login
                </button>
              </>
            ) : (
              <>
                <h2>{isCadastro ? "Cadastrar" : "Entrar"}</h2>

                {erro && <p className="erro-msg">{erro}</p>}
                {sucesso && <p className="sucesso-msg">{sucesso}</p>}

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

                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />

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

                {!isCadastro && (
                  <span className="forgot" onClick={() => navigate("/esqueci-senha")}>
                    Esqueceu a senha?
                  </span>
                )}

                <button
                  className="btn-login"
                  disabled={loading}
                  onClick={isCadastro ? handleCadastro : handleLogin}
                >
                  {loading ? "Aguarde..." : isCadastro ? "Cadastrar" : "Entrar →"}
                </button>

                <div className="divider">
                  <span>ou</span>
                </div>

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
