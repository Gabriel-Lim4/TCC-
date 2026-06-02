// ─────────────────────────────────────────────────────────────
// pages/Meta.jsx
//
// Conecta com o back-end para:
//   1. Verificar se a conta Meta já está vinculada (GET /meta/status)
//   2. Iniciar o fluxo OAuth (GET /meta/conectar)
//   3. Listar campanhas (GET /meta/campanhas)
//   4. Desconectar conta (DELETE /meta/desconectar)
//   5. Ler o resultado do callback OAuth (?meta=conectado/erro/negado)
// ─────────────────────────────────────────────────────────────

import '../styles/Meta.css';
import { useState, useEffect } from 'react';
import { useSearchParams }     from 'react-router-dom';
import api                     from '../services/api';

function Meta() {
  const [campanhas, setCampanhas]   = useState([]);
  const [conectado, setConectado]   = useState(false);
  const [accountId, setAccountId]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState('');
  const [searchParams]              = useSearchParams();

  // ── Efeito 1: lê o resultado do callback OAuth ───────────────
  // Quando o Meta redireciona de volta para /app/meta,
  // ele adiciona ?meta=conectado ou ?meta=erro na URL.
  // Aqui lemos esse parâmetro e exibimos o feedback adequado.
  useEffect(() => {
    const resultado = searchParams.get('meta');
    if (resultado === 'conectado') setSucesso('Conta Meta conectada com sucesso!');
    if (resultado === 'erro')      setErro('Erro ao conectar com o Meta. Tente novamente.');
    if (resultado === 'negado')    setErro('Autorização negada. Tente novamente.');
  }, [searchParams]);

  // ── Efeito 2: verifica status e carrega campanhas ────────────
  useEffect(() => {
    async function inicializar() {
      try {
        const { data } = await api.get('/meta/status');
        setConectado(data.conectado);
        if (data.account_id) setAccountId(data.account_id);

        // Se já tem conta vinculada, carrega as campanhas automaticamente
        if (data.conectado) await carregarCampanhas();
      } catch (err) {
        setErro('Erro ao verificar conexão com o Meta.');
      } finally {
        setLoading(false);
      }
    }
    inicializar();
  }, []);

  // ── Busca campanhas na Graph API via back-end ────────────────
  async function carregarCampanhas() {
    setLoadingCamp(true);
    try {
      const { data } = await api.get('/meta/campanhas');
      setCampanhas(data.campanhas || []);
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao buscar campanhas.';
      // Se o back sinalizar "reconectar", o token do Meta expirou
      if (err.response?.data?.acao === 'reconectar') {
        setConectado(false);
        setErro('Sua conexão com o Meta expirou. Clique em "Conectar conta" para renovar.');
      } else {
        setErro(msg);
      }
    } finally {
      setLoadingCamp(false);
    }
  }

  // ── Inicia fluxo OAuth ───────────────────────────────────────
  // Pede ao back a URL de autorização e redireciona o browser.
  // O userId é necessário para o back saber qual usuário
  // está autorizando no callback (que não tem JWT).
  async function conectarMeta() {
    setErro('');
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const { data } = await api.get('/meta/conectar');

      // Salva o state para segurança (CSRF)
      sessionStorage.setItem('meta_oauth_state', data.state);

      // Adiciona o userId como parâmetro extra na URL do Meta
      // O back-end lê esse parâmetro no callback para identificar o usuário
      const urlFinal = `${data.url}&userId=${usuario.id}`;
      window.location.href = urlFinal;
    } catch (err) {
      setErro('Erro ao iniciar conexão com o Meta.');
    }
  }

  // ── Remove conta vinculada ───────────────────────────────────
  async function desconectar() {
    setErro('');
    try {
      await api.delete('/meta/desconectar');
      setConectado(false);
      setCampanhas([]);
      setAccountId('');
      setSucesso('Conta Meta desconectada.');
    } catch (err) {
      setErro('Erro ao desconectar conta.');
    }
  }

  // ── Calcula totais das campanhas para os cards ───────────────
  // Os dados de campanhas não incluem spend — isso vem dos insights.
  // Por ora os cards de spend ficam zerados até implementar insights.
  const totalCampanhas = campanhas.length;
  const ativas = campanhas.filter(c => c.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div className="dashboard-content">
        <h1>Meta Ads</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <h1>Meta Ads</h1>
      <p className="subtitle">Acompanhe suas campanhas no Facebook e Instagram</p>

      {/* Feedback de erro e sucesso */}
      {erro    && <p style={{ color: 'var(--color-danger, #e53e3e)', marginBottom: 16 }}>{erro}</p>}
      {sucesso && <p style={{ color: 'var(--color-success, #38a169)', marginBottom: 16 }}>{sucesso}</p>}

      {/* Botão de conexão / status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {!conectado ? (
          <button className="btn-conectar" onClick={conectarMeta}>
            Conectar conta do Meta
          </button>
        ) : (
          <>
            <span style={{ fontSize: 13, color: '#38a169' }}>
              ● Conta conectada {accountId && `(${accountId})`}
            </span>
            <button className="btn-desconectar" onClick={desconectar}>
              Desconectar
            </button>
            <button className="btn-atualizar" onClick={carregarCampanhas} disabled={loadingCamp}>
              {loadingCamp ? 'Atualizando...' : 'Atualizar'}
            </button>
          </>
        )}
      </div>

      {/* CARDS PRINCIPAIS */}
      <div className="cards-top">
        <div className="card">
          <p>Campanhas ativas</p>
          <h2>{ativas}</h2>
        </div>
        <div className="card">
          <p>Total de campanhas</p>
          <h2>{totalCampanhas}</h2>
        </div>
        <div className="card">
          <p>Investimento Total</p>
          <h2>R$ 0,00</h2>
        </div>
        <div className="card">
          <p>ROAS</p>
          <h2>—</h2>
        </div>
      </div>

      {/* MÉTRICAS DE PERFORMANCE */}
      <h2 style={{ marginTop: 30 }}>Métricas de Performance</h2>
      <div className="cards-top" style={{ marginTop: 20 }}>
        <div className="card"><p>Impressões</p><h2>—</h2></div>
        <div className="card"><p>Cliques</p><h2>—</h2></div>
        <div className="card"><p>CTR</p><h2>—</h2></div>
        <div className="card"><p>CPM</p><h2>—</h2></div>
      </div>

      {/* LISTA DE CAMPANHAS */}
      {conectado && (
        <>
          <h2 style={{ marginTop: 30 }}>Campanhas</h2>

          {loadingCamp && <p style={{ marginTop: 12 }}>Buscando campanhas...</p>}

          {!loadingCamp && campanhas.length === 0 && (
            <p style={{ marginTop: 12, color: '#888' }}>
              Nenhuma campanha ativa encontrada.
            </p>
          )}

          {!loadingCamp && campanhas.map(c => (
            <div key={c.id} className="campaign-row">
              <div>
                <strong>{c.name}</strong>
                <span className="campaign-objective">{c.objective}</span>
              </div>
              <span className={`campaign-status status-${c.status?.toLowerCase()}`}>
                {c.status}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Por Plataforma */}
      <h2 style={{ marginTop: 40 }}>Por Plataforma</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h2>Facebook</h2>
          <div className="stats-grid">
            <div><p>Gasto</p><h1>R$ 0</h1></div>
            <div><p>Alcance</p><h1>—</h1></div>
            <div><p>Cliques</p><h1>—</h1></div>
            <div><p>ROAS</p><h1>—</h1></div>
          </div>
        </div>
        <div className="analytics-card">
          <h2>Instagram</h2>
          <div className="stats-grid">
            <div><p>Gasto</p><h1>R$ 0</h1></div>
            <div><p>Alcance</p><h1>—</h1></div>
            <div><p>Cliques</p><h1>—</h1></div>
            <div><p>ROAS</p><h1>—</h1></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Meta;
