# 📘 Manual de Usuario - MultiSQLDeployer

¡Bienvenido a la herramienta definitiva para el despliegue masivo y seguro de SQL! **MultiSQLDeployer** ha sido diseñado para administradores de bases de datos y desarrolladores que necesitan ejecutar cambios en múltiples servidores simultáneamente sin riesgo de errores accidentales.

---

## 🚀 1. Gestión de Destinos (Sidebar)

El panel izquierdo es tu centro de mando para elegir dónde se ejecutará tu código.

*   **Entornos**: Los servidores están agrupados por entorno (💻 Desarrollo, 🧪 Pruebas, 🔥 Productivo). Cada uno tiene un color distintivo para que siempre sepas dónde estás operando.
*   **Selección Jerárquica**:
    *   Haz clic en el nombre del **Entorno** para seleccionar todos sus servidores.
    *   Haz clic en un **Servidor** para seleccionar todas sus bases de datos.
    *   Selecciona **Bases de Datos** individuales para un control total.
*   **Indicadores de Estado (Pings)**:
    *   🟢 **Verde**: Servidor online y listo.
    *   🔴 **Rojo**: Servidor inaccesible (caído o bloqueado por firewall). El sistema saltará estos destinos automáticamente para no bloquearte.
    *   🟡 **Amarillo**: Verificando conexión.

---

## 🛡️ 2. Protocolo de Seguridad: El Escudo "Dry Run"

Esta es la funcionalidad más importante de la aplicación. En la barra de herramientas verás un icono de **Escudo**.

*   🔵 **Modo Seguro (Escudo Azul)**: Es el estado por defecto. Al ejecutar, el sistema inicia una transacción, corre tu código y hace un **ROLLBACK** inmediatamente. Esto te permite ver si el código funciona y qué datos traería sin afectar la base de datos.
*   🔴 **MODO REAL (Escudo Rojo)**: Solo se activa haciendo clic explícito. Al ejecutar en este modo, los cambios **SÍ se guardan (COMMIT)**. 
    *   *Nota: Al finalizar una ejecución real, el sistema vuelve automáticamente al modo seguro por tu protección.*
*   🟣 **Validación de Sintaxis**: El botón del escudo con puntos suspensivos valida si el código es correcto y si los objetos (tablas, columnas) existen, sin llegar a ejecutar ninguna lógica de datos.

---

## 🪄 3. Generador "ALTER SMART"

Ubicado en la pestaña **GENERADOR** del sidebar. Olvídate de escribir largos scripts de migración a mano.

1.  **Refrescar Esquema**: Pon el nombre de la tabla y dale a 🔄 para ver las columnas actuales.
2.  **Columna Muestra**: Elige una columna existente para que el sistema aprenda el tipo de dato y genere el código necesario para copiar la información de una a otra.
3.  **Idempotencia**: El script generado incluye validaciones (`IF NOT EXISTS`) para que puedas correrlo mil veces sin errores.

---

## 📊 4. Panel de Resultados y Dashboards

Después de cada ejecución, el panel inferior se llenará de vida:

*   **Pestañas de Resultados**: Cada base de datos seleccionada tendrá su propia pestaña con el estado (Éxito/Error).
*   **DataGrid Avanzado**:
    *   **Reordenar**: Arrastra las columnas para ver los datos como prefieras.
    *   **Paginación**: Maneja miles de filas con fluidez (50 por página).
*   **Desacoplar (Snapshots)**: ¿Necesitas comparar resultados? Haz clic en **"Desacoplar"** para abrir los resultados en una ventana nativa independiente que puedes mover a otro monitor.
*   **Exportar**: Botón de descarga para generar un archivo **Excel (.xlsx)** instantáneo con tus resultados.

---

## ⌨️ 5. Atajos de Teclado Rápidos

*   `Ctrl + S`: Guardar script actual.
*   `Ctrl + O`: Abrir archivo SQL.
*   `Ctrl + F`: Formatear código (embellecer SQL).
*   `Ctrl + Enter`: Ejecutar (en el modo seleccionado).

---

**⚠️ RECORDATORIO IMPORTANTE**: Siempre verifica el color del escudo antes de presionar el botón de **Ejecutar**. ¡La seguridad es primero! 🛡️✨
