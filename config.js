// Configuración de pesos. Editar aquí para ajustar el comportamiento.

// Pesos del total de bebidas por pedido (1 a 10). 2-6 es lo más probable.
const DRINKS_WEIGHTS = [3, 10, 12, 10, 8, 6, 4, 3, 2, 1];

// Pesos por momento del día. Refrescos y agua siempre bajos.
const MOMENTS = [
  {
    key: "mediodia",
    label: "Pedido de mediodía",
    weights: {
      Cerveza: 0.34, Vermú: 0.26, Refresco: 0.15,
      "Tinto de verano": 0.10, Agua: 0.08, Cubata: 0.07,
    },
  },
  {
    key: "noche",
    label: "Pedido de noche",
    weights: {
      Cubata: 0.34, Cerveza: 0.28, Refresco: 0.17,
      Vermú: 0.10, Agua: 0.06, "Tinto de verano": 0.05,
    },
  },
];

// Exponer en el ámbito global para script.js
window.DRINKS_WEIGHTS = DRINKS_WEIGHTS;
window.MOMENTS = MOMENTS;
