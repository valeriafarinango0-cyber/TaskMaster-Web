/**
 * CAPA MODEL — TaskModel.js
 * Consumo de la API PHP (api/tareas.php) — sigue siendo la fuente de verdad.
 * Login opcional: sin sesión, la API trabaja en modo invitado.
 * Fallback automático a localStorage cuando no hay conexión.
 *
 * Sincronización en tiempo real (Firestore, opcional):
 * cada create/update/delete que confirma la API PHP se espeja además en
 * Firestore (colección "tareas", documento = id numérico de MySQL). Otras
 * pestañas/dispositivos escuchan esos cambios via subscribeRealtime() y
 * se actualizan sin necesidad de refrescar. Si Firestore no está disponible
 * (sin conexión, reglas que lo impiden, etc.) todo esto falla en silencio:
 * la app sigue funcionando igual con PHP + localStorage.
 */

class TaskModel {

    constructor() {
        this.API_TAREAS = 'api/tareas.php';
        this._tareas = [];
    }

    // ── Fallback localStorage ─────────────────────────────────────────────────
    _lsGet()        { return JSON.parse(localStorage.getItem('tm_tareas') || '[]'); }
    _lsSave(tareas) { localStorage.setItem('tm_tareas', JSON.stringify(tareas)); }
    _lsNextId() {
        const t = this._lsGet();
        return t.length ? Math.max(...t.map(x => x.id)) + 1 : 1;
    }

    // ── Firestore: espejo best-effort de cada operación confirmada por PHP ─────
    _fb() { return window.__firebase || null; }

    async _fbMirrorSet(tarea) {
        const fb = this._fb();
        if (!fb || !tarea || tarea.id == null) return;
        try {
            await fb.setDoc(fb.doc(fb.db, 'tareas', String(tarea.id)), tarea, { merge: true });
        } catch (e) {
            console.warn('Firestore: no se pudo sincronizar la tarea', e.code || e);
        }
    }

    async _fbMirrorDelete(id) {
        const fb = this._fb();
        if (!fb || id == null) return;
        try {
            await fb.deleteDoc(fb.doc(fb.db, 'tareas', String(id)));
        } catch (e) {
            console.warn('Firestore: no se pudo eliminar la tarea remota', e.code || e);
        }
    }

    /**
     * Escucha cambios en tiempo real desde Firestore (otras pestañas/dispositivos)
     * y llama a onChange(tareasActualizadas) cuando algo cambia.
     * Devuelve la función de "unsubscribe", o null si Firestore no está disponible.
     */
    subscribeRealtime(onChange) {
        const fb = this._fb();
        if (!fb) return null;
        try {
            return fb.onSnapshot(fb.collection(fb.db, 'tareas'), snapshot => {
                let cambio = false;
                snapshot.docChanges().forEach(change => {
                    const data = { ...change.doc.data(), id: Number(change.doc.id) };
                    const idx  = this._tareas.findIndex(t => t.id === data.id);
                    if (change.type === 'removed') {
                        if (idx >= 0) { this._tareas.splice(idx, 1); cambio = true; }
                    } else if (idx >= 0) {
                        this._tareas[idx] = { ...this._tareas[idx], ...data };
                        cambio = true;
                    } else {
                        this._tareas.push(data);
                        cambio = true;
                    }
                });
                if (cambio) {
                    this._lsSave(this._tareas);
                    onChange([...this._tareas]);
                }
            }, err => console.warn('Firestore: escucha en tiempo real interrumpida', err.code || err));
        } catch (e) {
            console.warn('Firestore: no se pudo suscribir a cambios en tiempo real', e.code || e);
            return null;
        }
    }

    // ── GET: todas las tareas ─────────────────────────────────────────────────
    async getAll() {
        try {
            const res  = await fetch(this.API_TAREAS, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                this._tareas = data.tareas;
                this._lsSave(this._tareas);
                return this._tareas;
            }
        } catch (e) {
            console.warn('API no disponible — usando localStorage', e);
        }
        this._tareas = this._lsGet();
        return this._tareas;
    }

    // ── POST: crear tarea ─────────────────────────────────────────────────────
    async create(tarea) {
        if (!tarea.titulo || tarea.titulo.trim() === '') {
            return { success: false, error: 'El título es obligatorio.' };
        }
        if (!tarea.fecha_limite) {
            return { success: false, error: 'La fecha límite es obligatoria.' };
        }
        try {
            const res  = await fetch(this.API_TAREAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(tarea)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this._tareas.push(data.tarea);
                this._lsSave(this._tareas);
                this._fbMirrorSet(data.tarea);
                return { success: true, tarea: data.tarea };
            }
            return data;
        } catch (e) {
            const nueva = { ...tarea, id: this._lsNextId(), completada: 0, pomodoros_real: 0 };
            const arr = this._lsGet();
            arr.push(nueva);
            this._lsSave(arr);
            this._tareas = arr;
            this._fbMirrorSet(nueva);
            return { success: true, tarea: nueva };
        }
    }

    // ── PUT: actualizar tarea ─────────────────────────────────────────────────
    async update(id, cambios) {
        try {
            const res  = await fetch(this.API_TAREAS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id, ...cambios })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this._tareas = this._tareas.map(t => t.id === id ? { ...t, ...cambios } : t);
                this._lsSave(this._tareas);
                this._fbMirrorSet(this._tareas.find(t => t.id === id));
                return { success: true };
            }
            const arr = this._lsGet().map(t => t.id === id ? { ...t, ...cambios } : t);
            this._lsSave(arr);
            this._tareas = arr;
            return { success: false, error: data.error || 'No se pudo actualizar la tarea.' };
        } catch (e) {
            const arr = this._lsGet().map(t => t.id === id ? { ...t, ...cambios } : t);
            this._lsSave(arr);
            this._tareas = arr;
            this._fbMirrorSet(arr.find(t => t.id === id));
            return { success: true };
        }
    }

    // ── DELETE: eliminar tarea ────────────────────────────────────────────────
    async delete(id) {
        try {
            const res  = await fetch(this.API_TAREAS, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this._tareas = this._tareas.filter(t => t.id !== id);
                this._lsSave(this._tareas);
                this._fbMirrorDelete(id);
                return { success: true };
            }
            const arr = this._lsGet().filter(t => t.id !== id);
            this._lsSave(arr);
            this._tareas = arr;
            return { success: false, error: data.error || 'No se pudo eliminar la tarea.' };
        } catch (e) {
            const arr = this._lsGet().filter(t => t.id !== id);
            this._lsSave(arr);
            this._tareas = arr;
            this._fbMirrorDelete(id);
            return { success: true };
        }
    }

    // ── Toggle completada ─────────────────────────────────────────────────────
    async toggleCompleta(id) {
        const tarea = this._tareas.find(t => t.id === id);
        if (!tarea) return { success: false };
        return this.update(id, { completada: tarea.completada ? 0 : 1 });
    }

    // ── Urgencia dinámica (HU-02): 0-100% según proximidad a la fecha límite ───
    calcularUrgencia(fechaLimite) {
        if (!fechaLimite) return 0;
        const ahora    = new Date();
        const limite   = new Date(fechaLimite);
        const creacion = new Date(limite.getTime() - 7 * 24 * 60 * 60 * 1000);
        const total    = limite - creacion;
        const trans    = ahora - creacion;
        return Math.min(100, Math.max(0, Math.round((trans / total) * 100)));
    }

    etiquetaFecha(fechaLimite) {
        if (!fechaLimite) return { texto: 'Sin fecha', clase: 'vence--normal' };
        const ahora  = new Date();
        const limite = new Date(fechaLimite);
        const diff   = limite - ahora;
        const horas  = Math.floor(diff / 3_600_000);
        const dias   = Math.floor(diff / 86_400_000);
        if (diff < 0)   return { texto: 'Vencida',       clase: 'vence--hoy' };
        if (horas < 24) return { texto: `Hoy · ${horas}h`, clase: 'vence--hoy' };
        if (dias === 1) return { texto: 'Mañana',        clase: 'vence--pronto' };
        if (dias  < 3)  return { texto: `${dias} días`,  clase: 'vence--pronto' };
        return { texto: limite.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), clase: 'vence--normal' };
    }

    agruparPorDia(tareas, inicioSemana) {
        const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        const base = inicioSemana ? new Date(inicioSemana) : new Date();
        const hoy  = new Date();
        const res  = dias.map((d, i) => {
            const fecha = new Date(base);
            fecha.setDate(base.getDate() - base.getDay() + i);
            return {
                dia: d,
                fecha,
                tareas: [],
                esHoy: fecha.toDateString() === hoy.toDateString(),
            };
        });
        tareas.forEach(t => {
            if (!t.fecha_limite) return;
            const f = new Date(t.fecha_limite);
            const idx = res.findIndex(r => r.fecha.toDateString() === f.toDateString());
            if (idx >= 0) res[idx].tareas.push(t);
        });
        return res;
    }

    getCached() { return [...this._tareas]; }
}

const taskModel = new TaskModel();
