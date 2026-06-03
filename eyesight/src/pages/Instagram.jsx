/* importando o css da tela */
import "../styles/Instagram.css";

function Instagram() {

    return (

        /* conteúdo principal */
        <div className="dashboard-content">

            {/* titulo da página */}
            <h1>Instagram</h1>

            {/* subtitulo */}
            <p className="subtitle">
                Análise completa do desempenho da sua conta no Instagram
            </p>

            {/* cards principais */}
            <div className="cards-top">

                <div className="card">
                    <p>Seguidores</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Alcance</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Curtidas</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Taxa de Engajamento</p>
                    <h2>0%</h2>
                </div>

            </div>

            <h2 className="section-title">
                Estatísticas de Engajamento
            </h2>

            <div className="cards-top">

                <div className="card">
                    <p>Curtidas</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Comentários</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Salvamentos</p>
                    <h2>0</h2>
                </div>

                <div className="card">
                    <p>Compartilhamentos</p>
                    <h2>0</h2>
                </div>

            </div>

            {/* POSTS RECENTES */}
            <h2 className="section-title">
                Posts Recentes
            </h2>

            <div className="posts-grid">

                <div className="post-card">

                    <div className="post-image">
                        📷
                    </div>

                    <div className="post-info">
                        <span>♡ 0</span>
                        <span>💬 0</span>
                    </div>

                </div>

                <div className="post-card">

                    <div className="post-image">
                        📷
                    </div>

                    <div className="post-info">
                        <span>♡ 0</span>
                        <span>💬 0</span>
                    </div>

                </div>

                <div className="post-card">

                    <div className="post-image">
                        📷
                    </div>

                    <div className="post-info">
                        <span>♡ 0</span>
                        <span>💬 0</span>
                    </div>

                </div>

                <div className="post-card">

                    <div className="post-image">
                        📷
                    </div>

                    <div className="post-info">
                        <span>♡ 0</span>
                        <span>💬 0</span>
                    </div>

                </div>

                

            </div>

            {/* STORIES E REELS */}
            <div className="analytics-grid">

                {/* STORIES */}
                <div className="analytics-card">

                    <h2>Stories</h2>

                    <div className="stats-grid">

                        <div>
                            <p>Publicados (7d)</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Visualizações</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Alcance</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Interações</p>
                            <h1>0</h1>
                        </div>

                    </div>

                </div>

                {/* REELS */}
                <div className="analytics-card">

                    <h2>Reels</h2>

                    <div className="stats-grid">

                        <div>
                            <p>Publicados (30d)</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Visualizações</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Curtidas</p>
                            <h1>0</h1>
                        </div>

                        <div>
                            <p>Compartilhamentos</p>
                            <h1>0</h1>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

/* exportando componente */
export default Instagram;