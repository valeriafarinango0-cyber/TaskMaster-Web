<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

session_start();
include_once(__DIR__ . '/../config/conexion.php');
include_once(__DIR__ . '/../models/usuarios.php');

$userModel = new Usuario($conexion);
$metodo = $_SERVER['REQUEST_METHOD'];
// Todas las operaciones sobre datos de usuario actúan sobre la sesión activa,
// nunca sobre un id que envíe el navegador (evita leer/editar/borrar cuentas ajenas).
$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

if ($metodo === 'GET') {
	if (!$userId) { http_response_code(401); echo json_encode(["success"=>false, "error"=>"No autenticado."]); exit; }
	echo json_encode(["success"=>true, "usuario" => $userModel->find($userId)]);
}
elseif ($metodo === 'POST') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$u = $userModel->create($datos);
	if ($u) { http_response_code(201); echo json_encode(["success"=>true, "usuario"=>$u]); }
	else echo json_encode(["success"=>false, "error"=>"Error creando usuario"]);
}
elseif ($metodo === 'PUT') {
	if (!$userId) { http_response_code(401); echo json_encode(["success"=>false, "error"=>"No autenticado."]); exit; }
	$datos = json_decode(file_get_contents('php://input'), true);
	$ok = $userModel->update($userId, $datos);
	echo json_encode(["success"=>(bool)$ok]);
}
elseif ($metodo === 'DELETE') {
	if (!$userId) { http_response_code(401); echo json_encode(["success"=>false, "error"=>"No autenticado."]); exit; }

	$datos    = json_decode(file_get_contents('php://input'), true) ?? [];
	$password = $datos['password'] ?? '';
	if ($password === '') {
		http_response_code(400);
		echo json_encode(["success"=>false, "error"=>"Se requiere la contraseña para eliminar la cuenta."]);
		exit;
	}

	$stmt = $conexion->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
	$stmt->bind_param('i', $userId);
	$stmt->execute();
	$fila = $stmt->get_result()->fetch_assoc();
	$stmt->close();

	if (!$fila || !password_verify($password, $fila['password_hash'])) {
		http_response_code(401);
		echo json_encode(["success"=>false, "error"=>"Contraseña incorrecta."]);
		exit;
	}

	$ok = $userModel->delete($userId);
	if ($ok) {
		$_SESSION = [];
		session_destroy();
	}
	echo json_encode(["success"=>(bool)$ok]);
}
else { http_response_code(405); echo json_encode(["success"=>false, "error"=>"Método no permitido"]); }

$conexion->close();

?>

