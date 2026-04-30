# 05 — guía de escalabilidad (manual del desarrollador)

esta guía explica cómo extender el sistema de horas extra siguiendo los patrones de diseño establecidos, garantizando que el nuevo código sea coherente y mantenible.

## cómo agregar una nueva funcionalidad en el frontend

1.  **componente**: si es un elemento visual nuevo, créalo en `src/components/ui`. si es una característica completa, usa `src/components/feature`.
2.  **página**: si la funcionalidad requiere una nueva url, crea un componente en `src/pages` y regístralo en el enrutador principal.
3.  **servicio**: define las llamadas a la api en un nuevo archivo dentro de `src/services` para mantener la lógica de fetching separada de la vista.

## cómo agregar un nuevo endpoint en el backend

1.  **modelo / tipo**: define la interfaz o el esquema de los datos en `src/types`.
2.  **servicio**: implementa la lógica de persistencia o procesamiento en `src/services`.
3.  **controlador**: crea el manejador de la petición en `src/controllers`.
4.  **ruta**: registra el endpoint en el archivo correspondiente dentro de `src/routes`.

## mejores prácticas (clean code)

- **tipado estricto**: utiliza typescript en todo momento para evitar errores en tiempo de ejecución.
- **componentes pequeños**: si un componente supera las 200 líneas de código, considera dividirlo en subcomponentes más pequeños.
- **nombramiento**: usa nombres descriptivos en español (o inglés según la convención del equipo) que reflejen la intención del código.
- **comentarios**: documenta la lógica compleja o las decisiones de diseño no obvias, siguiendo el estilo de "tipo oración".

---
> [!TIP]
> antes de implementar una nueva funcionalidad, revisa si ya existen componentes o utilidades que puedas reutilizar para mantener la consistencia visual y técnica.
