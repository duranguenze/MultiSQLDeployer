# MultiSQLDeployer - Especificaciones de Proyecto

## 🎯 Objetivo
Crear una herramienta de escritorio robusta y estética para el despliegue masivo de código SQL en múltiples entornos (Desarrollo, Pruebas, Producción) de forma simultánea, garantizando la seguridad mediante un sistema de "Dry Run" persistente.

---

## 🏛️ Patrón de Diseño Sugerido: **Clean Architecture + Command Pattern**

Para este proyecto, sugiero una combinación de **Clean Architecture** y el **Patrón Command**:

1.  **Clean Architecture**:
    *   **Capa de Presentación (Electron/React/CSS)**: Interfaz de usuario premium con manejo de estados para los paneles.
    *   **Capa de Dominio (Entidades/Casos de Uso)**: Lógica de qué es un "Despliegue", reglas del "Dry Run" y validación de sintaxis.
    *   **Capa de Infraestructura (Drivers SQL)**: Conexiones reales a MSSQL/PostgreSQL/MySQL.
2.  **Command Pattern**:
    *   Cada ejecución SQL se encapsula en un objeto `SQLCommand`.
    *   Este objeto tiene métodos `execute()` y `validate()`. 
    *   El modo **Dry Run** simplemente llama a `validate()` (o ejecuta en una transacción que hace rollback), mientras que el modo real llama a `execute()`.

---

## 🏗️ Estructura de la Interfaz (UX/UI)

### 1. Panel Lateral (Selector de Destinos)
*   Agrupación por Servidor y Base de Datos.
*   Checkboxes para selección múltiple.
*   Indicadores visuales de estado (Dev/Test/Prod) con colores distintivos.

### 2. Panel Central (Editor SQL)
*   Editor con resaltado de sintaxis (Monaco Editor o CodeMirror).
*   Barra de herramientas superior con botón de "Ejecutar".

### 3. Sistema de Seguridad "Dry Run"
*   **Switch de Dry Run**: Siempre visible.
*   **Lógica Forzada**: Si el usuario lo desactiva para una ejecución real, el sistema debe reactivarlo automáticamente al finalizar, evitando ejecuciones accidentales futuras en producción.

### 4. Panel de Resultados (Output)
*   Terminal con scroll infinito.
*   Pestañas por servidor para ver resultados individuales.
*   Resaltado de errores en rojo y éxitos en verde neón.

---

## 🛠️ Stack Tecnológico Propuesto
*   **Framework**: [Electron.js](https://www.electronjs.org/) (Desktop Core).
*   **Frontend**: React + Vite (Velocidad y Componentización).
*   **Styling**: CSS Vanilla con variables (Modern Dark Mode, Glassmorphism).
*   **Base de Datos**: `mssql` (para SQL Server) preparado para Multi-motor.
*   **Almacenamiento Local**: `electron-store` para guardar preferencias de servidores.

---

## 🚀 Próximos Pasos (Checklist de Agentes)
- [x] Inicializar proyecto Electron + Vite + React.
- [x] Configurar el sistema de archivos y carpetas (Clean Architecture).
- [x] Diseñar la base del sistema de estilos (index.css) con estética Premium.
- [x] Implementar la estructura de 3 paneles en React.
- [x] Desarrollar el componente de Dry Run con auto-reactivación lógica.
- [x] Persistencia de preferencias con `electron-store`.
- [x] Implementar el motor de conexión SQL real en el Main Process (IPC).
- [x] Integrar "Test Connection" para listar bases de datos dinámicamente.
- [x] Integrate Monaco Editor para una experiencia de SQL Manager real.
- [x] Autocompletado inteligente (IntelliSense) basado en esquema real (Persistente).
- [x] Dashboard de Resultados Profesional con DataGrid avanzado (Paginación, Exportación, Reordenamiento).
- [x] Sistema de Snapshots en ventanas nativas independientes.
- [x] Barra de Herramientas Compacta (Clean Ribbon) con Tooltips y gestión de archivos.
- [x] Soporte Multi-Motor: PostgreSQL y MySQL (Arquitectura preparada).
- [x] Blindaje de Ejecución (Offline Guard): Sistema de pings y timeouts (5s) para evitar bloqueos por servidores inaccesibles.
- [x] Generador ALTER SMART: Creación de scripts de migración de columnas con lógica de copia de datos (UPDATE) e idempotencia nativa.
- [x] Soporte para Certificados Auto-firmados (SSL Trust): Conexiones seguras a servidores de desarrollo sin errores de TLS.
- [x] Estabilidad de UI: Optimización de Monaco Editor (remeasureFonts) y blindaje de IPC contra estructuras circulares (Nuclear Cleanup).

---

## 💡 Notas Técnicas y Soluciones
- **Problema de IPC**: Se detectó un error de carga del `preload.js` debido a que Electron no soporta ESM en scripts sandboxed por defecto.
- **Solución**: Se forzó el empaquetado de `preload.ts` a CommonJS (CJS) y se reescribió para usar `require`, asegurando compatibilidad total con el sandbox de Electron.
- **Soporte Multi-Motor**: La arquitectura de IPC está lista para recibir drivers de `pg` (PostgreSQL) y `mysql2` (MySQL).
- **Dashboard de Resultados**: Se implementó un `DataGrid` desacoplado de la barra de herramientas para evitar parpadeos y permitir scroll fluido con encabezados fijos.
- **Ventanas de Snapshot**: Se optimizó la carga de snapshots usando `URLSearchParams` para evitar el "flash" de la UI principal antes de cargar los datos en ventanas nativas.
- **Nueva Barra de Herramientas**: Se implementó una "Clean Ribbon" con tooltips, gestión de archivos (O/S/As) y control unificado de seguridad.
- **Blindaje de Ejecución (Offline Guard)**: Se implementó una verificación de TCP (ping rápido) antes de cualquier operación de base de datos. Esto evita que la aplicación se "congele" durante 30 segundos si un servidor está caído o bloqueado por firewall.
- **Generador ALTER SMART**: Se desarrolló una herramienta que no solo genera el `ALTER TABLE`, sino que permite elegir una "Columna Muestra" para autodefinir el tipo de dato y generar automáticamente el `UPDATE` para migrar los datos de la columna original a la nueva. Todo encapsulado en lógica de "IF NOT EXISTS" para MSSQL, Postgres y MySQL.
- **Resiliencia de UI (Monaco + IPC)**: Se resolvieron problemas de desfase del cursor mediante el uso de `remeasureFonts()` y sincronización con el evento de carga de fuentes del sistema. Además, se implementó un `cleanForIpc` nuclear para evitar errores de clonación de objetos (como `Window` o `Circular References`) al enviar resultados pesados a través del puente de Electron.
- **Soporte SSL Trust**: Se forzó la opción `trustServerCertificate: true` en todos los puntos de conexión de MSSQL para permitir el trabajo fluido en entornos de desarrollo con certificados auto-firmados.
