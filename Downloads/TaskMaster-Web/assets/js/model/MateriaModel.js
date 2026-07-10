/**
 * CAPA MODEL — MateriaModel.js
 * Define las materias disponibles y sus colores.
 * No tiene lógica de UI ni acceso al DOM.
 */

class MateriaModel {

  constructor() {
    // Materias predeterminadas del proyecto
    this._materias = [
      { id: 1, nombre: 'Programación Web',         color: '#5C6BC0', bg: '#E8EAF6' },
      { id: 2, nombre: 'Seguridad Informática',    color: '#E91E63', bg: '#FCE4EC' },
      { id: 3, nombre: 'Aplicaciones Móviles',     color: '#FF6F00', bg: '#FFF3E0' },
      { id: 4, nombre: 'Gestión de Proyectos',     color: '#2E7D32', bg: '#E8F5E9' },
      { id: 5, nombre: 'Sistemas Cliente-Servidor',color: '#6A1B9A', bg: '#F3E5F5' },
      { id: 6, nombre: 'General',                  color: '#546E7A', bg: '#ECEFF1' },
    ];
  }

  /** Retorna todas las materias */
  getAll() { return [...this._materias]; }

  /** Busca materia por id */
  getById(id) { return this._materias.find(m => m.id === Number(id)) || this._materias[5]; }

  /** Busca materia por nombre */
  getByNombre(nombre) {
    return this._materias.find(m => m.nombre === nombre) || this._materias[5];
  }
}

// Instancia global compartida
const materiaModel = new MateriaModel();
