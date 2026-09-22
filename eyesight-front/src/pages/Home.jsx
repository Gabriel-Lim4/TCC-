import { useState, useEffect } from "react";
import "../styles/Home.css";
import "../styles/variables.css";

import logo from "../assets/Logo.png";
import dashboard from "../assets/dashboard.png";
import dashboard3 from "../assets/dashboard3.png";

import { Link } from "react-router-dom";

import { FaTiktok, FaInstagram } from "react-icons/fa";

import {
  FiFacebook,
  FiLayers,
  FiClock,
  FiUsers,
  FiUserCheck,
  FiShoppingBag,
  FiLink,
  FiFileText,
  FiBell,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiMenu,
  FiX,
  FiArrowRight,
} from "react-icons/fi";

import { SiGoogleads } from "react-icons/si";
import { MdAndroid } from "react-icons/md";

// ============================================
// FAQ
// ============================================

const faqItems = [
  {
    question: "Preciso ter conta em todas as plataformas de anúncio?",
    answer:
      "Não. Você conecta só as que já usa hoje e pode adicionar as outras depois, sem precisar refazer nada.",
  },
  {
    question: "Os dados são atualizados em tempo real?",
    answer:
      "As métricas são sincronizadas periodicamente com cada plataforma, então o painel sempre reflete os números mais recentes disponíveis.",
  },
  {
    question: "O assistente substitui um gestor de tráfego?",
    answer:
      "Não. Ele ajuda a enxergar padrões nos dados mais rápido, mas quem decide a estratégia continua sendo você.",
  },
  {
    question: "O Eyesight é gratuito?",
    answer:
      "Este é um projeto acadêmico (TCC), então por enquanto o acesso é voltado para testes e demonstração.",
  },
];

// ============================================
// COMPARAÇÃO
// ============================================

const problemas = [
  "Instagram",
  "Meta Ads",
  "Google Ads",
  "Planilhas",
  "Relatórios separados",
];

const solucoes = [
  "Todas as plataformas conectadas",
  "Informações em um único painel",
  "Comparação rápida entre campanhas",
  "Assistente para apoiar análises",
];

// ============================================
// EQUIPE DO TCC

const integrantes = [
  { nome: "Clara Vau", papel: "Desenvolvimento Front-end" },
  { nome: "Davi Scavassa", papel: "Diário de Bordo" },
  { nome: "Enrico Fedel", papel: "Documentação" },
  { nome: "Felipe Branchini", papel: "Banco de Dados" },
  { nome: "Gabriel Oliveira", papel: "Desenvolvimento Back-end" },
];

function iniciaisDoNome(nome) {
  const partes = nome.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

// ============================================
// HOME
// ============================================

function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    onScroll();

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="home">

      {/* ============================================
          NAVBAR
          ============================================ */}

      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>

        <div className="logo">
          <img src={logo} alt="Eyesight Logo" />
          <span>EYESIGHT</span>
        </div>

        <div className={`nav-links${menuOpen ? " open" : ""}`}>

          <a href="#inicio" onClick={closeMenu}>
            Home
          </a>

          <a href="#sobre" onClick={closeMenu}>
            Sobre
          </a>

          <a href="#como-funciona" onClick={closeMenu}>
            Como funciona
          </a>

          <a href="#demo" onClick={closeMenu}>
            Demonstração
          </a>

          <a href="#funcionalidades" onClick={closeMenu}>
            Recursos
          </a>

        </div>

        <div className="nav-buttons">

          <Link to="/login">
            <button className="btn-login">
              Entrar
            </button>
          </Link>

          <Link to="/login" className="btn-register nav-register">
            Cadastrar
          </Link>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

        </div>

      </nav>


      {/* ============================================
          HERO
          ============================================ */}

      <section id="inicio" className="hero">

        <div className="hero-content">

          <div className="hero-text">

            <span className="hero-tag">
              ANÁLISE INTELIGENTE DE MARKETING
            </span>

            <h1>
              Todas as suas métricas.
              <span>Uma única visão.</span>
            </h1>

            <p>
              Centralize os dados das suas plataformas digitais e transforme
              métricas em decisões estratégicas para o seu negócio.
            </p>

            <div className="hero-buttons">

              <Link to="/cadastro" className="btn-primary">
                Começar agora
                <FiArrowRight />
              </Link>

              <Link to="/login" className="btn-secondary">
                Entrar
              </Link>

            </div>

            <div className="hero-trust">

              <span>Integrações com</span>

              <div className="hero-trust-icons">
                <FaTiktok />
                <FaInstagram />
                <FiFacebook />
                <SiGoogleads />
              </div>

            </div>

          </div>

        </div>

        {/* IMAGEM DO LADO DIREITO, COM DEGRADÊ SUMINDO EM DIREÇÃO AO TÍTULO */}
        <div className="hero-bg-image" aria-hidden="true">
          <img src={dashboard} alt="" />
        </div>


        {/* INDICADOR DE SCROLL */}

        <a
          href="#comparacao"
          className="hero-scroll-cue"
          aria-label="Ver mais"
        >
          <span></span>
        </a>

      </section>


      {/* ============================================
          COMO É HOJE X SOLUÇÃO
          ============================================ */}

      <section id="comparacao" className="comparison">

        <div className="comparison-header">

          <span className="section-tag">
            Por que escolher o Eyesight?
          </span>

          <h2>
            Menos abas. Mais clareza.
          </h2>

        </div>

        <div className="comparison-row">

          <div className="comparison-card">

            <div className="comparison-card-header">
              <span className="comparison-label problem">
                Antes
              </span>

              <h3>Como é hoje</h3>
            </div>

            <ul>
              {problemas.map((item) => (
                <li key={item}>
                  <FiXCircle />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

          </div>


          <div className="comparison-arrow">
            <FiArrowRight />
          </div>


          <div className="comparison-card solution">

            <div className="comparison-card-header">
              <span className="comparison-label solution-label">
                Com Eyesight
              </span>

              <h3>Com Eyesight</h3>
            </div>

            <ul>
              {solucoes.map((item) => (
                <li key={item}>
                  <FiCheckCircle />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

          </div>

        </div>

      </section>


      {/* ============================================
          PARA QUEM É
          ============================================ */}

      <section className="personas">

        <div className="personas-header">

          <span className="section-tag">
            Para quem é
          </span>

          <h2>
            Feito pra quem lida com número de campanha todo dia
          </h2>

        </div>

        <div className="personas-grid">

          <div className="persona-card">

            <div className="persona-icon">
              <FiUsers />
            </div>

            <h3>Agências pequenas</h3>

            <p>
              Centralize o relatório de cada cliente sem abrir cinco abas
              diferentes toda manhã.
            </p>

            <span className="card-link">
              Saiba mais <FiArrowRight />
            </span>

          </div>


          <div className="persona-card">

            <div className="persona-icon">
              <FiUserCheck />
            </div>

            <h3>Freelancers de tráfego</h3>

            <p>
              Mostre resultado pro cliente sem precisar montar planilha na
              mão antes da reunião.
            </p>

            <span className="card-link">
              Saiba mais <FiArrowRight />
            </span>

          </div>


          <div className="persona-card">

            <div className="persona-icon">
              <FiShoppingBag />
            </div>

            <h3>Lojas online</h3>

            <p>
              Veja se o investimento em anúncio está voltando em venda, não
              só em clique.
            </p>

            <span className="card-link">
              Saiba mais <FiArrowRight />
            </span>

          </div>

        </div>

      </section>


      {/* ============================================
          DEMONSTRAÇÃO
          ============================================ */}

      <section id="demo" className="demo">

        <div className="demo-header">

          <span className="section-tag">
            O sistema por dentro
          </span>

          <h2>
            Veja o Eyesight em ação
          </h2>

          <p>
            Visualize métricas de diferentes plataformas em um único painel e
            receba análises inteligentes em tempo real.
          </p>

        </div>


        <div className="dashboard-demo">

          <div className="demo-window-bar">

            <div className="preview-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span>
              app.eyesight.com/dashboard
            </span>

          </div>

          <div className="demo-image-wrapper">

            <img
              src={dashboard}
              alt="Demonstração do Dashboard Eyesight"
            />

          </div>

        </div>

      </section>


      {/* ============================================
          COMO FUNCIONA
          ============================================ */}

      <section id="como-funciona" className="how-it-works">

        <div className="how-it-works-header">

          <span className="section-tag">
            Como funciona
          </span>

          <h2>
            Do login ao insight, em três passos
          </h2>

        </div>


        <div className="steps-row">

          <div className="step-card">

            <div className="step-number">
              <FiLink />
            </div>

            <h3>Conectar contas</h3>

            <p>
              Google Ads, Meta Ads, TikTok e Instagram, num login só.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <h3>Ver tudo junto</h3>

            <p>
              As métricas chegam organizadas no painel, sem precisar
              exportar nada.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <h3>Entender o que fazer</h3>

            <p>
              O assistente aponta o que está funcionando e o que vale
              pausar.
            </p>

          </div>

        </div>

      </section>


      {/* ============================================
          SOBRE
          ============================================ */}

      <section id="sobre" className="about">

        <div className="about-visual">
          <div className="about-visual-frame">
            <img src={dashboard3} alt="Painel do Eyesight em uso" />
          </div>
        </div>

        <div className="about-content">

          <div className="about-text">

            <span className="section-tag">
              Sobre o Eyesight
            </span>

            <h2>
              Um painel só, pros dados que hoje vivem espalhados
            </h2>

            <p>
              O Eyesight nasceu como projeto de TCC do curso de Desenvolvimento
              de Sistemas, a partir de um problema comum: quem cuida de
              campanha de marketing digital acaba abrindo o painel de cada
              plataforma separadamente só pra montar um relatório.
            </p>

            <p>
              Aqui, os dados de Google Ads, Meta Ads, TikTok, TikTok Shop e
              Instagram chegam organizados num só lugar, com espaço pra
              crescer conforme novas integrações forem adicionadas.
            </p>

          </div>


          <div className="about-stats">

            <div className="stat-card">
              <FiLayers className="stat-icon" />

              <h3>5+</h3>

              <p>
                Plataformas Integradas
              </p>
            </div>


            <div className="stat-card">
              <MdAndroid className="stat-icon" />

              <h3>IA</h3>

              <p>
                Assistente Inteligente
              </p>
            </div>


            <div className="stat-card">
              <FiClock className="stat-icon" />

              <h3>24h</h3>

              <p>
                Métricas Centralizadas
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* ============================================
          RECURSOS
          ============================================ */}

      <section id="funcionalidades" className="features">

        <div className="features-header">

          <span className="section-tag">
            Recursos
          </span>

          <h2>
            Tudo o que você precisa para acompanhar seus resultados
          </h2>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <SiGoogleads />
          </div>

          <h3>Google Ads</h3>

          <p>
            Acompanhe campanhas, conversões, investimento e retorno sobre
            anúncios.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <FiFacebook />
          </div>

          <h3>Meta Ads</h3>

          <p>
            Visualize campanhas do Facebook e Instagram em um único painel.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <FaTiktok />
          </div>

          <h3>TikTok & TikTok Shop</h3>

          <p>
            Analise desempenho de vídeos, campanhas e vendas.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <MdAndroid />
          </div>

          <h3>Assistente Inteligente</h3>

          <p>
            Receba recomendações baseadas nos dados das campanhas.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <FiFileText />
          </div>

          <h3>Relatórios automáticos</h3>

          <p>
            Exporte um resumo do período sem montar apresentação do zero.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            <FiBell />
          </div>

          <h3>Alertas personalizados</h3>

          <p>
            Receba um aviso quando uma campanha sair da meta que você
            definiu.
          </p>

          <span className="card-link">
            Saiba mais <FiArrowRight />
          </span>

        </div>

      </section>


      {/* ============================================
          FAQ
          ============================================ */}

      <section className="faq">

        <div className="faq-header">

          <span className="section-tag">
            Perguntas frequentes
          </span>

          <h2>
            Ainda com dúvida?
          </h2>

        </div>


        <div className="faq-list">

          {faqItems.map((item, index) => {

            const isOpen = openFaq === index;

            return (
              <div
                key={item.question}
                className={`faq-item${isOpen ? " open" : ""}`}
              >

                <button
                  className="faq-question"
                  onClick={() =>
                    setOpenFaq(isOpen ? null : index)
                  }
                  aria-expanded={isOpen}
                >

                  <span>
                    {item.question}
                  </span>

                  <FiPlus />

                </button>


                <div className="faq-answer">

                  <p>
                    {item.answer}
                  </p>

                </div>

              </div>
            );

          })}

        </div>

      </section>


      {/* ============================================
          CTA FINAL
          ============================================ */}

      <section className="cta-banner">

        <div className="cta-content">

          <span className="section-tag">
            Comece agora
          </span>

          <h2>
            Curioso pra ver seus números num lugar só?
          </h2>

          <p>
            Entre com uma conta de teste e explore o painel do Eyesight.
          </p>

          <div className="cta-buttons">

            <Link to="/login" className="btn-primary">
              Entrar na plataforma
              <FiArrowRight />
            </Link>

            <Link to="/cadastro" className="btn-secondary">
              Cadastrar
            </Link>

          </div>

        </div>

      </section>


      {/* ============================================
          EQUIPE DO TCC
          ============================================ */}

      <section id="equipe" className="team">

        <div className="team-header">

          <span className="section-tag">
            Quem construiu o Eyesight
          </span>

          <h2>
            Equipe do projeto
          </h2>

        </div>

        <div className="team-grid">

          {integrantes.map((pessoa) => (
            <div className="team-card" key={pessoa.nome + pessoa.papel}>
              <div className="team-avatar">{iniciaisDoNome(pessoa.nome)}</div>
              <h3>{pessoa.nome}</h3>
              <p>{pessoa.papel}</p>
            </div>
          ))}

        </div>

      </section>


      {/* ============================================
          FOOTER
          ============================================ */}

      <footer className="footer">

        <div className="footer-logo">

          <img src={logo} alt="Eyesight Logo" />

          <span>EYESIGHT</span>

        </div>

        <p>
          Eyesight © 2026
        </p>

        <p className="footer-sub">
          Projeto de Trabalho de Conclusão de Curso
        </p>

      </footer>

    </div>
  );
}

export default Home;