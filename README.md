# TaskMaster Web

<<<<<<< HEAD
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
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Excluye .env, node_modules, credenciales
│
├── api/                          # Backend principal (PHP)
│   ├── tareas.php                # CRUD tareas (GET/POST/PUT/DELETE)
│   ├── categorias.php            # CRUD categorías propias del usuario
│   ├── login.php                 # Autenticación local
│   ├── registro.php              # Registro de usuarios
│   ├── google-auth.php           # Autenticación con Google
│   ├── notify.php                # Notificaciones/recordatorios
│   └── stats.php                 # Datos agregados para la vista semanal
│
├── config/
│   └── conexion.php               # Conexión mysqli a MySQL
│
├── database/
│   └── taskmaster_db.sql          # Script SQL (usuarios, categorías, tareas, alertas)
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
| POST | `/api/login.php` | Login local, valida contraseña con `password_verify()` |
| POST | `/api/registro.php` | Registro, guarda contraseña con `password_hash()` |
| POST | `/api/google-auth.php` | Autenticación con Google |
| POST | `/api/notify.php` | Envía/registra un recordatorio |
| GET | `/api/stats.php` | Datos agregados para la vista semanal |

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

Actualmente el proyecto corre en local (XAMPP). Aún no está desplegado en un hosting con dominio propio — pendiente de elegir proveedor con soporte PHP+MySQL (o migrar el backend a un servicio como Railway/Render) y registrar el dominio.

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
=======
Sistema web para gestión de tareas académicas.

## Stack actual

- Frontend: HTML5 + CSS3 + JavaScript (patrón MVVM)
- Backend: Node.js + Express
- Base de datos: Firebase Firestore
- Integraciones opcionales (correo, calendario, Drive, Classroom): carpeta `integraciones/`

> Nota: las carpetas `api/`, `config/`, `controllers/`, `models/` y `views/` contienen una
> versión previa del backend en PHP + MySQL (mysqli) que ya **no está en uso** — el proyecto
> migró a Node.js + Firebase. Se mantienen en el repositorio como referencia histórica del
> avance del proyecto, pero ningún archivo actual las invoca (no hay `index.php`).

## Instalación local (Node.js + Firebase)

1. Clona el repositorio y entra a la carpeta del proyecto.
2. Ejecuta `npm install`.
3. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/) (o usa uno existente) y habilita **Firestore**.
4. Genera una clave de cuenta de servicio: *Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada*. Se descargará un archivo `.json`.
5. Copia `.env.example` a `.env` y, si guardaste la clave con otro nombre o ruta, actualiza `FIREBASE_SERVICE_ACCOUNT_PATH`. Por defecto se espera el archivo `serviceAccountKey.json` en la raíz del proyecto (este archivo nunca debe subirse a git; ya está en `.gitignore`).
6. Inicia el servidor con `npm start`.
7. Abre `http://localhost:3000/`.

Si `serviceAccountKey.json` falta o es inválido, el servidor lo indica claramente en consola y no arranca, en vez de fallar con un error críptico.

### Módulo de integraciones (opcional)

`integraciones/` es un microservicio Express aparte para notificaciones por correo (Brevo),
calendario, Drive/OneDrive y Classroom/Teams.

1. `cd integraciones && npm install`
2. Copia `integraciones/.env.example` a `integraciones/.env` y completa las variables (reutiliza la misma clave de servicio de Firebase).
3. `npm start`

## Estructura relevante

```
server.js              → servidor principal Node/Express + API REST sobre Firestore
assets/js/model/        → capa Model (consumo de API + fallback localStorage)
assets/js/viewmodel/     → capa ViewModel (estado de la app)
assets/js/view/          → capa View (DOM, eventos, botones)
assets/js/app.js         → coordinador de la app (App)
integraciones/           → microservicio de integraciones externas
```
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
