/* importando o css da tela */
import "../styles/Tiktok.css";

function TikTok() {
  return (

    /* conteúdo principal */
    <div className="dashboard-content">

      {/* titulo da página */}
      <h1>TikTok</h1>

      {/* subtitulo da tela */}
      <p className="subtitle">Acompanhe o desempenho dos seus perfis e vídeos no TikTok</p>

      {/* cards principais */}
      <div className="cards-top">

        <div className="card">
          <p>Seguidores</p>

          {/* total de seguidores */}
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Visualizações</p>

          {/* visualizações dos vídeos */}
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Curtidas</p>

          {/* curtidas totais */}
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Taxa de Engajamento</p>

          {/* porcentagem de engajamento */}
          <h2>0%</h2>
        </div>

      </div>

      {/* titulo da segunda seção */}
      <h2 style={{ marginTop: "30px" }}>
        Detalhamento de Engajamento
      </h2>

      {/* cards secundários */}
      <div className="cards-top" style={{ marginTop: "20px" }}>

        <div className="card">
          <p>Curtidas Totais</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Comentários Totais</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Compartilhamentos</p>
          <h2>0</h2>
        </div>

      </div>

    </div>
  );
}

/* exportando o componente */
export default TikTok;