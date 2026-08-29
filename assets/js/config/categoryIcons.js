/**
 * Configuración de iconos y colores para categorías
 * Mapea cada categoría a sus iconos, colores y recursos
 */

const CATEGORY_RESOURCES = {
  'Trabajo': {
    icon: '/assets/icons/categories/trabajo.svg',
    color: '#7C4DFF',
    bgColor: '#F3E5F5',
    emptyState: '/assets/img/empty-states/trabajo-vacio.svg',
    emoji: '💼'
  },
  'Personal': {
    icon: '/assets/icons/categories/personal.svg',
    color: '#FFB020',
    bgColor: '#FFF3E0',
    emptyState: '/assets/img/empty-states/personal-vacio.svg',
    emoji: '👤'
  },
  'Hogar': {
    icon: '/assets/icons/categories/hogar.svg',
    color: '#FF6B6B',
    bgColor: '#FFEBEE',
    emptyState: '/assets/img/empty-states/hogar-vacio.svg',
    emoji: '🏠'
  },
  'Salud': {
    icon: '/assets/icons/categories/salud.svg',
    color: '#00C876',
    bgColor: '#E8F5E9',
    emptyState: '/assets/img/empty-states/salud-vacio.svg',
    emoji: '❤️'
  },
  'Finanzas': {
    icon: '/assets/icons/categories/finanzas.svg',
    color: '#1E88E5',
    bgColor: '#E3F2FD',
    emptyState: '/assets/img/empty-states/finanzas-vacio.svg',
    emoji: '💰'
  },
  'Proyectos': {
    icon: '/assets/icons/categories/proyectos.svg',
    color: '#E040FB',
    bgColor: '#F3E5F5',
    emptyState: '/assets/img/empty-states/proyectos-vacio.svg',
    emoji: '📋'
  },
  'Estudio': {
    icon: '/assets/icons/categories/estudio.svg',
    color: '#00BCD4',
    bgColor: '#E0F2F1',
    emptyState: '/assets/img/empty-states/estudio-vacio.svg',
    emoji: '📚'
  },
  'Bienestar': {
    icon: '/assets/icons/categories/personal.svg',
    color: '#FF1744',
    bgColor: '#FCE4EC',
    emptyState: '/assets/img/empty-states/salud-vacio.svg',
    emoji: '🧘'
  },
  'Recados': {
    icon: '/assets/icons/categories/hogar.svg',
    color: '#FF8C00',
    bgColor: '#FFF3E0',
    emptyState: '/assets/img/empty-states/hogar-vacio.svg',
    emoji: '🛒'
  },
  'Planificación': {
    icon: '/assets/icons/categories/proyectos.svg',
    color: '#6C63FF',
    bgColor: '#F0E6FF',
    emptyState: '/assets/img/empty-states/proyectos-vacio.svg',
    emoji: '📅'
  },
  'Otros': {
    icon: '/assets/icons/categories/personal.svg',
    color: '#999999',
    bgColor: '#F5F5F5',
    emptyState: '/assets/img/empty-states/personal-vacio.svg',
    emoji: '📌'
  }
};

/**
 * Obtiene los recursos (icono, color, etc.) de una categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {object} Objeto con recursos de la categoría
 */
function getCategoryResources(categoryName) {
  return CATEGORY_RESOURCES[categoryName] || CATEGORY_RESOURCES['Otros'];
}

/**
 * Obtiene el icono SVG de una categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} Ruta del archivo SVG
 */
function getCategoryIcon(categoryName) {
  return getCategoryResources(categoryName).icon;
}

/**
 * Obtiene el color de una categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} Color en formato hex
 */
function getCategoryColor(categoryName) {
  return getCategoryResources(categoryName).color;
}

/**
 * Obtiene la imagen de estado vacío de una categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} Ruta de la imagen
 */
function getCategoryEmptyState(categoryName) {
  return getCategoryResources(categoryName).emptyState;
}

/**
 * Obtiene el emoji de una categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} Emoji de la categoría
 */
function getCategoryEmoji(categoryName) {
  return getCategoryResources(categoryName).emoji;
}
