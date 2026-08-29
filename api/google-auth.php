<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
include_once(__DIR__ . '/../config/conexion.php');

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$nombre = trim($input['nombre'] ?? '');

if ($email === '' || $nombre === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos de Google insuficientes."]);
    exit;
}

$conexion->query("CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$stmt = $conexion->prepare("SELECT id, nombre FROM usuarios WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    $fakeHash = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
    $stmt = $conexion->prepare("INSERT INTO usuarios (nombre, email, password_hash, auth_provider) VALUES (?, ?, ?, 'google')");
    $stmt->bind_param('sss', $nombre, $email, $fakeHash);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error creando usuario de Google."]);
        $stmt->close();
        $conexion->close();
        exit;
    }
    $user = ["id" => $stmt->insert_id, "nombre" => $nombre];
    $stmt->close();
}

$_SESSION['user_id'] = $user['id'];

echo json_encode(["success" => true, "user" => ["id" => $user['id'], "nombre" => $user['nombre'], "email" => $email]]);
$conexion->close();
?>

