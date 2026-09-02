import { useState } from 'react';
import '../styles/Account.css';
import "../styles/variables.css";
import { FaTiktok, FaYoutube, FaLinkedin } from 'react-icons/fa';
import { FiInstagram, FiFacebook, FiUsers, FiSettings, FiPlus, FiX } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

// mapa central: cada plataforma suportada tem um rótulo, ícone e classe de cor.
// usado tanto pra renderizar os cards quanto pra popular o formulário de "Adicionar conta".
const PLATAFORMAS = {
  tiktok: { label: 'TikTok', iconClass: 'icon-tiktok', icon: <FaTiktok /> },
  instagram: { label: 'Instagram', iconClass: 'icon-instagram', icon: <FiInstagram /> },
  facebook: { label: 'Facebook', iconClass: 'icon-facebook', icon: <FiFacebook /> },
  youtube: { label: 'YouTube', iconClass: 'icon-youtube', icon: <FaYoutube /> },
  linkedin: { label: 'LinkedIn', iconClass: 'icon-linkedin', icon: <FaLinkedin /> },
};

// Card grande — usado para perfis (TikTok, Instagram)
const ProfileCard = ({ name, username, iconClass, icon, onDisconnect }) => {
  return (
    <div className="account-card">
      <div className="card-header-info">
        <div className={`platform-icon ${iconClass}`}>{icon}</div>
        <div className="platform-details">
          <h3>{name}</h3>
          {username && <p className="platform-username">{username}</p>}
        </div>
        <button className="settings-btn" aria-label="Configurações">
          <FiSettings />
        </button>
      </div>

      <div className="card-footer">
        <div className="status-indicator">
          <span className="status-dot" />
          <span className="status-text">Conectado</span>
        </div>
        <button className="disconnect-btn" onClick={onDisconnect}>Desconectar</button>
      </div>
    </div>
  );
};

// Linha compacta — usada para contas de anúncio (TikTok Shop, Facebook Ads)
const AdAccountRow = ({ name, type, iconClass, icon, onDisconnect }) => {
  return (
    <div className="ad-account-row">
      <div className={`platform-icon platform-icon-sm ${iconClass}`}>{icon}</div>
      <div className="ad-account-info">
        <h4>{name}</h4>
        <p>{type}</p>
      </div>
      <div className="status-indicator">
        <span className="status-dot" />
        <span className="status-text">Conectado</span>
      </div>
      <button className="disconnect-btn" onClick={onDisconnect}>Desconectar</button>
    </div>
  );
};

const AvailablePlatformCard = ({ name, iconClass, icon, onConnect }) => {
  return (
    <div className="available-card">
      <div className="available-info">
        <div className={`platform-icon ${iconClass}`}>{icon}</div>
        <h3>{name}</h3>
      </div>
      <button className="connect-btn" onClick={onConnect}>Conectar</button>
    </div>
  );
};

const Account = () => {
  const [perfis, setPerfis] = useState([
    { id: 1, chave: 'tiktok', username: '@usuario_tiktok' },
    { id: 2, chave: 'instagram', username: '@usuario_instagram' },
  ]);

  const [contasAnuncio, setContasAnuncio] = useState([
    { id: 1, chave: 'tiktok', name: 'TikTok Shop', type: 'Loja principal', iconClassOverride: 'icon-tiktok-shop' },
    { id: 2, chave: 'facebook', name: 'Facebook Ads', type: 'Conta de anúncios' },
  ]);

  const [disponiveis, setDisponiveis] = useState(['youtube', 'linkedin']);

  const [modalAberto, setModalAberto] = useState(false);
  const [formPlataforma, setFormPlataforma] = useState('');
  const [formUsername, setFormUsername] = useState('');

  const chavesConectadas = perfis.map((p) => p.chave);
  const opcoesParaAdicionar = Object.keys(PLATAFORMAS).filter(
    (chave) => !chavesConectadas.includes(chave)
  );

  const abrirModal = () => {
    setFormPlataforma(opcoesParaAdicionar[0] || '');
    setFormUsername('');
    setModalAberto(true);
  };

  const fecharModal = () => setModalAberto(false);

  const adicionarConta = (e) => {
    e.preventDefault();
    if (!formPlataforma) return;

    setPerfis((prev) => [
      ...prev,
      {
        id: Date.now(),
        chave: formPlataforma,
        username: formUsername.trim() || `@sua_conta_${formPlataforma}`,
      },
    ]);

    // se a plataforma escolhida estava na lista de "disponíveis", ela sai de lá
    setDisponiveis((prev) => prev.filter((chave) => chave !== formPlataforma));

    setModalAberto(false);
  };

  const desconectarPerfil = (id) => {
    setPerfis((prev) => prev.filter((p) => p.id !== id));
  };

  const desconectarAnuncio = (id) => {
    setContasAnuncio((prev) => prev.filter((c) => c.id !== id));
  };

  const conectarDisponivel = (chave) => {
    setPerfis((prev) => [
      ...prev,
      { id: Date.now(), chave, username: `@sua_conta_${chave}` },
    ]);
    setDisponiveis((prev) => prev.filter((c) => c !== chave));
  };

  const totalConectadas = perfis.length + contasAnuncio.length;

  return (
    <div className="account-container">
      {/* camada decorativa de fundo, na mesma linguagem visual do resto do app */}
      <div className="account-bg-mesh" aria-hidden="true" />

      <header className="account-header">
        <div className="title-section">
          <div className="header-icon-wrapper">
            <FiUsers />
          </div>
          <div className="header-text">
            <span className="account-eyebrow">
              <HiOutlineSparkles /> Central de Contas
            </span>
            <h1>Contas</h1>
            <p>Gerencie todas as suas contas conectadas e adicione novas plataformas</p>
          </div>
        </div>

        <span className="account-count-pill">{totalConectadas} conectadas</span>
      </header>

      {/* Perfis conectados */}
      <section className="account-section">
        <div className="section-header">
          <h2>Perfis conectados</h2>
          <button className="add-account-btn" onClick={abrirModal}>
            <FiPlus /> Adicionar conta
          </button>
        </div>

        {perfis.length > 0 ? (
          <div className="cards-grid">
            {perfis.map((perfil) => {
              const info = PLATAFORMAS[perfil.chave];
              return (
                <ProfileCard
                  key={perfil.id}
                  name={info.label}
                  username={perfil.username}
                  iconClass={info.iconClass}
                  icon={info.icon}
                  onDisconnect={() => desconectarPerfil(perfil.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="account-empty">
            <p>Nenhum perfil conectado ainda.</p>
            <button className="add-account-btn" onClick={abrirModal}>
              <FiPlus /> Adicionar conta
            </button>
          </div>
        )}
      </section>

      {/* Contas de anúncio — lista compacta, não são perfis */}
      <section className="account-section">
        <div className="section-header">
          <h2>Contas de anúncio</h2>
        </div>

        {contasAnuncio.length > 0 ? (
          <div className="ad-accounts-list">
            {contasAnuncio.map((conta) => {
              const info = PLATAFORMAS[conta.chave];
              return (
                <AdAccountRow
                  key={conta.id}
                  name={conta.name}
                  type={conta.type}
                  iconClass={conta.iconClassOverride || info.iconClass}
                  icon={info.icon}
                  onDisconnect={() => desconectarAnuncio(conta.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="account-empty">
            <p>Nenhuma conta de anúncio conectada.</p>
          </div>
        )}
      </section>

      {/* Plataformas disponíveis */}
      <section className="account-section">
        <div className="section-header">
          <h2>Plataformas disponíveis</h2>
        </div>

        {disponiveis.length > 0 ? (
          <div className="cards-grid">
            {disponiveis.map((chave) => {
              const info = PLATAFORMAS[chave];
              return (
                <AvailablePlatformCard
                  key={chave}
                  name={info.label}
                  iconClass={info.iconClass}
                  icon={info.icon}
                  onConnect={() => conectarDisponivel(chave)}
                />
              );
            })}
          </div>
        ) : (
          <div className="account-empty">
            <p>Todas as plataformas suportadas já estão conectadas.</p>
          </div>
        )}
      </section>

      {/* Modal: Adicionar conta */}
      {modalAberto && (
        <div className="account-modal-overlay" onClick={fecharModal}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <h3>Adicionar conta</h3>
              <button className="account-modal-close" onClick={fecharModal} aria-label="Fechar">
                <FiX />
              </button>
            </div>

            {opcoesParaAdicionar.length > 0 ? (
              <form onSubmit={adicionarConta}>
                <div className="account-modal-field">
                  <label>Plataforma</label>
                  <select
                    value={formPlataforma}
                    onChange={(e) => setFormPlataforma(e.target.value)}
                  >
                    {opcoesParaAdicionar.map((chave) => (
                      <option key={chave} value={chave}>
                        {PLATAFORMAS[chave].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="account-modal-field">
                  <label>Usuário / identificador</label>
                  <input
                    type="text"
                    placeholder="@seu_usuario"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />
                </div>

                <div className="account-modal-actions">
                  <button type="button" className="account-modal-cancel" onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="account-modal-submit">
                    <FiPlus /> Conectar plataforma
                  </button>
                </div>
              </form>
            ) : (
              <p className="account-modal-empty">
                Todas as plataformas suportadas já estão conectadas a esta conta.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;