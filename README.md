# 🛡️ MultiSQLDeployer

### **La herramienta definitiva para el despliegue masivo y seguro de SQL.**

**MultiSQLDeployer** es una aplicación de escritorio premium diseñada para administradores de bases de datos y desarrolladores que necesitan ejecutar cambios en múltiples servidores y entornos de forma simultánea, sin sacrificar la seguridad ni la velocidad.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.0.1-green.svg)
![Tech](https://img.shields.io/badge/stack-Electron%20%7C%20React%20%7C%20Vite-blueviolet)

---

## 🌟 Características Principales

### 🚀 Despliegue Multi-Entorno
Ejecuta tus scripts SQL en decenas de bases de datos al mismo tiempo. Organiza tus servidores por entornos (**Desarrollo**, **Pruebas**, **Producción**) con códigos de colores claros para evitar confusiones.

### 🛡️ Sistema "Dry Run" Persistente
La seguridad es nuestra prioridad. Por defecto, todas las ejecuciones se realizan en **Modo Seguro (Rollback Automático)**. Solo cuando activas explícitamente el **Modo Real (Commit)** se aplican los cambios. Al finalizar, el sistema vuelve automáticamente al modo seguro.

### 🪄 Generador "ALTER SMART"
Crea scripts de migración inteligentes. No solo genera el `ALTER TABLE`, sino que también incluye lógica de validación (`IF NOT EXISTS`) y generación automática de `UPDATE` para migrar datos entre columnas basándose en tipos de datos detectados.

### 📊 Dashboard de Resultados Profesional
- **DataGrid Avanzado**: Paginación, reordenamiento de columnas y scroll fluido.
- **Snapshots Nativos**: ¿Necesitas comparar resultados? Abre cualquier pestaña de resultados en una ventana nativa independiente de Windows.
- **Exportación**: Descarga tus resultados directamente a **Excel (.xlsx)** con un clic.

### ⌨️ Experiencia de Desarrollo Premium
- **Monaco Editor Integrado**: La misma potencia de VS Code para escribir tus queries.
- **Offline Guard**: Sistema de pings inteligentes que evita que la app se congele si un servidor está fuera de línea.
- **Diseño Moderno**: Interfaz oscura con estética *Glassmorphism* y micro-animaciones.

---

## 🛠️ Stack Tecnológico

- **Core**: [Electron.js](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Styling**: Vanilla CSS (Custom Design System)
- **Motores Soportados**: MSSQL (SQL Server), PostgreSQL, MySQL.

---

## 🚀 Instalación y Desarrollo

### Requisitos previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [Git](https://git-scm.com/)

### Pasos para iniciar en local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/duranguenze/MultiSQLDeployer.git
   cd MultiSQLDeployer
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   ```
   *El ejecutable se generará en la carpeta `/release`.*

---

## 🛡️ Protocolo de Seguridad

| Modo | Escudo | Acción |
| :--- | :---: | :--- |
| **Seguro** | 🔵 Azul | Inicia transacción -> Ejecuta SQL -> **ROLLBACK** |
| **Real** | 🔴 Rojo | Inicia transacción -> Ejecuta SQL -> **COMMIT** |
| **Validación** | 🟣 Morado | Verifica sintaxis y existencia de objetos sin ejecutar datos |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ por [duranguenze](https://github.com/duranguenze)
