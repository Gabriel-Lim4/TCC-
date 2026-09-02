/* importando o css da tela */
import "../styles/Instagram.css";
import "../styles/variables.css";

import {
  FiUsers, FiEye, FiHeart, FiTrendingUp,
  FiMessageSquare, FiBookmark, FiShare2, FiInstagram, FiVideo
} from "react-icons/fi";

function Instagram() {
  // taxa de engajamento também alimenta o anel abaixo
  const engajamento = 0;

  return (
    <div className="dashboard-content">
      <div className="page-header-title">
        <h1>Instagram</h1>
      </div>

      <p className="subtitle">
        Análise completa do desempenho da sua conta no Instagram
      </p>

      {/* Visão geral: 4 cards de mesmo tamanho, lado a lado */}
      <div className="overview-row">
        <div className="card card-highlight">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiUsers />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Seguidores</p>
          <h2 className="card-value">0</h2>
          <span className="card-note">desde o último mês</span>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiEye />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Alcance</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiHeart />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Curtidas</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card card-ring">
          <div
            className="engagement-ring"
            style={{ background: `conic-gradient(#d9714a ${engajamento}%, rgba(255,255,255,.08) 0)` }}
          >
            <div className="engagement-ring-inner">
              <FiTrendingUp />
              <strong>{engajamento}%</strong>
            </div>
          </div>
          <p className="card-title">Taxa de engajamento</p>
        </div>
      </div>

      {/* Faixa única com as métricas de engajamento, sem repetir o card padrão */}
      <h2 className="section-title">Estatísticas de engajamento</h2>
      <div className="stats-strip">
        <div className="stats-strip-item">
          <FiHeart />
          <div>
            <p>Curtidas</p>
            <strong>0</strong>
          </div>
        </div>
        <div className="stats-strip-item">
          <FiMessageSquare />
          <div>
            <p>Comentários</p>
            <strong>0</strong>
          </div>
        </div>
        <div className="stats-strip-item">
          <FiBookmark />
          <div>
            <p>Salvamentos</p>
            <strong>0</strong>
          </div>
        </div>
        <div className="stats-strip-item">
          <FiShare2 />
          <div>
            <p>Compartilhamentos</p>
            <strong>0</strong>
          </div>
        </div>
      </div>

      {/* Posts recentes: 4 cards de mesmo tamanho */}
      <h2 className="section-title">Posts recentes</h2>
      <div className="posts-grid">
        {[1, 2, 3, 4].map((post) => (
          <div className="post-card" key={post}>
            <div className="post-image">
              <FiInstagram className="placeholder-insta-icon" />
            </div>
            <div className="post-info">
              <span><FiHeart /> 0</span>
              <span><FiMessageSquare /> 0</span>
              <span><FiShare2 /> 0</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stories e Reels */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon" />
            <h2>Stories</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Publicados (7d)</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Visualizações</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Interações</p>
              <h1>0</h1>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiVideo className="section-icon" />
            <h2>Reels</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Publicados (30d)</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Visualizações</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Curtidas</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Compartilhamentos</p>
              <h1>0</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Instagram;