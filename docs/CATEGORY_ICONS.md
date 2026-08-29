# Iconos y Recursos de Categorías

## Descripción General

Este documento describe los iconos SVG y recursos visuales disponibles para cada categoría de tareas en TaskMaster.

## Estructura de Directorios

```
assets/
├── icons/
│   └── categories/
│       ├── trabajo.svg
│       ├── personal.svg
│       ├── hogar.svg
│       ├── salud.svg
│       ├── finanzas.svg
│       ├── proyectos.svg
│       └── estudio.svg
└── img/
    └── empty-states/
        ├── trabajo-vacio.svg
        ├── personal-vacio.svg
        ├── hogar-vacio.svg
        ├── salud-vacio.svg
        ├── finanzas-vacio.svg
        ├── proyectos-vacio.svg
        └── estudio-vacio.svg
```

## Categorías Disponibles

### 1. Trabajo 💼
- **Icono**: `assets/icons/categories/trabajo.svg`
- **Color**: `#7C4DFF` (Púrpura)
- **Fondo**: `#F3E5F5`
- **Estado Vacío**: `assets/img/empty-states/trabajo-vacio.svg`
- **Uso**: Tareas relacionadas con trabajo y labores profesionales

### 2. Personal 👤
- **Icono**: `assets/icons/categories/personal.svg`
- **Color**: `#FFB020` (Naranja)
- **Fondo**: `#FFF3E0`
- **Estado Vacío**: `assets/img/empty-states/personal-vacio.svg`
- **Uso**: Tareas personales y de desarrollo individual

### 3. Hogar 🏠
- **Icono**: `assets/icons/categories/hogar.svg`
- **Color**: `#FF6B6B` (Rojo)
- **Fondo**: `#FFEBEE`
- **Estado Vacío**: `assets/img/empty-states/hogar-vacio.svg`
- **Uso**: Tareas del hogar y actividades domésticas

### 4. Salud ❤️
- **Icono**: `assets/icons/categories/salud.svg`
- **Color**: `#00C876` (Verde)
- **Fondo**: `#E8F5E9`
- **Estado Vacío**: `assets/img/empty-states/salud-vacio.svg`
- **Uso**: Tareas relacionadas con salud y bienestar

### 5. Finanzas 💰
- **Icono**: `assets/icons/categories/finanzas.svg`
- **Color**: `#1E88E5` (Azul)
- **Fondo**: `#E3F2FD`
- **Estado Vacío**: `assets/img/empty-states/finanzas-vacio.svg`
- **Uso**: Tareas de gestión financiera y presupuestos

### 6. Proyectos 📋
- **Icono**: `assets/icons/categories/proyectos.svg`
- **Color**: `#E040FB` (Magenta)
- **Fondo**: `#F3E5F5`
- **Estado Vacío**: `assets/img/empty-states/proyectos-vacio.svg`
- **Uso**: Tareas de proyectos y metas a largo plazo

### 7. Estudio 📚
- **Icono**: `assets/icons/categories/estudio.svg`
- **Color**: `#00BCD4` (Cian)
- **Fondo**: `#E0F2F1`
- **Estado Vacío**: `assets/img/empty-states/estudio-vacio.svg`
- **Uso**: Tareas relacionadas con aprendizaje y educación

## Cómo Usar los Iconos

### En JavaScript (usando categoryIcons.js)

```javascript
// Incluir el archivo de configuración
<script src="assets/js/config/categoryIcons.js"></script>

// Obtener recursos de una categoría
const recursos = getCategoryResources('Trabajo');
console.log(recursos.color); // #7C4DFF
console.log(recursos.icon);  // /assets/icons/categories/trabajo.svg

// Funciones de utilidad
const color = getCategoryColor('Trabajo');           // #7C4DFF
const icono = getCategoryIcon('Trabajo');            // /assets/icons/categories/trabajo.svg
const empty = getCategoryEmptyState('Trabajo');      // /assets/img/empty-states/trabajo-vacio.svg
const emoji = getCategoryEmoji('Trabajo');           // 💼
```

### En HTML (carga de iconos)

```html
<!-- Icono simple -->
<img src="assets/icons/categories/trabajo.svg" alt="Trabajo" />

<!-- Con estilos CSS -->
<div class="category-badge" style="background-color: #7C4DFF;">
  <img src="assets/icons/categories/trabajo.svg" alt="Trabajo" />
  <span>Trabajo</span>
</div>

<!-- Estado vacío -->
<div class="empty-state">
  <img src="assets/img/empty-states/trabajo-vacio.svg" alt="Sin tareas de trabajo" />
</div>
```

### En CSS

```css
/* Usar como background */
.trabajo {
  background: url('assets/icons/categories/trabajo.svg') no-repeat center;
  background-size: contain;
  background-color: #F3E5F5;
}

/* Con color de frontera */
.trabajo-badge {
  border-left: 4px solid #7C4DFF;
  background-color: #F3E5F5;
}
```

## Guía de Colores

La paleta de colores fue diseñada para:
- Ser diferenciable y accesible
- Funcionar en modo claro y oscuro
- Mantener coherencia visual con el diseño de TaskMaster

| Categoría | Color Principal | Color de Fondo |
|-----------|-----------------|----------------|
| Trabajo | #7C4DFF | #F3E5F5 |
| Personal | #FFB020 | #FFF3E0 |
| Hogar | #FF6B6B | #FFEBEE |
| Salud | #00C876 | #E8F5E9 |
| Finanzas | #1E88E5 | #E3F2FD |
| Proyectos | #E040FB | #F3E5F5 |
| Estudio | #00BCD4 | #E0F2F1 |

## Personalización

Para personalizar los iconos o colores:

1. **Editar colores**: Modifica los valores en `categoryIcons.js`
2. **Cambiar iconos**: Reemplaza los archivos SVG en `assets/icons/categories/`
3. **Estados vacíos**: Modifica los archivos SVG en `assets/img/empty-states/`

## Accesibilidad

- Todos los iconos tienen atributos `alt` descriptivos
- Los colores cumplen con ratios de contraste WCAG AA
- Los SVG están optimizados para lectores de pantalla

## Notas Técnicas

- Los SVG usan `currentColor` para adaptarse al color del texto
- Los gradientes están inlineados para mejor compatibilidad
- El tamaño base de los iconos es 64x64px (SVG escalable)
- Las imágenes de estado vacío son 300x300px

## Próximas Mejoras

- [ ] Iconos adicionales para categorías personalizadas
- [ ] Animaciones para los iconos
- [ ] Temas de colores personalizables
- [ ] Soporte para iconos oscuros/claros específicos
