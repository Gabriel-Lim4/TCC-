import "../styles/Login.css";
import "../styles/variables.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";

// O link do e-mail passa pelo Supabase e volta aqui com o resultado no hash:
//   sucesso: #access_token=...&type=signup
//   erro:    #error=access_denied&error_code=otp_expired&error_description=...
function interpretarRetorno() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);

  const erroCode = params.get("error_code") || query.get("error_code");
  const erroDesc = params.get("error_description") || query.get("error_description");

  if (erroCode || params.get("error")) {
    return {
      status: "error",
      mensagem:
        erroCode === "otp_expired"
          ? "Link expirado ou já utilizado. Volte ao login, tente entrar e peça um novo e-mail de confirmação."
          : erroDesc || "Não foi possível confirmar o e-mail.",
    };
  }

  if (params.get("access_token") || params.get("type") === "signup") {
    return { status: "success", mensagem: "E-mail confirmado com sucesso. Você já pode entrar." };
  }

  return {
    status: "error",
    mensagem: "Link inválido. Verifique se copiou o endereço completo do e-mail.",
  };
}

function VerificarEmail() {
  const navigate = useNavigate();
  const [{ status, mensagem }] = useState(interpretarRetorno);

  // Remove tokens da barra de endereço
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

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
          <div className="login-box verify-box">
            <h2>Confirmação de e-mail</h2>
            <p className={status === "success" ? "sucesso-msg" : "erro-msg"}>{mensagem}</p>
            <button className="btn-login" onClick={() => navigate("/login")}>
              {status === "success" ? "Ir para login →" : "Voltar para login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificarEmail;
