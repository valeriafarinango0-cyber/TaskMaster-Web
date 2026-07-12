<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$prioridad = $data['prioridad'] ?? 'Media';
$asunto = $data['asunto'] ?? 'Notificación TaskMaster';
$mensaje = $data['mensaje'] ?? '';

if (!$email) {
    echo json_encode(['success' => false, 'error' => 'Email requerido.']);
    exit;
}

// Intentar enviar usando mail(). Si no está disponible, guardar en log.
$headers = "From: no-reply@taskmaster.local\r\n" .
           "Reply-To: no-reply@taskmaster.local\r\n" .
           "Content-type: text/plain; charset=utf-8\r\n";

$sent = @mail($email, $asunto, $mensaje, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    // Log fallback
    $logline = date('c') . " | to:$email | pri:$prioridad | subj:$asunto | msg:" . str_replace(["\n","\r"], [' ',' '], $mensaje) . "\n";
    file_put_contents(__DIR__ . '/notify.log', $logline, FILE_APPEND | LOCK_EX);
    echo json_encode(['success' => false, 'warning' => 'No se pudo enviar correo; registro en log.']);
}

?>
