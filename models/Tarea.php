<?php
class Tarea {
	private $conn;

	public function __construct($conexion) {
		$this->conn = $conexion;
	}

	public function all() {
		$sql = "SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color
				FROM tareas t
				LEFT JOIN materias m ON t.materia_id = m.id
				ORDER BY t.completada ASC, t.fecha_limite ASC";

		$res = $this->conn->query($sql);
		$rows = [];
		while ($r = $res->fetch_assoc()) {
			$rows[] = $r;
		}
		return $rows;
	}

	public function find(int $id) {
		$id = intval($id);
		$sql = "SELECT t.*, m.nombre AS materia_nombre, m.color AS materia_color
				FROM tareas t
				LEFT JOIN materias m ON t.materia_id = m.id
				WHERE t.id = ? LIMIT 1";
		$stmt = $this->conn->prepare($sql);
		$stmt->bind_param('i', $id);
		$stmt->execute();
		$res = $stmt->get_result();
		return $res->fetch_assoc() ?: null;
	}

	public function create(array $data) {
		$sql = "INSERT INTO tareas
			(titulo, descripcion, materia_id, prioridad, fecha_limite, pomodoros_est, min_anticipacion, completada, pomodoros_real)
			VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)";

		$titulo = $this->conn->real_escape_string(trim($data['titulo'] ?? ''));
		$descripcion = $this->conn->real_escape_string(trim($data['descripcion'] ?? ''));
		$materia_id = intval($data['materia_id'] ?? 6);
		$prioridad = $this->conn->real_escape_string($data['prioridad'] ?? 'Media');
		$fecha_limite = $this->conn->real_escape_string($data['fecha_limite'] ?? null);
		$pomodoros_est = intval($data['pomodoros_est'] ?? 1);
		$min_anticipacion = intval($data['min_anticipacion'] ?? 30);

		$stmt = $this->conn->prepare($sql);
		$stmt->bind_param('ssissii', $titulo, $descripcion, $materia_id, $prioridad, $fecha_limite, $pomodoros_est, $min_anticipacion);

		if ($stmt->execute()) {
			$id = $this->conn->insert_id;
			return $this->find($id);
		}
		return null;
	}

	public function update(int $id, array $data) {
		$allowed = ['titulo','descripcion','materia_id','prioridad','fecha_limite','pomodoros_est','pomodoros_real','completada','min_anticipacion'];
		$sets = [];
		$types = '';
		$values = [];

		foreach ($allowed as $field) {
			if (array_key_exists($field, $data)) {
				$sets[] = "$field = ?";
				if (in_array($field, ['materia_id','pomodoros_est','pomodoros_real','completada','min_anticipacion'])) {
					$types .= 'i';
					$values[] = intval($data[$field]);
				} else {
					$types .= 's';
					$values[] = $this->conn->real_escape_string($data[$field]);
				}
			}
		}

		if (empty($sets)) return false;

		$sql = "UPDATE tareas SET " . implode(', ', $sets) . " WHERE id = ?";
		$types .= 'i';
		$values[] = $id;

		$stmt = $this->conn->prepare($sql);
		// bind dynamically
		$bind_names[] = $types;
		for ($i=0; $i<count($values); $i++) {
			$bind_name = 'bind'.$i;
			$$bind_name = $values[$i];
			$bind_names[] = &$$bind_name;
		}
		call_user_func_array([$stmt, 'bind_param'], $bind_names);
		return $stmt->execute();
	}

	public function delete(int $id) {
		$id = intval($id);
		// eliminar alertas primero
		$this->conn->query("DELETE FROM alertas WHERE tarea_id = $id");
		$stmt = $this->conn->prepare("DELETE FROM tareas WHERE id = ?");
		$stmt->bind_param('i', $id);
		return $stmt->execute();
	}

	public function weeklyLoad(string $desde, string $hasta) {
		// devuelve cantidad de tareas por materia entre dos fechas
		$sql = "SELECT m.id, m.nombre, m.color, COUNT(t.id) AS total
				FROM materias m
				LEFT JOIN tareas t ON t.materia_id = m.id AND DATE(t.fecha_limite) BETWEEN ? AND ?
				GROUP BY m.id
				ORDER BY m.id";
		$stmt = $this->conn->prepare($sql);
		$stmt->bind_param('ss', $desde, $hasta);
		$stmt->execute();
		$res = $stmt->get_result();
		$rows = [];
		while ($r = $res->fetch_assoc()) $rows[] = $r;
		return $rows;
	}
}

?>

