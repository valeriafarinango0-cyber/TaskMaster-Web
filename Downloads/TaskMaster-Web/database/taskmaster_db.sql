-- =====================================================
-- TASKMASTER WEB - Base de datos MySQL
-- Ejecutar en phpMyAdmin: Importar este archivo
-- Base de datos: taskmaster_db
-- =====================================================

CREATE DATABASE IF NOT EXISTS taskmaster_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskmaster_db;

-- Tabla materias
CREATE TABLE IF NOT EXISTS materias (
    id     INT          NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    color  VARCHAR(7)   NOT NULL DEFAULT '#546E7A',
    bg     VARCHAR(7)   NOT NULL DEFAULT '#ECEFF1',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
    id               INT      NOT NULL AUTO_INCREMENT,
    titulo           VARCHAR(200) NOT NULL,
    descripcion      TEXT         DEFAULT NULL,
    materia_id       INT          DEFAULT 6,
    prioridad        ENUM('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
    fecha_limite     DATETIME     DEFAULT NULL,
    completada       TINYINT(1)   NOT NULL DEFAULT 0,
    pomodoros_est    INT          NOT NULL DEFAULT 1,
    pomodoros_real   INT          NOT NULL DEFAULT 0,
    min_anticipacion INT          NOT NULL DEFAULT 30,
    fecha_creacion   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla alertas
CREATE TABLE IF NOT EXISTS alertas (
    id           INT      NOT NULL AUTO_INCREMENT,
    tarea_id     INT      NOT NULL,
    hora_disparo DATETIME NOT NULL,
    activa       TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO materias (nombre, color, bg) VALUES
  ('Programacion Web',          '#5C6BC0', '#E8EAF6'),
  ('Seguridad Informatica',     '#E91E63', '#FCE4EC'),
  ('Aplicaciones Moviles',      '#FF6F00', '#FFF3E0'),
  ('Gestion de Proyectos',      '#2E7D32', '#E8F5E9'),
  ('Sistemas Cliente-Servidor', '#6A1B9A', '#F3E5F5'),
  ('General',                   '#546E7A', '#ECEFF1');

-- Tareas de ejemplo
INSERT INTO tareas (titulo, descripcion, materia_id, prioridad, fecha_limite, pomodoros_est) VALUES
  ('Entregar informe final', 'Documento con marco teorico y resultados', 1, 'Alta',
   DATE_ADD(NOW(), INTERVAL 1 DAY), 3),
  ('Practica de laboratorio', 'Implementar firewall con iptables', 2, 'Media',
   DATE_ADD(NOW(), INTERVAL 3 DAY), 2),
  ('Leer capitulo 4', 'Flutter avanzado - animaciones', 3, 'Baja',
   DATE_ADD(NOW(), INTERVAL 5 DAY), 1);
