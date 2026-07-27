<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include_once(__DIR__ . '/../config/conexion.php');
include_once(__DIR__ . '/../models/Categoria.php');

$catModel = new Categoria($conexion);
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
	if (!empty($_GET['id'])) {
		$id = intval($_GET['id']);
		echo json_encode(["success"=>true, "categoria" => $catModel->find($id)]);
		exit;
	}
	echo json_encode(["success"=>true, "categorias" => $catModel->all()]);
}
elseif ($metodo === 'POST') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$c = $catModel->create($datos);
	if ($c) { http_response_code(201); echo json_encode(["success"=>true, "categoria"=>$c]); }
	else echo json_encode(["success"=>false, "error"=>"Error creando categoria"]);
}
elseif ($metodo === 'PUT') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$id = intval($datos['id'] ?? 0);
	if (!$id) { echo json_encode(["success"=>false, "error"=>"ID requerido"]); exit; }
	$ok = $catModel->update($id, $datos);
	echo json_encode(["success"=>(bool)$ok]);
}
elseif ($metodo === 'DELETE') {
	$datos = json_decode(file_get_contents('php://input'), true);
	$id = intval($datos['id'] ?? 0);
	if (!$id) { echo json_encode(["success"=>false, "error"=>"ID requerido"]); exit; }
	$ok = $catModel->delete($id);
	echo json_encode(["success"=>(bool)$ok]);
}
else { http_response_code(405); echo json_encode(["success"=>false, "error"=>"Método no permitido"]); }

$conexion->close();

?>

