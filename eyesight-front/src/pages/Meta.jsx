
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

const PERIODOS = [
  { valor: "today",    rotulo: "Hoje" },
  { valor: "last_7d",  rotulo: "Últimos 7 dias" },
  { valor: "last_30d", rotulo: "Últimos 30 dias" },
  { valor: "last_90d", rotulo: "Últimos 90 dias" },
];

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

const TOTAIS_VAZIOS = { impressions: 0, clicks: 0, spend: 0, reach: 0, ctr: 0, cpm: 0, frequency: 0 };

function Meta() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [conta, setConta] = useState(null); // { conectado, account_id, vinculado_em }
  const [conectandoMeta, setConectandoMeta] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [periodo, setPeriodo] = useState("last_30d");
  const [totais, setTotais] = useState(TOTAIS_VAZIOS);
  const [totalCampanhas, setTotalCampanhas] = useState(0);
  const [campanhasComDados, setCampanhasComDados] = useState(0);
  const [carregandoMetricas, setCarregandoMetricas] = useState(false);

  async function carregarStatus() {
    try {
      const { data } = await api.get("/meta/status");
      setConta(data);
      return data;
    } catch (err) {
      console.error("[META] status:", err);
      setConta({ conectado: false });
      return { conectado: false };
    }
  }

  // Sincroniza as campanhas na Graph API e busca os totais do período.
  async function carregarMetricas(periodoAtual) {
    try {
      setCarregandoMetricas(true);

      // 1) sincroniza campanhas (grava no banco quem ainda não existe lá)
      const { data: dadosCampanhas } = await api.get("/meta/campanhas");
      setTotalCampanhas(dadosCampanhas?.total || 0);

      // 2) soma os insights de todas as campanhas no período escolhido
      const { data: resumo } = await api.get("/meta/insights/resumo", {
        params: { periodo: periodoAtual },
      });

      setTotais(resumo?.totais || TOTAIS_VAZIOS);
      setCampanhasComDados(resumo?.campanhas_com_dados || 0);
    } catch (err) {
      console.error("[META] métricas:", err);

      if (err.response?.data?.acao === "reconectar") {
        setFeedback({
          tipo: "erro",
          texto: "A conexão com o Meta expirou. Reconecte sua conta para atualizar os dados.",
        });
        setConta({ conectado: false });
      } else if (err.response?.status !== 404) {
        setFeedback({
          tipo: "erro",
          texto: err.response?.data?.erro || "Não foi possível buscar as métricas do Meta.",
        });
      }

      setTotais(TOTAIS_VAZIOS);
      setTotalCampanhas(0);
      setCampanhasComDados(0);
    } finally {
      setCarregandoMetricas(false);
    }
  }

  // Ao voltar do Meta o backend redireciona com ?meta=conectado|negado|sem-conta|erro
  useEffect(() => {
    const retorno = searchParams.get("meta");

    if (retorno) {
      setFeedback(MENSAGENS_RETORNO[retorno] || MENSAGENS_RETORNO.erro);
      setSearchParams({}, { replace: true });
    }

    carregarStatus().then((status) => {
      if (status.conectado) carregarMetricas(periodo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega as métricas sempre que o período muda (só se já estiver conectado)
  useEffect(() => {
    if (conta?.conectado) carregarMetricas(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

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
      setTotais(TOTAIS_VAZIOS);
      setTotalCampanhas(0);
      setCampanhasComDados(0);
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
  const semCampanhas = conectado && !carregandoMetricas && totalCampanhas === 0;

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

        {conectado ? (
          <select
            className="meta-periodo-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            disabled={carregandoMetricas}
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>{p.rotulo}</option>
            ))}
          </select>
        ) : (
          <span className="meta-status-pill">Nenhum dado no período</span>
        )}
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

            <p>
              {conta.account_id}
              {carregandoMetricas && " · atualizando métricas..."}
              {!carregandoMetricas && totalCampanhas > 0 &&
                ` · ${totalCampanhas} campanha${totalCampanhas > 1 ? "s" : ""} sincronizada${totalCampanhas > 1 ? "s" : ""}`}
            </p>
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

      {semCampanhas && (
        <div className="meta-feedback meta-feedback--erro" role="status">
          Nenhuma campanha ativa ou pausada foi encontrada nessa conta de anúncios para o período selecionado.
        </div>
      )}

      {/* Visão geral */}
      <div className="meta-overview-row">
        <div className="card meta-spend-card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiDollarSign />
            </div>
          </div>

          <p className="card-title">
            Investimento Total
          </p>

          <h2 className="card-value">
            {moeda.format(totais.spend || 0)}
          </h2>

          <span className="meta-spend-label">
            {campanhasComDados} campanha{campanhasComDados !== 1 ? "s" : ""} com dados no período
          </span>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiEye />
            </div>
          </div>

          <p className="card-title">
            Alcance
          </p>

          <h2 className="card-value">
            {numero.format(totais.reach || 0)}
          </h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiTarget />
            </div>
          </div>

          <p className="card-title">
            Cliques
          </p>

          <h2 className="card-value">
            {numero.format(totais.clicks || 0)}
          </h2>
        </div>

        <div className="card meta-roas-card">
          <FiTrendingUp className="meta-roas-icon" />

          <h2 className="meta-roas-value">
            {(totais.ctr || 0).toFixed(2)}%
          </h2>

          <span className="meta-roas-line" />

          <p className="card-title">
            CTR médio
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
            <strong>{numero.format(totais.impressions || 0)}</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiMousePointer />

          <div>
            <p>Cliques</p>
            <strong>{numero.format(totais.clicks || 0)}</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiActivity />

          <div>
            <p>Frequência</p>
            <strong>{(totais.frequency || 0).toFixed(2)}</strong>
          </div>
        </div>

        <div className="meta-strip-item">
          <FiDollarSign />

          <div>
            <p>CPM</p>
            <strong>{moeda.format(totais.cpm || 0)}</strong>
          </div>
        </div>
      </div>

      {/* Por Plataforma */}
      <h2 className="section-title">
        Por Plataforma
      </h2>

      <div className="analytics-grid">
        <div className="analytics-card analytics-card--em-breve">
          <div className="analytics-card-header">
            <FiFacebook className="section-icon fb-color" />

            <h2>Facebook</h2>
          </div>

          <p className="meta-em-breve-texto">
            Detalhamento por plataforma ainda não disponível — a Graph API precisa do
            parâmetro de breakdown por publisher_platform, que este painel ainda não consulta.
          </p>
        </div>

        <div className="analytics-card analytics-card--em-breve">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon ig-color" />

            <h2>Instagram</h2>
          </div>

          <p className="meta-em-breve-texto">
            Detalhamento por plataforma ainda não disponível — a Graph API precisa do
            parâmetro de breakdown por publisher_platform, que este painel ainda não consulta.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Meta;
