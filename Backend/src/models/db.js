/*
CREATE DATABASE eyesight;
USE eyesight;

-- ============================================
-- TABELA: usuarios
-- ============================================

banco eyesight MYSQL.txt
4 KB

CREATE DATABASE eyesight;
USE eyesight;

-- ============================================
-- TABELA: usuarios
-- ============================================
CREATE TABLE usuarios (
    pk_id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario        VARCHAR(100) NOT NULL,
    email_usuario       VARCHAR(150) NOT NULL UNIQUE,
    senha_hash          VARCHAR(255) NOT NULL,
    data_criacao_user   DATETIME DEFAULT NOW()
);

-- ============================================
-- TABELA: contas_vinculadas
-- ============================================
CREATE TABLE contas_vinculadas (
    pk_id_conta     INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_usuario   INT NOT NULL,
    plataforma      VARCHAR(20) NOT NULL,
    acess_token     TEXT NOT NULL,
    account_id      VARCHAR(100) NOT NULL,
    vinculado_em    DATETIME DEFAULT NOW(),

    FOREIGN KEY (fk_id_usuario) REFERENCES usuarios(pk_id_usuario)
        ON DELETE CASCADE
);

-- ============================================
-- TABELA: campanhas
-- ============================================
CREATE TABLE campanhas (
    pk_id_campanha      INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_conta         INT NOT NULL,
    id_externo          VARCHAR(100) NOT NULL,
    nome_campanha       VARCHAR(200) NOT NULL,
    status_campanha     VARCHAR(20),
    objetivo            VARCHAR(50),
    sincronizado_em     DATETIME DEFAULT NOW(),

    FOREIGN KEY (fk_id_conta) REFERENCES contas_vinculadas(pk_id_conta)
        ON DELETE CASCADE
);

-- ============================================
-- TABELA: metricas
-- ============================================
CREATE TABLE metricas (
    pk_id_metrica   INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_campanha  INT NOT NULL,
    tipo_metrica    VARCHAR(30) NOT NULL,
    valor_metrica   DECIMAL(15, 4) NOT NULL,
    periodo_metrica VARCHAR(50) NOT NULL,
    coletado_em     DATETIME DEFAULT NOW(),

    FOREIGN KEY (fk_id_campanha) REFERENCES campanhas(pk_id_campanha)
        ON DELETE CASCADE
);

-- ============================================
-- TABELA: analises_ia
-- ============================================
CREATE TABLE analises_ia (
    pk_id_analise       INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_usuario       INT NOT NULL,
    fk_id_campanha      INT NOT NULL,
    texto_analise       TEXT NOT NULL,
    sugestao_analise    TEXT NOT NULL,
    data_geracao_analise DATETIME DEFAULT NOW(),

    FOREIGN KEY (fk_id_usuario) REFERENCES usuarios(pk_id_usuario)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_id_campanha) REFERENCES campanhas(pk_id_campanha)
        ON DELETE CASCADE
);

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX idx_contas_usuario    ON contas_vinculadas(fk_id_usuario);
CREATE INDEX idx_campanhas_conta   ON campanhas(fk_id_conta);
CREATE INDEX idx_metricas_campanha ON metricas(fk_id_campanha);
CREATE INDEX idx_analises_usuario  ON analises_ia(fk_id_usuario);
CREATE INDEX idx_analises_campanha ON analises_ia(fk_id_campanha);
banco eyesight MYSQL.txt
4 KB */