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

// Asegura la tabla de usuarios y columnas necesarias
$conexion->query("CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$nombre   = trim($input['nombre'] ?? '');
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($nombre === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios."]);
    exit;
}

$stmt = $conexion->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "El correo ya está registrado."]);
    $stmt->close();
    $conexion->close();
    exit;
}
$stmt->close();

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conexion->prepare("INSERT INTO usuarios (nombre, email, password_hash, auth_provider) VALUES (?, ?, ?, 'local')");
$stmt->bind_param('sss', $nombre, $email, $passwordHash);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al crear el usuario."]);
    $stmt->close();
    $conexion->close();
    exit;
}
$userId = $stmt->insert_id;
$stmt->close();

$_SESSION['user_id'] = $userId;

echo json_encode(["success" => true, "user" => ["id" => $userId, "nombre" => $nombre, "email" => $email]]);
$conexion->close();
?>
<<<<<<< HEAD
=======

>>>>>>> claude/imagenes-iconos-categorias-qdq8s1
