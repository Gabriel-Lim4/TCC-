import "../styles/Accounts.css";

function Accounts() {
  return (
    <div className="dashboard-content">
      <h1>Contas</h1>
      <p className="subtitle">Gerencie todas as suas contas conectadas e adicione novas plataformas</p>

      <h2 style={{ marginTop: "30px" }}>Contas Conectadas</h2>

      <div className="platforms-grid">
        <div className="card">
          <h3>TikTok</h3>
          <p>2 perfis conectados</p>
        </div>

        <div className="card">
          <h3>Instagram</h3>
          <p>1 perfil conectado</p>
        </div>

        <div className="card">
          <h3>Facebook Ads</h3>
          <p>3 campanhas ativas</p>
        </div>

        <div className="card">
          <h3>TikTok Shop</h3>
          <p>5 campanhas ativas</p>
        </div>
      </div>
    </div>
  );
}

export default Accounts;