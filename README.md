# Home Dashboard

Panel doméstico liviano para reutilizar una tablet vieja como tablero de tareas, compras y recordatorios.

## Qué incluye este prototipo

- Tablero responsive con **Hoy**, **Esta semana** y **Compras**.
- Alta rápida de tareas y compras.
- Asignación a Nico, Diana o Ambos.
- Fecha de vencimiento opcional.
- Recurrencias diarias, semanales o mensuales con intervalo configurable.
- Ventana de aparición configurable para las recurrentes (por defecto, 7 días antes).
- Editar, completar y eliminar sin recargar la página.
- Las recurrentes avanzan su fecha al completarse y vuelven a ocultarse hasta su próxima ventana.
- Persistencia local mediante `localStorage`, con fallback en memoria si el navegador lo bloquea.
- Modo reposo tras 60 segundos sin interacción: hora, fecha, pendientes y próximo recordatorio.
- Estado online/offline visible.

## Probarlo en una PC

La forma recomendada es servir la carpeta por HTTP:

```bash
cd home-dashboard
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080` en el navegador.

También se incluye una versión generada `home-dashboard-standalone.html` para probar la interfaz en un único archivo sin estructura de carpetas.

## Datos

En esta iteración los datos se guardan en el navegador del dispositivo. Esto sirve para probar el comportamiento y el diseño sin depender de servicios externos.

La capa de persistencia ya está separada de la interfaz para que la siguiente iteración pueda reemplazar `LocalTaskRepository` por un repositorio Supabase y sincronizar tablet + celulares.

## Próxima etapa

- Conectar Supabase y autenticación de las dos personas de la casa.
- Realtime entre tablet y celulares.
- Ajustar compatibilidad según la versión real de Android/WebView de la tablet Ceibal.
- Configurar Fully Kiosk para arranque automático y bloqueo del dispositivo.

## Tests

```bash
npm test
```

Las pruebas cubren recurrencias, fin de mes, visibilidad por ventana, doble completado, repositorio local y agrupación del tablero.
