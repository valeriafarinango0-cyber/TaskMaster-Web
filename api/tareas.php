<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include("../config/conexion.php");

$metodo = $_SERVER['REQUEST_METHOD'];

// GET: obtener todas las tareas
if ($metodo === 'GET') {

    $sql = "SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color
            FROM tareas t
            LEFT JOIN materias m ON t.materia_id = m.id
            ORDER BY t.completada ASC, t.fecha_limite ASC";

    $resultado = $conexion->query($sql);
    $tareas    = [];

    while ($fila = $resultado->fetch_assoc()) {
        $tareas[] = $fila;
    }

    echo json_encode(["success" => true, "tareas" => $tareas]);
}

// POST: crear tarea
elseif ($metodo === 'POST') {

    $datos = json_decode(file_get_contents("php://input"), true);

    $titulo           = $conexion->real_escape_string(trim($datos['titulo'] ?? ''));
    $descripcion      = $conexion->real_escape_string(trim($datos['descripcion'] ?? ''));
    $materia_id       = intval($datos['materia_id'] ?? 6);
    $prioridad        = $conexion->real_escape_string($datos['prioridad'] ?? 'Media');
    $fecha_limite     = $conexion->real_escape_string($datos['fecha_limite'] ?? '');
    $pomodoros_est    = intval($datos['pomodoros_est'] ?? 1);
    $min_anticipacion = intval($datos['min_anticipacion'] ?? 30);

    if (empty($titulo)) {
        echo json_encode(["success" => false, "error" => "El titulo es obligatorio."]);
        exit;
    }

    if (empty($fecha_limite)) {
        echo json_encode(["success" => false, "error" => "La fecha limite es obligatoria."]);
        exit;
    }

    $sql = "INSERT INTO tareas
                (titulo, descripcion, materia_id, prioridad,
                 fecha_limite, pomodoros_est, min_anticipacion,
                 completada, pomodoros_real)
            VALUES
                ('$titulo', '$descripcion', $materia_id, '$prioridad',
                 '$fecha_limite', $pomodoros_est, $min_anticipacion, 0, 0)";

    if ($conexion->query($sql)) {
        $id    = $conexion->insert_id;
        $res   = $conexion->query("SELECT * FROM tareas WHERE id = $id");
        $tarea = $res->fetch_assoc();
        http_response_code(201);
        echo json_encode(["success" => true, "tarea" => $tarea]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al crear la tarea."]);
    }
}

// PUT: actualizar tarea
elseif ($metodo === 'PUT') {

    $datos = json_decode(file_get_contents("php://input"), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    $campos     = [];
    $permitidos = ['titulo','descripcion','materia_id','prioridad',
                   'fecha_limite','pomodoros_est','pomodoros_real',
                   'completada','min_anticipacion'];

    foreach ($permitidos as $campo) {
        if (array_key_exists($campo, $datos)) {
            $valor    = $conexion->real_escape_string($datos[$campo]);
            $campos[] = "$campo = '$valor'";
        }
    }

    if (empty($campos)) {
        echo json_encode(["success" => false, "error" => "Sin campos para actualizar."]);
        exit;
    }

    $set = implode(', ', $campos);
    $sql = "UPDATE tareas SET $set WHERE id = $id";

    if ($conexion->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al actualizar."]);
    }
}

// DELETE: eliminar tarea
elseif ($metodo === 'DELETE') {

    $datos = json_decode(file_get_contents("php://input"), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }

    $conexion->query("DELETE FROM alertas WHERE tarea_id = $id");
    $sql = "DELETE FROM tareas WHERE id = $id";

    if ($conexion->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al eliminar."]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Metodo no permitido."]);
}

$conexion->close();
?>