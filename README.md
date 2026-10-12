# Home Dashboard

Panel doméstico liviano para reutilizar una tablet vieja como tablero de tareas, compras y recordatorios.

## Estado actual

- GitHub Pages como frontend público.
- Supabase Auth + PostgreSQL + RLS para datos privados.
- Hogar compartido entre Nico y Diana.
- Sincronización de tareas entre tablet y celulares.
- Compatibilidad especial para navegador Android antiguo.
- Tablero con **Hoy**, **Esta semana** y **Compras**.
- Alta rápida con plantillas domésticas y fechas simples: **Sin fecha**, **Hoy**, **Mañana**, **+7 días** u otra fecha manual.
- Recurrencias diarias, semanales o mensuales.
- Edición, completado y eliminación sin recargar la página.
- Modo reposo tipo reloj de pared con hora grande, fecha, pendientes y próximo recordatorio.

## Desarrollo local

```bash
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080`.

## Configuración

El frontend lee la configuración de Supabase desde `config.js`. En GitHub Pages ese archivo se genera durante el deploy usando los secretos del repositorio:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Nunca se debe exponer una `service_role` o secret key en el frontend.

## Tests

```bash
npm test
```

Las pruebas cubren dominio de tareas, recurrencias, Supabase, compatibilidad legacy, fechas rápidas, plantillas y UX de tablet.
