import "../styles/Login.css";
import "../styles/ForgotPassword.css";
import "../styles/variables.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import logo from "../assets/Logo.png";
import api from "../services/api"; // ajuste o caminho conforme sua estrutura

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // -------------------------------------------------------
  // ENVIAR LINK DE REDEFINIÇÃO
  // -------------------------------------------------------
  async function handleEnviar(e) {
    e.preventDefault();
    setErro("");

    if (!email) {
      setErro("Informe seu e-mail.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/esqueci-senha", { email });

      setEnviado(true);
    } catch (err) {
      const msg =
        err.response?.data?.erro ||
        err.response?.data?.message ||
        "Não foi possível enviar o link. Tente novamente.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="login-page">
      <div className="login-container">

        {/* PAINEL ESQUERDO — mesma marca do Login */}
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

        {/* FORMULÁRIO */}
        <div className="right-side">
          <div className="login-box">

            <button
              type="button"
              className="fp-back"
              onClick={() => navigate("/login")}
            >
              <FiArrowLeft /> Voltar para o login
            </button>

            {!enviado ? (
              <>
                <h2>Redefinir senha</h2>
                <p className="fp-subtitle">
                  Informe o e-mail da sua conta e enviaremos um link para você
                  criar uma nova senha.
                </p>

                {erro && <p className="erro-msg">{erro}</p>}

                <form onSubmit={handleEnviar}>
                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button className="btn-login" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link de redefinição"}
                  </button>
                </form>
              </>
            ) : (
              <div className="fp-success">
                <FiCheckCircle className="fp-success-icon" />
                <h2>Verifique seu e-mail</h2>
                <p className="fp-subtitle">
                  Enviamos um link de redefinição para <strong>{email}</strong>.
                  Abra o e-mail e siga as instruções para criar uma nova senha.
                </p>

                <button
                  type="button"
                  className="fp-resend"
                  onClick={handleEnviar}
                  disabled={loading}
                >
                  {loading ? "Reenviando..." : "Não recebeu? Reenviar e-mail"}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;