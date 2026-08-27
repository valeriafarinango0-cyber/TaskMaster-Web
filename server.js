import express from 'express';
import cors from 'cors';
import { json } from 'express';
<<<<<<< HEAD
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
=======
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(express.static(path.join(__dirname, '/')));

<<<<<<< HEAD
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
=======
const serviceAccountPath = path.resolve(
  __dirname,
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} catch (err) {
  console.error('❌ No se pudo leer la credencial de Firebase en:', serviceAccountPath);
  console.error('   Descarga tu clave de servicio desde Firebase Console → Configuración del proyecto → Cuentas de servicio,');
  console.error('   guárdala en la ruta anterior (o define FIREBASE_SERVICE_ACCOUNT_PATH en un archivo .env) y vuelve a iniciar el servidor.');
  console.error('   Detalle:', err.message);
  process.exit(1);
}

let firebaseApp;
try {
  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
} catch (err) {
  console.error('❌ La credencial de Firebase en', serviceAccountPath, 'no es válida.');
  console.error('   Verifica que el archivo JSON descargado de Firebase no haya sido modificado.');
  console.error('   Detalle:', err.message);
  process.exit(1);
}

const db = getFirestore(firebaseApp);

// Verificar conexión a Firebase al arrancar
db.collection('_healthcheck').limit(1).get()
  .then(() => {
    console.log('✅ Firebase Firestore conectado correctamente');
  })
  .catch(err => {
    console.error('❌ Error conectando a Firestore:', err.message);
    console.error('Verifica el archivo de credenciales de Firebase (serviceAccountKey.json)');
  });

// ── Utilidades Firestore ────────────────────────────────────────────────────

async function nextId(collectionName) {
  const counterRef = db.collection('_counters').doc(collectionName);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const next = (doc.exists ? doc.data().value : 0) + 1;
    tx.set(counterRef, { value: next });
    return next;
  });
}

async function ensureSeed(collectionName, seedRows) {
  const snap = await db.collection(collectionName).limit(1).get();
  if (!snap.empty) return;
  const batch = db.batch();
  for (const row of seedRows) {
    batch.set(db.collection(collectionName).doc(String(row.id)), row);
  }
  await batch.commit();
  const maxId = Math.max(...seedRows.map(r => r.id));
  await db.collection('_counters').doc(collectionName).set({ value: maxId });
}

const MATERIAS_SEED = [
  { id: 1, nombre: 'Trabajo',  color: '#4F8EF7', bg: '#E8EAF6' },
  { id: 2, nombre: 'Personal', color: '#F7C34F', bg: '#FFF8E1' },
  { id: 3, nombre: 'Salud',    color: '#4FD18A', bg: '#E8F5E9' },
  { id: 4, nombre: 'Hogar',    color: '#F7934F', bg: '#FFF3E0' },
  { id: 5, nombre: 'Estudio',  color: '#A04FF7', bg: '#F3E5F5' },
  { id: 6, nombre: 'Urgente',  color: '#F74F4F', bg: '#FFEBEE' },
  { id: 7, nombre: 'Ideas',    color: '#4FF7F0', bg: '#E0F7FA' },
];

const CATEGORIAS_SEED = [
  { id: 1, nombre: 'Personal' },
  { id: 2, nombre: 'Academico' },
  { id: 3, nombre: 'Trabajo' },
];

ensureSeed('materias', MATERIAS_SEED).catch(err => console.error('Error sembrando materias:', err.message));
ensureSeed('categorias', CATEGORIAS_SEED).catch(err => console.error('Error sembrando categorías:', err.message));

// ── Materias ─────────────────────────────────────────────────────────────

app.get('/api/materias', async (req, res) => {
  try {
    const snap = await db.collection('materias').get();
    const materias = snap.docs.map(d => d.data()).sort((a, b) => a.id - b.id);
    res.json({ success: true, materias });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error leyendo materias.' });
  }
});

<<<<<<< HEAD
app.get('/api/tareas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color, t.general_categoria
         FROM tareas t
         LEFT JOIN materias m ON t.materia_id = m.id
         ORDER BY t.completada ASC, t.fecha_limite ASC`
    );
    res.json({ success: true, tareas: rows });
=======
// ── Categorías ───────────────────────────────────────────────────────────

app.get('/api/categorias', async (req, res) => {
  try {
    const snap = await db.collection('categorias').get();
    const categorias = snap.docs.map(d => d.data()).sort((a, b) => a.id - b.id);
    res.json({ success: true, categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error leyendo categorías.' });
  }
});

// ── Tareas ───────────────────────────────────────────────────────────────

app.get('/api/tareas', async (req, res) => {
  try {
    const [tareasSnap, materiasSnap] = await Promise.all([
      db.collection('tareas').get(),
      db.collection('materias').get(),
    ]);

    const materiasMap = {};
    materiasSnap.docs.forEach(d => {
      const m = d.data();
      materiasMap[m.id] = m;
    });

    // Filtrar por usuario cuando el cliente lo indica; las tareas antiguas
    // (usuario_id null, creadas antes del soporte multiusuario) siguen visibles
    const usuarioId = req.query.usuario_id ? Number(req.query.usuario_id) : null;

    const tareas = tareasSnap.docs
      .map(d => {
        const t = d.data();
        const m = materiasMap[t.materia_id];
        return {
          ...t,
          materia_nombre: m ? m.nombre : null,
          materia_color: m ? m.color : null,
        };
      })
      .filter(t => usuarioId === null || t.usuario_id == null || t.usuario_id === usuarioId)
      .sort((a, b) => {
        if (a.completada !== b.completada) return a.completada - b.completada;
        return new Date(a.fecha_limite) - new Date(b.fecha_limite);
      });

    res.json({ success: true, tareas });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error leyendo tareas.' });
  }
});

app.post('/api/tareas', async (req, res) => {
  try {
    const {
      titulo = '', descripcion = '', materia_id = 6,
      prioridad = 'Media', fecha_limite = '', general_categoria = '',
<<<<<<< HEAD
      pomodoros_est = 1, min_anticipacion = 30,
=======
      pomodoros_est = 1, min_anticipacion = 30, usuario_id = null,
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    } = req.body;

    if (!titulo.trim()) {
      return res.status(400).json({ success: false, error: 'El título es obligatorio.' });
    }
    if (!fecha_limite) {
      return res.status(400).json({ success: false, error: 'La fecha límite es obligatoria.' });
    }

<<<<<<< HEAD
    const [result] = await pool.query(
      `INSERT INTO tareas
         (titulo, descripcion, materia_id, prioridad, fecha_limite, general_categoria, pomodoros_est, min_anticipacion, completada, pomodoros_real)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [titulo.trim(), descripcion.trim(), Number(materia_id), prioridad, fecha_limite, general_categoria, Number(pomodoros_est), Number(min_anticipacion)]
    );

    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, tarea: rows[0] });
=======
    const id = await nextId('tareas');
    const tarea = {
      id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materia_id: Number(materia_id),
      categoria_id: null,
      subcategoria: null,
      general_categoria,
      prioridad,
      fecha_limite,
      completada: 0,
      pomodoros_est: Number(pomodoros_est),
      pomodoros_real: 0,
      min_anticipacion: Number(min_anticipacion),
      aviso_enviado: 0,
      nota: null,
      usuario_id: usuario_id != null ? Number(usuario_id) : null,
      fecha_creacion: new Date().toISOString(),
    };

    await db.collection('tareas').doc(String(id)).set(tarea);
    res.status(201).json({ success: true, tarea });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error creando tarea.' });
  }
});

app.put('/api/tareas', async (req, res) => {
  try {
    const data = req.body;
    const id = Number(data.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

<<<<<<< HEAD
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
=======
    const allowed = ['titulo', 'descripcion', 'materia_id', 'prioridad', 'fecha_limite', 'general_categoria', 'pomodoros_est', 'pomodoros_real', 'completada', 'min_anticipacion'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        updates[key] = data[key];
      }
    }

    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: 'Sin campos para actualizar.' });

    const ref = db.collection('tareas').doc(String(id));
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada.' });
    }

    await ref.update(updates);
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error actualizando tarea.' });
  }
});

app.delete('/api/tareas', async (req, res) => {
  try {
    const id = Number(req.body.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

<<<<<<< HEAD
    await pool.query('DELETE FROM alertas WHERE tarea_id = ?', [id]);
    await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
=======
    await db.collection('tareas').doc(String(id)).delete();

    const alertasSnap = await db.collection('alertas').where('tarea_id', '==', id).get();
    if (!alertasSnap.empty) {
      const batch = db.batch();
      alertasSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error eliminando tarea.' });
  }
});

<<<<<<< HEAD
=======
// ── Auth ─────────────────────────────────────────────────────────────────

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
app.post('/api/auth', async (req, res) => {
  try {
    const action = req.query.action || req.body.action;
    const { nombre = '', email = '', password = '' } = req.body;

<<<<<<< HEAD
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

=======
    if (!['login', 'register', 'google'].includes(action)) {
      return res.status(405).json({ success: false, error: 'Acción no soportada.' });
    }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    if (action === 'register') {
      if (!nombre.trim() || !email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
<<<<<<< HEAD
      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO auth_users (nombre, email, password_hash) VALUES (?, ?, ?)',
        [nombre.trim(), email.trim(), hash]
      );
      return res.json({ success: true, user_id: result.insertId });
=======

      const existing = await db.collection('usuarios').where('email', '==', email.trim()).limit(1).get();
      if (!existing.empty) {
        return res.status(409).json({ success: false, error: 'Este correo ya está registrado.' });
      }

      const hash = await bcrypt.hash(password, 10);
      const id = await nextId('usuarios');
      const usuario = {
        id,
        nombre: nombre.trim(),
        email: email.trim(),
        password_hash: hash,
        fecha_creacion: new Date().toISOString(),
      };
      await db.collection('usuarios').doc(String(id)).set(usuario);
      return res.json({ success: true, user_id: id });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    }

    if (action === 'login') {
      if (!email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
<<<<<<< HEAD
      const [rows] = await pool.query('SELECT id, nombre, password_hash FROM auth_users WHERE email = ? LIMIT 1', [email.trim()]);
      const user = rows[0];
      if (!user) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: email.trim() } });
=======

      const snap = await db.collection('usuarios').where('email', '==', email.trim()).limit(1).get();
      if (snap.empty) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });

      const user = snap.docs[0].data();
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });

      return res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: user.email } });
    }

    if (action === 'google') {
      if (!email.trim()) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }

      const snap = await db.collection('usuarios').where('email', '==', email.trim()).limit(1).get();
      if (!snap.empty) {
        const user = snap.docs[0].data();
        return res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: user.email } });
      }

      const id = await nextId('usuarios');
      const usuario = {
        id,
        nombre: nombre.trim() || email.trim().split('@')[0],
        email: email.trim(),
        password_hash: null,
        fecha_creacion: new Date().toISOString(),
      };
      await db.collection('usuarios').doc(String(id)).set(usuario);
      return res.json({ success: true, user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    }
  } catch (error) {
    console.error('AUTH ERROR:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error en auth: ' + error.message
    });
  }
});

<<<<<<< HEAD
=======
// ── Notificaciones ───────────────────────────────────────────────────────

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
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
