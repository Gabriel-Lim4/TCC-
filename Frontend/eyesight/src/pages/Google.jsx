/* importando o css da tela */
import "../styles/Google.css";

function Google() {
  return (

    /* conteúdo principal */
    <div className="dashboard-content">

      {/* titulo da página */}
      <h1>Google Ads</h1>

      {/* subtitulo da tela */}
      <p className="subtitle">Gerencie e acompanhe suas campanhas do Google Ads</p>

      {/* cards principais */}
      <div className="cards-top">
        <div className="card">
          <p>Investimento Total</p>
          {/* total de seguidores */}
          <h2>R$ 0,00</h2>
        </div>

        <div className="card">
          <p>Cliques</p>
          {/* visualizações dos vídeos */}
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Conversões</p>
          {/* curtidas totais */}
          <h2>0</h2>
        </div>

        <div className="card">
          <p>ROAS</p>
          {/* porcentagem de engajamento */}
          <h2>0.00x</h2>
        </div>

      </div>

      {/* titulo da segunda seção */}
      <h2 style={{ marginTop: "30px" }}>
        Métricas de Performance
      </h2>

      {/* cards secundários */}
      <div className="cards-top" style={{ marginTop: "20px" }}>

        <div className="card">
          <p>Impressões</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>CTR</p>
          <h2>0%</h2>
        </div>

        <div className="card">
          <p>CPC Médio</p>
          <h2>R$ 0,00</h2>
        </div>

               <div className="card">
          <p>CPA</p>
          <h2>R$ 0,00</h2>
        </div>


      </div>

      {/* Campanhas Ativas */}
<h2 style={{ marginTop: "20px" }}>Campanhas Ativas</h2>

<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Nome da Campanha</th>
        <th>Status</th>
        <th>Orçamento</th>
        <th>Gasto</th>
        <th>Cliques</th>
        <th>Conversões</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Campanha de Vendas - Produto A</td>
        <td><span className="status active">Ativa</span></td>
        <td>R$ 0/dia</td>
        <td>R$ 0</td>
        <td>0</td>
        <td>0</td>
      </tr>

      <tr>
        <td>Campanha de Awareness - Marca</td>
        <td><span className="status active">Ativa</span></td>
        <td>R$ 0/dia</td>
        <td>R$ 0</td>
        <td>0</td>
        <td>0</td>
      </tr>

      <tr>
        <td>Campanha de Remarketing</td>
        <td><span className="status paused">Pausada</span></td>
        <td>R$ 0/dia</td>
        <td>R$ 0</td>
        <td>0</td>
        <td>0</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 style={{ marginTop: "30px" }}>Por Tipo de Campanha</h2>

<div className="cards-top">
  
  <div className="card type">
    <h3>Search</h3>
    <p>Gasto</p>
    <h2>R$ 0</h2>
    <p>Cliques: 0</p>
  </div>

  <div className="card type">
    <h3>Display</h3>
    <p>Gasto</p>
    <h2>R$ 0</h2>
    <p>Impressões: 0</p>
  </div>

  <div className="card type">
    <h3>Shopping</h3>
    <p>Gasto</p>
    <h2>R$ 0</h2>
    <p>Vendas: 0</p>
  </div>

</div>

    </div>
  );
}

/* exportando o componente */
export default Google;