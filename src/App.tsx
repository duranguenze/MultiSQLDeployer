import { useState, useEffect, useRef } from 'react'
import {
  Database,
  Server,
  Play,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ShieldEllipsis,
  Settings,
  Terminal,
  Layers,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Download,
  List as ListIcon,
  ExternalLink,
  Maximize2,
  Minimize2,
  Move,
  Save,
  FolderOpen,
  RotateCcw,
  RotateCw,
  AlignLeft,
  Eraser,
  FileCode,
  Zap
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { format } from 'sql-formatter'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'

const getIpc = () => (window as any).ipcRenderer;

const DataGrid = ({ data, columns = [], onExport }: { data: any[], columns: string[], onExport: () => void }) => {
  const [columnOrder, setColumnOrder] = useState<string[]>(columns || []);
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  useEffect(() => {
    if (columns) {
      setColumnOrder(columns);
      setColumnLabels(columns.reduce((acc, col) => ({ ...acc, [col]: col }), {}));
    }
  }, [columns]);

  const safeData = data || [];
  const totalPages = Math.ceil(safeData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = safeData.slice(indexOfFirstRow, indexOfLastRow);

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setColumnOrder(newOrder);
  };

  if (safeData.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
      <Terminal size={40} strokeWidth={1} />
      <p className="text-sm font-medium">No hay datos para mostrar</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '8px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '6px 12px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Resultados</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
            {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, safeData.length)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>de</span> {safeData.length}
          </span>
        </div>
        <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}>
            <ChevronRight size={14} className="rotate-180 text-slate-600" />
          </button>
          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontWeight: 800, color: '#475569' }}>
            {currentPage}/{totalPages}
          </span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}>
            <ChevronRight size={14} className="text-slate-600" />
          </button>
        </div>
        <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
        <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>
          <Download size={12} strokeWidth={4} />
          Exportar Excel
        </button>
      </div>
      <div className="DataGrid-container" style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ minWidth: 'max-content' }}>
            <table className="w-full text-left border-collapse table-auto">
              <thead style={{ position: 'sticky', top: 0, zIndex: 30, background: '#f8fafc' }}>
                <tr>
                  {columnOrder.map((col, idx) => (
                    <th key={col} className="px-4 py-3 text-[11px] font-black whitespace-nowrap group relative uppercase tracking-wider" draggable onDragStart={(e) => e.dataTransfer.setData('colIdx', idx.toString())} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                      const fromIdx = parseInt(e.dataTransfer.getData('colIdx'));
                      moveColumn(fromIdx, idx);
                    }}>
                      <div className="flex items-center justify-between gap-4">
                        {editingColumn === col ? (
                          <input autoFocus className="bg-white border-2 border-blue-600 rounded px-1 text-slate-900 outline-none w-full" value={columnLabels[col]} onChange={(e) => setColumnLabels(prev => ({ ...prev, [col]: e.target.value }))} onBlur={() => setEditingColumn(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingColumn(null)} />
                        ) : (
                          <span onDoubleClick={() => setEditingColumn(col)}>{columnLabels[col]}</span>
                        )}
                        <ListIcon size={12} className="text-slate-400 opacity-30 group-hover:opacity-100" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-blue-50 border-b border-slate-100">
                    {columnOrder.map((col) => (
                      <td key={col} className="px-4 py-2 text-sm whitespace-nowrap font-mono text-slate-700">
                        {row[col] === null ? <span className="text-slate-300 italic">NULL</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to ensure objects are serializable for IPC (Nuclear version)
const cleanForIpc = (obj: any) => {
  try {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      // Block common circular/DOM/Browser objects
      if (value && typeof value === 'object') {
        if (value instanceof Node || value instanceof Window || value.constructor?.name?.includes('Element') || value.constructor?.name === 'Window') {
          return undefined;
        }
      }
      return value;
    }));
  } catch (err) {
    console.warn("IPC Cleanup warning:", err);
    return {};
  }
};

const ENVIRONMENTS_DEFAULT = [
  { id: 'dev', name: 'Desarrollo', color: '#ffffff', icon: '💻' },
  { id: 'test', name: 'Pruebas', color: '#f97316', icon: '🧪' },
  { id: 'prod', name: 'Productivo', color: '#ef4444', icon: '🔥' },
];

// --- Generator UI Sub-component to stabilize inputs ---
const GeneratorUI = ({ servers, onGenerate }: any) => {
  const [genTable, setGenTable] = useState('')
  const [genColumns, setGenColumns] = useState<any[]>([])
  const [selectedGenSrv, setSelectedGenSrv] = useState<any>(null)
  const [selectedGenDb, setSelectedGenDb] = useState('')
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState('VARCHAR(100)')
  const [selectedSampleCol, setSelectedSampleCol] = useState('')

  return (
    <div style={{padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
      <div className="panel-header" style={{padding:0, border:0}}><span className="panel-title">ALTER SMART</span></div>
      
      <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
        <label style={{fontSize:'9px', fontWeight:900, color:'#64748b'}}>SERVIDOR & DB</label>
        <select className="settings-input" style={{fontSize:'11px'}} onChange={(e) => {
          const [sId, db] = e.target.value.split('|');
          setSelectedGenSrv(servers.find((s:any) => s.id === sId));
          setSelectedGenDb(db);
        }}>
          <option value="">Selecciona...</option>
          {servers.flatMap((s:any) => s.dbs.map((db:string) => <option key={`${s.id}|${db}`} value={`${s.id}|${db}`}>{s.name} - {db}</option>))}
        </select>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
        <label style={{fontSize:'9px', fontWeight:900, color:'#64748b'}}>TABLA</label>
        <div style={{display:'flex', gap:'5px'}}>
          <input className="settings-input" style={{flex:1, fontSize:'11px'}} value={genTable} onChange={(e) => setGenTable(e.target.value)} placeholder="Nombre de tabla..."/>
          <button className="toolbar-btn" onClick={async () => {
            if (!selectedGenSrv || !selectedGenDb || !genTable) return alert("Faltan datos");
            const res = await getIpc().invoke('get-columns', cleanForIpc({ 
            config: { user: selectedGenSrv.user, password: selectedGenSrv.password, server: selectedGenSrv.host, database: selectedGenDb, port: selectedGenSrv.port }, 
            table: genTable, 
            engine: selectedGenSrv.engine 
          }));
            if (res.success) setGenColumns(res.columns); else alert(res.error);
          }}><RotateCw size={14}/></button>
        </div>
      </div>

      {genColumns.length > 0 && (
        <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
          <label style={{fontSize:'9px', fontWeight:900, color:'#64748b'}}>COLUMNA MUESTRA (COPIAR DATOS)</label>
          <select className="settings-input" style={{fontSize:'11px'}} value={selectedSampleCol} onChange={(e) => {
            const colName = e.target.value;
            setSelectedSampleCol(colName);
            const col = genColumns.find(c => c.name === colName);
            if (col) setNewColType(col.type + (col.length && col.length !== -1 ? `(${col.length})` : ''));
          }}>
            <option value="">Ninguna (Solo crear)</option>
            {genColumns.map(c => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
          </select>
        </div>
      )}

      <div style={{marginTop:'1rem', padding:'1rem', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:'1px solid var(--panel-border)'}}>
        <label style={{fontSize:'10px', fontWeight:900, color:'var(--accent-primary)', marginBottom:'10px', display:'block'}}>NUEVA COLUMNA</label>
        <input className="settings-input" style={{width:'100%', marginBottom:'10px'}} placeholder="Nombre..." value={newColName} onChange={(e)=>setNewColName(e.target.value)}/>
        <input className="settings-input" style={{width:'100%', marginBottom:'15px'}} placeholder="Tipo (ej: VARCHAR(100))" value={newColType} onChange={(e)=>setNewColType(e.target.value)}/>
        
        <button className="btn btn-primary" style={{width:'100%'}} onClick={() => {
          if (!newColName) return;
          const engine = selectedGenSrv?.engine || 'mssql';
          let script = '';
          const updateSnippet = selectedSampleCol ? `\n\n-- Migración de datos\nUPDATE ${genTable} SET ${newColName} = ${selectedSampleCol};` : '';
          
          if (engine === 'mssql') {
            const upSql = selectedSampleCol ? `\n    EXEC('UPDATE ${genTable} SET ${newColName} = ${selectedSampleCol}');` : '';
            script = `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${genTable}') AND name = '${newColName}')\nBEGIN\n    ALTER TABLE ${genTable} ADD ${newColName} ${newColType};${upSql}\n    PRINT 'Columna ${newColName} agregada correctamente';\nEND`;
          } else if (engine === 'postgres') {
            script = `ALTER TABLE ${genTable} ADD COLUMN IF NOT EXISTS ${newColName} ${newColType};${updateSnippet}`;
          } else {
            // MySQL Idempotent
            const upMy = selectedSampleCol ? `\n    SET @upd = CONCAT('UPDATE ', @tablename, ' SET ', @columnname, ' = ${selectedSampleCol}');\n    PREPARE stmtUp FROM @upd; EXECUTE stmtUp; DEALLOCATE PREPARE stmtUp;` : '';
            script = `-- MySQL Idempotent Add\nSET @dbname = DATABASE();\nSET @tablename = '${genTable}';\nSET @columnname = '${newColName}';\nSET @preparedStatement = (SELECT IF(\n    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,\n    'SELECT 1',\n    CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' ${newColType}')\n));\nPREPARE stmt FROM @preparedStatement;\nEXECUTE stmt;\nDEALLOCATE PREPARE stmt;${upMy}`;
          }
          onGenerate(script);
        }}>Generar & Cargar</button>
      </div>
    </div>
  )
}

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const snapId = urlParams.get('snapshotId');
  const isSnapshot = !!snapId;

  const [isDryRun, setIsDryRun] = useState(true)
  const [sqlQuery, setSqlQuery] = useState('-- MultiSQLDeployer Editor\nSELECT TOP 10 * FROM Usuarios;')
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([])
  const [results, setResults] = useState<any[]>([])
  const [executing, setExecuting] = useState(false)
  const [servers, setServers] = useState<any[]>([])
  const [environments, setEnvironments] = useState<any[]>(ENVIRONMENTS_DEFAULT)
  const [serverStatus, setServerStatus] = useState<Record<string, 'online' | 'offline' | 'checking'>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [schemaTables, setSchemaTables] = useState<string[]>([])
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [consoleHeight, setConsoleHeight] = useState(300)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [snapshotModeData, setSnapshotModeData] = useState<any>(null)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(isSnapshot)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [collapsedServers, setCollapsedServers] = useState<string[]>([])
  const [sidebarTab, setSidebarTab] = useState<'destinations' | 'generator'>('destinations')

  useEffect(() => {
    const loadConfig = async () => {
      const savedServers = await getIpc().invoke('get-config', 'servers');
      const finalServers = savedServers || [];
      setServers(finalServers);
      const savedEnvs = await getIpc().invoke('get-config', 'environments');
      if (savedEnvs) setEnvironments(savedEnvs);
      const cachedSchema = await getIpc().invoke('get-config', 'cachedSchema');
      if (cachedSchema) setSchemaTables(cachedSchema);

      finalServers.forEach((s: any) => checkSrvConn(s));
    };
    loadConfig();

    let pulses = 0;
    const pulseInterval = setInterval(() => {
      if (editorRef.current) {
        editorRef.current.layout();
        if (monacoRef.current) {
          monacoRef.current.editor.remeasureFonts();
        }
      }
      pulses++;
      if (pulses > 10) clearInterval(pulseInterval);
    }, 500);

    const handleResizeWindow = () => {
      if (editorRef.current) editorRef.current.layout();
    };
    window.addEventListener('resize', handleResizeWindow);

    return () => {
      clearInterval(pulseInterval);
      window.removeEventListener('resize', handleResizeWindow);
    };
  }, []);

  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;
      const provider = monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const tables = (window as any)._schemaTables || [];
          const suggestions = tables.map((table: string) => ({
            label: table,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: table,
            range: range,
            detail: 'Tabla de Base de Datos'
          }));

          const keywords = ['SELECT', 'FROM', 'WHERE', 'UPDATE', 'DELETE', 'INSERT', 'INTO', 'VALUES', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'GROUP BY', 'ORDER BY', 'HAVING'];
          keywords.forEach(kw => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range: range
            });
          });

          return { suggestions };
        }
      });

      return () => provider.dispose();
    }
  }, [monacoRef.current]);

  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => editorRef.current.layout(), 50);
    }
  }, [sidebarTab]);

  const checkSrvConn = async (srv: any) => {
    setServerStatus(prev => ({ ...prev, [srv.id]: 'checking' }));
    const res = await getIpc().invoke('check-connection', { host: srv.host, engine: srv.engine });
    setServerStatus(prev => ({ ...prev, [srv.id]: res.online ? 'online' : 'offline' }));
  };

  useEffect(() => {
    if (isSnapshot && snapId) {
      getIpc().invoke('get-snapshot-data', snapId).then((data: any) => {
        if (data) {
          setSnapshotModeData(data);
          document.title = `Snapshot: ${data.db}`;
        }
        setIsLoadingSnapshot(false);
      }).catch(() => setIsLoadingSnapshot(false));
    }
  }, [isSnapshot, snapId])

  useEffect(() => { (window as any)._schemaTables = schemaTables }, [schemaTables])

  const toggleDestination = (dbId: string) => {
    setSelectedDestinations(prev => prev.includes(dbId) ? prev.filter(id => id !== dbId) : [...prev, dbId])
  }

  const toggleGroup = (type: string) => {
    const groupDbs = servers.filter(s => s.type === type).flatMap(s => s.dbs.map((db: string) => `${s.id}|${db}`));
    const allSelected = groupDbs.length > 0 && groupDbs.every(id => selectedDestinations.includes(id));
    if (allSelected) {
      setSelectedDestinations(prev => prev.filter(id => !groupDbs.includes(id)));
    } else {
      setSelectedDestinations(prev => [...new Set([...prev, ...groupDbs])]);
    }
  }

  const toggleServer = (serverId: string) => {
    const srv = servers.find(s => s.id === serverId);
    if (!srv) return;
    const serverDbs = srv.dbs.map((db: string) => `${srv.id}|${db}`);
    const allSelected = serverDbs.length > 0 && serverDbs.every(id => selectedDestinations.includes(id));
    if (allSelected) {
      setSelectedDestinations(prev => prev.filter(id => !serverDbs.includes(id)));
    } else {
      setSelectedDestinations(prev => [...new Set([...prev, ...serverDbs])]);
    }
  }

  const toggleCollapseGroup = (type: string) => setCollapsedGroups(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const toggleCollapseServer = (id: string) => setCollapsedServers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleToggleDryRun = () => setIsDryRun(!isDryRun);
  const handleUndo = () => editorRef.current?.trigger('keyboard', 'undo', null);
  const handleRedo = () => editorRef.current?.trigger('keyboard', 'redo', null);
  const handleFormatSQL = () => {
    try {
      const formatted = format(sqlQuery, { language: 'sql', uppercase: true, indent: '  ' });
      setSqlQuery(formatted);
    } catch (err) { console.error(err); }
  }
  const handleCheckSyntax = () => {
    runDeployment(true);
  }

  const handleOpenFile = async () => {
    const res = await getIpc().invoke('open-file-dialog');
    if (res?.content) { setSqlQuery(res.content); setCurrentFilePath(res.filePath); }
  }
  const handleSaveFile = async (saveAs = false) => {
    const res = await getIpc().invoke('save-file-dialog', { content: sqlQuery, filePath: saveAs ? null : currentFilePath });
    if (res?.success) setCurrentFilePath(res.filePath);
  }

  const handleExportExcel = (result: any) => {
    if (!result.data || result.data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, `Resultado_${result.db}_${Date.now()}.xlsx`);
  }

  const handleRefreshSchema = async () => {
    const firstId = selectedDestinations[0];
    if (!firstId) return alert("Selecciona una DB.");
    const [srvId, dbName] = firstId.split('|');
    const srv = servers.find(s => s.id === srvId);
    if (!srv) return;
    setIsRefreshingSchema(true);
    const res = await getIpc().invoke('get-schema', { config: { user: srv.user, password: srv.password, server: srv.host, database: dbName }, engine: srv.engine });
    if (res.success) { setSchemaTables(res.tables); await getIpc().invoke('save-config', { key: 'cachedSchema', value: res.tables }); }
    setIsRefreshingSchema(false);
  }

  const runDeployment = async (checkSyntax = false) => {
    if (selectedDestinations.length === 0) return;
    setExecuting(true); setResults([]);
    for (const destId of selectedDestinations) {
      const [srvId, dbName] = destId.split('|');
      const srv = servers.find(s => s.id === srvId);
      if (!srv) continue;

      if (serverStatus[srv.id] === 'offline') {
        setResults(prev => [...prev, { 
          id: destId, 
          server: srv.name, 
          db: dbName, 
          status: 'error', 
          message: 'Omitido: El servidor no responde (Offline)', 
          data: [], 
          columns: [] 
        }]);
        continue;
      }

      const res = await getIpc().invoke('execute-sql', cleanForIpc({ 
        config: { 
          user: srv.user, 
          password: srv.password, 
          server: srv.host, 
          database: dbName, 
          port: srv.port 
        }, 
        query: sqlQuery, 
        isDryRun, 
        engine: srv.engine,
        checkSyntax: !!checkSyntax 
      }));
      setResults(prev => [...prev, { 
        id: destId, 
        server: srv.name, 
        db: dbName, 
        mode: checkSyntax ? 'SYNTAX' : (isDryRun ? 'DRYRUN' : 'REAL'),
        status: res.success ? 'success' : 'error', 
        message: res.success ? (checkSyntax ? res.message : res.message || 'Ejecución exitosa') : res.error, 
        data: res.data || [], 
        columns: res.columns || [] 
      }]);
    }
    setExecuting(false); 
    setIsDryRun(true); // Always revert to safe mode
    setSelectedResultIndex(0); // View first result by default
  }

  const handleResize = (e: React.MouseEvent) => {
    const startY = e.clientY; const startH = consoleHeight;
    const move = (me: MouseEvent) => { setConsoleHeight(Math.max(100, Math.min(window.innerHeight - 200, startH + (startY - me.clientY)))); editorRef.current?.layout(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }

  if (isSnapshot) {
    if (isLoadingSnapshot) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#11131a'}}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>;
    return <div style={{height:'100vh', display:'flex', flexDirection:'column', background:'#f8fafc'}}><DataGrid data={snapshotModeData.data} columns={snapshotModeData.columns} onExport={() => {}} /></div>;
  }
  return (
    <div className="app-container">
      {/* Sidebar Jerárquico Premium */}
      <aside className="sidebar">
        <div style={{display:'flex', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid var(--panel-border)'}}>
           <button onClick={() => setSidebarTab('destinations')} style={{flex:1, padding:'10px', background: sidebarTab === 'destinations' ? 'rgba(0,242,255,0.1)' : 'transparent', border:'none', color: sidebarTab === 'destinations' ? 'var(--accent-primary)' : '#64748b', fontSize:'10px', fontWeight:900, cursor:'pointer'}}>DESTINOS</button>
           <button onClick={() => setSidebarTab('generator')} style={{flex:1, padding:'10px', background: sidebarTab === 'generator' ? 'rgba(0,242,255,0.1)' : 'transparent', border:'none', color: sidebarTab === 'generator' ? 'var(--accent-primary)' : '#64748b', fontSize:'10px', fontWeight:900, cursor:'pointer'}}>GENERADOR</button>
        </div>

        {sidebarTab === 'destinations' ? (
          <>
            <div className="panel-header">
              <span className="panel-title">Destinos</span>
              <div style={{display:'flex', gap:'8px'}}>
                <Filter size={14} className="text-secondary"/>
                <Settings size={16} onClick={() => setShowSettings(true)} style={{cursor:'pointer'}} className="text-secondary hover:text-white transition-colors"/>
              </div>
            </div>
            <div style={{padding:'0.5rem', overflowY:'auto'}}>
              {environments.map(env => {
                const grpServers = servers.filter(s => s.type === env.id); 
                if (grpServers.length === 0) return null;
                const color = env.color;
                const grpName = env.name;
                const grpIcon = env.icon;
                const grpDbs = grpServers.flatMap(s => s.dbs.map((db:string) => `${s.id}|${db}`));
                const allSel = grpDbs.length > 0 && grpDbs.every(id => selectedDestinations.includes(id));
                const someSel = grpDbs.some(id => selectedDestinations.includes(id)) && !allSel;
                const isCol = collapsedGroups.includes(env.id);
                
                return (
                  <div key={env.id} style={{marginBottom:'1rem', borderRadius:'8px', overflow:'hidden', border:`1px solid ${allSel || someSel ? color+'33' : 'transparent'}`}}>
                    <div style={{display:'flex', alignItems:'center', padding:'8px 12px', background:'rgba(255,255,255,0.02)', cursor:'pointer'}}>
                       <div onClick={() => toggleCollapseGroup(env.id)} style={{flex:1, display:'flex', alignItems:'center', gap:'6px'}}>
                         {isCol ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}
                         <span style={{color, fontSize:'10px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em'}}>{grpIcon} {grpName}</span>
                       </div>
                       <div onClick={() => toggleGroup(env.id)} style={{color}}>
                         {allSel ? <CheckSquare size={16}/> : someSel ? <CheckSquare size={16} style={{opacity:0.5}}/> : <Square size={16} style={{opacity:0.2}}/>}
                       </div>
                    </div>
                    {!isCol && (
                      <div style={{padding:'4px'}}>
                        {grpServers.map(srv => {
                           const isSrvCol = collapsedServers.includes(srv.id);
                           const srvDbs = srv.dbs.map((db:string) => `${srv.id}|${db}`);
                           const allSrvSel = srvDbs.length > 0 && srvDbs.every((id:string) => selectedDestinations.includes(id));
                           const someSrvSel = srvDbs.some(id => selectedDestinations.includes(id)) && !allSrvSel;
                           
                           return (
                             <div key={srv.id} style={{marginBottom:'2px'}}>
                                <div style={{display:'flex', alignItems:'center', padding:'6px 10px', gap:'8px', borderRadius:'6px', background:allSrvSel ? 'rgba(255,255,255,0.03)' : 'transparent'}}>
                                   <div onClick={() => { toggleCollapseServer(srv.id); if (collapsedServers.includes(srv.id)) checkSrvConn(srv); }} style={{flex:1, display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                                     {isSrvCol ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}
                                     <div style={{position:'relative'}}>
                                       <Server size={14} color={color}/>
                                       <div style={{
                                         position:'absolute', top:-2, right:-2, width:6, height:6, borderRadius:'50%', 
                                         background: serverStatus[srv.id] === 'online' ? '#22c55e' : serverStatus[srv.id] === 'offline' ? '#ef4444' : '#eab308',
                                         boxShadow: serverStatus[srv.id] === 'online' ? '0 0 4px #22c55e' : 'none'
                                       }}/>
                                     </div>
                                     <span style={{fontSize:'12px', fontWeight:600, color:allSrvSel ? 'white' : '#94a3b8'}}>{srv.name}</span>
                                   </div>
                                   <div onClick={() => toggleServer(srv.id)} style={{color}}>
                                     {allSrvSel ? <CheckSquare size={14}/> : someSrvSel ? <CheckSquare size={14} style={{opacity:0.5}}/> : <Square size={14} style={{opacity:0.1}}/>}
                                   </div>
                                </div>
                                {!isSrvCol && (
                                  <div style={{marginLeft:'28px', marginTop:'2px', display:'flex', flexDirection:'column', gap:'1px'}}>
                                    {srv.dbs.map((db:string) => {
                                       const dbId = `${srv.id}|${db}`; const sel = selectedDestinations.includes(dbId);
                                       return (
                                         <div key={db} onClick={() => toggleDestination(dbId)} style={{display:'flex', alignItems:'center', gap:'8px', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color: sel ? 'white' : '#64748b', background: sel ? color+'11' : 'transparent'}}>
                                           <Database size={10} style={{opacity: sel ? 1 : 0.5}}/>
                                           <span style={{flex:1}}>{db}</span>
                                           {sel ? <CheckSquare size={12} color={color}/> : <Square size={12} style={{opacity:0.05}}/>}
                                         </div>
                                       )
                                    })}
                                  </div>
                                )}
                             </div>
                           )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <GeneratorUI servers={servers} onGenerate={(script) => setSqlQuery(script)} />
        )}
      </aside>

      <main className="main-content">
        {/* Clean Ribbon Toolbar */}
        <div style={{height:'40px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--panel-border)', display:'flex', alignItems:'center', padding:'0 8px', gap:'4px', flexShrink:0}}>
          <div style={{display:'flex', gap:'2px'}}>
            <button onClick={handleOpenFile} className="toolbar-btn" title="Abrir Archivo (Ctrl+O)"><FolderOpen size={16}/></button>
            <button onClick={() => handleSaveFile()} className="toolbar-btn" title="Guardar (Ctrl+S)"><Save size={16}/></button>
            <button onClick={() => handleSaveFile(true)} className="toolbar-btn" title="Guardar como..."><FileCode size={16}/></button>
          </div>
          <div className="toolbar-divider"/>
          <div style={{display:'flex', gap:'2px'}}>
            <button onClick={handleUndo} className="toolbar-btn" title="Deshacer"><RotateCcw size={16}/></button>
            <button onClick={handleRedo} className="toolbar-btn" title="Rehacer"><RotateCw size={16}/></button>
            <button onClick={handleFormatSQL} className="toolbar-btn" title="Formatear SQL"><AlignLeft size={16}/></button>
          </div>
          <div className="toolbar-divider"/>
          <div style={{display:'flex', gap:'2px', alignItems:'center'}}>
            <button onClick={() => runDeployment(true)} className="toolbar-btn" title="Comprobar Sintaxis (SET NOEXEC ON)" style={{color: '#8b5cf6'}}>
              <ShieldEllipsis size={16}/>
            </button>
            <button onClick={handleToggleDryRun} className={`toolbar-btn ${isDryRun ? 'active-warning' : 'active-danger'}`} title={isDryRun ? 'Dry Run Activado' : 'MODO REAL'}>
              {isDryRun ? <ShieldCheck size={16}/> : <ShieldOff size={16}/>}
            </button>
            <button onClick={() => runDeployment(false)} disabled={executing} className="toolbar-btn action-run" style={{position:'relative'}} title="Ejecutar en todos los destinos">
              {executing ? <Zap size={16} className="animate-pulse"/> : <Play size={16}/>}
              {!isDryRun && !executing && <div style={{position:'absolute', top:6, right:6, width:6, height:6, background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 5px #ef4444'}}/>}
            </button>
            <button onClick={handleRefreshSchema} className="toolbar-btn" title="Refrescar Esquema / Limpiar Caché"><Eraser size={16}/></button>
          </div>
          <div style={{flex:1}}/>
          <button onClick={() => setShowSettings(true)} className="toolbar-btn" title="Configuración"><Settings size={16}/></button>
        </div>

        {/* Editor Area */}
        <div className="editor-container" style={{height:`calc(100vh - ${consoleHeight}px - 75px)`, position:'relative', overflow:'hidden'}}>
          <Editor 
            height="100%" 
            defaultLanguage="sql" 
            value={sqlQuery} 
            theme="vs-dark" 
            onChange={(v)=>setSqlQuery(v||'')} 
            onMount={(e, m)=>{
              editorRef.current=e;
              monacoRef.current=m;
            }} 
            options={{
              minimap:{enabled:true}, 
              fontSize:14, 
              fontFamily: "'JetBrains Mono', monospace",
              automaticLayout:true,
              padding:{top:10},
              scrollBeyondLastLine: false,
              formatOnPaste: true,
              wordWrap: 'on'
            }}
          />
        </div>

        {/* Results Resizer */}
        <div onMouseDown={handleResize} style={{height:'6px', background:'rgba(255,255,255,0.03)', cursor:'row-resize', zIndex:10}} className="hover:bg-accent/20 transition-colors"/>

        {/* Results Panel Premium */}
        <div className="results-panel" style={{height:`${consoleHeight}px`, display:'flex', flexDirection:'column', background:'#f8fafc', overflow:'hidden'}}>
          <div className="results-header" style={{padding:'0.5rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #e2e8f0', background:'white', flexShrink:0}}>
            <div style={{display:'flex', alignItems:'center', gap:'1.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#475569'}}>
                <Terminal size={16} className="text-blue-600"/>
                <span style={{fontSize:'10px', fontWeight:900, letterSpacing:'0.1em'}}>RESULTADOS</span>
              </div>
              
              {executing && (
                <div style={{display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', background:'#eff6ff', borderRadius:'100px', border:'1px solid #bfdbfe'}}>
                  <Zap size={12} className="animate-pulse text-blue-600"/> 
                  <span style={{fontSize:'9px', fontWeight:800, color:'#1e40af', textTransform:'uppercase'}}>Procesando...</span>
                </div>
              )}
              
              <div style={{display:'flex', gap:'2px', background:'#f1f5f9', padding:'3px', borderRadius:'10px', border:'1px solid #e2e8f0'}}>
                {results.map((r, i) => (
                  <button 
                    key={r.id} 
                    onClick={() => setSelectedResultIndex(i)} 
                    style={{
                      padding: '8px 16px',
                      background: selectedResultIndex === i ? 'white' : 'transparent',
                      border: 'none',
                      borderBottom: selectedResultIndex === i ? '2px solid var(--accent-primary)' : 'none',
                      color: selectedResultIndex === i ? 'var(--accent-primary)' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{
                      fontSize:'8px', 
                      padding:'2px 4px', 
                      borderRadius:'4px', 
                      background: r.mode === 'REAL' ? '#ef4444' : r.mode === 'DRYRUN' ? '#3b82f6' : '#8b5cf6',
                      color: 'white'
                    }}>{r.mode}</div>
                    {r.db}
                    {r.status === 'error' ? <XCircle size={10} color="#ef4444"/> : <CheckCircle2 size={10} color="#22c55e"/>}
                  </button>
                ))}
              </div>
            </div>

            {results[selectedResultIndex] && (
              <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                <button 
                  onClick={() => getIpc().invoke('open-snapshot-window', cleanForIpc(results[selectedResultIndex]))} 
                  style={{fontSize:'10px', fontWeight:700, padding:'4px 10px', background:'white', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', color:'#475569'}}
                >
                  <ExternalLink size={12}/> Desacoplar
                </button>
                <span style={{fontSize:'9px', fontWeight:900, padding:'3px 10px', borderRadius:'100px', background: results[selectedResultIndex].status === 'success' ? '#dcfce7' : '#fee2e2', color: results[selectedResultIndex].status === 'success' ? '#166534' : '#991b1b', textTransform:'uppercase'}}>
                  {results[selectedResultIndex].status}
                </span>
                <span style={{fontSize:'10px', color:'#64748b', fontWeight:500}}>{results[selectedResultIndex].message}</span>
              </div>
            )}
          </div>
          
          <div style={{flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
            {results.length > 0 ? (
              <DataGrid data={results[selectedResultIndex].data} columns={results[selectedResultIndex].columns} onExport={() => handleExportExcel(results[selectedResultIndex])} />
            ) : (
              <div style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#94a3b8', gap:'1rem'}}>
                 <div style={{width:'64px', height:'64px', borderRadius:'50%', border:'2px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.3}}>
                    <Play size={24}/>
                 </div>
                 <p style={{fontSize:'13px', fontWeight:500}}>Ejecuta una consulta para ver resultados</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            servers={servers} 
            environments={environments}
            onClose={() => setShowSettings(false)} 
            onSave={(s:any, e:any) => { 
              setServers(s); 
              setEnvironments(e);
              getIpc().invoke('save-config', { key: 'servers', value: s }); 
              getIpc().invoke('save-config', { key: 'environments', value: e });
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Settings Modal Component (Standalone & Full Detail) ---
const SettingsModal = ({ servers, environments, onClose, onSave }: any) => {
  const [tempServers, setTempServers] = useState([...servers]);
  const [tempEnvs, setTempEnvs] = useState([...environments]);
  const [activeTab, setActiveTab] = useState('servers');
  const [editingDbFor, setEditingDbFor] = useState<string | null>(null);
  const [newDb, setNewDb] = useState('');
  const [testingSrv, setTestingSrv] = useState<string | null>(null);

  const update = (id: string, upd: any) => setTempServers(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s));
  const updateEnv = (id: string, upd: any) => setTempEnvs(prev => prev.map(e => e.id === id ? { ...e, ...upd } : e));
  
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}}>
      <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} style={{width:'1000px', height:'750px', background:'#11131a', borderRadius:'20px', display:'flex', overflow:'hidden', border:'1px solid var(--panel-border)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)'}}>
        {/* Modal Sidebar */}
        <div style={{width:'260px', background:'rgba(255,255,255,0.02)', borderRight:'1px solid var(--panel-border)', padding:'2rem', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
           <h2 style={{fontSize:'1rem', fontWeight:900, color:'white', marginBottom:'2rem', display:'flex', alignItems:'center', gap:'10px'}}>
             <Settings size={20} className="text-accent"/> CONFIGURACIÓN
           </h2>
           
           <div 
             onClick={() => setActiveTab('servers')}
             style={{
               padding:'0.8rem 1.2rem', 
               background: activeTab === 'servers' ? 'rgba(0,242,255,0.1)' : 'transparent', 
               color: activeTab === 'servers' ? 'var(--accent-primary)' : '#94a3b8', 
               borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px', fontWeight:700, fontSize:'0.9rem', cursor:'pointer'
             }}>
             <Server size={18}/> Servidores SQL
           </div>

           <div 
             onClick={() => setActiveTab('envs')}
             style={{
               padding:'0.8rem 1.2rem', 
               background: activeTab === 'envs' ? 'rgba(0,242,255,0.1)' : 'transparent', 
               color: activeTab === 'envs' ? 'var(--accent-primary)' : '#94a3b8', 
               borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px', fontWeight:700, fontSize:'0.9rem', cursor:'pointer'
             }}>
             <Layers size={18}/> Entornos
           </div>

           <div style={{flex:1}}/>
           <button onClick={onClose} style={{padding:'1rem', background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', cursor:'pointer', fontWeight:700}}>Cerrar sin guardar</button>
        </div>

        {/* Modal Main Content */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{padding:'2rem', borderBottom:'1px solid var(--panel-border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.01)'}}>
            <div>
              <h3 style={{fontSize:'1.5rem', fontWeight:900, color:'white', margin:0}}>
                {activeTab === 'servers' ? 'Gestionar Servidores' : 'Gestionar Entornos'}
              </h3>
              <p style={{fontSize:'0.9rem', color:'#94a3b8', margin:'5px 0 0 0'}}>
                {activeTab === 'servers' ? 'Configura tus conexiones y destinos de despliegue.' : 'Define grupos personalizados (Dev, Prod, Staging, etc).'}
              </p>
            </div>
            {activeTab === 'servers' ? (
              <button className="btn btn-primary" onClick={() => setTempServers([...tempServers, { id: `s-${Date.now()}`, name: 'Nuevo Servidor', host: 'localhost', user: 'sa', password: '', engine: 'mssql', type: 'dev', dbs: ['master'] }])}>
                <Layers size={18}/> + Nuevo Servidor
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setTempEnvs([...tempEnvs, { id: `env-${Date.now()}`, name: 'Nuevo Entorno', color: '#9c27b0', icon: '📁' }])}>
                <Layers size={18}/> + Nuevo Entorno
              </button>
            )}
          </div>

          <div style={{flex:1, overflowY:'auto', padding:'2rem'}}>
            {activeTab === 'servers' ? (
              tempServers.map(srv => {
                const env = tempEnvs.find(e => e.id === srv.type) || tempEnvs[0];
                const color = env?.color || '#ffffff';
                return (
                  <div key={srv.id} style={{background:'rgba(255,255,255,0.02)', padding:'1.5rem', borderRadius:'15px', marginBottom:'2rem', border:'1px solid var(--panel-border)', borderLeft:`5px solid ${color}`}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.5rem'}}>
                      <Server size={20} color={color}/>
                      <input style={{background:'transparent', border:'none', color:'white', fontSize:'1.1rem', fontWeight:800, outline:'none', width:'100%'}} value={srv.name} onChange={(e)=>update(srv.id, {name:e.target.value})} placeholder="Nombre del servidor..."/>
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
                      <div>
                        <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'5px', display:'block'}}>HOST / IP</label>
                        <input className="settings-input" style={{width:'100%'}} value={srv.host} onChange={(e)=>update(srv.id, {host:e.target.value})} placeholder="localhost"/>
                      </div>
                      <div>
                        <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'5px', display:'block'}}>MOTOR</label>
                        <select className="settings-input" style={{width:'100%'}} value={srv.engine} onChange={(e)=>update(srv.id, {engine:e.target.value})}>
                          <option value="mssql">SQL Server</option>
                          <option value="postgres">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'5px', display:'block'}}>ENTORNO</label>
                        <select className="settings-input" style={{width:'100%', borderLeft:`3px solid ${color}`}} value={srv.type} onChange={(e)=>update(srv.id, {type:e.target.value})}>
                          {tempEnvs.map(e => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem'}}>
                      <div>
                        <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'5px', display:'block'}}>USUARIO</label>
                        <input className="settings-input" style={{width:'100%'}} value={srv.user} onChange={(e)=>update(srv.id, {user:e.target.value})} placeholder="sa"/>
                      </div>
                      <div>
                        <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'5px', display:'block'}}>CONTRASEÑA</label>
                        <input className="settings-input" type="password" style={{width:'100%'}} value={srv.password} onChange={(e)=>update(srv.id, {password:e.target.value})} placeholder="••••••••"/>
                      </div>
                    </div>

                    <div style={{marginBottom:'1.5rem'}}>
                      <label style={{fontSize:'0.7rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', marginBottom:'10px', display:'block'}}>BASES DE DATOS PERMITIDAS</label>
                      <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                        {srv.dbs.map((db:string) => (
                          <div key={db} style={{background:'rgba(255,255,255,0.05)', padding:'5px 12px', borderRadius:'6px', fontSize:'12px', color:'white', display:'flex', alignItems:'center', gap:'8px', border:'1px solid rgba(255,255,255,0.05)'}}>
                            {db} 
                            <XCircle size={14} onClick={()=>update(srv.id, {dbs: srv.dbs.filter((d:string)=>d!==db)})} style={{cursor:'pointer', color:'#ef4444'}}/>
                          </div>
                        ))}
                        {editingDbFor === srv.id ? (
                          <input 
                            autoFocus 
                            className="settings-input" 
                            style={{width:'150px', fontSize:'12px', padding:'4px 10px'}} 
                            value={newDb} 
                            onChange={(e)=>setNewDb(e.target.value)} 
                            onKeyDown={(e)=>{ 
                              if(e.key==='Enter' && newDb.trim()){ 
                                update(srv.id, {dbs: [...new Set([...srv.dbs, newDb.trim()])]}); 
                                setEditingDbFor(null); setNewDb(''); 
                              } 
                              if(e.key==='Escape') setEditingDbFor(null);
                            }} 
                            onBlur={()=>{
                              if(newDb.trim()) update(srv.id, {dbs: [...new Set([...srv.dbs, newDb.trim()])]});
                              setEditingDbFor(null); setNewDb('');
                            }}
                            placeholder="Nombre DB..."
                          />
                        ) : (
                          <button onClick={()=>setEditingDbFor(srv.id)} style={{background:'transparent', color:'#94a3b8', border:'1px dashed #444', fontSize:'11px', borderRadius:'6px', padding:'5px 12px', cursor:'pointer', fontWeight:600}}>+ Agregar DB</button>
                        )}
                      </div>
                    </div>

                    <div style={{display:'flex', justifyContent:'flex-end', gap:'12px'}}>
                      <button 
                        disabled={testingSrv === srv.id}
                        className="btn" 
                        onClick={async () => {
                          setTestingSrv(srv.id);
                          const res = await getIpc().invoke('get-databases', { config: { user: srv.user, password: srv.password, server: srv.host }, engine: srv.engine });
                          if(res.success) { 
                            if(confirm(`¡Éxito! Se encontraron ${res.databases.length} bases de datos. ¿Deseas importarlas todas?`)) {
                              update(srv.id, { dbs: res.databases }); 
                            }
                          } else alert("Error de conexión: " + res.error);
                          setTestingSrv(null);
                        }} 
                        style={{fontSize:'12px', fontWeight:700, background:'rgba(0,242,255,0.1)', color:'var(--accent-primary)', border:'1px solid var(--accent-primary)', padding:'0.6rem 1.2rem', borderRadius:'8px', cursor:'pointer'}}
                      >
                        {testingSrv === srv.id ? 'Probando...' : 'Probar Conexión & Listar DBs'}
                      </button>
                      <button className="btn" onClick={()=>setTempServers(tempServers.filter(s=>s.id!==srv.id))} style={{fontSize:'12px', fontWeight:700, color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', padding:'0.6rem 1.2rem', borderRadius:'8px', cursor:'pointer'}}>Eliminar Servidor</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                {tempEnvs.map(env => (
                  <div key={env.id} style={{background:'rgba(255,255,255,0.02)', padding:'1.5rem', borderRadius:'15px', border:'1px solid var(--panel-border)', borderLeft:`5px solid ${env.color}`, display:'flex', gap:'1rem', alignItems:'center'}}>
                    <div style={{width:'50px'}}>
                      <label style={{fontSize:'0.6rem', color:'#64748b', fontWeight:800, marginBottom:'4px', display:'block'}}>ICONO</label>
                      <input className="settings-input" style={{width:'100%', textAlign:'center'}} value={env.icon} onChange={(e)=>updateEnv(env.id, {icon:e.target.value})}/>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'0.6rem', color:'#64748b', fontWeight:800, marginBottom:'4px', display:'block'}}>NOMBRE</label>
                      <input className="settings-input" style={{width:'100%'}} value={env.name} onChange={(e)=>updateEnv(env.id, {name:e.target.value})}/>
                    </div>
                    <div style={{width:'120px'}}>
                      <label style={{fontSize:'0.6rem', color:'#64748b', fontWeight:800, marginBottom:'4px', display:'block'}}>COLOR</label>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <input type="color" value={env.color} onChange={(e)=>updateEnv(env.id, {color:e.target.value})} style={{width:'30px', height:'30px', border:'none', background:'transparent', cursor:'pointer'}}/>
                        <input className="settings-input" style={{flex:1, fontSize:'10px'}} value={env.color} onChange={(e)=>updateEnv(env.id, {color:e.target.value})}/>
                      </div>
                    </div>
                    <div style={{paddingTop:'15px'}}>
                      <button onClick={()=>setTempEnvs(tempEnvs.filter(e=>e.id!==env.id))} style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}} title="Eliminar entorno">
                        <XCircle size={20}/>
                      </button>
                    </div>
                  </div>
                ))}
                <p style={{fontSize:'0.8rem', color:'#64748b', textAlign:'center', marginTop:'1rem'}}>
                  Tip: Los cambios en los entornos afectarán la forma en que se agrupan tus servidores en la barra lateral.
                </p>
              </div>
            )}
          </div>

          <div style={{padding:'1.5rem 2rem', display:'flex', justifyContent:'flex-end', gap:'1.5rem', background:'rgba(0,0,0,0.2)', borderTop:'1px solid var(--panel-border)'}}>
            <button onClick={onClose} style={{background:'transparent', color:'#94a3b8', border:'none', cursor:'pointer', fontWeight:700}}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => { onSave(tempServers, tempEnvs); onClose(); }} style={{padding:'0.8rem 2.5rem', fontSize:'1rem'}}>Guardar Configuración</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default App;
