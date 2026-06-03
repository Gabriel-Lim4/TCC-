/* importando o css da tela */
import "../styles/Meta.css";

function Meta() {
  return (
    <div className="dashboard-content">

      {/* TÍTULO */}
      <h1>Meta Ads</h1>
      <p className="subtitle">
        Acompanhe suas campanhas no Facebook e Instagram
      </p>

      {/* CARDS PRINCIPAIS */}
      <div className="cards-top">

        <div className="card">
          <p>Investimento Total</p>
          <h2>R$ 0,00</h2>
        </div>

        <div className="card">
          <p>Alcance</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Conversões</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>ROAS</p>
          <h2>0.00x</h2>
        </div>

      </div>

      {/* MÉTRICAS DE PERFORMANCE */}
      <h2 style={{ marginTop: "30px" }}>
        Métricas de Performance
      </h2>

      <div className="cards-top" style={{ marginTop: "20px" }}>

        <div className="card">
          <p>Impressões</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Cliques</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Frequência</p>
          <h2>0.00</h2>
        </div>

        <div className="card">
          <p>CPM</p>
          <h2>R$ 0,00</h2>
        </div>

      </div>

      {/* Por Plataforma */}
      <h2 style={{ marginTop: "40px" }}>
        Por Plataforma
      </h2>

      <div className="analytics-grid">

        {/* Facebook*/}
        <div className="analytics-card">

          <h2>Facebook</h2>

          <div className="stats-grid">

            <div>
              <p>Gasto</p>
              <h1>R$ 0</h1>
            </div>

            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>

            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>

            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>

          </div>
        </div>

        {/* Instagram */}
        <div className="analytics-card">

          <h2>Instagram</h2>

          <div className="stats-grid">

            <div>
              <p>Gastos</p>
              <h1>R$ 0</h1>
            </div>

            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>

            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>

            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default Meta;