-- =====================================================
-- TASKMASTER WEB - Base de datos MySQL
-- Ejecutar en phpMyAdmin: Importar este archivo
-- Base de datos: taskmaster_db
-- =====================================================

CREATE DATABASE IF NOT EXISTS taskmaster_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskmaster_db;

-- Tabla usuarios (login opcional)
CREATE TABLE IF NOT EXISTS usuarios (
    id             INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(150) NOT NULL,
    email          VARCHAR(200) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    auth_provider  VARCHAR(50)  NOT NULL DEFAULT 'local',
    fecha_creacion TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla categorias (creadas por el usuario; usuario_id NULL = categoria de invitado/compartida)
CREATE TABLE IF NOT EXISTS categorias (
    id             INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(100) NOT NULL,
    color          VARCHAR(7)   NOT NULL DEFAULT '#00C9FF',
    icono          VARCHAR(10)  DEFAULT NULL,
    usuario_id     INT          DEFAULT NULL,
    fecha_creacion TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
    id               INT      NOT NULL AUTO_INCREMENT,
    usuario_id       INT          DEFAULT NULL,
    titulo           VARCHAR(200) NOT NULL,
    descripcion      TEXT         DEFAULT NULL,
    categoria_id     INT          DEFAULT NULL,
    prioridad        ENUM('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
    fecha_limite     DATETIME     DEFAULT NULL,
    completada       TINYINT(1)   NOT NULL DEFAULT 0,
    pomodoros_est    INT          NOT NULL DEFAULT 1,
    pomodoros_real   INT          NOT NULL DEFAULT 0,
    min_anticipacion INT          NOT NULL DEFAULT 30,
    fecha_creacion   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
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
-- DATOS INICIALES (categorias universales de ejemplo, usuario_id NULL)
-- =====================================================

INSERT INTO categorias (nombre, color, icono) VALUES
  ('Estudio',   '#F093FB', '📚'),
  ('Trabajo',   '#00C9FF', '💼'),
  ('Personal',  '#92FE9D', '🌿'),
  ('Salud',     '#F5576C', '❤'),
  ('Finanzas',  '#FFC107', '💰'),
  ('General',   '#7C4DFF', '📌');

-- Tareas de ejemplo
-- categoria_id: 1=Estudio, 2=Trabajo, 3=Personal, 4=Salud, 5=Finanzas, 6=General
INSERT INTO tareas (titulo, descripcion, categoria_id, prioridad, fecha_limite, pomodoros_est) VALUES
  ('Entregar propuesta de proyecto', 'Documento con objetivos y cronograma', 2, 'Alta',
   DATE_ADD(NOW(), INTERVAL 1 DAY), 3),
  ('Pagar servicios del hogar', 'Luz, agua e internet', 6, 'Media',
   DATE_ADD(NOW(), INTERVAL 3 DAY), 1),
  ('Rutina de ejercicio', 'Sesion de 45 minutos', 4, 'Baja',
   DATE_ADD(NOW(), INTERVAL 2 DAY), 1);
