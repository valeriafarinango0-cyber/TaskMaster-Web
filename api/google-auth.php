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

// Client ID de la app en Google Cloud Console (no es secreto: viaja también
// en el frontend). Configurable por entorno; el valor por defecto es el que
// ya usa integraciones/.env para este mismo proyecto.
$googleClientId = getenv('GOOGLE_CLIENT_ID') ?: '1047323212016-hanf3ml2lg14ltd61j7naso03p3o53qj.apps.googleusercontent.com';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$credential = trim($input['credential'] ?? '');

if ($credential === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Falta el token de Google."]);
    exit;
}

// Verifica el ID token con el endpoint tokeninfo de Google en vez de confiar
// en datos que mande el navegador. No se usa una librería JWT local porque
// el proyecto no tiene un gestor de dependencias PHP (Composer/vendor).
$verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
$respuesta = @file_get_contents($verifyUrl);
$payload   = $respuesta ? json_decode($respuesta, true) : null;

if (!$payload || !isset($payload['aud']) || $payload['aud'] !== $googleClientId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Token de Google inválido."]);
    exit;
}
if (($payload['email_verified'] ?? 'false') !== 'true' || empty($payload['email'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "El correo de Google no está verificado."]);
    exit;
}
if (isset($payload['exp']) && intval($payload['exp']) < time()) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "El token de Google expiró, intenta de nuevo."]);
    exit;
}

$email  = trim($payload['email']);
$nombre = trim($payload['name'] ?? explode('@', $email)[0]);

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
