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

$conexion->query("CREATE TABLE IF NOT EXISTS categorias (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#00C9FF',
    icono VARCHAR(10) DEFAULT NULL,
    usuario_id INT DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Migraciones defensivas: la tabla puede ya existir con un esquema mas viejo
// (sin usuario_id, o con "emoji" en vez de "icono").
$colUsr = $conexion->query("SHOW COLUMNS FROM categorias LIKE 'usuario_id'");
if ($colUsr && $colUsr->num_rows === 0) {
    $conexion->query("ALTER TABLE categorias ADD COLUMN usuario_id INT NULL");
}
$colIco = $conexion->query("SHOW COLUMNS FROM categorias LIKE 'icono'");
if ($colIco && $colIco->num_rows === 0) {
    $conexion->query("ALTER TABLE categorias ADD COLUMN icono VARCHAR(10) DEFAULT NULL");
}

// Login opcional: sin sesion, las categorias son las "de invitado" (usuario_id NULL)
$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
$metodo = $_SERVER['REQUEST_METHOD'];

// Evita que un usuario edite/elimine categorías de otro usuario.
function categoriaEsDelUsuario($conexion, $id, $userId) {
    $stmt = $conexion->prepare("SELECT usuario_id FROM categorias WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$fila) return false;
    return $userId !== null
        ? (int) $fila['usuario_id'] === $userId
        : $fila['usuario_id'] === null;
}

// ── GET: listar categorias ────────────────────────────────────────────────
if ($metodo === 'GET') {
    if ($userId) {
        $stmt = $conexion->prepare("SELECT * FROM categorias WHERE usuario_id = ? OR usuario_id IS NULL ORDER BY id ASC");
        $stmt->bind_param('i', $userId);
    } else {
        $stmt = $conexion->prepare("SELECT * FROM categorias WHERE usuario_id IS NULL ORDER BY id ASC");
    }
    $stmt->execute();
    $resultado = $stmt->get_result();
    $categorias = [];
    while ($fila = $resultado->fetch_assoc()) {
        $categorias[] = $fila;
    }
    $stmt->close();
    echo json_encode(["success" => true, "categorias" => $categorias]);
}

// ── POST: crear categoria ─────────────────────────────────────────────────
elseif ($metodo === 'POST') {
    $datos  = json_decode(file_get_contents('php://input'), true) ?? [];
    $nombre = trim($datos['nombre'] ?? '');
    $color  = trim($datos['color'] ?? '#00C9FF');
    $icono  = trim($datos['icono'] ?? '');

    if ($nombre === '') {
        echo json_encode(["success" => false, "error" => "El nombre de la categoría es obligatorio."]);
        exit;
    }
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        $color = '#00C9FF';
    }

    $stmt = $conexion->prepare("INSERT INTO categorias (nombre, color, icono, usuario_id) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('sssi', $nombre, $color, $icono, $userId);

    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stmt->close();
        $q = $conexion->prepare("SELECT * FROM categorias WHERE id = ?");
        $q->bind_param('i', $id);
        $q->execute();
        $categoria = $q->get_result()->fetch_assoc();
        $q->close();
        http_response_code(201);
        echo json_encode(["success" => true, "categoria" => $categoria]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al crear la categoría."]);
    }
}

// ── PUT: actualizar categoria ─────────────────────────────────────────────
elseif ($metodo === 'PUT') {
    $datos = json_decode(file_get_contents('php://input'), true) ?? [];
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }
    if (!categoriaEsDelUsuario($conexion, $id, $userId)) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Categoría no encontrada."]);
        exit;
    }

    $campos  = [];
    $tipos   = '';
    $valores = [];

    if (isset($datos['nombre'])) { $campos[] = 'nombre = ?'; $tipos .= 's'; $valores[] = trim($datos['nombre']); }
    if (isset($datos['color']) && preg_match('/^#[0-9A-Fa-f]{6}$/', $datos['color'])) {
        $campos[] = 'color = ?'; $tipos .= 's'; $valores[] = $datos['color'];
    }
    if (isset($datos['icono'])) { $campos[] = 'icono = ?'; $tipos .= 's'; $valores[] = trim($datos['icono']); }

    if (!$campos) {
        echo json_encode(["success" => false, "error" => "Sin campos para actualizar."]);
        exit;
    }

    $tipos .= 'i';
    $valores[] = $id;
    $sql = "UPDATE categorias SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param($tipos, ...$valores);
    echo json_encode(["success" => (bool) $stmt->execute()]);
}

// ── DELETE: eliminar categoria ────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    $datos = json_decode(file_get_contents('php://input'), true) ?? [];
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "error" => "ID requerido."]);
        exit;
    }
    if (!categoriaEsDelUsuario($conexion, $id, $userId)) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Categoría no encontrada."]);
        exit;
    }

    // Las tareas de esta categoria quedan sin categoria (no se eliminan)
    $stmtU = $conexion->prepare("UPDATE tareas SET categoria_id = NULL WHERE categoria_id = ?");
    $stmtU->bind_param('i', $id);
    $stmtU->execute();
    $stmtU->close();

    $stmt = $conexion->prepare("DELETE FROM categorias WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(["success" => (bool) $stmt->execute()]);
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido."]);
}

$conexion->close();
?>
