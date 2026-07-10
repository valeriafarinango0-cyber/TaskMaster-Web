<?php

include("../config/conexion.php");

$sql = "SELECT * FROM tareas";

$resultado = $conexion->query($sql);

$tareas = [];

while($fila = $resultado->fetch_assoc()){
    $tareas[] = $fila;
}

header("Content-Type: application/json");

echo json_encode($tareas);

?>