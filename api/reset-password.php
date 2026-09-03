<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once(__DIR__ . '/../config/conexion.php');

// Migración defensiva: columnas para el token de recuperación.
$col = $conexion->query("SHOW COLUMNS FROM usuarios LIKE 'reset_token'");
if ($col && $col->num_rows === 0) {
    $conexion->query("ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(64) DEFAULT NULL, ADD COLUMN reset_token_expira DATETIME DEFAULT NULL");
}

$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

// ── Paso 1: el usuario pide el enlace de recuperación ───────────────────────
if ($action === 'request') {
    $email = trim($input['email'] ?? '');

    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = $conexion->prepare("SELECT id, nombre FROM usuarios WHERE email = ? LIMIT 1");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // Solo se genera/envía el token si la cuenta existe, pero la
        // respuesta al navegador es siempre la misma para no revelar
        // qué correos están registrados (evita enumeración de usuarios).
        if ($user) {
            $token   = bin2hex(random_bytes(32));
            $expira  = date('Y-m-d H:i:s', strtotime('+30 minutes'));

            $stmtU = $conexion->prepare("UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?");
            $stmtU->bind_param('ssi', $token, $expira, $user['id']);
            $stmtU->execute();
            $stmtU->close();

            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $link   = "$scheme://$host/index.html?reset=" . $token;

            $asunto  = 'Recupera tu contraseña de TaskMaster';
            $mensaje = "Hola " . $user['nombre'] . ",\n\n" .
                       "Recibimos una solicitud para restablecer tu contraseña. " .
                       "Este enlace es válido por 30 minutos:\n\n" . $link . "\n\n" .
                       "Si no fuiste tú, ignora este mensaje.";
            $headers = "From: no-reply@taskmaster.local\r\n" .
                       "Reply-To: no-reply@taskmaster.local\r\n" .
                       "Content-type: text/plain; charset=utf-8\r\n";

            $sent = false;
            try {
                $sent = mail($email, $asunto, $mensaje, $headers);
            } catch (Exception $e) {
                $sent = false;
            }

            if (!$sent) {
                $logline = date('c') . " | reset-password | to:$email | link:$link\n";
                file_put_contents(__DIR__ . '/notify.log', $logline, FILE_APPEND | LOCK_EX);
            }
        }
    }

    echo json_encode(["success" => true, "message" => "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."]);
    $conexion->close();
    exit;
}

// ── Paso 2: el usuario define la nueva contraseña con el token del enlace ──
if ($action === 'reset') {
    $token    = trim($input['token'] ?? '');
    $password = $input['password'] ?? '';

    if ($token === '' || strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Token inválido o contraseña muy corta (mínimo 8 caracteres)."]);
        $conexion->close();
        exit;
    }

    $stmt = $conexion->prepare("SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW() LIMIT 1");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "El enlace es inválido o ya expiró. Solicita uno nuevo."]);
        $conexion->close();
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmtU = $conexion->prepare("UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?");
    $stmtU->bind_param('si', $hash, $user['id']);
    $stmtU->execute();
    $stmtU->close();

    echo json_encode(["success" => true, "message" => "Contraseña actualizada. Ya puedes iniciar sesión."]);
    $conexion->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Acción no soportada."]);
$conexion->close();
