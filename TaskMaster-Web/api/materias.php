<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include("../config/conexion.php");

$sql      = "SELECT * FROM materias ORDER BY id ASC";
$resultado= $conexion->query($sql);
$materias = [];

while ($fila = $resultado->fetch_assoc()) {
    $materias[] = $fila;
}

echo json_encode(["success" => true, "materias" => $materias]);

$conexion->close();
?>