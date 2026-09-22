import "../styles/Login.css";
import "../styles/variables.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import api from "../services/api";

// O link do e-mail volta aqui com o token de recuperação no hash:
//   #access_token=...&type=recovery   (ou #error_code=otp_expired ...)
function lerToken() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");

  if (accessToken && params.get("type") === "recovery") {
    return { accessToken, erro: "" };
  }

  return {
    accessToken: "",
    erro:
      params.get("error_code") === "otp_expired"
        ? "Link expirado ou já utilizado. Solicite um novo."
        : "Link inválido. Solicite um novo e-mail de redefinição.",
  };
}

function RedefinirSenha() {
  const navigate = useNavigate();
  const [{ accessToken, erro: erroLink }] = useState(lerToken);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState(erroLink);
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 6) return setErro("A senha deve ter no mínimo 6 caracteres.");
    if (novaSenha !== confirmar) return setErro("As senhas não coincidem.");

    try {
      setLoading(true);
      await api.post("/auth/redefinir-senha", { accessToken, novaSenha });
      setSucesso("Senha redefinida com sucesso.");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
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
          <form className="login-box" onSubmit={handleSalvar}>
            <h2>Nova senha</h2>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            {accessToken && !sucesso && (
              <>
                <label>Nova senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />

                <label>Confirmar senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />

                <button className="btn-login" type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </button>
              </>
            )}

            {(sucesso || !accessToken) && (
              <button
                className="btn-login"
                type="button"
                onClick={() => navigate(sucesso ? "/login" : "/esqueci-senha")}
              >
                {sucesso ? "Ir para login →" : "Solicitar novo link"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default RedefinirSenha;
