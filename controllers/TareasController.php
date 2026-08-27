<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit;
}

include_once(__DIR__ . '/../config/conexion.php');
include_once(__DIR__ . '/../models/Tarea.php');

$tareaModel = new Tarea($conexion);
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
	// soporta ?id= o ?action=weekly&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
	if (!empty($_GET['id'])) {
		$id = intval($_GET['id']);
		$res = $tareaModel->find($id);
		echo json_encode(["success" => true, "tarea" => $res]);
		exit;
	}
	if (!empty($_GET['action']) && $_GET['action'] === 'weekly') {
		$desde = $_GET['desde'] ?? date('Y-m-d');
		$hasta = $_GET['hasta'] ?? date('Y-m-d', strtotime('+6 days'));
		$res = $tareaModel->weeklyLoad($desde, $hasta);
		echo json_encode(["success" => true, "data" => $res]);
		exit;
	}

	$all = $tareaModel->all();
	echo json_encode(["success" => true, "tareas" => $all]);
}

elseif ($metodo === 'POST') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$t = $tareaModel->create($datos);
	if ($t) {
		http_response_code(201);
		echo json_encode(["success" => true, "tarea" => $t]);
	} else {
		echo json_encode(["success" => false, "error" => "Error al crear tarea."]);
	}
}

elseif ($metodo === 'PUT') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$id = intval($datos['id'] ?? 0);
	if (!$id) { echo json_encode(["success"=>false, "error"=>"ID requerido."]); exit; }
	$ok = $tareaModel->update($id, $datos);
	echo json_encode(["success" => $ok]);
}

elseif ($metodo === 'DELETE') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$id = intval($datos['id'] ?? 0);
	if (!$id) { echo json_encode(["success"=>false, "error"=>"ID requerido."]); exit; }
	$ok = $tareaModel->delete($id);
	echo json_encode(["success" => $ok]);
}

else {
	http_response_code(405);
	echo json_encode(["success" => false, "error" => "Método no permitido."]);
}

$conexion->close();

?>

