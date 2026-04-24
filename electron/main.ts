import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'node:fs/promises'
import sql from 'mssql'
import pg from 'pg'
import mysql from 'mysql2/promise'
import Store from 'electron-store'
import net from 'node:net'

const store = new Store()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure
//
// ├─┬─┬─ dist
// │ │ └── index.html
// │ │
// │ ├─┬─ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0b10',
      symbolColor: '#ffffff',
      height: 35
    },
    backgroundColor: '#0a0b10',
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// SQL Implementation
ipcMain.handle('execute-sql', async (_, { config, query, isDryRun, engine = 'mssql', checkSyntax = false }) => {
  if (engine === 'mssql') {
    try {
      const pool = await sql.connect({
        ...config,
        connectionTimeout: 5000,
        requestTimeout: 30000,
        options: {
          ...config.options,
          trustServerCertificate: true // Common for local/dev servers
        }
      })
      
      if (checkSyntax) {
        const request = new sql.Request(pool)
        await request.query('SET NOEXEC ON')
        try {
          await request.query(query)
          await request.query('SET NOEXEC OFF')
          return { success: true, message: 'Sintaxis y Objetos Válidos (MSSQL)' }
        } catch (err: any) {
          await request.query('SET NOEXEC OFF')
          return { success: false, error: err.message }
        }
      }

      if (isDryRun) {
        const transaction = new sql.Transaction(pool)
        await transaction.begin()
        try {
        const request = new sql.Request(transaction)
        const result = await request.query(query)
        await transaction.rollback()
        const columns = result.recordset && result.recordset.columns ? Object.keys(result.recordset.columns) : []
        return { success: true, data: result.recordset, columns, message: 'Dry run completed (Rolled back)' }
        } catch (err: any) {
          await transaction.rollback()
          return { success: false, error: err.message }
        }
      } else {
        const result = await pool.request().query(query)
        const columns = result.recordset && result.recordset.columns ? Object.keys(result.recordset.columns) : []
        return { success: true, data: result.recordset, columns, message: 'Ejecución exitosa' }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      await sql.close()
    }
  } else if (engine === 'postgres') {
    const client = new pg.Client({
      user: config.user,
      host: config.server,
      database: config.database,
      password: config.password,
      port: config.port || 5432,
      connectionTimeoutMillis: 5000,
      ssl: config.options?.encrypt ? { rejectUnauthorized: false } : false
    })
    try {
      await client.connect()
      if (checkSyntax || isDryRun) {
        await client.query('BEGIN')
        try {
          const result = await client.query(query)
          await client.query('ROLLBACK')
          const rows = Array.isArray(result) ? (result[result.length - 1]?.rows || []) : (result.rows || [])
          const fields = Array.isArray(result) ? (result[result.length - 1]?.fields || []) : (result.fields || [])
          const columns = fields.map((f: any) => f.name)
          return { 
            success: true, 
            data: rows, 
            columns,
            message: checkSyntax ? 'Sintaxis Válida (Postgres)' : 'Dry run completed (Rolled back)' 
          }
        } catch (err: any) {
          await client.query('ROLLBACK')
          return { success: false, error: err.message }
        }
      } else {
        const result = await client.query(query)
        const rows = Array.isArray(result) ? (result[result.length - 1]?.rows || []) : (result.rows || [])
        const fields = Array.isArray(result) ? (result[result.length - 1]?.fields || []) : (result.fields || [])
        const columns = fields.map((f: any) => f.name)
        return { success: true, data: rows, columns, message: 'Ejecución exitosa' }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      await client.end()
    }
  } else if (engine === 'mysql') {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: config.server,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port || 3306,
        connectTimeout: 5000,
        ssl: config.options?.encrypt ? { rejectUnauthorized: false } : undefined
      })
      if (checkSyntax || isDryRun) {
        await connection.beginTransaction()
        try {
          const [rows, fields]: any = await connection.execute(query)
          await connection.rollback()
          const columns = fields ? fields.map((f: any) => f.name) : []
          return { 
            success: true, 
            data: rows, 
            columns,
            message: checkSyntax ? 'Sintaxis Válida (MySQL)' : 'Dry run completed (Rolled back)' 
          }
        } catch (err: any) {
          await connection.rollback()
          return { success: false, error: err.message }
        }
      } else {
        const [rows, fields]: any = await connection.execute(query)
        const columns = fields ? fields.map((f: any) => f.name) : []
        return { success: true, data: rows, columns, message: 'Ejecución exitosa' }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      if (connection) await connection.end()
    }
  }
  return { success: false, error: 'Engine no soportado' }
})

// Configuration persistence handlers
ipcMain.handle('get-config', (_, key) => {
  return store.get(key)
})

ipcMain.handle('save-config', (_, { key, value }) => {
  store.set(key, value)
  return { success: true }
})

ipcMain.handle('get-databases', async (_, { config, engine = 'mssql' }) => {
  if (engine === 'mssql') {
    try {
      const pool = await sql.connect({ 
        ...config, 
        connectionTimeout: 10000, 
        requestTimeout: 10000,
        options: {
          trustServerCertificate: true
        }
      })
      const result = await pool.request().query("SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')")
      await sql.close()
      return { success: true, databases: result.recordset.map(r => r.name) }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      try { await sql.close() } catch (e) {}
    }
  } else if (engine === 'postgres') {
    const client = new pg.Client({
      user: config.user,
      host: config.server,
      password: config.password,
      port: config.port || 5432,
      database: 'postgres' // Default db to list others
    })
    try {
      await client.connect()
      const result = await client.query("SELECT datname as name FROM pg_database WHERE datistemplate = false AND datname != 'postgres'")
      return { success: true, databases: result.rows.map(r => r.name) }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      await client.end()
    }
  } else if (engine === 'mysql') {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: config.server,
        user: config.user,
        password: config.password,
        port: config.port || 3306
      })
      const [rows]: any = await connection.execute("SHOW DATABASES WHERE `Database` NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')")
      return { success: true, databases: rows.map((r: any) => r.Database) }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      if (connection) await connection.end()
    }
  }
  return { success: false, error: 'Engine no soportado' }
})

// Store snapshots in memory to pass between windows
const snapshots = new Map();

ipcMain.handle('open-snapshot-window', (event, data) => {
  const snapshotId = `snap_${Date.now()}`;
  snapshots.set(snapshotId, data);

  const snapshotWin = new BrowserWindow({
    width: 1000,
    height: 700,
    title: `Snapshot: ${data.db}`,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Remove menu for snapshots
  snapshotWin.setMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    snapshotWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?snapshotId=${snapshotId}`);
  } else {
    snapshotWin.loadFile(path.join(process.env.DIST, 'index.html'), {
      query: { snapshotId }
    });
  }
  
  return true;
});

ipcMain.handle('get-snapshot-data', (event, id) => {
  return snapshots.get(id);
});

// Fetch table and view names for IntelliSense
ipcMain.handle('get-schema', async (_event, { config, engine = 'mssql' }) => {
  if (engine === 'mssql') {
    try {
      const pool = await sql.connect({ 
        ...config, 
        options: { 
          ...config.options, 
          connectTimeout: 10000,
          trustServerCertificate: true
        } 
      });
      const result = await pool.request().query(`
        SELECT name FROM sys.tables
        UNION
        SELECT name FROM sys.views
        ORDER BY name ASC
      `);
      await sql.close();
      return { success: true, tables: result.recordset.map(r => r.name) };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      try { await sql.close() } catch (e) {}
    }
  } else if (engine === 'postgres') {
    const client = new pg.Client({
      user: config.user,
      host: config.server,
      database: config.database,
      password: config.password,
      port: config.port || 5432
    })
    try {
      await client.connect()
      const result = await client.query(`
        SELECT table_name as name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name ASC
      `)
      return { success: true, tables: result.rows.map(r => r.name) }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      await client.end()
    }
  } else if (engine === 'mysql') {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: config.server,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port || 3306
      })
      const [rows]: any = await connection.execute("SHOW TABLES")
      return { success: true, tables: rows.map((r: any) => Object.values(r)[0]) }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      if (connection) await connection.end()
    }
  }
  return { success: false, error: 'Engine no soportado' }
})

ipcMain.handle('get-columns', async (_, { config, table, engine = 'mssql' }) => {
  if (engine === 'mssql') {
    try {
      const pool = await sql.connect({ 
        ...config, 
        connectionTimeout: 10000,
        options: {
          trustServerCertificate: true
        }
      });
      const result = await pool.request().input('table', table).query(`
        SELECT COLUMN_NAME as name, DATA_TYPE as type, CHARACTER_MAXIMUM_LENGTH as length
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @table
        ORDER BY ORDINAL_POSITION
      `);
      await sql.close();
      return { success: true, columns: result.recordset };
    } catch (err: any) { return { success: false, error: err.message }; }
  } else if (engine === 'postgres' || engine === 'mysql') {
    const isPG = engine === 'postgres';
    let client: any;
    try {
      if (isPG) {
        client = new pg.Client({
          user: config.user,
          host: config.server,
          database: config.database,
          password: config.password,
          port: config.port || 5432
        });
        await client.connect();
        const res = await client.query("SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [table]);
        return { success: true, columns: res.rows };
      } else {
        client = await mysql.createConnection({
          host: config.server,
          user: config.user,
          password: config.password,
          database: config.database,
          port: config.port || 3306
        });
        const [rows]: any = await client.execute("SELECT COLUMN_NAME as name, DATA_TYPE as type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?", [table, config.database]);
        return { success: true, columns: rows };
      }
    } catch (err: any) { return { success: false, error: err.message }; }
    finally { if (client) isPG ? await client.end() : await client.end(); }
  }
  return { success: false, error: 'Engine no soportado' };
});

// File Management Handlers
ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Archivos SQL', extensions: ['sql'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (canceled) return null;

  try {
    const content = await fs.readFile(filePaths[0], 'utf8');
    return { content, filePath: filePaths[0] };
  } catch (err: any) {
    return { error: err.message };
  }
});

ipcMain.handle('save-file-dialog', async (_, { content, filePath }) => {
  let targetPath = filePath;

  if (!targetPath) {
    const { canceled, filePath: savedPath } = await dialog.showSaveDialog({
      filters: [
        { name: 'Archivos SQL', extensions: ['sql'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    if (canceled) return null;
    targetPath = savedPath;
  }

  try {
    await fs.writeFile(targetPath, content, 'utf8');
    return { success: true, filePath: targetPath };
  } catch (err: any) {
    return { error: err.message };
  }
});

ipcMain.handle('check-connection', async (_, { host, port, engine }) => {
  const defaultPorts: any = { mssql: 1433, postgres: 5432, mysql: 3306 };
  const targetPort = port || defaultPorts[engine] || 1433;
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500); // 2.5 seconds timeout
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ online: true });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ online: false, error: 'Timeout' });
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ online: false, error: err.message });
    });
    
    socket.connect(targetPort, host);
  });
});

