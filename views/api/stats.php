<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

session_start();
include_once(__DIR__ . '/../config/conexion.php');

$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

$desde = $_GET['desde'] ?? date('Y-m-d', strtotime('monday this week'));
$hasta = $_GET['hasta'] ?? date('Y-m-d', strtotime($desde . ' +6 days'));

$SELECT_BASE = "SELECT t.*, c.nombre AS categoria_nombre, c.color AS categoria_color
                FROM tareas t
                LEFT JOIN categorias c ON t.categoria_id = c.id";

if ($userId) {
    $stmt = $conexion->prepare("$SELECT_BASE WHERE t.usuario_id = ? AND DATE(t.fecha_limite) BETWEEN ? AND ?");
    $stmt->bind_param('iss', $userId, $desde, $hasta);
} else {
    $stmt = $conexion->prepare("$SELECT_BASE WHERE t.usuario_id IS NULL AND DATE(t.fecha_limite) BETWEEN ? AND ?");
    $stmt->bind_param('ss', $desde, $hasta);
}

$stmt->execute();
$resultado = $stmt->get_result();
$tareas = [];
while ($fila = $resultado->fetch_assoc()) {
    $tareas[] = $fila;
}
$stmt->close();

$pomodorosTotal = array_sum(array_column($tareas, 'pomodoros_real'));

// Racha de dias activos: dias consecutivos (incluyendo hoy) con al menos un pomodoro completado
$racha = 0;
if ($userId) {
    $stmtR = $conexion->prepare(
        "SELECT DISTINCT DATE(fecha_creacion) AS dia FROM tareas
         WHERE usuario_id = ? AND pomodoros_real > 0 ORDER BY dia DESC"
    );
    $stmtR->bind_param('i', $userId);
} else {
    $stmtR = $conexion->prepare(
        "SELECT DISTINCT DATE(fecha_creacion) AS dia FROM tareas
         WHERE usuario_id IS NULL AND pomodoros_real > 0 ORDER BY dia DESC"
    );
}
$stmtR->execute();
$dias = array_column($stmtR->get_result()->fetch_all(MYSQLI_ASSOC), 'dia');
$stmtR->close();

$cursor = new DateTime('today');
foreach ($dias as $dia) {
    if ($dia === $cursor->format('Y-m-d')) {
        $racha++;
        $cursor->modify('-1 day');
    } else {
        break;
    }
}

$conexion->close();

echo json_encode([
    "success"         => true,
    "desde"            => $desde,
    "hasta"            => $hasta,
    "tareas"           => $tareas,
    "pomodoros_total"  => (int) $pomodorosTotal,
    "racha_dias"       => $racha,
]);
?>
