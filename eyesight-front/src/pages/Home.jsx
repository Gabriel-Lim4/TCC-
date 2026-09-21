import { useState, useEffect } from "react";
import "../styles/Home.css";
import "../styles/variables.css";
import logo from "../assets/logo.svg";
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
} from "react-icons/fi";
import { SiGoogleads } from "react-icons/si";
import { MdAndroid } from "react-icons/md";

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

const problemas = ["Instagram", "Meta Ads", "Google Ads", "Planilhas", "Relatórios separados"];

const solucoes = [
  "Todas as plataformas conectadas",
  "Informações em um único painel",
  "Comparação rápida entre campanhas",
  "Assistente para apoiar análises",
];

function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home">
      {/* Navbar */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="logo">
          <img src={logo} alt="Eyesight Logo" />
          EYESIGHT
        </div>

        <div className={`nav-links${menuOpen ? " open" : ""}`}>
          <a href="#" onClick={closeMenu}>Home</a>
          <a href="#sobre" onClick={closeMenu}>Sobre</a>
          <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
          <a href="#demo" onClick={closeMenu}>Demonstração</a>
          <a href="#funcionalidades" onClick={closeMenu}>Recursos</a>
        </div>

        <div className="nav-buttons">
          <Link to="/login">
            <button className="btn-login">Entrar</button>
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

      {/* Hero */}
      <section className="hero">
        <span className="section-tag">
          Plataforma para análise de campanhas digitais
        </span>

        <h1>
          Acompanhe todas as suas campanhas
          <br />
          <span>em um único painel</span>
        </h1>

        <p>
          O Eyesight reúne métricas de diferentes plataformas de anúncios em um único ambiente.
          Assim, fica mais fácil acompanhar resultados, comparar desempenho e tomar decisões
          com base em dados.
        </p>

        <div className="hero-buttons">
          <Link to="/login" className="btn-register">
            Entrar na plataforma
          </Link>

          <button className="btn-demo">Conhecer o sistema</button>
        </div>

        <div className="hero-trust">
          <span>Dados direto de:</span>
          <div className="hero-trust-icons">
            <SiGoogleads title="Google Ads" />
            <FiFacebook title="Meta Ads" />
            <FaTiktok title="TikTok" />
            <FaInstagram title="Instagram" />
          </div>
        </div>

        <div className="hero-scroll-cue" aria-hidden="true">
          <span />
        </div>
      </section>

      {/* Como é hoje x Solução */}
      <section className="comparison">
        <div className="comparison-header">
          <span className="section-tag">Por que escolher o Eyesight?</span>
        </div>

        <div className="comparison-row">
          <div className="comparison-card">
            <h3>Como é hoje</h3>
            <ul>
              {problemas.map((item) => (
                <li key={item}>
                  <FiXCircle /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="comparison-arrow" aria-hidden="true">
            →
          </div>

          <div className="comparison-card solution">
            <h3>Com Eyesight</h3>
            <ul>
              {solucoes.map((item) => (
                <li key={item}>
                  <FiCheckCircle /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="personas">
        <div className="personas-header">
          <span className="section-tag">Para quem é</span>
          <h2>Feito pra quem lida com número de campanha todo dia</h2>
        </div>

        <div className="personas-grid">
          <div className="persona-card viewfinder">
            <div className="persona-icon">
              <FiUsers />
            </div>
            <h3>Agências pequenas</h3>
            <p>
              Centralize o relatório de cada cliente sem abrir cinco abas
              diferentes toda manhã.
            </p>
          </div>

          <div className="persona-card viewfinder">
            <div className="persona-icon">
              <FiUserCheck />
            </div>
            <h3>Freelancers de tráfego</h3>
            <p>
              Mostre resultado pro cliente sem precisar montar planilha na
              mão antes da reunião.
            </p>
          </div>

          <div className="persona-card viewfinder">
            <div className="persona-icon">
              <FiShoppingBag />
            </div>
            <h3>Lojas online</h3>
            <p>
              Veja se o investimento em anúncio está voltando em venda, não
              só em clique.
            </p>
          </div>
        </div>
      </section>

      {/* Demonstração */}
      <section id="demo" className="demo">
        <span className="section-tag">O sistema por dentro</span>
        <h2>Veja o Eyesight em ação</h2>

        <p>
          Visualize métricas de diferentes plataformas em um único painel e
          receba análises inteligentes em tempo real.
        </p>

        <div className="dashboard-preview viewfinder viewfinder--active">
          <div className="preview-bar">
            <div className="preview-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="preview-url">app.eyesight.com/dashboard</span>
          </div>

          <div className="preview-body">
            <div className="preview-stats">
              <div className="preview-stat">
                <span className="preview-stat-label">Alcance total</span>
                <strong>54.2K</strong>
                <em>+18%</em>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">Engajamento</span>
                <strong>7.8%</strong>
                <em>+8%</em>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">ROI médio</span>
                <strong>3.4x</strong>
                <em>+22%</em>
              </div>
            </div>

            <div className="preview-chart">
              {[38, 55, 46, 68, 80, 72, 95].map((h, i) => (
                <div
                  key={i}
                  className="preview-bar-col"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="how-it-works">
        <div className="how-it-works-header">
          <span className="section-tag">Como funciona</span>
          <h2>Do login ao insight, em três passos</h2>
        </div>

        <div className="steps-row">
          <div className="step-card viewfinder">
            <div className="step-number">
              <FiLink />
            </div>
            <h3>Conectar contas</h3>
            <p>Google Ads, Meta Ads, TikTok e Instagram, num login só.</p>
          </div>

          <div className="step-card viewfinder">
            <div className="step-number">02</div>
            <h3>Ver tudo junto</h3>
            <p>
              As métricas chegam organizadas no painel, sem precisar
              exportar nada.
            </p>
          </div>

          <div className="step-card viewfinder">
            <div className="step-number">03</div>
            <h3>Entender o que fazer</h3>
            <p>
              O assistente aponta o que está funcionando e o que vale
              pausar.
            </p>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="about">
        <div className="about-text">
          <span className="section-tag">Sobre o Eyesight</span>

          <h2>Um painel só, pros dados que hoje vivem espalhados</h2>

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
            <p>Plataformas Integradas</p>
          </div>

          <div className="stat-card">
            <MdAndroid className="stat-icon" />
            <h3>IA</h3>
            <p>Assistente Inteligente</p>
          </div>

          <div className="stat-card">
            <FiClock className="stat-icon" />
            <h3>24h</h3>
            <p>Métricas Centralizadas</p>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="funcionalidades" className="features">
        <div className="features-header">
          <span className="section-tag">Recursos</span>
          <h2>Tudo o que você precisa para acompanhar seus resultados</h2>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <SiGoogleads />
          </div>
          <h3>Google Ads</h3>
          <p>
            Acompanhe campanhas, conversões, investimento e retorno sobre
            anúncios.
          </p>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <FiFacebook />
          </div>
          <h3>Meta Ads</h3>
          <p>
            Visualize campanhas do Facebook e Instagram em um único painel.
          </p>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <FaTiktok />
          </div>
          <h3>TikTok & TikTok Shop</h3>
          <p>Analise desempenho de vídeos, campanhas e vendas.</p>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <MdAndroid />
          </div>
          <h3>Assistente Inteligente</h3>
          <p>Receba recomendações baseadas nos dados das campanhas.</p>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <FiFileText />
          </div>
          <h3>Relatórios automáticos</h3>
          <p>Exporte um resumo do período sem montar apresentação do zero.</p>
        </div>

        <div className="feature-card viewfinder">
          <div className="feature-icon">
            <FiBell />
          </div>
          <h3>Alertas personalizados</h3>
          <p>
            Receba um aviso quando uma campanha sair da meta que você
            definiu.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="faq-header">
          <span className="section-tag">Perguntas frequentes</span>
          <h2>Ainda com dúvida?</h2>
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
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  {item.question}
                  <FiPlus />
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="cta-banner viewfinder">
        <h2>Curioso pra ver seus números num lugar só?</h2>
        <p>Entre com uma conta de teste e explore o painel do Eyesight.</p>

        <div className="hero-buttons">
          <Link to="/login" className="btn-register">
            Entrar na plataforma
          </Link>
          <a href="#demo" className="btn-demo">
            Ver demonstração
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>Eyesight © 2026</p>
        <p className="footer-sub">Projeto de Trabalho de Conclusão de Curso</p>
      </footer>
    </div>
  );
}

export default Home;