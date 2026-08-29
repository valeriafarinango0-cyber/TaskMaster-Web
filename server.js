import express from 'express';
import cors from 'cors';
import { json } from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './lib/firestore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(express.static(path.join(__dirname, '/')));

db.collection('_healthcheck').limit(1).get()
  .then(() => console.log('✅ Firebase Firestore conectado correctamente'))
  .catch(err => console.error('❌ Error conectando a Firestore:', err.message));

const MATERIAS_DEFAULT = [
  { id: 1, nombre: 'Estudio',  color: '#5C6BC0', bg: '#E8EAF6' },
  { id: 2, nombre: 'Trabajo',  color: '#E91E63', bg: '#FCE4EC' },
  { id: 3, nombre: 'Personal', color: '#FF6F00', bg: '#FFF3E0' },
  { id: 4, nombre: 'Salud',    color: '#2E7D32', bg: '#E8F5E9' },
  { id: 5, nombre: 'Finanzas', color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 6, nombre: 'General',  color: '#546E7A', bg: '#ECEFF1' },
];

async function siguienteId(coleccion) {
  const snap = await db.collection(coleccion).get();
  let max = 0;
  snap.forEach(doc => {
    const id = Number(doc.data().id || 0);
    if (id > max) max = id;
  });
  return max + 1;
}

// ── Materias ─────────────────────────────────────────────────────────────

app.get('/api/materias', async (req, res) => {
  try {
    const snap = await db.collection('materias').get();
    if (snap.empty) {
      const batch = db.batch();
      MATERIAS_DEFAULT.forEach(m => {
        batch.set(db.collection('materias').doc(String(m.id)), m);
      });
      await batch.commit();
      return res.json({ success: true, materias: MATERIAS_DEFAULT });
    }
    const materias = snap.docs.map(d => d.data()).sort((a, b) => a.id - b.id);
    res.json({ success: true, materias });
  } catch (error) {
    console.error('MATERIAS ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error leyendo materias.' });
  }
});

// ── Categorías personalizadas del usuario ───────────────────────────────

app.get('/api/categorias', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    let query = db.collection('categorias');
    if (usuario_id) query = query.where('usuario_id', '==', Number(usuario_id));
    const snap = await query.get();
    const categorias = snap.docs.map(d => d.data()).sort((a, b) => a.id - b.id);
    res.json({ success: true, categorias });
  } catch (error) {
    console.error('CATEGORIAS GET ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error leyendo categorías.' });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre = '', color = '#00C9FF', icono = '', usuario_id = null } = req.body;
    if (!nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre de la categoría es obligatorio.' });
    }
    const id = await siguienteId('categorias');
    const categoria = { id, nombre: nombre.trim(), color, icono, usuario_id: usuario_id != null ? Number(usuario_id) : null };
    await db.collection('categorias').doc(String(id)).set(categoria);
    res.status(201).json({ success: true, categoria });
  } catch (error) {
    console.error('CATEGORIAS POST ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error creando categoría.' });
  }
});

// ── Tareas ───────────────────────────────────────────────────────────────

app.get('/api/tareas', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    let query = db.collection('tareas');
    if (usuario_id) query = query.where('usuario_id', '==', Number(usuario_id));
    const snap = await query.get();

    const materiasSnap = await db.collection('materias').get();
    const materiasPorId = {};
    materiasSnap.forEach(d => { materiasPorId[d.data().id] = d.data(); });

    const tareas = snap.docs.map(d => {
      const t = d.data();
      const materia = materiasPorId[t.materia_id];
      return {
        ...t,
        materia_nombre: materia ? materia.nombre : null,
        materia_color: materia ? materia.color : null,
      };
    }).sort((a, b) => {
      if (a.completada !== b.completada) return a.completada - b.completada;
      return new Date(a.fecha_limite) - new Date(b.fecha_limite);
    });

    res.json({ success: true, tareas });
  } catch (error) {
    console.error('TAREAS GET ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error leyendo tareas.' });
  }
});

app.post('/api/tareas', async (req, res) => {
  try {
    const {
      titulo = '', descripcion = '', materia_id = 6,
      prioridad = 'Media', fecha_limite = '', general_categoria = '',
      pomodoros_est = 1, min_anticipacion = 30, usuario_id = null,
    } = req.body;

    if (!titulo.trim()) {
      return res.status(400).json({ success: false, error: 'El título es obligatorio.' });
    }
    if (!fecha_limite) {
      return res.status(400).json({ success: false, error: 'La fecha límite es obligatoria.' });
    }

    const id = await siguienteId('tareas');
    const tarea = {
      id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materia_id: Number(materia_id),
      prioridad,
      fecha_limite,
      general_categoria,
      pomodoros_est: Number(pomodoros_est),
      min_anticipacion: Number(min_anticipacion),
      completada: 0,
      pomodoros_real: 0,
      usuario_id: usuario_id != null ? Number(usuario_id) : null,
      fecha_creacion: new Date().toISOString(),
    };

    await db.collection('tareas').doc(String(id)).set(tarea);
    res.status(201).json({ success: true, tarea });
  } catch (error) {
    console.error('TAREAS POST ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error creando tarea.' });
  }
});

app.put('/api/tareas', async (req, res) => {
  try {
    const data = req.body;
    const id = Number(data.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

    const allowed = ['titulo', 'descripcion', 'materia_id', 'prioridad', 'fecha_limite', 'general_categoria', 'pomodoros_est', 'pomodoros_real', 'completada', 'min_anticipacion'];
    const cambios = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cambios[key] = data[key];
      }
    }

    if (!Object.keys(cambios).length) return res.status(400).json({ success: false, error: 'Sin campos para actualizar.' });

    const ref = db.collection('tareas').doc(String(id));
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Tarea no encontrada.' });

    await ref.update(cambios);
    res.json({ success: true });
  } catch (error) {
    console.error('TAREAS PUT ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error actualizando tarea.' });
  }
});

app.delete('/api/tareas', async (req, res) => {
  try {
    const id = Number(req.body.id || 0);
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

    await db.collection('tareas').doc(String(id)).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('TAREAS DELETE ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error eliminando tarea.' });
  }
});

// ── Autenticación ────────────────────────────────────────────────────────

app.post('/api/auth', async (req, res) => {
  try {
    const action = req.query.action || req.body.action;
    const { nombre = '', email = '', password = '' } = req.body;
    const emailNorm = email.trim().toLowerCase();

    if (!['login', 'register'].includes(action)) {
      return res.status(405).json({ success: false, error: 'Acción no soportada.' });
    }

    if (action === 'register') {
      if (!nombre.trim() || !emailNorm || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
      const existente = await db.collection('usuarios').where('email', '==', emailNorm).limit(1).get();
      if (!existente.empty) {
        return res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese correo.' });
      }
      const hash = await bcrypt.hash(password, 10);
      const id = await siguienteId('usuarios');
      const usuario = { id, nombre: nombre.trim(), email: emailNorm, password_hash: hash, fecha_creacion: new Date().toISOString() };
      await db.collection('usuarios').doc(String(id)).set(usuario);
      return res.json({ success: true, user_id: id });
    }

    if (action === 'login') {
      if (!emailNorm || !password) {
        return res.status(400).json({ success: false, error: 'Campos incompletos' });
      }
      const snap = await db.collection('usuarios').where('email', '==', emailNorm).limit(1).get();
      if (snap.empty) return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos.' });
      const user = snap.docs[0].data();
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos.' });
      return res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: user.email } });
    }
  } catch (error) {
    console.error('AUTH ERROR:', error.message, error.stack);
    res.status(500).json({ success: false, error: 'Error en autenticación: ' + error.message });
  }
});

// Eliminar cuenta: borra el usuario y todas sus tareas.
app.delete('/api/auth', async (req, res) => {
  try {
    const usuario_id = Number(req.body.usuario_id || 0);
    const password = req.body.password || '';
    if (!usuario_id || !password) {
      return res.status(400).json({ success: false, error: 'usuario_id y password son obligatorios.' });
    }

    const ref = db.collection('usuarios').doc(String(usuario_id));
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(password, doc.data().password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Contraseña incorrecta.' });

    const tareasSnap = await db.collection('tareas').where('usuario_id', '==', usuario_id).get();
    const batch = db.batch();
    tareasSnap.forEach(d => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE ACCOUNT ERROR:', error.message);
    res.status(500).json({ success: false, error: 'Error eliminando la cuenta.' });
  }
});

// ── Notificaciones ───────────────────────────────────────────────────────

app.post('/api/notify', async (req, res) => {
  try {
    const { email = '', asunto = 'Notificación TaskMaster', mensaje = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido.' });
    }

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
