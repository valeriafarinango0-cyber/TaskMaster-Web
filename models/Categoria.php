<?php
class Categoria {
	private $conn;
	public function __construct($conexion) { $this->conn = $conexion; }

	public function all() {
		$sql = "SELECT * FROM categorias ORDER BY id ASC";
		$res = $this->conn->query($sql);
		$rows = [];
		if ($res) {
			while ($r = $res->fetch_assoc()) $rows[] = $r;
		}
		return $rows;
	}

	public function find(int $id) {
		$id = intval($id);
		$res = $this->conn->query("SELECT * FROM categorias WHERE id = $id LIMIT 1");
		return $res ? $res->fetch_assoc() : null;
	}

	public function create(array $data) {
		$nombre = $this->conn->real_escape_string(trim($data['nombre'] ?? ''));
		if ($nombre === '') return null;
		$sql = "INSERT INTO categorias (nombre) VALUES ('$nombre')";
		if ($this->conn->query($sql)) {
			return $this->find($this->conn->insert_id);
		}
		return null;
	}

	public function update(int $id, array $data) {
		$id = intval($id);
		if (!isset($data['nombre'])) return false;
		$nombre = $this->conn->real_escape_string(trim($data['nombre']));
		return $this->conn->query("UPDATE categorias SET nombre = '$nombre' WHERE id = $id");
	}

	public function delete(int $id) {
		$id = intval($id);
		return $this->conn->query("DELETE FROM categorias WHERE id = $id");
	}
}

?>
