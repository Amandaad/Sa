CREATE DATABASE IF NOT EXISTS studio_as CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studio_as;

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  servico VARCHAR(120) NOT NULL,
  emoji VARCHAR(16) NOT NULL,
  preco VARCHAR(80) NOT NULL,
  data_exibicao VARCHAR(20) NOT NULL,
  data_chave VARCHAR(40) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  obs TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  google_event_id VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_data_hora (data_chave, hora)
);
