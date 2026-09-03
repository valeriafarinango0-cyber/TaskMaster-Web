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

// El destinatario siempre es el correo de la sesión activa — nunca uno que
// mande el navegador — para no convertir este endpoint en un relay abierto.
$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'Inicia sesión para recibir notificaciones por correo.']);
    exit;
}

$stmt = $conexion->prepare("SELECT email FROM usuarios WHERE id = ?");
$stmt->bind_param('i', $userId);
$stmt->execute();
$fila = $stmt->get_result()->fetch_assoc();
$stmt->close();

$email = $fila['email'] ?? '';
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'No se encontró un correo válido para esta cuenta.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$prioridad = $data['prioridad'] ?? 'Media';
$asunto = $data['asunto'] ?? 'Notificación TaskMaster';
$mensaje = $data['mensaje'] ?? '';

// Intentar enviar usando mail(). Si no está disponible, guardar en log.
$headers = "From: no-reply@taskmaster.local\r\n" .
           "Reply-To: no-reply@taskmaster.local\r\n" .
           "Content-type: text/plain; charset=utf-8\r\n";

$sent = false;
try {
    $sent = mail($email, $asunto, $mensaje, $headers);
} catch (Exception $e) {
    $sent = false;
}

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    // Log fallback
    $logline = date('c') . " | to:$email | pri:$prioridad | subj:$asunto | msg:" . str_replace(["\n","\r"], [' ',' '], $mensaje) . "\n";
    file_put_contents(__DIR__ . '/notify.log', $logline, FILE_APPEND | LOCK_EX);
    echo json_encode(['success' => false, 'warning' => 'No se pudo enviar correo; registro en log.']);
}

?>
