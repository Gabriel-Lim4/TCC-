import React from 'react';
import '../styles/Account.css';

// Componente para renderizar cada card de plataforma conectada
const AccountCard = ({ name, type, username, isConnected, iconClass }) => {
  return (
    <div className="account-card">
      <div className="card-header-info">
        <div className={`platform-icon ${iconClass}`}>
          <span className="icon-placeholder"></span>
        </div>
        <div className="platform-details">
          <h3>{name}</h3>
          {type && <p className="platform-type">{type}</p>}
          {username && <p className="platform-username">{username}</p>}
        </div>
        <button className="settings-btn" aria-label="Configurações">
          ⚙️
        </button>
      </div>
      
      <div className="card-footer">
        <div className="status-indicator">
          <span className="status-dot">✓</span>
          <span className="status-text">{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>
        <button className="disconnect-btn">Desconectar</button>
      </div>
    </div>
  );
};

// Componente para renderizar as plataformas disponíveis para conexão
const AvailablePlatformCard = ({ name, iconClass }) => {
  return (
    <div className="available-card">
      <div className="available-info">
        <div className={`platform-icon ${iconClass}`}>
          <span className="icon-placeholder"></span>
        </div>
        <h3>{name}</h3>
      </div>
      <button className="connect-btn">Conectar</button>
    </div>
  );
};

const Account = () => {
  return (
    <div className="account-container">
      {/* Cabeçalho Principal */}
      <header className="account-header">
        <div className="title-section">
          <div className="header-icon-wrapper">
            👥
          </div>
          <div className="header-text">
            <h1>Contas</h1>
            <p>Gerencie todas as suas contas conectadas e adicione novas plataformas</p>
          </div>
        </div>
      </header>

      {/* Seção: Contas Conectadas */}
      <section className="account-section">
        <div className="section-header">
          <h2>Contas Conectadas</h2>
          <button className="add-account-btn">+ Adicionar Conta</button>
        </div>

        <div className="cards-grid">
          <AccountCard 
            name="TikTok" 
            username="@usuario_tiktok" 
            isConnected={true} 
            iconClass="icon-tiktok" 
          />
          <AccountCard 
            name="TikTok Shop" 
            type="Loja Principal" 
            isConnected={true} 
            iconClass="icon-tiktok-shop" 
          />
          <AccountCard 
            name="Instagram" 
            username="@usuario_instagram" 
            isConnected={true} 
            iconClass="icon-instagram" 
          />
          <AccountCard 
            name="Facebook Ads" 
            type="Conta de Anúncios" 
            isConnected={true} 
            iconClass="icon-facebook" 
          />
        </div>
      </section>

      {/* Seção: Plataformas Disponíveis */}
      <section className="account-section">
        <div className="section-header">
          <h2>Plataformas Disponíveis</h2>
        </div>

        <div className="cards-grid">
          <AvailablePlatformCard name="YouTube" iconClass="icon-youtube" />
          <AvailablePlatformCard name="LinkedIn" iconClass="icon-linkedin" />
        </div>
      </section>
    </div>
  );
};

export default Account;