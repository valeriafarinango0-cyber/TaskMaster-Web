<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Estados simples usados por el frontend
$estados = [
	["id" => 0, "clave" => "pendiente",   "label" => "Pendiente"],
	["id" => 1, "clave" => "completada",  "label" => "Completada"]
];

echo json_encode(["success" => true, "estados" => $estados]);
?>
<<<<<<< HEAD
=======

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
