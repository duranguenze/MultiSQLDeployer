import { useState, useEffect, useRef } from 'react'
import {
  Database,
  Server,
  Play,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
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

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setColumnOrder(newOrder);
  };

  if (data.length === 0) return (
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
            {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, data.length)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>de</span> {data.length}
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

const ENVIRONMENTS_DEFAULT = [
  { id: 'dev', name: 'Desarrollo', color: '#ffffff', icon: '💻' },
  { id: 'test', name: 'Pruebas', color: '#f97316', icon: '🧪' },
  { id: 'prod', name: 'Productivo', color: '#ef4444', icon: '🔥' },
];

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
  const [showSettings, setShowSettings] = useState(false)
  const [schemaTables, setSchemaTables] = useState<string[]>([])
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [consoleHeight, setConsoleHeight] = useState(300)
  const editorRef = useRef<any>(null)
  const [snapshotModeData, setSnapshotModeData] = useState<any>(null)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(isSnapshot)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [collapsedServers, setCollapsedServers] = useState<string[]>([])

  useEffect(() => {
    const loadConfig = async () => {
      const savedServers = await getIpc().invoke('get-config', 'servers');
      setServers(savedServers || []);
      const savedEnvs = await getIpc().invoke('get-config', 'environments');
      if (savedEnvs) setEnvironments(savedEnvs);
      const cachedSchema = await getIpc().invoke('get-config', 'cachedSchema');
      if (cachedSchema) setSchemaTables(cachedSchema);
    };
    loadConfig();
  }, []);

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
  const handleOpenFile = async () => {
    const res = await getIpc().invoke('open-file-dialog');
    if (res?.content) { setSqlQuery(res.content); setCurrentFilePath(res.filePath); }
  }
  const handleSaveFile = async (saveAs = false) => {
    const res = await getIpc().invoke('save-file-dialog', { content: sqlQuery, filePath: saveAs ? null : currentFilePath });
    if (res?.success) setCurrentFilePath(res.filePath);
  }
  const handleExportExcel = (result: any) => {
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

  const runDeployment = async () => {
    if (selectedDestinations.length === 0) return;
    setExecuting(true); setResults([]);
    for (const destId of selectedDestinations) {
      const [srvId, dbName] = destId.split('|');
      const srv = servers.find(s => s.id === srvId);
      if (!srv) continue;
      const res = await getIpc().invoke('execute-sql', { config: { user: srv.user, password: srv.password, server: srv.host, database: dbName }, query: sqlQuery, isDryRun, engine: srv.engine });
      setResults(prev => [...prev, { id: destId, server: srv.name, db: dbName, status: res.success ? 'success' : 'error', message: res.success ? 'Ejecución exitosa' : res.error, data: res.data, columns: res.columns }]);
    }
    setExecuting(false); if (!isDryRun) setIsDryRun(true);
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
                               <div onClick={() => toggleCollapseServer(srv.id)} style={{flex:1, display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                                 {isSrvCol ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}
                                 <Server size={14} color={color}/>
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
            <button onClick={handleToggleDryRun} className={`toolbar-btn ${isDryRun ? 'active-warning' : 'active-danger'}`} title={isDryRun ? 'Dry Run Activado' : 'MODO REAL'}>
              {isDryRun ? <ShieldCheck size={16}/> : <ShieldOff size={16}/>}
            </button>
            <button onClick={runDeployment} disabled={executing} className="toolbar-btn action-run" style={{position:'relative'}} title="Ejecutar en todos los destinos">
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
            onMount={(e)=>editorRef.current=e} 
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
                    key={i} 
                    onClick={() => setSelectedResultIndex(i)} 
                    style={{
                      padding:'4px 12px', borderRadius:'7px', fontSize:'10px', border:'none', 
                      background: selectedResultIndex === i ? 'white' : 'transparent', 
                      color: selectedResultIndex === i ? '#1e293b' : '#64748b', 
                      fontWeight:800, cursor:'pointer', transition:'all 0.2s',
                      boxShadow: selectedResultIndex === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {r.db}
                  </button>
                ))}
              </div>
            </div>

            {results[selectedResultIndex] && (
              <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                <button 
                  onClick={() => getIpc().invoke('open-snapshot-window', results[selectedResultIndex])} 
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
