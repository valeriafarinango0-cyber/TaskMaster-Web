/**
 * CAPA VIEW — SemanaView.js
 * Pantalla 4: Vista semanal — gráfico apilado por categoría,
 * alerta de sobrecarga, progreso por categoría y mini estadísticas.
 */

class SemanaView {

  constructor(viewModel) {
    this._vm = viewModel;

    this.$rango           = document.getElementById('semana-rango');
    this.$resumen         = document.getElementById('semana-resumen');
    this.$barChart        = document.getElementById('bar-chart');
    this.$materiaProgress = document.getElementById('materia-progress');
    this.$pomStats        = document.getElementById('pomodoro-stats');
  }

  render() {
    const datos = this._vm.getDatosSemana();
    const { texto } = this._vm.getRangoSemana();

    this.$rango.textContent = texto;
    this._renderResumen(datos);
    this._renderBarChart(datos.porDia, datos.categorias);
    this._renderCategoriaProgress(datos.avanceCategorias);
    this._renderMiniStats(datos);
  }

  _renderResumen({ urgentes, medias, completadas }) {
    this.$resumen.innerHTML = `
      <span class="badge badge--danger">🔴 ${urgentes} urgentes</span>
      <span class="badge badge--warning">🟣 ${medias} medias</span>
      <span class="badge badge--success">✓ ${completadas} completadas</span>
    `;
  }

  _renderBarChart(porDia, categorias) {
    const MAX = 5; // HU: alerta de sobrecarga a partir de 5 tareas/día

    this.$barChart.innerHTML = porDia.map(({ dia, tareas, esHoy }) => {
      const overload = tareas.length > MAX;
      const segmentos = categorias.map(c => {
        const n = tareas.filter(t => Number(t.categoria_id) === Number(c.id)).length;
        if (!n) return '';
        const h = Math.max(6, Math.round((n / Math.max(MAX, tareas.length)) * 100));
        return `<div class="bar-stack-seg" style="height:${h}px;background:${c.color}" title="${c.nombre}: ${n}"></div>`;
      }).join('');

      return `
        <div class="bar-day ${overload ? 'bar-day--overload' : ''}">
          <div class="bar-day__stacks">${segmentos || '<div style="height:4px;width:100%;background:rgba(255,255,255,.08);border-radius:3px"></div>'}</div>
          <span class="bar-day__label">${esHoy ? `<b>${dia}</b>` : dia} ${overload ? '⚠' : ''}</span>
        </div>`;
    }).join('');
  }

  _renderCategoriaProgress(avance) {
    if (!avance.length) {
      this.$materiaProgress.innerHTML = '<p style="color:var(--muted);font-size:13px">Sin tareas esta semana.</p>';
      return;
    }
    this.$materiaProgress.innerHTML = avance.map(({ categoria, pct }) => `
      <div class="mat-prog-row">
        <span class="mat-prog-name" style="color:${categoria.color}">${categoria.icono || ''} ${categoria.nombre}</span>
        <div class="mat-prog-bar">
          <div class="mat-prog-fill" style="width:${pct}%;background:${categoria.color}"></div>
        </div>
        <span class="mat-prog-pct">${pct}%</span>
      </div>`).join('');
  }

  _renderMiniStats({ pomSemana, racha }) {
    this.$pomStats.innerHTML = `
      <div class="pom-stat">
        <div class="pom-stat__num">🍅 ${pomSemana}</div>
        <div class="pom-stat__label">Pomodoros esta semana</div>
      </div>
      <div class="pom-stat">
        <div class="pom-stat__num">🔥 ${racha}</div>
        <div class="pom-stat__label">Racha de días activos</div>
      </div>`;
  }
}
