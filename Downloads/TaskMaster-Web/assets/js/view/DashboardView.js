/**
 * CAPA VIEW — DashboardView.js
 * Renderiza el dashboard semanal: gráfico por materia, Pomodoros y avance.
 */

class DashboardView {

  constructor(viewModel) {
    this._vm = viewModel;
    this.$barChart       = document.getElementById('bar-chart');
    this.$pomStats       = document.getElementById('pomodoro-stats');
    this.$materiaProgress= document.getElementById('materia-progress');
  }

  render() {
    const { porDia, pomHoy, avanceMaterias, materias } = this._vm.getDatosDashboard();
    this._renderBarChart(porDia, materias);
    this._renderPomStats(pomHoy);
    this._renderMateriaProgress(avanceMaterias);
  }

  _renderBarChart(porDia, materias) {
    const MAX = 6;
    this.$barChart.innerHTML = porDia.map(({ dia, tareas, esHoy }) => {
      const overload = tareas.length >= MAX;
      // Agrupar segmentos por materia
      const segmentos = materias.map(m => {
        const n = tareas.filter(t => t.materia_id === m.id).length;
        if (!n) return '';
        const h = Math.round((n / MAX) * 90);
        return `<div class="bar-stack-seg" style="height:${h}px;background:${m.color}"></div>`;
      }).join('');

      return `
        <div class="bar-day ${overload ? 'bar-day--overload' : ''}">
          <div class="bar-day__stacks">${segmentos || '<div style="height:4px;width:100%;background:#E0E0E0;border-radius:3px"></div>'}</div>
          <span class="bar-day__label">${esHoy ? `<b>${dia}</b>` : dia} ${overload ? '⚠' : ''}</span>
        </div>`;
    }).join('');
  }

  _renderPomStats(pomHoy) {
    this.$pomStats.innerHTML = `
      <div class="pom-stat">
        <div class="pom-stat__num">🍅 ${pomHoy}</div>
        <div class="pom-stat__label">Pomodoros hoy</div>
      </div>
      <div class="pom-stat">
        <div class="pom-stat__num">⏱ ${pomHoy * 25}</div>
        <div class="pom-stat__label">Minutos de enfoque</div>
      </div>`;
  }

  _renderMateriaProgress(avance) {
    if (!avance.length) {
      this.$materiaProgress.innerHTML = '<p style="color:var(--color-text-muted);font-size:13px">Sin datos aún.</p>';
      return;
    }
    this.$materiaProgress.innerHTML = avance.map(({ materia, pct }) => `
      <div class="mat-prog-row">
        <span class="mat-prog-name" style="color:${materia.color}">${materia.nombre}</span>
        <div class="mat-prog-bar">
          <div class="mat-prog-fill" style="width:${pct}%;background:${materia.color}"></div>
        </div>
        <span class="mat-prog-pct" style="color:${materia.color}">${pct}%</span>
      </div>`).join('');
  }
}
