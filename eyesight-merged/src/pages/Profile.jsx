import "../styles/Profile.css";
import { User, Shield, Bell, CreditCard, Edit } from "lucide-react";

function Profile() {
  return (
    <div className="profile-page">

      <div className="profile-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais e preferências da conta</p>
      </div>

      <div className="profile-card">

        <div className="profile-top">

          <div className="profile-user">

            <div className="avatar">
              <span>NU</span>
            </div>

            <div className="user-info">
              <h2>Nome Usuário</h2>
              <p>usuario@email.com</p>

              <div className="badges">
                <span className="badge pro">Pro</span>
                <span className="badge verified">Verificado</span>
              </div>

              <p className="description">
                Gerenciador de campanhas e analytics para e-commerce.
                Especialista em TikTok Shop e Meta Ads.
              </p>
            </div>

          </div>

          <button className="edit-btn">
            <Edit size={16} />
            Editar perfil
          </button>

        </div>

        <div className="profile-stats">

          <div className="stat">
            <h3>4</h3>
            <span>Contas conectadas</span>
          </div>

          <div className="stat">
            <h3>12</h3>
            <span>Campanhas ativas</span>
          </div>

          <div className="stat">
            <h3>87</h3>
            <span>Relatórios gerados</span>
          </div>

          <div className="stat">
            <h3>Jan 2025</h3>
            <span>Membro desde</span>
          </div>

        </div>

      </div>

      <div className="profile-tabs">
        <button className="active">
          <User size={18} />
          Perfil
        </button>

        <button>
          <Shield size={18} />
          Segurança
        </button>

        <button>
          <Bell size={18} />
          Notificações
        </button>

        <button>
          <CreditCard size={18} />
          Plano
        </button>
      </div>

      <div className="profile-content">

        <div className="personal-info">

          <h2>Informações Pessoais</h2>

          <div className="form-grid">

            <div className="input-group">
              <label>Nome completo</label>
              <input type="text" value="Nome Usuário" readOnly />
            </div>

            <div className="input-group">
              <label>E-mail</label>
              <input type="email" value="usuario@email.com" readOnly />
            </div>

            <div className="input-group">
              <label>Telefone</label>
              <input type="text" value="+55 (11) 99999-9999" readOnly />
            </div>

            <div className="input-group">
              <label>Localização</label>
              <input type="text" value="São Paulo, Brasil" readOnly />
            </div>

          </div>

        </div>

        <div className="social-card">

          <h2>Redes Conectadas</h2>

          <div className="social-item">
            <div>
              <strong>TikTok</strong>
              <p>@nomeusuario</p>
            </div>

            <span className="connected">
              Conectado
            </span>
          </div>

          <div className="social-item">
            <div>
              <strong>Instagram</strong>
              <p>@nomeusuario</p>
            </div>

            <span className="connected">
              Conectado
            </span>
          </div>

          <div className="social-item">
            <div>
              <strong>Twitter/X</strong>
              <p>@nomeusuario</p>
            </div>

            <button className="connect-btn">
              Conectar
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;