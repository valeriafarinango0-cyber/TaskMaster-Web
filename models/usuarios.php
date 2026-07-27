<?php
class Usuario {
	private $conn;
	public function __construct($conexion) { $this->conn = $conexion; }

	public function all() {
		$res = $this->conn->query("SELECT id, nombre, email, fecha_creacion FROM usuarios ORDER BY id ASC");
		$rows = [];
		if ($res) while ($r = $res->fetch_assoc()) $rows[] = $r;
		return $rows;
	}

	public function find(int $id) {
		$id = intval($id);
		$res = $this->conn->query("SELECT id, nombre, email, fecha_creacion FROM usuarios WHERE id = $id LIMIT 1");
		return $res ? $res->fetch_assoc() : null;
	}

	public function create(array $data) {
		$nombre = $this->conn->real_escape_string(trim($data['nombre'] ?? ''));
		$email  = $this->conn->real_escape_string(trim($data['email'] ?? ''));
		if ($nombre === '' || $email === '') return null;
		$sql = "INSERT INTO usuarios (nombre, email) VALUES ('$nombre', '$email')";
		if ($this->conn->query($sql)) return $this->find($this->conn->insert_id);
		return null;
	}

	public function update(int $id, array $data) {
		$id = intval($id);
		$sets = [];
		if (isset($data['nombre'])) $sets[] = "nombre = '".$this->conn->real_escape_string($data['nombre'])."'";
		if (isset($data['email']))  $sets[] = "email  = '".$this->conn->real_escape_string($data['email'])."'";
		if (empty($sets)) return false;
		$sql = "UPDATE usuarios SET " . implode(', ', $sets) . " WHERE id = $id";
		return $this->conn->query($sql);
	}

	public function delete(int $id) {
		$id = intval($id);
		return $this->conn->query("DELETE FROM usuarios WHERE id = $id");
	}
}

?>
