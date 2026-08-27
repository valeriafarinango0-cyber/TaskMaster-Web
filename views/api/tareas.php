<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
include_once(__DIR__ . '/../config/conexion.php');

// ── Migraciones defensivas (no rompen instalaciones existentes) ────────────
$colCat = $conexion->query("SHOW COLUMNS FROM tareas LIKE 'categoria_id'");
if ($colCat && $colCat->num_rows === 0) {
    $conexion->query("ALTER TABLE tareas ADD COLUMN categoria_id INT NULL AFTER descripcion");
}
$colUsr = $conexion->query("SHOW COLUMNS FROM tareas LIKE 'usuario_id'");
if ($colUsr && $colUsr->num_rows === 0) {
    $conexion->query("ALTER TABLE tareas ADD COLUMN usuario_id INT NULL AFTER id");
}
$conexion->query("CREATE TABLE IF NOT EXISTS categorias (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#00C9FF',
    icono VARCHAR(10) DEFAULT NULL,
    usuario_id INT DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
// La tabla categorias puede ya existir con un esquema mas viejo (sin estas columnas)
$colCatUsr = $conexion->query("SHOW COLUMNS FROM categorias LIKE 'usuario_id'");
if ($colCatUsr && $colCatUsr->num_rows === 0) {
    $conexion->query("ALTER TABLE categorias ADD COLUMN usuario_id INT NULL");
}
$colCatIco = $conexion->query("SHOW COLUMNS FROM categorias LIKE 'icono'");
if ($colCatIco && $colCatIco->num_rows === 0) {
    $conexion->query("ALTER TABLE categorias ADD COLUMN icono VARCHAR(10) DEFAULT NULL");
}

// Login opcional: sin sesion, se trabaja en modo invitado (usuario_id IS NULL)
$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
$metodo = $_SERVER['REQUEST_METHOD'];

$SELECT_BASE = "SELECT t.*, c.nombre AS categoria_nombre, c.color AS categoria_color, c.icono AS categoria_icono
                FROM tareas t
                LEFT JOIN categorias c ON t.categoria_id = c.id";

// ── GET: obtener tareas del usuario (o de invitado) ─────────────────────────
if ($metodo === 'GET') {
    if ($userId) {
        $sql = "$SELECT_BASE WHERE t.usuario_id = ? ORDER BY t.completada ASC, t.fecha_limite ASC";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param('i', $userId);
    } else {
        $sql = "$SELECT_BASE WHERE t.usuario_id IS NULL ORDER BY t.completada ASC, t.fecha_limite ASC";
        $stmt = $conexion->prepare($sql);
    }
    $stmt->execute();
    $resultado = $stmt->get_result();

    $tareas = [];
    while ($fila = $resultado->fetch_assoc()) {
        $tareas[] = $fila;
    }
    $stmt->close();

    echo json_encode(["success" => true, "tareas" => $tareas]);
}

// ── POST: crear tarea ─────────────────────────────────────────────────────
elseif ($metodo === 'POST') {

    $datos = json_decode(file_get_contents("php://input"), true) ?? [];

    $titulo           = trim($datos['titulo'] ?? '');
    $descripcion      = trim($datos['descripcion'] ?? '');
    $categoria_id     = !empty($datos['categoria_id']) ? intval($datos['categoria_id']) : null;
    $prioridad        = $datos['prioridad'] ?? 'Media';
    $fecha_limite     = $datos['fecha_limite'] ?? '';
    $pomodoros_est    = intval($datos['pomodoros_est'] ?? 1);
    $min_anticipacion = intval($datos['min_anticipacion'] ?? 30);

    if ($titulo === '') {
        echo json_encode(["success" => false, "error" => "El título es obligatorio."]);
        exit;
    }
    if ($fecha_limite === '') {
        echo json_encode(["success" => false, "error" => "La fecha límite es obligatoria."]);
        exit;
    }

    $sql = "INSERT INTO tareas
                (titulo, descripcion, categoria_id, prioridad, fecha_limite, pomodoros_est, min_anticipacion, completada, pomodoros_real, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('ssisssii', $titulo, $descripcion, $categoria_id, $prioridad, $fecha_limite, $pomodoros_est, $min_anticipacion, $userId);

    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stmt->close();
        $q = $conexion->prepare("$SELECT_BASE WHERE t.id = ?");
        $q->bind_param('i', $id);
        $q->execute();
        $tarea = $q->get_result()->fetch_assoc();
        $q->close();
        http_response_code(201);
        echo json_encode(["success" => true, "tarea" => $tarea]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al crear la tarea."]);
    }
}

// ── PUT: actualizar tarea ─────────────────────────────────────────────────
elseif ($metodo === 'PUT') {

    $datos = json_decode(file_get_contents("php://input"), true) ?? [];
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    $permitidos = ['titulo','descripcion','categoria_id','prioridad',
                   'fecha_limite','pomodoros_est','pomodoros_real',
                   'completada','min_anticipacion'];
    $enteros = ['categoria_id','pomodoros_est','pomodoros_real','completada','min_anticipacion'];

    $campos = []; $tipos = ''; $valores = [];
    foreach ($permitidos as $campo) {
        if (array_key_exists($campo, $datos)) {
            $campos[] = "$campo = ?";
            if (in_array($campo, $enteros)) {
                $tipos    .= 'i';
                $valores[] = $datos[$campo] === null || $datos[$campo] === '' ? null : intval($datos[$campo]);
            } else {
                $tipos    .= 's';
                $valores[] = $datos[$campo];
            }
        }
    }

    if (empty($campos)) {
        echo json_encode(["success" => false, "error" => "Sin campos para actualizar."]);
        exit;
    }

    $tipos .= 'i';
    $valores[] = $id;
    $sql = "UPDATE tareas SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param($tipos, ...$valores);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al actualizar."]);
    }
}

// ── DELETE: eliminar tarea ────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {

    $datos = json_decode(file_get_contents("php://input"), true) ?? [];
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    $stmtA = $conexion->prepare("DELETE FROM alertas WHERE tarea_id = ?");
    $stmtA->bind_param('i', $id);
    $stmtA->execute();
    $stmtA->close();

    $stmt = $conexion->prepare("DELETE FROM tareas WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al eliminar."]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido."]);
}

$conexion->close();
?>
