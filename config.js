// Configuración de pesos. Editar aquí para ajustar el comportamiento.

// Pesos del total de bebidas por pedido (1 a 10). 2-6 es lo más probable.
const DRINKS_WEIGHTS = [3, 10, 12, 10, 8, 6, 4, 3, 2, 1];

// Pesos por momento del día. Refrescos y agua siempre bajos.
const MOMENTS = [
  {
    key: "mediodia",
    label: "Pedido de mediodía",
    weights: {
      Cerveza: 0.32, Vermú: 0.24, Refresco: 0.14,
      "Tinto de verano": 0.09, Vino: 0.07, Agua: 0.08, Cubata: 0.06,
    },
  },
  {
    key: "noche",
    label: "Pedido de noche",
    weights: {
      Cubata: 0.32, Cerveza: 0.27, Refresco: 0.16,
      Vermú: 0.09, "Tinto de verano": 0.05, Vino: 0.06, Agua: 0.05,
    },
  },
];

// Exponer en el ámbito global para script.js
window.DRINKS_WEIGHTS = DRINKS_WEIGHTS;
window.MOMENTS = MOMENTS;
