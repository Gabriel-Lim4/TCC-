import "../styles/Home.css";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">

      {/* Navbar */}
      <nav className="navbar">

        <div className="logo">
          <img src={logo} alt="Eyesight Logo" />
          EYESIGHT
        </div>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#sobre">Sobre</a>
          <a href="#demo">Demonstração</a>
          <a href="#funcionalidades">Recursos</a>
        </div>

        <div className="nav-buttons">

          <Link to="/login">
            <button className="btn-login">
              Entrar
            </button>
          </Link>

          {/*<Link to="/cadastro">
            <button className="btn-register">
              Criar Conta
            </button>
          </Link>*/}

        </div>

      </nav>

      {/* Hero */}
      <section className="hero">

        <span className="badge">
          Plataforma Inteligente de Marketing
        </span>

        <h1>
          Todas as suas métricas
          <br />
          <span> Uma única visão</span>
        </h1>

        <p>
          Centralize dados de Instagram, TikTok,
          TikTok Shop, Meta Ads e Google Ads e <br />tome
          decisões mais estratégicas com suporte de
          inteligência artificial.
        </p>

        <div className="hero-buttons">

          <Link to="/login" className="btn-register">
            Começar
          </Link>

          <button className="btn-demo">
            Ver demonstração
          </button>

        </div>

      </section>

      {/* Problema x Solução */}

      <section className="comparison">

        <div className="comparison-header">
          <span className="comparison-badge">
            Por que escolher o Eyesight?
          </span>
        </div>

        <div className="comparison-card">
          <h3>Como é hoje</h3>
          <ul>
            <li>❌ Trocar entre várias plataformas</li>
            <li>❌ Exportar planilhas manualmente</li>
            <li>❌ Comparar métricas em abas diferentes</li>
            <li>❌ Perder tempo consolidando dados</li>
          </ul>
        </div>

        <div className="comparison-card solution">
          <h3>Com Eyesight</h3>
          <ul>
            <li>✅ Dados centralizados</li>
            <li>✅ Painel unificado</li>
            <li>✅ Comparação automática</li>
            <li>✅ Insights gerados por IA</li>
          </ul>
        </div>

      </section>

      {/* Demonstração */}

      <section id="demo" className="demo">

        <h2>Veja o Eyesight em ação</h2>

        <p>
          Visualize métricas de diferentes plataformas
          em um único painel e receba análises
          inteligentes em tempo real.
        </p>

        <div className="dashboard-preview">

          PRINT OU VÍDEO DA DASHBOARD

        </div>

      </section>

      {/* Sobre */}

      <section id="sobre" className="about">

        <div className="about-text">

          <span className="section-tag">
            Sobre o Eyesight
          </span>

          <h2>
            Uma plataforma para centralizar
            suas métricas de marketing
          </h2>

          <p>
            O Eyesight reúne dados de Google Ads,
            Meta Ads, TikTok, TikTok Shop e
            Instagram em um único ambiente.
          </p>

        </div>

        <div className="about-stats">

          <div className="stat-card">
            <h3>5+</h3>
            <p>Plataformas Integradas</p>
          </div>

          <div className="stat-card">
            <h3>IA</h3>
            <p>Assistente Inteligente</p>
          </div>

          <div className="stat-card">
            <h3>24h</h3>
            <p>Métricas Centralizadas</p>
          </div>

        </div>

      </section>

      {/* Recursos */}

      <section
        id="funcionalidades"
        className="features"
      >

        <div className="features-header">

          <span className="section-tag">
            Recursos
          </span>

          <h2>
            Tudo o que você precisa para acompanhar
            seus resultados
          </h2>

        </div>

        <div className="feature-card">
          <h3>Google Ads</h3>
          <p>
            Acompanhe campanhas,
            conversões, investimento
            e retorno sobre anúncios.
          </p>
        </div>

        <div className="feature-card">
          <h3>Meta Ads</h3>
          <p>
            Visualize campanhas do Facebook
            e Instagram em um único painel.
          </p>
        </div>

        <div className="feature-card">
          <h3>TikTok & TikTok Shop</h3>
          <p>
            Analise desempenho de vídeos,
            campanhas e vendas.
          </p>
        </div>

        <div className="feature-card">
          <h3>Assistente Inteligente</h3>
          <p>
            Receba recomendações baseadas
            nos dados das campanhas.
          </p>
        </div>

      </section>

    </div>
  );
}

export default Home;