<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$prioridades = [
	["clave"=>"Alta",  "label"=>"Alta"],
	["clave"=>"Media", "label"=>"Media"],
	["clave"=>"Baja",  "label"=>"Baja"]
];

echo json_encode(["success"=>true, "prioridades"=>$prioridades]);
?>
<<<<<<< HEAD
=======

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
