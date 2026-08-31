/**
 * CAPA MODEL — CategoriaModel.js
 * Categorías propias del usuario: {id, nombre, color, icono}.
 * Consumo de api/categorias.php con fallback a localStorage.
 */

class CategoriaModel {

    constructor() {
<<<<<<< HEAD
        this.API_CATEGORIAS = 'api/categorias.php';
        this._categorias = [];
    }

=======
        this.API_CATEGORIAS = 'api/categorias';
        this._categorias = [];
    }

    _usuarioId() {
        try {
            const u = JSON.parse(localStorage.getItem('tm_user') || 'null');
            return u && u.id != null ? u.id : null;
        } catch (e) {
            return null;
        }
    }

>>>>>>> claude/imagenes-iconos-categorias-qdq8s1
    // ── Fallback localStorage ─────────────────────────────────────────────────
    _lsGet() {
        const guardadas = JSON.parse(localStorage.getItem('tm_categorias') || 'null');
        if (guardadas) return guardadas;
        // Semilla inicial universal (no académica) para que la app no arranque vacía
        return [
            { id: 1, nombre: 'Trabajo',   color: '#00C9FF', icono: '💼' },
            { id: 2, nombre: 'Personal',  color: '#92FE9D', icono: '🌿' },
            { id: 3, nombre: 'Hogar',     color: '#F093FB', icono: '🏠' },
            { id: 4, nombre: 'Salud',     color: '#F5576C', icono: '❤' },
            { id: 5, nombre: 'Finanzas',  color: '#FFC107', icono: '💰' },
            { id: 6, nombre: 'Proyectos', color: '#7C4DFF', icono: '🚀' },
        ];
    }
    _lsSave(categorias) { localStorage.setItem('tm_categorias', JSON.stringify(categorias)); }
    _lsNextId() {
        const c = this._lsGet();
        return c.length ? Math.max(...c.map(x => x.id)) + 1 : 1;
    }

    // ── GET: todas las categorías ─────────────────────────────────────────────
    async getAll() {
        try {
<<<<<<< HEAD
            const res  = await fetch(this.API_CATEGORIAS, { credentials: 'include' });
=======
            const usuarioId = this._usuarioId();
            const url = usuarioId != null ? `${this.API_CATEGORIAS}?usuario_id=${usuarioId}` : this.API_CATEGORIAS;
            const res  = await fetch(url, { credentials: 'include' });
>>>>>>> claude/imagenes-iconos-categorias-qdq8s1
            const data = await res.json();
            if (res.ok && data.success && data.categorias.length) {
                this._categorias = data.categorias;
                this._lsSave(this._categorias);
                return this._categorias;
            }
        } catch (e) {
            console.warn('API de categorías no disponible — usando localStorage', e);
        }
        this._categorias = this._lsGet();
        return this._categorias;
    }

    // ── POST: crear categoría ─────────────────────────────────────────────────
    async create({ nombre, color = '#00C9FF', icono = '' }) {
        nombre = (nombre || '').trim();
        if (!nombre) return { success: false, error: 'El nombre de la categoría es obligatorio.' };

        try {
            const res  = await fetch(this.API_CATEGORIAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
<<<<<<< HEAD
                body: JSON.stringify({ nombre, color, icono })
=======
                body: JSON.stringify({ nombre, color, icono, usuario_id: this._usuarioId() })
>>>>>>> claude/imagenes-iconos-categorias-qdq8s1
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this._categorias.push(data.categoria);
                this._lsSave(this._categorias);
                return { success: true, categoria: data.categoria };
            }
            return data;
        } catch (e) {
            const nueva = { id: this._lsNextId(), nombre, color, icono };
            const arr = this._lsGet();
            arr.push(nueva);
            this._lsSave(arr);
            this._categorias = arr;
            return { success: true, categoria: nueva };
        }
    }

    getById(id) {
        return this._categorias.find(c => c.id === Number(id)) || null;
    }

    getCached() { return [...this._categorias]; }
}

const categoriaModel = new CategoriaModel();
