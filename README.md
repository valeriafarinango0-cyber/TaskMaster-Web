# TaskMaster Web

> Sistema web de gestión de tareas y productividad personal desarrollado como proyecto de fin de curso — ISTER Rumiñahui, Tecnología Superior en Desarrollo de Software, 2026.

## Autores

- **Eduardo Antonio Hurtado Quintero** — Frontend MVVM, autenticación, categorías, Pomodoro, vista semanal, sincronización en tiempo real con Firebase
- **Valeria Farinango** — Backend PHP, estructura base, integración mysqli

**Tutor:** Mg. Yngrid Josefina Melo Quintana
**Institución:** Instituto Superior Tecnológico Rumiñahui — Sangolquí, Ecuador

---

## Descripción

TaskMaster Web es una SPA (Single Page Application) que permite a cualquier usuario —estudiante, profesional, emprendedor o persona del hogar— organizar sus tareas con categorías propias, prioridades, fechas límite, recordatorios personalizados y sesiones de enfoque mediante la técnica Pomodoro.

El acceso requiere una cuenta (registro con correo o Google) para ver el panel de tareas. Los datos se guardan en MySQL vía una API REST en PHP, con **fallback automático a `localStorage`** cuando no hay conexión, y se espejan de forma opcional hacia **Firebase Firestore** para sincronización en tiempo real entre pestañas o dispositivos.

---

## Stack Tecnológico

| Capa | Tecnología | Uso en el proyecto |
|---|---|---|
| **Backend principal** | PHP 8 + mysqli | API REST (`api/*.php`) — lo que el frontend consume realmente: tareas, categorías, autenticación, notificaciones, estadísticas |
| **Backend alternativo** | Node.js + Express (`server.js`) | Implementación paralela con rutas equivalentes, pensada para un despliegue eventual fuera de un hosting con PHP |
| **Base de datos** | MySQL / MariaDB | Persistencia de tareas, usuarios, categorías, alertas (vía XAMPP en desarrollo local) |
| **Sincronización en tiempo real** | Firebase Firestore (Web SDK v10) | Espejo opcional y de "mejor esfuerzo" de cada tarea; no reemplaza a MySQL |
| **Frontend** | JavaScript ES6+ nativo | Patrón MVVM implementado a mano, sin frameworks ni build step |
| **Estilos** | CSS3 propio | Variables CSS, tema oscuro, diseño responsive (380px–1280px) |
| **Seguridad** | `password_hash()` (PHP) | Hash de contraseñas — nunca se guardan en texto plano |
| **Notificaciones** | Web Notifications API | Recordatorios nativos del navegador, sin cuenta de correo real |
| **Control de versiones** | Git + GitHub | Historial documentado por avances académicos |

---

## Arquitectura del sistema

### Patrón MVVM (Model-View-ViewModel)

```
┌───────────────────────────────────────────────────────────────┐
│                          FRONTEND                             │
│                                                                 │
│  VIEW                  VIEWMODEL              MODEL            │
│  HomeView.js      ←→  TaskViewModel.js   ←→  TaskModel.js      │
│  ModalView.js          subscribe()            CategoriaModel.js│
│  SemanaView.js         _notify()              fetch() → JSON   │
│  PomodoroView.js       setFiltro()             ↳ fallback      │
│  AuthView.js           crearTarea()              localStorage  │
└───────────────────────────────────────────────────────────────┘
                              │  fetch() / JSON
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    BACKEND (PHP + mysqli)                      │
│                                                                 │
│  api/tareas.php        api/categorias.php     api/login.php    │
│  api/registro.php      api/google-auth.php    api/notify.php   │
│  api/stats.php         config/conexion.php                     │
│                                                                 │
│  (server.js — Node.js/Express — implementación alternativa)    │
└───────────────────────────────────────────────────────────────┘
                              │  mysqli (consultas preparadas)
                              ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│   MySQL — taskmaster_db       │   │   Firebase Firestore       │
│   ├── usuarios                │   │   └── colección "tareas"   │
│   ├── categorias               │◄──┤       (espejo en tiempo    │
│   ├── tareas                   │   │        real, opcional)     │
│   └── alertas                  │   └───────────────────────────┘
└───────────────────────────────┘
```

---

## Estructura del proyecto

```
TaskMaster-Web/
├── index.html                    # SPA principal — todas las vistas
├── server.js                     # Backend alternativo Node.js + Express
├── package.json                  # Dependencias npm (backend alternativo)
├── manifest.json                 # Configuración PWA (instalable)
├── sw.js                         # Service Worker — cache del app shell / modo offline
├── serviceAccountKey.json        # Credencial Firebase Admin (NO se sube a Git)
├── .env.example                  # Plantilla de variables de entorno (server.js)
├── .gitignore                    # Excluye .env, node_modules, credenciales
│
├── api/                          # Backend principal (PHP) — lo que consume el frontend
│   ├── tareas.php                # CRUD tareas (GET/POST/PUT/DELETE)
│   ├── categorias.php            # CRUD categorías propias del usuario
│   ├── usuarios.php               # Wrapper → controllers/UsuariosController.php
│   ├── login.php                 # Autenticación local
│   ├── registro.php              # Registro de usuarios
│   ├── google-auth.php           # Autenticación con Google
│   ├── notify.php                # Notificaciones/recordatorios (correo de la sesión)
│   ├── estados.php               # Catálogo fijo de estados de tarea
│   ├── prioridades.php           # Catálogo fijo de prioridades
│   └── stats.php                 # Datos agregados para la vista semanal
│
├── controllers/                  # Controladores PHP estilo MVC
│   ├── UsuariosController.php    # En uso real (vía api/usuarios.php)
│   ├── TareasController.php      # No enrutado — api/tareas.php implementa su propia lógica
│   └── CategoriasController.php  # No enrutado — api/categorias.php implementa su propia lógica
│
├── models/                       # Modelos PHP (mysqli) que usan los controllers/
│   ├── usuarios.php
│   ├── Tarea.php
│   └── Categoria.php
│
├── config/
│   └── conexion.php               # Conexión mysqli (lee DB_HOST/DB_USER/DB_PASSWORD/DB_NAME del entorno)
│
├── lib/
│   └── firestore.js               # Instancia Firebase Admin Firestore (usada por server.js)
│
├── database/
│   └── taskmaster_db.sql          # Script SQL (usuarios, categorías, tareas, alertas)
│
├── docs/
│   ├── Manual.pdf                 # Manuales de usuario, administrador y desarrollador
│   ├── API.POSTMAN.json           # Colección Postman de la API REST
│   ├── DER.png                    # Diagrama entidad-relación de la base de datos
│   └── CATEGORY_ICONS.md          # Referencia de íconos por categoría
│
├── integraciones/                 # Servidor Node.js secundario (puerto aparte)
│   ├── server.js
│   ├── routes/                    # OAuth Google/Microsoft, Calendar, Drive, Classroom, Teams, OneDrive, email, ICS
│   └── lib/                       # tokenStore, Brevo (email), Firestore, OAuth helpers
│
└── assets/
    ├── css/
    │   ├── main.css               # Layout, variables, componentes, tema oscuro
    │   ├── components.css         # Piezas puntuales complementarias
    │   └── responsive.css         # Ajustes mobile/desktop
    ├── img/
    │   └── logo.svg                # Logo TaskMaster
    └── js/
        ├── model/
        │   ├── TaskModel.js        # fetch + fallback localStorage + espejo Firestore
        │   └── CategoriaModel.js   # Categorías propias del usuario
        ├── viewmodel/
        │   └── TaskViewModel.js    # Estado global + patrón Observer
        ├── view/
        │   ├── HomeView.js         # Lista de tareas + urgencia dinámica
        │   ├── SemanaView.js       # Gráfico de carga semanal
        │   ├── ModalView.js        # Formulario nueva/editar tarea
        │   ├── PomodoroView.js     # Enfoque a pantalla completa (ring SVG)
        │   └── AuthView.js         # Login/registro obligatorio, sesión
        ├── app.js                  # Coordinador principal de la SPA
        └── firebase-init.js        # Inicializa Firestore para sync en tiempo real
```

---

## Base de datos

### Diagrama de relaciones

```
usuarios (1) ──────────── (N) tareas
    │                          │
    └──────── (N) categorias   └──── (N) alertas
```

### Comportamiento al eliminar

- `usuarios → tareas`: `ON DELETE CASCADE`
- `usuarios → categorias`: `ON DELETE CASCADE`
- `categorias → tareas`: `ON DELETE SET NULL` (la tarea queda sin categoría)
- `tareas → alertas`: `ON DELETE CASCADE`

---

## API REST — Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tareas.php` | Lista tareas (con categoría, del usuario en sesión) |
| POST | `/api/tareas.php` | Crea una tarea nueva, con validación |
| PUT | `/api/tareas.php` | Actualiza campos de una tarea |
| DELETE | `/api/tareas.php` | Elimina una tarea y sus alertas |
| GET/POST/PUT/DELETE | `/api/categorias.php` | CRUD de categorías propias (nombre, color, ícono) |
| GET/POST/PUT/DELETE | `/api/usuarios.php` | Perfil del usuario en sesión: ver/editar/eliminar cuenta (requiere contraseña para eliminar) |
| POST | `/api/login.php` | Login local, valida contraseña con `password_verify()` |
| POST | `/api/registro.php` | Registro, guarda contraseña con `password_hash()` |
| POST | `/api/google-auth.php` | Autenticación con Google |
| POST | `/api/notify.php` | Envía un recordatorio al correo del usuario en sesión |
| GET | `/api/estados.php` | Catálogo de estados de tarea |
| GET | `/api/prioridades.php` | Catálogo de prioridades |
| GET | `/api/stats.php` | Datos agregados para la vista semanal |

> Colección completa lista para importar en Postman: [`docs/API.POSTMAN.json`](docs/API.POSTMAN.json).

### Servidor de integraciones (`integraciones/`, puerto aparte)

Corre por separado (`cd integraciones && npm start`) y expone OAuth 2.0 con Google/Microsoft y las rutas de Calendar, Drive, Classroom, Teams, OneDrive, envío de email (Brevo) y generación de archivos `.ics`. Ver el Manual de Desarrollador (`docs/Manual.pdf`) para el detalle de cada ruta.

---

## Historias de usuario implementadas

| ID | Historia | Estado |
|---|---|---|
| HU-01 | Crear tarea con título, categoría propia, prioridad y fecha límite | ✅ |
| HU-02 | Urgencia dinámica con barra de color y cuenta regresiva en vivo | ✅ |
| HU-03 | Recordatorio personalizable en minutos de anticipación | ✅ |
| HU-04 | Notificaciones web nativas | ✅ |
| HU-05 | Editar y eliminar tareas con confirmación | ✅ |
| HU-06 | Filtros por categoría/estado y vista semanal con gráfico de barras | ✅ |
| HU-07 | Temporizador Pomodoro a pantalla completa, con ring SVG animado | ✅ |
| HU-08 | Cuenta obligatoria (correo o Google) para acceder al panel | ✅ |
| HU-09 | Sincronización en tiempo real entre pestañas/dispositivos (Firestore) | ✅ |

---

## Instalación y ejecución local

### Requisitos

- XAMPP (Apache + MySQL) con PHP 8+
- Node.js 18+ (solo si se quiere probar el backend alternativo `server.js`)

### Pasos (backend principal — PHP)

```bash
# 1. Clonar el repositorio
git clone https://github.com/valeriafarinango0-cyber/TaskMaster-Web.git
cd TaskMaster-Web
git checkout avance-eduardo

# 2. Crear la base de datos
# Abrir phpMyAdmin → importar database/taskmaster_db.sql

# 3. Levantar el servidor PHP
php -S localhost:8000
# (o servir la carpeta con Apache/XAMPP)

# 4. Abrir en el navegador
# http://localhost:8000
```

### Backend alternativo (Node.js, opcional)

```bash
npm install
cp .env.example .env   # ajustar credenciales de tu MySQL local
npm start               # http://localhost:3000
```

---

## Sincronización en tiempo real (Firestore)

`assets/js/firebase-init.js` conecta con un proyecto real de Firebase. Cada `create`/`update`/`delete` confirmado por PHP se espeja hacia la colección `tareas` de Firestore, y `TaskModel.subscribeRealtime()` escucha cambios (por ejemplo, dos pestañas abiertas se actualizan solas, sin recargar). Es un complemento **opcional y de "mejor esfuerzo"**: si Firestore no responde, la app sigue funcionando igual con PHP + localStorage.

---

## Hosting y dominio

El proyecto está desplegado en **Hostinger** con dominio propio: **[taskmaster-app.com](https://taskmaster-app.com/)**. El sitio se sirve correctamente (frontend, assets, PWA), pero las funcionalidades que dependen del backend PHP en producción — por ejemplo, los botones de login/registro — actualmente **no responden** y están pendientes de corrección (revisar conexión a MySQL, variables de entorno DB_* en hPanel y permisos del hosting). Para probar el flujo completo con backend funcional, usar el entorno local (XAMPP) descrito arriba.

---

## Funcionalidades destacadas

- **Login obligatorio**: el panel de tareas solo es visible tras iniciar sesión o registrarse (correo o Google).
- **Modo offline**: fallback automático a `localStorage` cuando la API no responde.
- **Tiempo real**: Firebase Firestore sincroniza cambios entre pestañas/dispositivos sin recargar.
- **Seguridad**: contraseñas con `password_hash()`, consultas preparadas contra inyección SQL.
- **Responsive**: diseño adaptable desde 380px (móvil) hasta 1280px (escritorio).
- **Sin frameworks**: frontend en JavaScript puro con patrón MVVM implementado manualmente.
- **Pomodoro integrado**: temporizador de 25 minutos con ring SVG animado por `stroke-dashoffset`.

---

## Avances académicos

| Avance | Porcentaje | Contenido |
|---|---|---|
| Avance 1 | 25% | Estructura HTML, CSS y base de datos MySQL |
| Avance 2 | 50% | Patrón MVVM en JavaScript y API REST en PHP con mysqli |
| Avance 3 | 75% | Dashboard semanal, filtros dinámicos y Pomodoro |
| Avance 4 | 100% | Autenticación, categorías propias, rediseño completo, login obligatorio y sincronización en tiempo real con Firestore |

Todos los avances están documentados en el historial de commits de la rama `avance-eduardo`.

---

*Proyecto desarrollado para la materia Gestión de Proyectos — ISTER Rumiñahui, 2026.*
