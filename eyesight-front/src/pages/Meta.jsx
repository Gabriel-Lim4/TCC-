
/* importando o css da tela */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import "../styles/Meta.css";
import "../styles/variables.css";

import api from "../services/api";

import {
  FiDollarSign,
  FiEye,
  FiTarget,
  FiTrendingUp,
  FiMousePointer,
  FiActivity,
  FiFacebook,
  FiInstagram,
  FiLink,
  FiCheckCircle
} from "react-icons/fi";

import { HiOutlineSparkles } from "react-icons/hi";

const MENSAGENS_RETORNO = {
  conectado: { tipo: "ok", texto: "Conta do Meta Ads conectada com sucesso." },
  negado: { tipo: "erro", texto: "Você cancelou a autorização. Nada foi conectado." },
  "sem-conta": {
    tipo: "erro",
    texto: "Nenhuma conta de anúncios foi encontrada nesse perfil do Facebook.",
  },
  erro: { tipo: "erro", texto: "Não foi possível conectar o Meta. Tente novamente." },
};

function Meta() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [conta, setConta] = useState(null); // { conectado, account_id, vinculado_em }
  const [conectandoMeta, setConectandoMeta] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function carregarStatus() {
    try {
      const { data } = await api.get("/meta/status");
      setConta(data);
    } catch (err) {
      console.error("[META] status:", err);
      setConta({ conectado: false });
    }
  }

  // Ao voltar do Meta o backend redireciona com ?meta=conectado|negado|sem-conta|erro
  useEffect(() => {
    const retorno = searchParams.get("meta");

    if (retorno) {
      setFeedback(MENSAGENS_RETORNO[retorno] || MENSAGENS_RETORNO.erro);
      setSearchParams({}, { replace: true });
    }

    carregarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function conectarMeta() {
    try {
      setFeedback(null);
      setConectandoMeta(true);

      const resposta = await api.get("/meta/conectar");

      if (!resposta.data?.url) {
        throw new Error("URL de autorização do Meta não recebida.");
      }

      window.location.href = resposta.data.url;
    } catch (err) {
      console.error("Erro ao conectar Meta:", err);

      setFeedback({
        tipo: "erro",
        texto:
          err.response?.data?.erro ||
          "Não foi possível iniciar a conexão com o Meta.",
      });

      setConectandoMeta(false);
    }
  }

  async function desconectarMeta() {
    if (!window.confirm("Desconectar a conta do Meta Ads? Campanhas e métricas salvas serão removidas.")) {
      return;
    }

    try {
      setDesconectando(true);
      await api.delete("/meta/desconectar");
      setConta({ conectado: false });
      setFeedback({ tipo: "ok", texto: "Conta do Meta desconectada." });
    } catch (err) {
      setFeedback({
        tipo: "erro",
        texto: err.response?.data?.erro || "Não foi possível desconectar.",
      });
    } finally {
      setDesconectando(false);
    }
  }

  const conectado = !!conta?.conectado;

  return (
    <div className="dashboard-content">
      {/* camada decorativa de fundo, na mesma linguagem visual do resto do app */}
      <div className="meta-bg-mesh" aria-hidden="true" />

      <div className="page-header-row">
        <div className="page-header-title">
          <span className="meta-eyebrow">
            <HiOutlineSparkles /> Plataforma &middot; Meta Ads
          </span>

          <h1>Meta Ads</h1>

          <p className="subtitle">
            Acompanhe suas campanhas no Facebook e Instagram
          </p>
        </div>

        <span className={`meta-status-pill ${conectado ? "meta-status-pill--ok" : ""}`}>
          {conectado ? "Conta conectada" : "Nenhum dado no período"}
        </span>
      </div>

      {feedback && (
        <div className={`meta-feedback meta-feedback--${feedback.tipo}`} role="status">
          {feedback.texto}
        </div>
      )}

      {conectado ? (
        <div className="meta-connect-banner meta-connect-banner--ok">
          <div className="meta-connect-icon">
            <FiCheckCircle />
          </div>

          <div className="meta-connect-text">
            <strong>Conta do Meta Ads conectada</strong>

            <p>{conta.account_id}</p>
          </div>

          <button
            type="button"
            className="meta-disconnect-btn"
            onClick={desconectarMeta}
            disabled={desconectando}
          >
            {desconectando ? "Desconectando..." : "Desconectar"}
          </button>
        </div>
      ) : (
        <div className="meta-connect-banner">
          <div className="meta-connect-icon">
            <FiLink />
          </div>

          <div className="meta-connect-text">
            <strong>Conecte sua conta do Meta Ads</strong>

            <p>
              Assim que uma conta for conectada, os números abaixo passam a
              refletir suas campanhas reais.
            </p>
          </div>

          <button
            type="button"
            className="meta-connect-btn"
            onClick={conectarMeta}
            disabled={conectandoMeta || conta === null}
          >
            {conectandoMeta ? "Conectando..." : "Conectar conta"}
          </button>
        </div>
      )}

      {/* Visão geral: gasto em destaque + cards normais + ROAS tipográfico */}
      <div className="meta-overview-row">
        <div className="card meta-spend-card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiDollarSign />
            </div>

            <span className="green-text">+0%</span>
          </div>

          <p className="card-title">
            Investimento Total
          </p>

          <h2 className="card-value">
            R$ 0,00
          </h2>

          <div className="meta-spend-track">
            <div
              className="meta-spend-fill"
              style={{ width: "0%" }}
            />
          </div>

          <span className="meta-spend-label">
            0% do investido este mês
          </span>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiEye />
            </div>

            <span className="green-text">+0%</span>
          </div>

          <p className="card-title">
            Alcance
          </p>

          <h2 className="card-value">
            0
          </h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiTarget />
            </div>

            <span className="green-text">+0%</span>
          </div>

          <p className="card-title">
            Conversões
          </p>

          <h2 className="card-value">
            0
          </h2>
        </div>

        <div className="card meta-roas-card">
          <FiTrendingUp className="meta-roas-icon" />

          <h2 className="meta-roas-value">
            0.00x
          </h2>

          <span className="meta-roas-line" />

          <p className="card-title">
            ROAS
          </p>
        </div>
      </div>

      {/* Métricas de performance */}
      <h2 className="section-title">
        Métricas de Performance
      </h2>

      <div className="meta-strip">
        <div className="meta-strip-item">
          <FiEye />

          <div>
            <p>Impressões</p>
            <strong>0</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiMousePointer />

          <div>
            <p>Cliques</p>
            <strong>0</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiActivity />

          <div>
            <p>Frequência</p>
            <strong>0.00</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiDollarSign />

          <div>
            <p>CPM</p>
            <strong>R$ 0,00</strong>
          </div>
        </div>
      </div>

      {/* Por Plataforma */}
      <h2 className="section-title">
        Por Plataforma
      </h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiFacebook className="section-icon fb-color" />

            <h2>Facebook</h2>
          </div>

          <div className="stats-grid">
            <div>
              <p>Gasto</p>
              <h1>R$ 0</h1>
            </div>

            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>

            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>

            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>
          </div>

          <div className="meta-share-bar">
            <div
              className="meta-share-fill meta-share-fb"
              style={{ width: "50%" }}
            />
          </div>

          <span className="meta-share-label">
            50% do investimento total
          </span>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon ig-color" />

            <h2>Instagram</h2>
          </div>

          <div className="stats-grid">
            <div>
              <p>Gastos</p>
              <h1>R$ 0</h1>
            </div>

            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>

            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>

            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>
          </div>

          <div className="meta-share-bar">
            <div
              className="meta-share-fill meta-share-ig"
              style={{ width: "50%" }}
            />
          </div>

          <span className="meta-share-label">
            50% do investimento total
          </span>
        </div>
      </div>
    </div>
  );
}

export default Meta;

