<?php

$conexion = new mysqli(
    "localhost",
    "root",
    "",
    "taskmaster_db"
);

if ($conexion->connect_error) {
    die("Error de conexión");
}

?>