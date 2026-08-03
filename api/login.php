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
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrecta"]);
    exit;
}

$stmt = $conexion->prepare("SELECT id, nombre, password_hash FROM usuarios WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrecta"]);
    $conexion->close();
    exit;
}

$_SESSION['user_id'] = $user['id'];

echo json_encode(["success" => true, "user" => ["id" => $user['id'], "nombre" => $user['nombre'], "email" => $email]]);
$conexion->close();
?>
