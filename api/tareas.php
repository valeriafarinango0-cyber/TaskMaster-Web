<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Mostrar errores en desarrollo para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

try {
    include("../config/conexion.php");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success"=>false, "error"=>"Error de inclusión: " . $e->getMessage()]);
    exit;
}

// Asegurar columna usuario_id en la tabla tareas (no falla si ya existe)
try {
    $col = $conexion->query("SHOW COLUMNS FROM tareas LIKE 'usuario_id'");
    if ($col && $col->num_rows === 0) {
        $conexion->query("ALTER TABLE tareas ADD COLUMN usuario_id INT NULL AFTER id");
    }
} catch (Exception $e) {
    // no bloquear la ejecución si falla el alter (entorno con DB diferente)
}

$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

function requireAuth($userId) {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "No autorizado"]);
        exit;
    }
}

$metodo = $_SERVER['REQUEST_METHOD'];

// ── GET: obtener todas las tareas del usuario ───────────────────────────────
if ($metodo === 'GET') {
    requireAuth($userId);

    $sql = "SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color, t.general_categoria
            FROM tareas t
            LEFT JOIN materias m ON t.materia_id = m.id
            WHERE t.usuario_id = ?
            ORDER BY t.completada ASC, t.fecha_limite ASC";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('i', $userId);
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
    requireAuth($userId);

    $datos = json_decode(file_get_contents("php://input"), true);

    $titulo           = trim($datos['titulo'] ?? '');
    $descripcion      = trim($datos['descripcion'] ?? '');
    $materia_id       = intval($datos['materia_id'] ?? 6);
    $prioridad        = $datos['prioridad'] ?? 'Media';
    $fecha_limite     = $datos['fecha_limite'] ?? '';
    $general_categoria= $datos['general_categoria'] ?? '';
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
                (titulo, descripcion, materia_id, prioridad, fecha_limite, general_categoria, pomodoros_est, min_anticipacion, completada, pomodoros_real, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('ssisssiii', $titulo, $descripcion, $materia_id, $prioridad, $fecha_limite, $general_categoria, $pomodoros_est, $min_anticipacion, $userId);

    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stmt->close();
        $q = $conexion->prepare("SELECT * FROM tareas WHERE id = ? AND usuario_id = ?");
        $q->bind_param('ii', $id, $userId);
        $q->execute();
        $res = $q->get_result();
        $tarea = $res->fetch_assoc();
        $q->close();
        http_response_code(201);
        echo json_encode(["success" => true, "tarea" => $tarea]);
    } else {
        $stmt->close();
        echo json_encode(["success" => false, "error" => "Error al crear la tarea."]);
    }
}

// ── PUT: actualizar tarea ─────────────────────────────────────────────────
elseif ($metodo === 'PUT') {
    requireAuth($userId);

    $datos = json_decode(file_get_contents("php://input"), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    $campos = [];
    $permitidos = ['titulo','descripcion','materia_id','prioridad','fecha_limite','general_categoria','pomodoros_est','pomodoros_real','completada','min_anticipacion'];
    foreach ($permitidos as $campo) {
        if (array_key_exists($campo, $datos)) {
            $valor = $conexion->real_escape_string($datos[$campo]);
            $campos[] = "$campo = '$valor'";
        }
    }

    if (empty($campos)) {
        echo json_encode(["success" => false, "error" => "Sin campos para actualizar."]);
        exit;
    }

    $set = implode(', ', $campos);
    $sql = "UPDATE tareas SET $set WHERE id = ? AND usuario_id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('ii', $id, $userId);
    if ($stmt->execute()) {
        $affected = $stmt->affected_rows;
        $stmt->close();
        if ($affected === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Tarea no encontrada o no autorizada."]);
            exit;
        }
        echo json_encode(["success" => true]);
    } else {
        $stmt->close();
        echo json_encode(["success" => false, "error" => "Error al actualizar."]);
    }
}

// ── DELETE: eliminar tarea ─────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    requireAuth($userId);

    $datos = json_decode(file_get_contents("php://input"), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    // Eliminar alertas relacionadas primero
    $stmtA = $conexion->prepare("DELETE FROM alertas WHERE tarea_id = ?");
    $stmtA->bind_param('i', $id);
    $stmtA->execute();
    $stmtA->close();

    $sql = "DELETE FROM tareas WHERE id = ? AND usuario_id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('ii', $id, $userId);
    if ($stmt->execute()) {
        $affected = $stmt->affected_rows;
        $stmt->close();
        if ($affected === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Tarea no encontrada o no autorizada."]);
            exit;
        }
        echo json_encode(["success" => true]);
    } else {
        $stmt->close();
        echo json_encode(["success" => false, "error" => "Error al eliminar."]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido."]);
}

$conexion->close();
?>
