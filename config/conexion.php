<?php

// Variables de entorno del hosting (ej. hPanel -> Node.js/PHP -> Environment
// Variables). Si no están definidas, usa los valores por defecto de XAMPP local.
$conexion = new mysqli(
    getenv('DB_HOST') ?: "localhost",
    getenv('DB_USER') ?: "root",
    getenv('DB_PASSWORD') ?: "",
    getenv('DB_NAME') ?: "taskmaster_db"
);

if ($conexion->connect_error) {
    die("Error de conexion");
}

?>
