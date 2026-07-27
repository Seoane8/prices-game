# Cuenta mental — Práctica de sumas de precios

Web estática para practicar el cálculo mental de la cuenta de un pedido de bar (útil para trabajar de camarero en eventos).

Cada ronda genera un pedido aleatorio (nº y cantidades variables) y se evalúa el resultado y el tiempo. Hay tres modos de juego:

- **Sumar total**: escribe la suma del pedido.
- **Total + cambio**: primero calcula el total y, tras comprobarlo, el cliente paga y calculas el cambio a devolver.
- **Cambio (mental)**: se muestra el pedido y el pago del cliente; calcula el cambio mentalmente sin ver el total.

| Producto        | Precio (€) |
|-----------------|-----------:|
| Cerveza         | 2,50 |
| Tinto de verano | 2,50 |
| Refresco        | 2,50 |
| Cubata          | 5,00 |
| Vermú           | 3,00 |
| Agua            | 1,00 |

## Cómo usar

Abre `index.html` en cualquier navegador. Funciona offline.

- **Enter / Comprobar**: valida la respuesta (o arranca la siguiente ronda).
- **Esc**: vuelve a la pantalla de inicio.
- **Nueva ronda**: genera otro pedido.
- **Reiniciar estadísticas**: borra aciertos y mejor tiempo.
- Acepta punto o coma decimal al introducir cantidades.

## Desplegar en GitHub Pages

1. Sube el repositorio a GitHub.
2. `Settings` → `Pages`.
3. En «Source» selecciona la rama `main` y carpeta `/root`.
4. Guarda. En unos minutos estará en `https://<usuario>.github.io/prices-game/`.

No requiere build ni dependencias: es un único archivo HTML.