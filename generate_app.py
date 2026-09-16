# Part 7: App root component & ReactDOM mount
with open('app.js', 'a', encoding='utf-8') as f:
    f.write('''
// --- MAIN APP ROOT COMPONENT ---
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('splice_guard_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Fleet State
  const [joints, setJoints] = useState(INITIAL_JOINTS);
  const [selectedJoint, setSelectedJoint] = useState('J03');
  const [inspectModalJoint, setInspectModalJoint] = useState(null);
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [activeUspModal, setActiveUspModal] = useState(null);

  // Live Telemetry State
  const [telemetry, setTelemetry] = useState({
    speed: 2.8,
    load: 74,
    temp: 43.2,
    vibration: 4.72,
    isRunning: true,
    speedHistory: [2.8, 2.78, 2.81, 2.82, 2.79, 2.8, 2.8],
    loadHistory: [71, 72, 74, 76, 75, 73, 74],
    tempHistory: [41, 41.5, 42, 42.6, 43, 43.1, 43.2],
    vibrationHistory: [1.8, 2.1, 2.8, 3.4, 4.1, 4.5, 4.72]
  });

  // Conveyor Animation Progress (0 to 100)
  const [beltProgress, setBeltProgress] = useState(0);

  // Active Scenario
  const [currentScenario, setCurrentScenario] = useState('NORMAL');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('splice_guard_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Real-time Clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Conveyor Belt Motion Animation Loop
  useEffect(() => {
    if (!telemetry.isRunning || telemetry.speed <= 0) return;
    const progressInterval = setInterval(() => {
      setBeltProgress((prev) => (prev + telemetry.speed * 0.35) % 100);
    }, 100);
    return () => clearInterval(progressInterval);
  }, [telemetry.isRunning, telemetry.speed]);

  // Natural Sensor Noise / Fluctuation Loop
  useEffect(() => {
    if (!telemetry.isRunning) return;
    const telemetryInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Natural micro fluctuations
        const speedNoise = (Math.random() - 0.5) * 0.04;
        const loadNoise = (Math.random() - 0.5) * 0.6;
        const tempNoise = (Math.random() - 0.5) * 0.15;
        const vibNoise = (Math.random() - 0.5) * 0.08;

        const newSpeed = Math.max(0, +(prev.speed + speedNoise).toFixed(2));
        const newLoad = Math.max(10, Math.min(100, +(prev.load + loadNoise).toFixed(1)));
        const newTemp = +(prev.temp + tempNoise).toFixed(1);
        const newVib = +(prev.vibration + vibNoise).toFixed(2);

        return {
          ...prev,
          speed: newSpeed,
          load: newLoad,
          temp: newTemp,
          vibration: newVib,
          speedHistory: [...prev.speedHistory.slice(1), newSpeed],
          loadHistory: [...prev.loadHistory.slice(1), newLoad],
          tempHistory: [...prev.tempHistory.slice(1), newTemp],
          vibrationHistory: [...prev.vibrationHistory.slice(1), newVib]
        };
      });
    }, 1800);
    return () => clearInterval(telemetryInterval);
  }, [telemetry.isRunning]);

  // --- SCENARIO HANDLERS ---
  const handleScenarioSelect = (scenario) => {
    setCurrentScenario(scenario);
    if (soundEnabled) playSyntheticPulse();

    if (scenario === 'NORMAL') {
      setJoints({
        ...INITIAL_JOINTS,
        J03: {
          ...INITIAL_JOINTS.J03,
          healthScore: 92,
          vibration: 'Normal',
          rawVibValue: 1.4,
          normVibValue: 1.3,
          persistence: '0/10',
          persistCount: 0,
          confidence: '99%',
          rul: '> 200 h',
          rulRange: '200–240 h',
          status: 'NORMAL',
          statusColor: 'emerald',
          velocity: '-0.1 pts/hr',
          anomalyState: 'NONE'
        }
      });
      setTelemetry((prev) => ({
        ...prev,
        load: 72,
        vibration: 1.38,
        temp: 38.5,
        vibrationHistory: [1.2, 1.3, 1.4, 1.35, 1.38, 1.36, 1.38]
      }));
    } else if (scenario === 'LOAD_CHANGE') {
      // Load increases to 96%, raw vibration rises, but normalized stays low
      setTelemetry((prev) => ({
        ...prev,
        load: 96,
        vibration: 6.12,
        loadHistory: [74, 80, 88, 92, 95, 96, 96],
        vibrationHistory: [4.7, 5.2, 5.6, 5.9, 6.0, 6.1, 6.12]
      }));
    } else if (scenario === 'TRANSIENT_SPIKE') {
      // Single spike, persistence 1/10
      setTelemetry((prev) => ({
        ...prev,
        vibration: 7.84,
        vibrationHistory: [4.7, 4.8, 7.84, 5.1, 4.8, 4.7, 4.7]
      }));
    } else if (scenario === 'PERSISTENT_FAULT') {
      setJoints(INITIAL_JOINTS);
      setTelemetry((prev) => ({
        ...prev,
        load: 74,
        vibration: 4.72,
        vibrationHistory: [2.1, 2.8, 3.4, 4.1, 4.5, 4.68, 4.72]
      }));
    } else if (scenario === 'ACTIVE_INTERROGATION') {
      setActiveTab('interrogation');
    } else if (scenario === 'CRITICAL_DEGRADATION') {
      setJoints((prev) => ({
        ...prev,
        J03: {
          ...prev.J03,
          healthScore: 42,
          vibration: 'Critical',
          rawVibValue: 6.85,
          normVibValue: 6.42,
          persistence: '9/10',
          persistCount: 9,
          confidence: '98%',
          rul: '12–18 h',
          rulRange: '12–18 h',
          status: 'CRITICAL',
          statusColor: 'rose',
          velocity: '-5.4 pts/hr',
          probableCause: 'IMMINENT SPLICE TEAR / Core rubber delamination complete',
          anomalyState: 'CRITICAL_TRIP'
        }
      }));
      setTelemetry((prev) => ({
        ...prev,
        vibration: 6.85,
        temp: 58.4,
        vibrationHistory: [4.7, 5.2, 5.8, 6.2, 6.5, 6.7, 6.85]
      }));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'conveyor', label: 'Conveyor Monitor', icon: 'monitor' },
    { id: 'joints', label: 'Joint Health', icon: 'layers' },
    { id: 'sensors', label: 'Sensor Analytics', icon: 'activity' },
    { id: 'interrogation', label: 'Active Interrogation', icon: 'zap' },
    { id: 'prediction', label: 'Prediction & RUL', icon: 'trending-down' },
    { id: 'maintenance', label: 'Maintenance', icon: 'wrench' },
    { id: 'architecture', label: 'System Architecture', icon: 'network' }
  ];

  return (
    <div className=\"min-h-screen flex flex-col\">
      {/* --- TOP HEADER --- */}
      <header className=\"border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3\">
        <div className=\"max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4\">
          
          {/* Logo & Main Titles */}
          <div className=\"flex items-center gap-3\">
            <div className=\"w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold font-display shadow-lg shadow-cyan-500/20\">
              <Icon name=\"shield-check\" size={22} className=\"text-slate-950\" />
            </div>
            <div>
              <div className=\"flex items-center gap-2\">
                <h1 className=\"text-lg font-bold font-display tracking-wider text-slate-100 flex items-center gap-2\">
                  SPLICE-GUARD
                  <span className=\"text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30\">
                    INDUSTRY 4.0 PROTOTYPE
                  </span>
                </h1>
              </div>
              <p className=\"text-xs text-slate-400 font-mono\">
                Intelligent Conveyor Joint Health Monitoring • Iron Ore Logistics
              </p>
            </div>
          </div>

          {/* System Status Indicators & Actions */}
          <div className=\"flex flex-wrap items-center gap-3 font-mono text-xs\">
            {/* System Online Badge */}
            <div className=\"flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400\">
              <span className=\"w-2 h-2 rounded-full bg-emerald-500 animate-ping\"></span>
              <span>SYSTEM ONLINE</span>
            </div>

            {/* Conveyor ID */}
            <div className=\"px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300\">
              Asset: <strong className=\"text-cyan-400\">CV-01</strong>
            </div>

            {/* Live Clock */}
            <div className=\"px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hidden sm:block\">
              Updated: <strong className=\"text-slate-100\">{currentTime}</strong>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute acoustic chirp effects' : 'Enable acoustic chirp effects'}
              className={p-2 rounded-lg border transition-all }
            >
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={14} />
            </button>

            {/* Dark / Light Mode Toggle Button (Explicit User Request) */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className=\"px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-all\"
              title=\"Toggle Dark / Light Mode\"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} className=\"text-amber-400\" />
              <span className=\"font-sans text-xs\">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Highlighted Tagline Requirement */}
        <div className=\"max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs\">
          <div className=\"text-cyan-400 font-medium italic flex items-center gap-2\">
            <span className=\"text-slate-500 font-mono text-[11px] not-italic\">[CORE DOCTRINE]</span>
            \"Don't just detect anomalies. Verify them, explain them, and predict when to act.\"
          </div>
          <div className=\"flex items-center gap-2 font-mono text-[11px] text-slate-400\">
            <span>Simulated Telemetry Engine:</span>
            <span className=\"text-emerald-400 font-bold\">ACTIVE</span>
          </div>
        </div>
      </header>

      {/* --- DEMO SCENARIOS QUICK BAR --- */}
      <div className=\"bg-slate-950/70 border-b border-slate-800 px-4 py-2\">
        <div className=\"max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono\">
          <div className=\"flex items-center gap-2 text-slate-400\">
            <Icon name=\"play-circle\" size={14} className=\"text-cyan-400\" />
            <span>DEMO CONTROLS:</span>
          </div>

          <div className=\"flex flex-wrap items-center gap-2\">
            <button
              onClick={() => handleScenarioSelect('NORMAL')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              NORMAL OPERATION
            </button>

            <button
              onClick={() => handleScenarioSelect('LOAD_CHANGE')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              LOAD CHANGE
            </button>

            <button
              onClick={() => handleScenarioSelect('TRANSIENT_SPIKE')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              TRANSIENT VIBRATION
            </button>

            <button
              onClick={() => handleScenarioSelect('PERSISTENT_FAULT')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              PERSISTENT JOINT FAULT
            </button>

            <button
              onClick={() => handleScenarioSelect('ACTIVE_INTERROGATION')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              ACTIVE INTERROGATION
            </button>

            <button
              onClick={() => handleScenarioSelect('CRITICAL_DEGRADATION')}
              className={px-2.5 py-1 rounded text-[11px] font-bold transition-all border }
            >
              CRITICAL DEGRADATION
            </button>
          </div>
        </div>
      </div>

      {/* --- CORE USP 7-STEP INTERACTIVE PIPELINE --- */}
      <div className=\"bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto select-none\">
        <div className=\"max-w-7xl mx-auto flex items-center justify-between min-w-[760px] gap-1 font-mono text-[11px]\">
          {USP_STEPS.map((st, idx) => {
            const isHighlight = 
              (currentScenario === 'LOAD_CHANGE' && st.id === 'context') ||
              (currentScenario === 'TRANSIENT_SPIKE' && st.id === 'verify') ||
              (currentScenario === 'PERSISTENT_FAULT' && st.id === 'confirm') ||
              (currentScenario === 'ACTIVE_INTERROGATION' && st.id === 'interrogate') ||
              (currentScenario === 'CRITICAL_DEGRADATION' && st.id === 'act');

            return (
              <React.Fragment key={st.id}>
                <div
                  onClick={() => setActiveUspModal(st)}
                  className={lex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all border }
                  title={${st.title}: }
                >
                  <Icon name={st.icon} size={12} className={isHighlight ? 'text-cyan-400' : 'text-slate-500'} />
                  <span>{st.step}. {st.label}</span>
                </div>
                {idx < USP_STEPS.length - 1 && (
                  <span className=\"text-slate-600 font-bold\">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* --- MAIN LAYOUT (SIDEBAR + CONTENT) --- */}
      <div className=\"flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6\">
        {/* Sidebar Navigation */}
        <aside className=\"w-full md:w-56 shrink-0 space-y-1.5 font-mono text-xs\">
          <div className=\"text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider\">
            Operational Views
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all }
              >
                <Icon name={item.icon} size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Joint Selector in Sidebar */}
          <div className=\"pt-4 mt-4 border-t border-slate-800 space-y-2\">
            <div className=\"text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider\">
              Monitored Splices
            </div>
            {Object.keys(joints).map((k) => {
              const j = joints[k];
              const isSel = selectedJoint === k;
              return (
                <div
                  key={k}
                  onClick={() => { setSelectedJoint(k); setInspectModalJoint(j); }}
                  className={p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-[11px] }
                >
                  <div className=\"flex items-center gap-2\">
                    <span className={w-2 h-2 rounded-full }></span>
                    <strong className=\"text-slate-200\">{j.id}</strong>
                  </div>
                  <span className={ont-bold }>
                    {j.healthScore}%
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Primary Content Area */}
        <main className=\"flex-1 min-w-0\">
          {activeTab === 'dashboard' && (
            <DashboardView 
              telemetry={telemetry} 
              joints={joints} 
              selectedJoint={selectedJoint} 
              onSelectJoint={(id) => { setSelectedJoint(id); setInspectModalJoint(joints[id]); }} 
              onRunInterrogation={() => setActiveTab('interrogation')}
              theme={theme}
              onSimulateLoadChange={() => handleScenarioSelect('LOAD_CHANGE')}
              onSimulateTransientSpike={() => handleScenarioSelect('TRANSIENT_SPIKE')}
              onSimulatePersistentFault={() => handleScenarioSelect('PERSISTENT_FAULT')}
              currentScenario={currentScenario}
              beltProgress={beltProgress}
            />
          )}

          {activeTab === 'conveyor' && (
            <ConveyorMonitorView 
              telemetry={telemetry} 
              joints={joints} 
              selectedJoint={selectedJoint} 
              onSelectJoint={(id) => { setSelectedJoint(id); setInspectModalJoint(joints[id]); }}
              beltProgress={beltProgress} 
              theme={theme}
              onUpdateSpeed={(newSpd) => setTelemetry(prev => ({ ...prev, speed: newSpd }))}
              onToggleRunning={() => setTelemetry(prev => ({ ...prev, isRunning: !prev.isRunning }))}
            />
          )}

          {activeTab === 'joints' && (
            <JointHealthView 
              joints={joints} 
              onSelectJoint={(id) => { setSelectedJoint(id); setInspectModalJoint(joints[id]); }} 
            />
          )}

          {activeTab === 'sensors' && (
            <SensorAnalyticsView 
              telemetry={telemetry} 
              joints={joints} 
            />
          )}

          {activeTab === 'interrogation' && (
            <ActiveInterrogationLabView 
              joints={joints} 
              selectedJoint={selectedJoint} 
              onSelectJoint={setSelectedJoint} 
              theme={theme} 
            />
          )}

          {activeTab === 'prediction' && (
            <PredictionRulView 
              joints={joints} 
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView 
              joints={joints} 
              onOpenWorkOrder={() => setIsWorkOrderOpen(true)} 
            />
          )}

          {activeTab === 'architecture' && (
            <SystemArchitectureView />
          )}
        </main>
      </div>

      {/* --- FOOTER --- */}
      <footer className=\"border-t border-slate-800 bg-slate-950/80 px-4 py-4 mt-auto font-mono text-xs text-slate-400\">
        <div className=\"max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3\">
          <div>
            <strong className=\"text-slate-200\">SPLICE-GUARD</strong> | Prototype for Smart Mining & Predictive Maintenance
          </div>
          <div className=\"flex items-center gap-4 text-[11px]\">
            <span>Asset ID: CV-01</span>
            <span>Firmware: v2.4-Edge</span>
            <span className=\"text-cyan-400\">MQTT Ready</span>
          </div>
        </div>
      </footer>

      {/* Modal Dialogs */}
      {inspectModalJoint && (
        <JointDetailModal 
          joint={inspectModalJoint} 
          onClose={() => setInspectModalJoint(null)} 
          onRunInterrogation={() => { setInspectModalJoint(null); setActiveTab('interrogation'); }} 
        />
      )}

      {isWorkOrderOpen && (
        <WorkOrderModal 
          isOpen={isWorkOrderOpen} 
          onClose={() => setIsWorkOrderOpen(false)} 
        />
      )}

      {/* USP Step Info Modal */}
      {activeUspModal && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm\">
          <div className=\"industrial-card w-full max-w-md p-6 rounded-xl border border-cyan-500/50 shadow-2xl font-mono text-xs\">
            <div className=\"flex items-center justify-between border-b border-slate-700 pb-3 mb-3\">
              <div className=\"flex items-center gap-2\">
                <Icon name={activeUspModal.icon} size={18} className=\"text-cyan-400\" />
                <strong className=\"text-sm text-slate-100\">Step {activeUspModal.step}: {activeUspModal.label}</strong>
              </div>
              <button onClick={() => setActiveUspModal(null)} className=\"p-1 rounded bg-slate-800 text-slate-400\">
                <Icon name=\"x\" size={14} />
              </button>
            </div>
            <h4 className=\"font-bold text-cyan-300 text-sm mb-1\">{activeUspModal.title}</h4>
            <p className=\"text-slate-300 mb-4 leading-relaxed\">{activeUspModal.desc}</p>
            <div className=\"p-3 rounded bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px]\">
              This pipeline stage ensures raw sensor spikes do not trigger unwarranted alarms while ensuring true internal vulcanization decay is interrogated before belt failure.
            </div>
            <div className=\"mt-4 flex justify-end\">
              <button onClick={() => setActiveUspModal(null)} className=\"px-3 py-1.5 rounded bg-cyan-600 text-white font-bold\">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Render into DOM
const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
''')
print('Part 7 and App mount appended successfully')
