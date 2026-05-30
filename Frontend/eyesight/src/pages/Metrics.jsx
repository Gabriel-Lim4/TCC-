/* importando o css da tela */
import "../styles/Metrics.css";

function Metrics() {
    return (

        /* conteúdo principal */
        <div className="dashboard-content">

            {/* titulo da página */}
            <h1>Métricas</h1>

            {/* subtitulo da tela */}
            <p className="subtitle">Visão unificada de todas as suas métricas de performance</p>

            {/* cards principais */}
            <div className="metrics-grid">

                <div className="card">
                    <p>Receita Total</p>

                    {/* total de seguidores */}
                    <h2>R$ 0</h2>
                </div>

                <div className="card">
                    <p>Audiência Total</p>

                    {/* visualizações dos vídeos */}
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Engajamento</p>

                    {/* curtidas totais */}
                    <h2>0%</h2>
                </div>

                <div className="card">
                    <p>Conversões</p>

                    {/* porcentagem de engajamento */}
                    <h2>0</h2>
                </div>

            </div>

            {/* titulo da segunda seção */}
            <h2 style={{ marginTop: "30px" }}>
                Métricas de Receita
            </h2>

            {/* cards secundários */}
            <div className="metrics-grid" style={{ marginTop: "20px" }}>

                <div className="card">
                    <p>Receita Total</p>
                    <h2>R$ 0,00</h2>
                </div>

                <div className="card">
                    <p>Ticket Médio</p>
                    <h2>R$ 0,00</h2>
                </div>

                <div className="card">
                    <p>LTV</p>
                    <h2>R$ 0,00</h2>
                </div>

                <div className="card">
                    <p>ROI Geral</p>
                    <h2>0%</h2>
                </div>

            </div>

            {/* titulo da segunda seção */}
            <h2 style={{ marginTop: "30px" }}>
                Métricas de Audiência
            </h2>

            {/* cards 3 */}
            <div className="metrics-grid" style={{ marginTop: "20px" }}>

                <div className="card">
                    <p>Total de Seguidores</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Alcance Total</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Impressões</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Crescimento</p>
                    <h2>+0%</h2>
                </div>

            </div>

            {/* titulo da segunda seção */}
            <h2 style={{ marginTop: "30px" }}>
                Métricas de Engajamento
            </h2>

            {/* cards 3 */}
            <div className="metrics-grid" style={{ marginTop: "20px" }}>

                <div className="card">
                    <p>Taxa de Engajamento</p>
                    <h2>0%</h2>
                </div>

                <div className="card">
                    <p>Curtidas Totais</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Comentários</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Compartilhamentos</p>
                    <h2>0</h2>
                </div>

            </div>

            {/* titulo da segunda seção */}
            <h2 style={{ marginTop: "30px" }}>
                Métricas de Conversão
            </h2>

            {/* cards 3 */}
            <div className="metrics-grid" style={{ marginTop: "20px" }}>

                <div className="card">
                    <p>Taxa de Conversão</p>
                    <h2>0%</h2>
                </div>

                <div className="card">
                    <p>Cliques</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>CTR</p>
                    <h2>0%</h2>
                </div>

                <div className="card">
                    <p>Conversões</p>
                    <h2>0</h2>
                </div>

            </div>

            {/* Campanhas Ativas */}
            <h2 style={{ marginTop: "20px" }}>Comparação por Plataforma</h2>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Plataforma</th>
                            <th>Seguidores</th>
                            <th>Engajamento</th>
                            <th>Receita</th>
                            <th>ROI</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>TikTok</td>
                            <td>0</td>
                            <td>0%</td>
                            <td>R$ 0,00</td>
                            <td>0%</td>
                        </tr>

                        <tr>
                            <td>TikTok Shop</td>
                            <td>0</td>
                            <td>0%</td>
                            <td>R$ 0,00</td>
                            <td>0%</td>
                        </tr>

                        <tr>
                            <td>Instagram</td>
                            <td>0</td>
                            <td>0%</td>
                            <td>R$ 0,00</td>
                            <td>0%</td>
                        </tr>

                        <tr>
                            <td>Google Ads</td>
                            <td>0</td>
                            <td>0%</td>
                            <td>R$ 0,00</td>
                            <td>0%</td>
                        </tr>

                        <tr>
                            <td>Meta Ads</td>
                            <td>0</td>
                            <td>0%</td>
                            <td>R$ 0,00</td>
                            <td>0%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
}

/* exportando o componente */
export default Metrics;