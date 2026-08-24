# TaskMaster Web

Gestor de tareas universal para maximizar la productividad personal — pensado para
cualquier persona (trabajo, estudio, hogar, proyectos personales), no solo para
estudiantes. El usuario crea sus propias categorías con nombre y color; no hay
categorías académicas predefinidas.

---

## 1. Arquitectura y herramientas usadas

**Patrón**: MVVM (Model-View-ViewModel) en el frontend, API REST en el backend.

```
Navegador (JS puro, sin frameworks)
   │
   │  fetch() → JSON
   ▼
API REST en PHP (api/*.php)
   │
   │  mysqli (consultas preparadas)
   ▼
MySQL (base de datos taskmaster_db)
```

**Frontend — JavaScript puro, patrón MVVM:**

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Model | `assets/js/model/TaskModel.js`, `CategoriaModel.js` | Habla con la API (`fetch`), con **fallback automático a `localStorage`** si no hay conexión — la app funciona sin backend. |
| ViewModel | `assets/js/viewmodel/TaskViewModel.js` | Estado central de la app (tareas, categorías, filtro activo, semana seleccionada). Patrón observer: las Views se suscriben con `subscribe()` y se re-renderizan cuando el estado cambia. |
| View | `assets/js/view/HomeView.js`, `ModalView.js`, `PomodoroView.js`, `SemanaView.js`, `AuthView.js` | Solo manipulan el DOM. No tienen lógica de negocio — piden datos al ViewModel y le delegan las acciones del usuario. |
| Coordinador | `assets/js/app.js` | Instancia Model → ViewModel → Views, conecta la navegación y los eventos globales. |

**Backend — PHP 8 + mysqli:**

- `config/conexion.php` — conexión mysqli a MySQL (host, usuario, contraseña, base de datos).
- `api/tareas.php` — CRUD de tareas (GET/POST/PUT/DELETE). Login **opcional**: sin sesión activa trabaja en modo invitado (`usuario_id IS NULL`); con sesión, cada usuario ve solo sus propias tareas.
- `api/categorias.php` — CRUD de categorías propias del usuario (nombre, color, ícono).
- `api/login.php`, `api/registro.php`, `api/google-auth.php` — autenticación local (email + `password_hash`) y con Google, con sesiones PHP (`$_SESSION`).
- `api/notify.php` — notificaciones (recordatorios de tareas).
- `api/stats.php` — datos agregados para la vista semanal (pomodoros, racha de días activos).

**Base de datos (MySQL, `database/taskmaster_db.sql`):**

- `usuarios` — cuentas (login opcional).
- `categorias` — categorías propias del usuario (`usuario_id` puede ser `NULL` = modo invitado).
- `tareas` — título, descripción, categoría, prioridad, fecha límite, pomodoros estimados/reales.
- `alertas` — recordatorios asociados a una tarea.

**Herramientas y librerías:**

- PHP 8.5 + mysqli (consultas preparadas contra inyección SQL)
- MySQL / MariaDB (vía XAMPP en desarrollo local)
- JavaScript ES6+ nativo (clases, `async/await`, `fetch`) — sin frameworks ni build step
- CSS propio con variables (tema oscuro, diseño responsive)
- Web Notifications API (recordatorios nativos del navegador)
- Node.js + Express (`server.js`) como backend alternativo con las mismas rutas
- Git / GitHub para control de versiones

---

## 2. Cómo funciona el sitio web

**Pantalla de inicio**: header con logo, resumen de estadísticas (tareas totales,
urgentes, completadas hoy), filtros por categoría (chips de colores) y la lista de
tareas del día. Cada tarjeta de tarea muestra: categoría, prioridad, barra de
urgencia (se llena automáticamente según qué tan cerca está la fecha límite),
cuenta regresiva en vivo y progreso de sesiones Pomodoro.

**Crear/editar tarea**: modal con título, descripción, categoría (con opción de
crear una categoría nueva sin salir del formulario), prioridad (Alta/Media/Baja),
fecha límite, número de Pomodoros estimados y recordatorio configurable.

**Modo Enfoque (Pomodoro)**: pantalla completa con temporizador circular de 25
minutos por tarea. Al completar una sesión se registra automáticamente y llega
una notificación del navegador.

**Vista semanal / estadísticas**: gráfico de carga por día (con alerta visual si
un día supera 5 tareas), progreso por categoría, pomodoros de la semana y racha
de días activos.

**Cuenta (opcional)**: la app funciona completa sin registrarse (modo invitado,
datos en `localStorage` + base de datos con `usuario_id NULL`). Quien quiera
sincronizar sus tareas entre dispositivos puede registrarse con correo o con
Google.

---

## 3. Hosting y dominio

Actualmente el proyecto corre en local (XAMPP / `php -S`). **Aún no está
desplegado en un hosting con dominio propio** — es una decisión pendiente
(proveedor de hosting con soporte PHP+MySQL, o migrar el backend a un servicio
como Railway/Render, y registrar un dominio).

## 4. Sincronización en tiempo real (Firestore)

`assets/js/firebase-init.js` conecta con un proyecto real de Firebase
(`taskmaster-web-e81b4`). `TaskModel.js` espeja cada `create`/`update`/`delete`
confirmado por PHP hacia la colección `tareas` de Firestore, y
`subscribeRealtime()` escucha cambios en tiempo real (para que, por ejemplo,
dos pestañas abiertas se actualicen solas sin recargar). Es un complemento
opcional y de "mejor esfuerzo": si Firestore no responde, la app sigue
funcionando igual con PHP + localStorage — nunca bloquea nada.

**Estado verificado:** las lecturas contra Firestore funcionan correctamente
(probado contra el proyecto real). Las escrituras (`setDoc`/`deleteDoc`) no se
pudieron confirmar en pruebas automatizadas — muy probablemente porque las
**Reglas de seguridad de Firestore** del proyecto todavía no permiten escribir
en la colección `tareas`. Para habilitarlo, en la consola de Firebase
(Firestore Database → Reglas) usar algo como:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tareas/{tareaId} {
      allow read, write: if true; // demo/desarrollo — sin autenticación
    }
  }
}
```

(Para producción, reemplazar `if true` por una regla que valide sesión/usuario.)

## 5. Cómo ejecutarlo en local

1. Levantar MySQL (por ejemplo con XAMPP) e importar `database/taskmaster_db.sql`.
2. Desde la carpeta del proyecto, correr `php -S localhost:8000`.
3. Abrir `http://localhost:8000` en el navegador.
