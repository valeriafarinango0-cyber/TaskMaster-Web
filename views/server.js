import express from 'express';
import cors from 'cors';
import { json } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(express.static(path.join(__dirname, '/')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskmaster_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión a MySQL al arrancar
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado correctamente a taskmaster_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
    console.error('Verifica que XAMPP MySQL esté corriendo');
  });

app.get('/api/materias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materias ORDER BY id ASC');
    res.json({ success: true, materias: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error leyendo materias.' });
  }
});

app.get('/api/tareas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color, t.general_categoria
         FROM tareas t
         LEFT JOIN materias m ON t.materia_id = m.id
         ORDER BY t.completada ASC, t.fecha_limite ASC`
    );
    res.json({ success: true, tareas: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error leyendo tareas.' });
  }
});

app.post('/api/tareas', async (req, res) => {
  try {
    const {
      titulo = '', descripcion = '', materia_id = 6,
      prioridad = 'Media', fecha_limite = '', general_categoria = '',
      pomodoros_est = 1, min_anticipacion = 30,
    } = req.body;

    if (!titulo.trim()) {
      return res.status(400).json({ success: false, error: 'El título es obligatorio.' });
    }
    if (!fecha_limite) {
      return res.status(400).json({ success: false, error: 'La fecha límite es obligatoria.' });
    }

    const [result] = await pool.query(
      `INSERT INTO tareas
         (titulo, descripcion, materia_id, prioridad, fecha_limite, general_categoria, pomodoros_est, min_anticipacion, completada, pomodoros_real)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [titulo.trim(), descripcion.trim(), Number(materia_id), prioridad, fecha_limite, general_categoria, Number(pomodoros_est), Number(min_anticipacion)]
    );

    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, tarea: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error creando tarea.' });
  }
});

app.put('/api/tareas', async (req, res) => {
  try {
    const data = req.body;
    const id = Number(data.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

    const allowed = ['titulo','descripcion','materia_id','prioridad','fecha_limite','general_categoria','pomodoros_est','pomodoros_real','completada','min_anticipacion'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (!fields.length) return res.status(400).json({ success: false, error: 'Sin campos para actualizar.' });

    values.push(id);
    const sql = `UPDATE tareas SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, values);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error actualizando tarea.' });
  }
});

app.delete('/api/tareas', async (req, res) => {
  try {
    const id = Number(req.body.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

    await pool.query('DELETE FROM alertas WHERE tarea_id = ?', [id]);
    await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error eliminando tarea.' });
  }
});

app.post('/api/auth', async (req, res) => {
  try {
    const action = req.query.action || req.body.action;
    const { nombre = '', email = '', password = '' } = req.body;

    if (!['login', 'register'].includes(action)) {
      return res.status(405).json({ success: false, error: 'Acción no soportada.' });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    if (action === 'register') {
      if (!nombre.trim() || !email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO auth_users (nombre, email, password_hash) VALUES (?, ?, ?)',
        [nombre.trim(), email.trim(), hash]
      );
      return res.json({ success: true, user_id: result.insertId });
    }

    if (action === 'login') {
      if (!email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
      const [rows] = await pool.query('SELECT id, nombre, password_hash FROM auth_users WHERE email = ? LIMIT 1', [email.trim()]);
      const user = rows[0];
      if (!user) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: email.trim() } });
    }
  } catch (error) {
    console.error('AUTH ERROR:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error en auth: ' + error.message
    });
  }
});

app.post('/api/notify', async (req, res) => {
  try {
    const { email = '', asunto = 'Notificación TaskMaster', mensaje = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido.' });
    }

    // Intento de envío local simple: escribir en archivo de log
    const logMsg = `${new Date().toISOString()} | to:${email} | msg:${mensaje.replace(/\n|\r/g, ' ')}\n`;
    await import('fs').then(fs => fs.promises.appendFile(path.join(__dirname, 'notify.log'), logMsg));
    res.json({ success: true, warning: 'Notificación registrada en el servidor.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error en notificación.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`TaskMaster Node server running on http://localhost:${port}`);
});
