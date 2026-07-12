<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include("../config/conexion.php");

$exists = $conexion->query("SHOW TABLES LIKE 'categorias'");
$categorias = [];
if ($exists && $exists->num_rows > 0) {
	$res = $conexion->query("SELECT * FROM categorias ORDER BY id ASC");
	while ($f = $res->fetch_assoc()) $categorias[] = $f;
} else {
	// fallback: categorías estáticas
	$categorias = [
		["id" => 1, "nombre" => "Personal"],
		["id" => 2, "nombre" => "Academico"],
		["id" => 3, "nombre" => "Trabajo"]
	];
}

echo json_encode(["success" => true, "categorias" => $categorias]);

$conexion->close();
?>

