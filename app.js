// SPLICE-GUARD: Context-Aware, Active & Predictive Conveyor Belt Joint Monitoring
// High-Fidelity Industry 4.0 Web Prototype

const { useState, useEffect, useRef, useMemo } = React;

// --- CORE USP PIPELINE CONFIGURATION ---
const USP_STEPS = [
  { id: 'context', step: 1, label: 'CONTEXT', title: 'Operating Conditions', desc: 'Belt Speed, Load (Tonnage), Ambient/Bearing Temp & Drive State', icon: 'gauge' },
  { id: 'detect', step: 2, label: 'DETECT', title: 'Multi-Sensor Ingestion', desc: 'Triaxial Vibration, Strain Tension, DS18B20 Temp, Piezo Acoustic', icon: 'activity' },
  { id: 'verify', step: 3, label: 'VERIFY', title: 'Persistence Engine', desc: '10-cycle ring buffer isolates true structural anomalies from rock impacts', icon: 'shield-check' },
  { id: 'interrogate', step: 4, label: 'INTERROGATE', title: 'Active NDT Excitation', desc: 'Fires calibrated acoustic impulse into passing splice to test core stiffness', icon: 'zap' },
  { id: 'confirm', step: 5, label: 'CONFIRM', title: 'Signature Diagnostics', desc: 'Anomaly confidence (91%), health score (61%), rubber cord pullout risk', icon: 'check-circle-2' },
  { id: 'predict', step: 6, label: 'PREDICT', title: 'RUL Forecasting', desc: 'Degradation velocity (-3.2 pts/hr) & uncertainty interval (36–48h)', icon: 'trending-down' },
  { id: 'act', step: 7, label: 'ACT', title: 'Explainable Maintenance', desc: 'Action hierarchy: NORMAL -> WATCH -> INSPECT -> PLAN MAINTENANCE -> CRITICAL', icon: 'wrench' }
];

// --- INITIAL FLEET TELEMETRY ---
const INITIAL_JOINTS = {
  J01: {
    id: 'J01',
    name: 'Splice Joint #01',
    location: '220 m',
    distMeters: 220,
    healthScore: 96,
    vibration: 'Normal',
    rawVibValue: 1.24,
    normVibValue: 1.18,
    persistence: '0/10',
    persistCount: 0,
    confidence: '98%',
    confValue: 98,
    rul: '> 200 h',
    rulRange: '210–240 h',
    probableCause: 'Healthy / Nominal vulcanization bond',
    status: 'NORMAL',
    statusColor: 'emerald',
    velocity: '-0.1 pts/hr',
    lastInspected: 'Today, 08:30',
    tensileLoad: '72 kN',
    temperature: '38.4 °C',
    anomalyState: 'NONE',
    interrogationResult: 'BASELINE MATCH (Dev: 1.4%)',
    interrogationDev: 1.4,
    interrogationConf: 99,
    history: [98, 97.5, 97, 96.8, 96.5, 96.2, 96]
  },
  J02: {
    id: 'J02',
    name: 'Splice Joint #02',
    location: '500 m',
    distMeters: 500,
    healthScore: 82,
    vibration: 'Elevated',
    rawVibValue: 3.12,
    normVibValue: 2.85,
    persistence: '3/10',
    persistCount: 3,
    confidence: '78%',
    confValue: 78,
    rul: '80–100 h',
    rulRange: '80–100 h',
    probableCause: 'Possible top-cover wear / minor edge fraying',
    status: 'WATCH',
    statusColor: 'amber',
    velocity: '-0.9 pts/hr',
    lastInspected: 'Yesterday, 16:15',
    tensileLoad: '78 kN',
    temperature: '41.2 °C',
    anomalyState: 'BORDERLINE',
    interrogationResult: 'SLIGHT ATTENUATION (Dev: 6.8%)',
    interrogationDev: 6.8,
    interrogationConf: 84,
    history: [95, 92, 89, 87, 85, 83.5, 82]
  },
  J03: {
    id: 'J03',
    name: 'Splice Joint #03',
    location: '780 m',
    distMeters: 780,
    healthScore: 61,
    vibration: 'High',
    rawVibValue: 4.72,
    normVibValue: 4.38,
    persistence: '7/10',
    persistCount: 7,
    confidence: '91%',
    confValue: 91,
    rul: '36–48 h',
    rulRange: '36–48 h',
    probableCause: 'Splice degradation / rubber cord pullout risk',
    status: 'INSPECT',
    statusColor: 'rose',
    velocity: '-3.2 pts/hr',
    lastInspected: 'Today, 01:15',
    tensileLoad: '84 kN',
    temperature: '46.8 °C',
    anomalyState: 'PERSISTENT ANOMALY',
    interrogationResult: 'SPLICE DEGRADATION CONFIRMED',
    interrogationDev: 18.6,
    interrogationConf: 94,
    history: [92, 86, 79, 73, 68, 64, 61]
  }
};

const HARDWARE_COMPONENTS = [
  {
    id: 'esp32',
    name: 'ESP32-S3 Edge Controller',
    category: 'Edge Controller',
    specs: 'Dual-core Xtensa 240MHz, 8MB PSRAM, FreeRTOS',
    role: 'Real-time telemetry sampling at 2 kHz, FFT feature extraction, persistence ring buffer, and edge anomaly inference.',
    pinout: 'SPI/I2C/UART/CAN Bus, RS-485 Modbus interface',
    status: 'ONLINE',
    icon: 'cpu'
  },
  {
    id: 'mpu6050',
    name: 'MPU6050 Accelerometer',
    category: 'Vibration Sensing',
    specs: 'Tri-axial accelerometer & gyro, 16-bit ADC, programmable range up to ±16g',
    role: 'Mounted at idler impact zone & joint passage station to measure instantaneous RMS vibration (mm/s).',
    pinout: 'I2C Interface (Addr 0x68), INT pin for threshold interrupts',
    status: 'ONLINE',
    icon: 'activity'
  },
  {
    id: 'hx711',
    name: 'Load Cell + HX711 24-Bit ADC',
    category: 'Load / Tension Sensing',
    specs: 'High-precision 24-bit analog front end, 80 SPS sampling',
    role: 'Measures take-up pulley tension & material payload weight to normalize vibration against ore tonnage.',
    pinout: 'PD_SCK, DOUT to ESP32 GPIO18/19',
    status: 'ONLINE',
    icon: 'weight'
  },
  {
    id: 'ir_speed',
    name: 'Optical IR Speed Encoder',
    category: 'Tachometer / Speed',
    specs: 'Slotted optical disc / hall effect, 1024 pulses/revolution',
    role: 'Calculates instantaneous belt speed (m/s) and determines exact splice transit timestamps at idler stations.',
    pinout: 'Digital Interrupt GPIO4',
    status: 'ONLINE',
    icon: 'gauge'
  },
  {
    id: 'ds18b20',
    name: 'DS18B20 Thermometer',
    category: 'Thermal Monitoring',
    specs: '1-Wire digital thermometer, -55°C to +125°C, ±0.5°C accuracy',
    role: 'Monitors friction heat at pulley bearings and vulcanized joint transition temperature.',
    pinout: '1-Wire Bus GPIO15 with 4.7kΩ pullup',
    status: 'ONLINE',
    icon: 'thermometer'
  },
  {
    id: 'piezo',
    name: 'Piezo Dynamic Sensor',
    category: 'Acoustic / NDT Receiver',
    specs: 'Wideband acoustic emission transducer (10 Hz – 100 kHz)',
    role: 'Captures dynamic ring-down acoustic response during controlled active interrogation pulse.',
    pinout: 'Analog ADC1_CH0 with pre-amp filter circuit',
    status: 'ONLINE',
    icon: 'radio'
  },
  {
    id: 'actuator',
    name: 'Solenoid Pulse Actuator',
    category: 'Active Excitation Generator',
    specs: 'Controlled non-destructive impactor, calibrated 5 J mechanical/acoustic impulse',
    role: 'Fires brief excitation pulse into passing splice to measure structural resonant decay and rubber stiffness.',
    pinout: 'MOSFET Driver PWM GPIO22',
    status: 'READY',
    icon: 'zap'
  }
];

// Helper: play simulated synthetic industrial chirp sound using Web Audio API
function playSyntheticPulse() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.29);
  } catch (e) {}
}

// Icon helper using Lucide
const Icon = ({ name, size = 18, className = '' }) => {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [name, className]);
  return <i data-lucide={name} style={{ width: size, height: size }} className={inline-block align-middle }></i>;
};

// --- CONVEYOR BELT VISUALIZATION COMPONENT ---
function ConveyorVisualizer({ 
  beltSpeed, 
  isRunning, 
  joints, 
  selectedJoint, 
  onSelectJoint, 
  beltProgress, 
  theme 
}) {
  const isDark = theme === 'dark';
  const jointOffsets = { J01: 22, J02: 50, J03: 78 };

  const getJointPos = (jointKey) => {
    const rawPos = (jointOffsets[jointKey] + (beltProgress || 0)) % 100;
    if (rawPos <= 50) {
      const pct = rawPos / 50;
      const x = 75 + pct * 650;
      const y = 52;
      return { x, y, isTop: true };
    } else {
      const pct = (rawPos - 50) / 50;
      const x = 725 - pct * 650;
      const y = 138;
      return { x, y, isTop: false };
    }
  };

  return (
    <div className="w-full p-4 rounded-xl industrial-card relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-700/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Icon name="cpu" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              CV-01 Dynamic Conveyor Twin 
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {isRunning ? (beltSpeed > 0 ? ${beltSpeed.toFixed(1)} m/s MOVING : 'IDLE') : 'STOPPED'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">1,000 m Steel-Cord Loop • Monitored Splice Transits</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 cursor-pointer" onClick={() => onSelectJoint('J01')}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span>J01: Healthy (96%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 cursor-pointer" onClick={() => onSelectJoint('J02')}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
            <span>J02: Watch (82%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 cursor-pointer" onClick={() => onSelectJoint('J03')}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-ping"></span>
            <span>J03: Degrading (61%)</span>
          </div>
        </div>
      </div>

      {/* Conveyor Canvas / SVG Graphic */}
      <div className="relative w-full overflow-x-auto py-2">
        <svg viewBox="0 0 800 190" className="w-full h-44 select-none min-w-[650px]">
          <defs>
            <linearGradient id="oreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9a3412" />
              <stop offset="50%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>

          {/* Machine Structural Chassis */}
          <rect x="50" y="88" width="700" height="14" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="1" rx="2" />
          <line x1="80" y1="102" x2="50" y2="160" stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <line x1="720" y1="102" x2="750" y2="160" stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <line x1="280" y1="102" x2="280" y2="160" stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="2" />
          <line x1="520" y1="102" x2="520" y2="160" stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="2" />

          {/* Drive Pulley (Head) */}
          <circle cx="75" cy="95" r="43" fill={isDark ? "#1e293b" : "#94a3b8"} stroke="#06b6d4" strokeWidth="3" />
          <circle cx="75" cy="95" r="16" fill={isDark ? "#0f172a" : "#64748b"} stroke="#38bdf8" strokeWidth="2" />
          <circle cx="75" cy="95" r="5" fill="#38bdf8" />
          <g transform={
otate( 75 95)}>
            <line x1="75" y1="55" x2="75" y2="135" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="2" />
            <line x1="35" y1="95" x2="115" y2="95" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="2" />
          </g>
          <text x="75" y="178" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="10" className="font-mono font-medium">Drive Pulley (450kW)</text>

          {/* Tail / Idler Pulley */}
          <circle cx="725" cy="95" r="43" fill={isDark ? "#1e293b" : "#94a3b8"} stroke="#38bdf8" strokeWidth="3" />
          <circle cx="725" cy="95" r="16" fill={isDark ? "#0f172a" : "#64748b"} stroke="#38bdf8" strokeWidth="2" />
          <circle cx="725" cy="95" r="5" fill="#38bdf8" />
          <g transform={
otate( 725 95)}>
            <line x1="725" y1="55" x2="725" y2="135" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="2" />
            <line x1="685" y1="95" x2="765" y2="95" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="2" />
          </g>
          <text x="725" y="178" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="10" className="font-mono font-medium">Tail Pulley & Tensioner</text>

          {/* Carrying Rollers */}
          {[170, 270, 370, 470, 570, 650].map((ix, i) => (
            <g key={i}>
              <circle cx={ix} cy="62" r="10" fill={isDark ? "#334155" : "#cbd5e1"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
              <circle cx={ix} cy="62" r="3" fill="#64748b" />
            </g>
          ))}

          {/* Return Rollers */}
          {[220, 390, 560].map((ix, i) => (
            <g key={i}>
              <circle cx={ix} cy="128" r="10" fill={isDark ? "#334155" : "#cbd5e1"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
              <circle cx={ix} cy="128" r="3" fill="#64748b" />
            </g>
          ))}

          {/* Main Conveyor Belt Track */}
          <path
            d="M 75 52 L 725 52 A 43 43 0 0 1 725 138 L 75 138 A 43 43 0 0 1 75 52 Z"
            fill="none"
            stroke={isDark ? "#1e293b" : "#475569"}
            strokeWidth="9"
          />

          {/* Moving Animated Tread Track */}
          <path
            d="M 75 52 L 725 52 A 43 43 0 0 1 725 138 L 75 138 A 43 43 0 0 1 75 52 Z"
            fill="none"
            stroke={isRunning && beltSpeed > 0 ? (isDark ? "#06b6d4" : "#0284c7") : (isDark ? "#475569" : "#94a3b8")}
            strokeWidth="3"
            strokeDasharray="8 12"
            strokeDashoffset={isRunning ? -((beltProgress || 0) * 12) : 0}
            opacity="0.75"
          />

          {/* Flowing Iron Ore Bed Layer */}
          {isRunning && (
            <path
              d="M 105 48 Q 200 45, 300 48 T 500 47 T 700 48"
              fill="none"
              stroke="url(#oreGrad)"
              strokeWidth="4.5"
              strokeDasharray="4 6"
              strokeDashoffset={-((beltProgress || 0) * 8)}
              opacity="0.85"
            />
          )}

          {/* Active NDT Interrogation Station Gantry */}
          <g transform="translate(590, 16)">
            <line x1="-16" y1="0" x2="16" y2="0" stroke="#a855f7" strokeWidth="3" />
            <line x1="0" y1="0" x2="0" y2="28" stroke="#a855f7" strokeWidth="2" />
            <polygon points="-8,28 8,28 0,36" fill="#a855f7" />
            <circle cx="0" cy="2" r="3.5" fill="#c084fc" className="animate-pulse" />
            <text x="0" y="-5" textAnchor="middle" fill="#c084fc" fontSize="9" className="font-mono font-bold">NDT EXCITATION GANTRY</text>
          </g>

          {/* Splice Markers */}
          {Object.keys(joints).map((key) => {
            const joint = joints[key];
            const pos = getJointPos(key);
            const isSelected = selectedJoint === key;
            const fillMap = { J01: '#10b981', J02: '#f59e0b', J03: '#f43f5e' };

            return (
              <g 
                key={key} 
                transform={	ranslate(, )}
                className="cursor-pointer transition-transform duration-200 hover:scale-125"
                onClick={() => onSelectJoint(key)}
              >
                {isSelected && (
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
                )}
                <rect 
                  x="-4" 
                  y="-10" 
                  width="8" 
                  height="20" 
                  rx="2" 
                  fill={fillMap[key]} 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />
                <g transform={	ranslate(0, )}>
                  <rect 
                    x="-22" 
                    y="-8" 
                    width="44" 
                    height="16" 
                    rx="3" 
                    fill={isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)"} 
                    stroke={fillMap[key]} 
                    strokeWidth="1" 
                  />
                  <text 
                    x="0" 
                    y="3" 
                    textAnchor="middle" 
                    fill={fillMap[key]} 
                    fontSize="9" 
                    className="font-mono font-bold"
                  >
                    {joint.id} ({joint.healthScore}%)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-700/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400 block">Belt Velocity</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">{beltSpeed.toFixed(1)} m/s</span>
          <span className="text-[10px] text-slate-500 block">Target: 2.8 m/s</span>
        </div>
        <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400 block">Loop Transit Cycle</span>
          <span className="font-mono font-bold text-slate-200 text-sm">357.1 sec</span>
          <span className="text-[10px] text-slate-500 block">@ 1000m total path</span>
        </div>
        <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400 block">Mass Throughput</span>
          <span className="font-mono font-bold text-amber-400 text-sm">3,840 t/h</span>
          <span className="text-[10px] text-slate-500 block">Iron Ore Pellets</span>
        </div>
        <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30">
          <span className="text-slate-400 block">Station Transit</span>
          <span className="font-mono font-bold text-rose-400 text-sm">J03 approaching</span>
          <span className="text-[10px] text-slate-500 block">Active Interrogator Armed</span>
        </div>
      </div>
    </div>
  );
}

// --- LIVE SPARKLINE COMPONENT ---
function LiveSparkline({ data = [], color = '#06b6d4', height = 36, width = 120 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) === 0 ? 1 : (max - min);

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return ${x.toFixed(1)},;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Glow dot on latest point */}
      {data.length > 0 && (() => {
        const lastVal = data[data.length - 1];
        const lastX = width;
        const lastY = height - ((lastVal - min) / range) * (height - 8) - 4;
        return (
          <circle cx={lastX} cy={lastY} r="3" fill={color} className="animate-pulse" />
        );
      })()}
    </svg>
  );
}

// --- INTERACTIVE WAVEFORM COMPONENT ---
function InteractiveWaveform({ deviation = 18.6, isInterrogating = false, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      // Draw Grid Lines
      ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 40) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 30) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Zero Axis
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, mid); ctx.lineTo(w, mid);
      ctx.stroke();
      ctx.setLineDash([]);

      // 1. Healthy Baseline Waveform (Clean exponential decaying sine wave - Emerald)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const decay = Math.exp(-x / 140);
        const y = mid + Math.sin((x * 0.08) + (t * 0.04)) * (h * 0.38) * decay;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Current Joint Response Waveform (Degraded with high harmonic distortion & faster damping - Rose/Amber)
      ctx.strokeStyle = isInterrogating ? '#f43f5e' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        // Degraded joint has 28% faster damping and harmonic rattle
        const decay = Math.exp(-x / 95);
        const fundamental = Math.sin((x * 0.08) + (t * 0.04));
        const harmonic = Math.sin((x * 0.24) + (t * 0.08)) * 0.35;
        const y = mid + (fundamental + harmonic) * (h * 0.38) * decay * (1 - (deviation * 0.015));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 1;
      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [deviation, isInterrogating, isDark]);

  return (
    <div className="waveform-container p-3 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-2 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-1 bg-emerald-500 inline-block rounded-full"></span>
            <span>Healthy Baseline Reference</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-1 bg-rose-500 inline-block rounded-full"></span>
            <span>Current Joint Response (J03)</span>
          </div>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Acoustic Ring-Down Sampling: 48 kHz
        </div>
      </div>
      <canvas ref={canvasRef} width={600} height={140} className="w-full h-36 block rounded" />
    </div>
  );
}

// --- ANOMALY VERIFICATION CARD (CORE USP) ---
function AnomalyVerificationCard({ joint = 'J03', telemetry, onRunInterrogation }) {
  return (
    <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icon name="shield-alert" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                Anomaly Verification Intelligence
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  PERSISTENT ANOMALY
                </span>
              </h3>
              <p className="text-xs text-slate-400">Target Joint: <strong className="text-cyan-400">{joint}</strong> • Operating Context Normalization</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Confidence: <strong className="text-rose-400">91%</strong>
          </span>
        </div>

        {/* Verification Metrics Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs font-mono">
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Raw Vibration</span>
            <span className="text-rose-400 text-base font-bold flex items-center gap-1 mt-0.5">
              ↑ 28%
              <span className="text-[10px] text-slate-400 font-normal">(4.7 mm/s)</span>
            </span>
            <span className="text-[10px] text-rose-300 block mt-1">Exceeds nominal</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Operating Load</span>
            <span className="text-amber-400 text-base font-bold flex items-center gap-1 mt-0.5">
              ↑ 22%
              <span className="text-[10px] text-slate-400 font-normal">(74% full)</span>
            </span>
            <span className="text-[10px] text-amber-300 block mt-1">Ore burden shift</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Normalized Anomaly</span>
            <span className="text-cyan-400 text-base font-bold flex items-center gap-1 mt-0.5">
              ↑ 7%
              <span className="text-[10px] text-slate-400 font-normal">(Residual)</span>
            </span>
            <span className="text-[10px] text-cyan-300 block mt-1">Load-independent</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Cycle Persistence</span>
            <span className="text-rose-400 text-base font-bold flex items-center gap-1 mt-0.5">
              7 / 10 cycles
            </span>
            <span className="text-[10px] text-rose-300 block mt-1">Repeated fault</span>
          </div>
        </div>

        {/* Explainable AI Callout Box */}
        <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed mb-4">
          <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-1">
            <Icon name="info" size={14} />
            <span>Why Raw Vibration Alone Is Misleading:</span>
          </div>
          <p className="italic text-slate-300">
            "Vibration increased during a load change. After operating-condition normalization, only a persistent abnormal component remained."
          </p>
          <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Algorithm: <code className="text-cyan-300">V_norm = V_raw - f(Tonnage, Speed, Temp)</code></span>
            <span className="text-emerald-400 font-mono">Persistence Filter: ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/40 text-xs">
        <span className="text-slate-400">Status: <strong className="text-rose-400 font-mono">PERSISTENT JOINT ANOMALY DETECTED</strong></span>
        <button
          onClick={onRunInterrogation}
          className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 text-xs"
        >
          <Icon name="zap" size={14} />
          Trigger Interrogation on {joint}
        </button>
      </div>
    </div>
  );
}

// --- ACTIVE JOINT INTERROGATION CARD ---
function ActiveInterrogationCard({ 
  selectedJoint = 'J03', 
  theme, 
  onInterrogationComplete 
}) {
  const [step, setStep] = useState(0); // 0=idle, 1=excitation, 2=capture, 3=comparison, 4=done
  const [isRunning, setIsRunning] = useState(false);
  const [deviation, setDeviation] = useState(18.6);

  const startInterrogation = () => {
    setIsRunning(true);
    setStep(1);
    playSyntheticPulse();

    setTimeout(() => {
      setStep(2);
      setTimeout(() => {
        setStep(3);
        setTimeout(() => {
          setStep(4);
          setIsRunning(false);
          if (onInterrogationComplete) onInterrogationComplete();
        }, 800);
      }, 800);
    }, 800);
  };

  const stepsList = [
    { n: 1, text: 'Excitation Triggered', desc: 'Calibrated 5J Piezo pulse fired' },
    { n: 2, text: 'Response Captured', desc: 'Dynamic acoustic ring-down sampled' },
    { n: 3, text: 'Healthy Baseline Comparison', desc: 'Spectral FFT reference overlaid' },
    { n: 4, text: 'Signature Deviation Calculated', desc: 'Stiffness & damping deviation' }
  ];

  return (
    <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Icon name="zap" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                Active Joint Interrogation
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  PROTOTYPE NDT DEMO
                </span>
              </h3>
              <p className="text-xs text-slate-400">Joint Selected: <strong className="text-cyan-400">{selectedJoint}</strong> • Acoustic Excitation & Decay</p>
            </div>
          </div>
          <button
            onClick={startInterrogation}
            disabled={isRunning}
            className={px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all }
          >
            <Icon name={isRunning ? "loader-2" : "play"} size={14} className={isRunning ? 'animate-spin' : ''} />
            {isRunning ? 'Interrogating...' : 'START INTERROGATION'}
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 text-xs font-mono">
          {stepsList.map((st) => {
            const isDone = step >= st.n;
            const isCurrent = step === st.n;
            return (
              <div 
                key={st.n}
                className={p-2.5 rounded-lg border transition-all  }
              >
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <span className={w-4 h-4 rounded-full flex items-center justify-center text-[10px] }>
                    {st.n}
                  </span>
                  <span>{st.text}</span>
                </div>
                <p className="text-[10px] text-slate-400">{st.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Dynamic Animated Waveform */}
        <InteractiveWaveform deviation={deviation} isInterrogating={isRunning} theme={theme} />

        {/* Results Banner */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-mono">
          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Response Deviation</span>
            <span className="text-base font-bold text-rose-400">18.6%</span>
            <span className="text-[10px] text-slate-500 block">Threshold: 10.0%</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Interrogation Confidence</span>
            <span className="text-base font-bold text-cyan-400">94%</span>
            <span className="text-[10px] text-slate-500 block">Multi-harmonic match</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Diagnostic Outcome</span>
            <span className="text-xs font-bold text-rose-400 leading-tight block mt-1">
              SPLICE DEGRADATION CONFIRMED
            </span>
            <span className="text-[10px] text-rose-300 block">Core bond loss</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 text-[11px] text-slate-500 italic border-t border-slate-700/40">
        * Non-destructive acoustic interrogation demo. Emits safe micro-strain excitation to detect internal cord delamination before visual tearing occurs.
      </div>
    </div>
  );
}

// --- FALSE ALARM DEMONSTRATION SECTION ---
function FalseAlarmDemoSection({ 
  onSimulateLoadChange, 
  onSimulateTransientSpike, 
  onSimulatePersistentFault,
  currentScenario
}) {
  return (
    <div className="industrial-card p-5 rounded-xl border border-slate-700/50 my-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/40 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold tracking-wide flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icon name="check-check" size={16} />
            </span>
            False Alarm Intelligence & Verification Suite
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrating why legacy threshold alarms fail and how SPLICE-GUARD eliminates false alarms.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          <span>Active Test:</span>
          <strong className="text-cyan-400 uppercase">{currentScenario}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Test 1: Load Change */}
        <div className={p-4 rounded-xl border transition-all flex flex-col justify-between }>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Scenario A: Ore Load Surge</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                NO FALSE ALARM
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Ore feed rate jumps by 25%. Heavy material dampening & idler impact causes raw vibration to spike.
            </p>
            <div className="space-y-1.5 text-xs font-mono mb-4 bg-slate-900/50 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Raw Vibration:</span>
                <span className="text-rose-400 font-bold">HIGH (↑ 32%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normalized Anomaly:</span>
                <span className="text-emerald-400 font-bold">LOW (Nominal)</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span className="text-slate-400">System Decision:</span>
                <span className="text-emerald-400 font-bold">SUPPRESS ALARM</span>
              </div>
            </div>
          </div>
          <button
            onClick={onSimulateLoadChange}
            className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all"
          >
            <Icon name="refresh-cw" size={14} />
            SIMULATE LOAD CHANGE
          </button>
        </div>

        {/* Test 2: Transient Spike */}
        <div className={p-4 rounded-xl border transition-all flex flex-col justify-between }>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Scenario B: Boulder Impact</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                IGNORE TRANSIENT
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              An isolated oversize iron ore lump hits idler zone #4, triggering a momentary 8g mechanical jolt.
            </p>
            <div className="space-y-1.5 text-xs font-mono mb-4 bg-slate-900/50 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Transient Peak:</span>
                <span className="text-rose-400 font-bold">7.8 mm/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Persistence Buffer:</span>
                <span className="text-amber-400 font-bold">1 / 10 cycles</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span className="text-slate-400">System Decision:</span>
                <span className="text-amber-400 font-bold">IGNORE TRANSIENT</span>
              </div>
            </div>
          </div>
          <button
            onClick={onSimulateTransientSpike}
            className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all"
          >
            <Icon name="zap-off" size={14} />
            SIMULATE TRANSIENT SPIKE
          </button>
        </div>

        {/* Test 3: Persistent Joint Fault */}
        <div className={p-4 rounded-xl border transition-all flex flex-col justify-between }>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Scenario C: Splice Decay</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                CONFIRMED FAULT
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Splice J03 exhibits recurring abnormal harmonic response every 357 seconds at the identical loop coordinate.
            </p>
            <div className="space-y-1.5 text-xs font-mono mb-4 bg-slate-900/50 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Repeated Response:</span>
                <span className="text-rose-400 font-bold">YES (7/10 cycles)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Interrogation:</span>
                <span className="text-purple-400 font-bold">TRIGGERED</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span className="text-slate-400">System Decision:</span>
                <span className="text-rose-400 font-bold">CONFIRMED DEGRADATION</span>
              </div>
            </div>
          </div>
          <button
            onClick={onSimulatePersistentFault}
            className="w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs flex items-center justify-center gap-2 border border-rose-500 shadow-md shadow-rose-900/30 transition-all"
          >
            <Icon name="alert-triangle" size={14} />
            SIMULATE PERSISTENT JOINT FAULT
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 1. MAIN DASHBOARD VIEW ---
function DashboardView({ 
  telemetry, 
  joints, 
  selectedJoint, 
  onSelectJoint, 
  onRunInterrogation, 
  theme,
  onSimulateLoadChange,
  onSimulateTransientSpike,
  onSimulatePersistentFault,
  currentScenario,
  beltProgress
}) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Conveyor Status */}
        <div className="industrial-card p-3.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Conveyor Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">RUNNING</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">CV-01 • Loaded</div>
        </div>

        {/* 2. Overall Belt Health */}
        <div className="industrial-card p-3.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Overall Health</span>
            <Icon name="heart-pulse" size={14} className="text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-400">87%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '87%' }}></div>
          </div>
        </div>

        {/* 3. Joints Monitored */}
        <div className="industrial-card p-3.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Joints Monitored</span>
            <Icon name="layers" size={14} className="text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">3 Active</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">J01, J02, J03</div>
        </div>

        {/* 4. Active Alerts */}
        <div className="industrial-card p-3.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Active Alerts</span>
            <Icon name="bell" size={14} className="text-rose-400" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-400">1 Critical</div>
          <div className="text-[11px] text-rose-300 font-mono mt-0.5">Splice wear detected</div>
        </div>

        {/* 5. Highest Risk Joint */}
        <div 
          onClick={() => onSelectJoint('J03')} 
          className="industrial-card p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/10 cursor-pointer hover:border-rose-500 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Highest Risk Joint</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">61%</span>
          </div>
          <div className="text-lg font-bold font-mono text-rose-400 flex items-center gap-1.5">
            J03
            <Icon name="external-link" size={12} />
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Inspect & Plan</div>
        </div>

        {/* 6. Estimated RUL */}
        <div className="industrial-card p-3.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Estimated RUL</span>
            <Icon name="clock" size={14} className="text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">36–48 h</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Conf: 82% (Uncertainty)</div>
        </div>
      </div>

      {/* Interactive Conveyor Belt Graphic */}
      <ConveyorVisualizer 
        beltSpeed={telemetry.speed} 
        isRunning={telemetry.isRunning} 
        joints={joints} 
        selectedJoint={selectedJoint} 
        onSelectJoint={onSelectJoint} 
        beltProgress={beltProgress} 
        theme={theme} 
      />

      {/* Live Sensor Panel & Sparklines */}
      <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/40 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Icon name="activity" size={16} />
            </div>
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Live Conveyor Sensor Panel
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SIMULATION MODE
              </span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Sampling: 2000 Hz Edge Ring Buffer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Belt Speed */}
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Belt Speed</span>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {telemetry.speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Nominal: 2.8 m/s</span>
            </div>
            <LiveSparkline data={telemetry.speedHistory} color="#06b6d4" width={90} height={32} />
          </div>

          {/* Load */}
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Ore Load</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {telemetry.load.toFixed(0)} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Tonnage: 3,840 t/h</span>
            </div>
            <LiveSparkline data={telemetry.loadHistory} color="#f59e0b" width={90} height={32} />
          </div>

          {/* Temperature */}
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Splice Temp</span>
              <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                {telemetry.temp.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Ambient: 24.2 °C</span>
            </div>
            <LiveSparkline data={telemetry.tempHistory} color="#38bdf8" width={90} height={32} />
          </div>

          {/* Vibration RMS */}
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Vibration RMS</span>
              <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                {telemetry.vibration.toFixed(2)} <span className="text-xs font-normal text-slate-400">mm/s</span>
              </div>
              <span className="text-[10px] text-rose-300 block">Elevated on J03</span>
            </div>
            <LiveSparkline data={telemetry.vibrationHistory} color="#f43f5e" width={90} height={32} />
          </div>

          {/* Acoustic Response */}
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Acoustic Signal</span>
              <div className="text-sm font-bold font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                ABNORMAL
              </div>
            </div>
            <div className="text-[10px] font-mono text-purple-400 flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/40">
              <span>Piezo Resonant:</span>
              <span>18.6% Dev</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Anomaly Verification vs Active Interrogation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnomalyVerificationCard 
          joint="J03" 
          telemetry={telemetry} 
          onRunInterrogation={onRunInterrogation} 
        />
        <ActiveInterrogationCard 
          selectedJoint={selectedJoint} 
          theme={theme} 
          onInterrogationComplete={() => {}} 
        />
      </div>

      {/* False Alarm Demonstration Suite */}
      <FalseAlarmDemoSection 
        onSimulateLoadChange={onSimulateLoadChange}
        onSimulateTransientSpike={onSimulateTransientSpike}
        onSimulatePersistentFault={onSimulatePersistentFault}
        currentScenario={currentScenario}
      />
    </div>
  );
}

// --- 2. CONVEYOR MONITOR VIEW ---
function ConveyorMonitorView({ 
  telemetry, 
  joints, 
  selectedJoint, 
  onSelectJoint, 
  beltProgress, 
  theme,
  onUpdateSpeed,
  onToggleRunning
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icon name="monitor" size={20} className="text-cyan-400" />
            Conveyor CV-01 High-Resolution Telemetry Twin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Primary Iron Ore Overland Trunk Conveyor • 1,000 m Center-to-Center • ST-2500 Steel Cord Construction
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-4 bg-slate-800/40 p-2 rounded-lg border border-slate-700/40 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Drive Speed:</span>
            <input 
              type="range" 
              min="0" 
              max="4.5" 
              step="0.1" 
              value={telemetry.speed} 
              onChange={(e) => onUpdateSpeed(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold w-12 text-right">{telemetry.speed.toFixed(1)} m/s</span>
          </div>

          <button
            onClick={onToggleRunning}
            className={px-3 py-1.5 rounded font-bold transition-all text-xs flex items-center gap-1.5 }
          >
            <Icon name={telemetry.isRunning ? 'pause' : 'play'} size={12} />
            {telemetry.isRunning ? 'STOP CONVEYOR' : 'START CONVEYOR'}
          </button>
        </div>
      </div>

      {/* Main Visualizer */}
      <ConveyorVisualizer 
        beltSpeed={telemetry.speed} 
        isRunning={telemetry.isRunning} 
        joints={joints} 
        selectedJoint={selectedJoint} 
        onSelectJoint={onSelectJoint} 
        beltProgress={beltProgress} 
        theme={theme} 
      />

      {/* Mechanical Specs & Sensor Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="settings" size={14} className="text-cyan-400" />
            Mechanical Drive Subsystem
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Motor Rating:</span><span className="text-slate-200">450 kW ABB Variable Frequency</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Gearbox Ratio:</span><span className="text-slate-200">19.4 : 1 Helical Bevel</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Drive Pulley Dia:</span><span className="text-slate-200">1,000 mm Diamond Lagged</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Motor Bearing Temp:</span><span className="text-emerald-400 font-bold">54.2 °C (Nominal)</span></div>
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="shield" size={14} className="text-amber-400" />
            Tensioning & Gravity Take-Up
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Take-Up Tension:</span><span className="text-amber-400 font-bold">78.4 kN (Target: 75–80)</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Counterweight Mass:</span><span className="text-slate-200">16.0 Tonnes</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Carriage Travel:</span><span className="text-slate-200">420 mm / 1200 mm</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Belt Stretch (Elong.):</span><span className="text-emerald-400">0.42% (Elastic)</span></div>
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="radio" size={14} className="text-purple-400" />
            Gantry Inspection Station #1
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Station Coordinate:</span><span className="text-slate-200">Ch. 780 m (Near Head)</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Acoustic Transducer:</span><span className="text-emerald-400 font-bold">Armed & Calibrated</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Optical Splice Sync:</span><span className="text-cyan-400 font-bold">LOCKED (±2 mm)</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Last Cycle Transit:</span><span className="text-rose-400 font-bold">J03 (7/10 Anomaly)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. JOINT HEALTH FLEET VIEW ---
function JointHealthView({ joints, onSelectJoint }) {
  return (
    <div className="space-y-6">
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/40 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Icon name="layers" size={18} className="text-cyan-400" />
              Monitored Splice Joint Fleet Overview
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Condition assessments derived from context-normalized vibration, multi-cycle persistence, and active NDT excitation.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Total Splices: <strong className="text-cyan-400">3</strong> • Critical: <strong className="text-rose-400">1</strong>
          </span>
        </div>

        {/* Fleet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 text-slate-400 uppercase tracking-wider bg-slate-800/20">
                <th className="py-3 px-3">Joint ID</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Health Score</th>
                <th className="py-3 px-3">Vibration</th>
                <th className="py-3 px-3">Persistence</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Est. RUL</th>
                <th className="py-3 px-3">Probable Cause</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {Object.keys(joints).map((key) => {
                const j = joints[key];
                const badgeColor = {
                  NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  WATCH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  INSPECT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                  CRITICAL: 'bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse'
                }[j.status] || 'bg-slate-700 text-slate-300';

                return (
                  <tr 
                    key={key} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectJoint(key)}
                  >
                    <td className="py-3.5 px-3 font-bold text-slate-100 flex items-center gap-2">
                      <span className={w-2.5 h-2.5 rounded-full }></span>
                      {j.id}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{j.location}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <strong className={
                          j.healthScore > 85 ? 'text-emerald-400' :
                          j.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }>{j.healthScore}%</strong>
                        <div className="w-12 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={h-1.5 rounded-full }
                            style={{ width: ${j.healthScore}% }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{j.vibration}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">{j.persistence}</td>
                    <td className="py-3.5 px-3 text-cyan-400 font-bold">{j.confidence}</td>
                    <td className="py-3.5 px-3 font-bold text-amber-400">{j.rul}</td>
                    <td className="py-3.5 px-3 text-slate-400 max-w-[200px] truncate" title={j.probableCause}>
                      {j.probableCause}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={px-2 py-0.5 rounded text-[10px] font-bold border }>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelectJoint(key); }}
                        className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- JOINT DETAIL MODAL / DRAWER ---
function JointDetailModal({ joint, onClose, onRunInterrogation }) {
  if (!joint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="industrial-card w-full max-w-3xl rounded-2xl border border-slate-600 p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={p-2.5 rounded-xl border }>
              <Icon name="shield-alert" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {joint.name} Diagnostic File
                <span className={	ext-xs font-mono px-2.5 py-0.5 rounded-full border }>
                  {joint.status}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Coordinate: {joint.location} • Monitored since commissioning</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-5">
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Health Score</span>
            <span className={	ext-xl font-bold }>
              {joint.healthScore} / 100
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Trend: {joint.healthScore < 70 ? 'Declining' : 'Stable'}</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Degradation Velocity</span>
            <span className="text-xl font-bold text-rose-400">{joint.velocity}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Estimated slope</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Anomaly Confidence</span>
            <span className="text-xl font-bold text-cyan-400">{joint.confidence}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Bayesian Multi-sensor</span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Persistence Ratio</span>
            <span className="text-xl font-bold text-amber-400">{joint.persistence}</span>
            <span className="text-[10px] text-slate-500 block mt-1">10-cycle window</span>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="space-y-3 text-xs font-mono mb-5 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Active Interrogation:</span>
            <span className="text-purple-400 font-bold">{joint.interrogationResult}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Probable Root Cause:</span>
            <span className="text-rose-400 font-bold text-right">{joint.probableCause}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Estimated RUL (Remaining Useful Life):</span>
            <span className="text-amber-400 font-bold">{joint.rulRange} (Prototype estimate)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Recommended Action:</span>
            <span className="text-rose-400 font-bold uppercase">
              {joint.status === 'NORMAL' ? 'ROUTINE PATROL' : joint.status === 'WATCH' ? 'CLOSE MONITORING' : 'PLAN SPLICE OVERHAUL'}
            </span>
          </div>
        </div>

        {/* Degradation Trend Graph */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-5">
          <div className="flex items-center justify-between text-xs font-mono mb-3">
            <span className="text-slate-300 font-bold">Degradation Trend Over Operating Cycles</span>
            <span className="text-slate-500">Threshold Line: 50%</span>
          </div>
          <div className="h-32 w-full flex items-end justify-between gap-2 px-2 pt-4 border-b border-l border-slate-700">
            {joint.history.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                  {val}%
                </span>
                <div 
                  className={w-full rounded-t transition-all }
                  style={{ height: ${val}% }}
                ></div>
                <span className="text-[9px] font-mono text-slate-500">C{idx+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700 text-xs font-medium">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onRunInterrogation(); }}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all font-mono"
          >
            <Icon name="zap" size={14} />
            Interrogate {joint.id}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 4. SENSOR ANALYTICS VIEW ---
function SensorAnalyticsView({ telemetry, joints }) {
  const [selectedSensorJoint, setSelectedSensorJoint] = useState('J03');
  const activeJ = joints[selectedSensorJoint] || joints.J03;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Icon name="activity" size={18} className="text-cyan-400" />
            Multi-Sensor Diagnostic Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Raw vs Context-Normalized Signal Analysis • High-Frequency Triaxial Vibration, Strain Load & Acoustic Emissions
          </p>
        </div>

        {/* Joint Selector */}
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/40">
          <span className="text-slate-400 px-2">Filter Joint:</span>
          {['J01', 'J02', 'J03'].map((jId) => (
            <button
              key={jId}
              onClick={() => setSelectedSensorJoint(jId)}
              className={px-3 py-1 rounded font-bold transition-all }
            >
              {jId}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {/* Sensor 1: MPU6050 Vibration */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Icon name="activity" size={16} />
                <span>MPU6050 Vibration (RMS)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                {activeJ.vibration}
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-100">{activeJ.rawVibValue.toFixed(2)} <span className="text-xs text-slate-400 font-normal">mm/s</span></span>
              <span className="text-[11px] text-cyan-400">Norm: {activeJ.normVibValue.toFixed(2)} mm/s</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 mb-3">
              <div className="flex justify-between"><span>Nominal Zone:</span><span className="text-emerald-400">&lt; 2.5 mm/s</span></div>
              <div className="flex justify-between"><span>Warning Level:</span><span className="text-amber-400">2.5 – 4.0 mm/s</span></div>
              <div className="flex justify-between"><span>Critical Trip:</span><span className="text-rose-400">&gt; 4.5 mm/s</span></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/30">
            <LiveSparkline data={telemetry.vibrationHistory} color="#f43f5e" width={280} height={40} />
          </div>
        </div>

        {/* Sensor 2: HX711 Load / Tension */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Icon name="weight" size={16} />
                <span>HX711 Load & Tension</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                LOADED
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-100">{telemetry.load.toFixed(0)} <span className="text-xs text-slate-400 font-normal">%</span></span>
              <span className="text-[11px] text-amber-400">Tension: {activeJ.tensileLoad}</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 mb-3">
              <div className="flex justify-between"><span>Tonnage Throughput:</span><span className="text-slate-200">3,840 t/h</span></div>
              <div className="flex justify-between"><span>Zero Tare Drift:</span><span className="text-emerald-400">0.02%</span></div>
              <div className="flex justify-between"><span>Dynamic Impact Shock:</span><span className="text-amber-400">Moderate</span></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/30">
            <LiveSparkline data={telemetry.loadHistory} color="#f59e0b" width={280} height={40} />
          </div>
        </div>

        {/* Sensor 3: DS18B20 Temperature */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Icon name="thermometer" size={16} />
                <span>DS18B20 Joint Temp</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                NOMINAL
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-100">{telemetry.temp.toFixed(1)} <span className="text-xs text-slate-400 font-normal">°C</span></span>
              <span className="text-[11px] text-slate-400">Ambient: 24.2 °C</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 mb-3">
              <div className="flex justify-between"><span>Vulcanized Core Temp:</span><span className="text-slate-200">{activeJ.temperature}</span></div>
              <div className="flex justify-between"><span>Friction Thermal Rise:</span><span className="text-cyan-400">+14.2 °C</span></div>
              <div className="flex justify-between"><span>Overheat Limit:</span><span className="text-rose-400">75.0 °C</span></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/30">
            <LiveSparkline data={telemetry.tempHistory} color="#06b6d4" width={280} height={40} />
          </div>
        </div>

        {/* Sensor 4: Optical IR Speed */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Icon name="gauge" size={16} />
                <span>Optical IR Speed Encoder</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px]">
                SYNCED
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-100">{telemetry.speed.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m/s</span></span>
              <span className="text-[11px] text-emerald-400">53.4 RPM</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 mb-3">
              <div className="flex justify-between"><span>Encoder Resolution:</span><span className="text-slate-200">1024 PPR</span></div>
              <div className="flex justify-between"><span>Belt Slip Ratio:</span><span className="text-emerald-400">0.12% (Safe)</span></div>
              <div className="flex justify-between"><span>Transit Latency:</span><span className="text-cyan-400">± 1.2 ms</span></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/30">
            <LiveSparkline data={telemetry.speedHistory} color="#10b981" width={280} height={40} />
          </div>
        </div>

        {/* Sensor 5: Piezo Dynamic Acoustic */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Icon name="radio" size={16} />
                <span>Piezo Wideband Acoustic Sensor (100 kHz)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px]">
                NDT RECEIVER
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <span className="text-slate-400 text-[10px] block">Dynamic Amplitude</span>
                <strong className="text-purple-300 text-sm">420 mV pk-pk</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Harmonic Distortion</span>
                <strong className="text-rose-400 text-sm">18.6% THD</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Resonant Damping</span>
                <strong className="text-amber-400 text-sm">ζ = 0.18</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Rubber Bond Health</span>
                <strong className="text-rose-400 text-sm">DEGRADED</strong>
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Acoustic Emission Event Rate: <strong className="text-rose-400">142 hits/cycle</strong></span>
            <span className="text-purple-400">Micro-crack energy spectrum detected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. ACTIVE INTERROGATION LAB VIEW ---
function ActiveInterrogationLabView({ joints, selectedJoint, onSelectJoint, theme }) {
  const currentJoint = joints[selectedJoint] || joints.J03;

  return (
    <div className="space-y-6">
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Icon name="zap" size={18} className="text-purple-400" />
            Active NDT Interrogation & Dynamic Ring-Down Laboratory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controlled mechanical/acoustic pulse excitation isolates internal rubber cord pull-out from external rock noise.
          </p>
        </div>

        {/* Joint Selector */}
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/40">
          <span className="text-slate-400 px-2">Target Joint:</span>
          {['J01', 'J02', 'J03'].map((jId) => (
            <button
              key={jId}
              onClick={() => onSelectJoint(jId)}
              className={px-3 py-1 rounded font-bold transition-all }
            >
              {jId}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interrogation Station Card */}
      <ActiveInterrogationCard 
        selectedJoint={selectedJoint} 
        theme={theme} 
        onInterrogationComplete={() => {}} 
      />

      {/* Deep NDT Physics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="waves" size={14} className="text-purple-400" />
            Spectral Damping & Loss Factor
          </h4>
          <p className="text-slate-400 mb-3 leading-relaxed">
            Healthy rubber exhibits uniform viscoelastic hysteresis. Delaminated splices experience internal frictional slipping, multiplying damping loss:
          </p>
          <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between"><span>Baseline Damping (η₀):</span><span className="text-emerald-400 font-bold">0.062</span></div>
            <div className="flex justify-between"><span>J03 Damping (η_meas):</span><span className="text-rose-400 font-bold">0.178 (+187%)</span></div>
            <div className="flex justify-between"><span>Dynamic Loss Angle:</span><span className="text-amber-400 font-bold">δ = 11.4°</span></div>
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="shield-check" size={14} className="text-cyan-400" />
            Steel Cord Vulcanization Bond
          </h4>
          <p className="text-slate-400 mb-3 leading-relaxed">
            Measures acoustic transmission speed across the staggered splice step-overlap. Lower wave speed indicates cord pullout:
          </p>
          <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between"><span>Healthy Group Velocity:</span><span className="text-emerald-400 font-bold">1,850 m/s</span></div>
            <div className="flex justify-between"><span>J03 Measured Velocity:</span><span className="text-rose-400 font-bold">1,520 m/s (-17.8%)</span></div>
            <div className="flex justify-between"><span>Interfacial Shear Bond:</span><span className="text-rose-400 font-bold">Degraded (61%)</span></div>
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="cpu" size={14} className="text-amber-400" />
            Edge Interrogation Algorithm
          </h4>
          <p className="text-slate-400 mb-3 leading-relaxed">
            ESP32 micro-edge executes in-situ FFT autocorrelation on the 48 kHz dynamic burst:
          </p>
          <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800 space-y-1.5">
            <div className="flex justify-between"><span>Sampling Duration:</span><span className="text-slate-200">250 ms burst</span></div>
            <div className="flex justify-between"><span>FFT Bins:</span><span className="text-slate-200">2048 points</span></div>
            <div className="flex justify-between"><span>Anomaly Decision:</span><span className="text-rose-400 font-bold">CONFIRMED</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 6. PREDICTION & RUL VIEW ---
function PredictionRulView({ joints }) {
  const j = joints.J03;

  return (
    <div className="space-y-6">
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Icon name="trending-down" size={18} className="text-amber-400" />
            Predictive Degradation & Remaining Useful Life (RUL)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Joint J03 Prognostic Trajectory • Uncertainty Bounds: 36–48 Operating Hours
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            RUL: 36–48 h
          </span>
          <span className="px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Confidence: <strong className="text-cyan-400">82%</strong>
          </span>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300 font-mono">
        <Icon name="alert-triangle" size={18} className="text-amber-400 shrink-0" />
        <div>
          <strong>IMPORTANT PROTOTYPE DISCLAIMER:</strong> RUL shown is a prototype estimate generated from simulated degradation data and is not an industrial-certified prediction.
        </div>
      </div>

      {/* Degradation Curve with Shaded Uncertainty Cone */}
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-bold">Splice Health Trajectory vs Operating Hours</span>
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-3 h-1 bg-cyan-500 rounded-full inline-block"></span>
              <span>Historical Wear</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-3 h-1 bg-amber-500 border border-dashed rounded-full inline-block"></span>
              <span>Projected Mean RUL</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <span className="w-3 h-2 bg-purple-500/30 rounded inline-block"></span>
              <span>82% Uncertainty Envelope</span>
            </div>
          </div>
          <span className="text-rose-400 font-bold">Failure Threshold: 50% Health</span>
        </div>

        {/* SVG Degradation Chart */}
        <div className="w-full overflow-x-auto py-2">
          <svg viewBox="0 0 760 260" className="w-full h-64 select-none min-w-[620px]">
            <defs>
              <linearGradient id="uncertaintyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.35)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
              </linearGradient>
            </defs>

            {/* Grid & Axes */}
            <line x1="60" y1="30" x2="60" y2="220" stroke="#334155" strokeWidth="1.5" />
            <line x1="60" y1="220" x2="740" y2="220" stroke="#334155" strokeWidth="1.5" />

            {/* Y Axis Labels (Health %) */}
            {[100, 80, 60, 50, 40, 20].map((hp, idx) => {
              const y = 30 + ((100 - hp) / 100) * 190;
              return (
                <g key={idx}>
                  <line x1="55" y1={y} x2="740" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="48" y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10" className="font-mono">{hp}%</text>
                </g>
              );
            })}

            {/* Failure Threshold Red Line (50%) */}
            <line x1="60" y1="125" x2="740" y2="125" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x="730" y="120" textAnchor="end" fill="#f43f5e" fontSize="10" className="font-mono font-bold">CRITICAL TRIP THRESHOLD (50%)</text>

            {/* X Axis Time Labels */}
            {['0h', '24h', '48h', '72h (Now)', '96h', '120h (+48h RUL)'].map((tLabel, idx) => {
              const x = 60 + idx * 130;
              return (
                <g key={idx}>
                  <line x1={x} y1="220" x2="x" y2="225" stroke="#475569" strokeWidth="1.5" />
                  <text x={x} y="240" textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-mono">{tLabel}</text>
                </g>
              );
            })}

            {/* Historical Wear Curve (0h to 72h) */}
            {/* Points: 0h: 96% -> 24h: 88% -> 48h: 75% -> 72h: 61% */}
            <path
              d="M 60 38 L 190 53 L 320 78 L 450 104"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Historical data dots */}
            <circle cx="60" cy="38" r="4" fill="#06b6d4" />
            <circle cx="190" cy="53" r="4" fill="#06b6d4" />
            <circle cx="320" cy="78" r="4" fill="#06b6d4" />
            <circle cx="450" cy="104" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />

            {/* Current Point Marker (Now - 72h, Health 61%) */}
            <line x1="450" y1="30" x2="450" y2="220" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="450" y="25" textAnchor="middle" fill="#f59e0b" fontSize="10" className="font-mono font-bold">CURRENT STATE (J03: 61%)</text>

            {/* Shaded Uncertainty Cone for Future Projection */}
            <path
              d="M 450 104 L 610 125 L 680 125 L 450 104 Z"
              fill="url(#uncertaintyGrad)"
            />

            {/* Projected Mean RUL Line (crosses 50% at ~42h into the future) */}
            <path
              d="M 450 104 L 640 125"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Uncertainty Interval Indicator on Threshold Line */}
            <line x1="610" y1="115" x2="610" y2="135" stroke="#a855f7" strokeWidth="3" />
            <line x1="680" y1="115" x2="680" y2="135" stroke="#a855f7" strokeWidth="3" />
            <line x1="610" y1="125" x2="680" y2="125" stroke="#a855f7" strokeWidth="2" />
            <text x="645" y="150" textAnchor="middle" fill="#a855f7" fontSize="10" className="font-mono font-bold">36–48 Operating Hours</text>
          </svg>
        </div>

        {/* Prediction Metrics Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-3 border-t border-slate-700/40">
          <div className="bg-slate-800/30 p-2.5 rounded border border-slate-700/30">
            <span className="text-slate-400 block text-[11px]">Degradation Velocity</span>
            <span className="text-rose-400 font-bold text-sm">-3.2 points/hour</span>
            <span className="text-[10px] text-slate-500 block">Accelerating wear</span>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded border border-slate-700/30">
            <span className="text-slate-400 block text-[11px]">Failure Probability Window</span>
            <span className="text-amber-400 font-bold text-sm">36 to 48 hours</span>
            <span className="text-[10px] text-slate-500 block">At current ore load</span>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded border border-slate-700/30">
            <span className="text-slate-400 block text-[11px]">Confidence Interval</span>
            <span className="text-cyan-400 font-bold text-sm">82% Bayesian Bounds</span>
            <span className="text-[10px] text-slate-500 block">P(Fail &lt; 50) = 0.94</span>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded border border-slate-700/30">
            <span className="text-slate-400 block text-[11px]">Recommended Action</span>
            <span className="text-rose-400 font-bold text-sm uppercase">Plan Maintenance</span>
            <span className="text-[10px] text-rose-300 block">Next turnaround</span>
          </div>
        </div>
      </div>

      {/* Explainable AI: What Caused the Prediction? */}
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50">
        <div className="border-b border-slate-700/40 pb-3 mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Icon name="help-circle" size={16} className="text-cyan-400" />
            Explainable AI: What Caused This Prediction?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Decomposition of weighted physical contributors influencing the 36–48h RUL forecast.
          </p>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Persistent Vibration Anomaly (Multi-Cycle Synchronous Peak)
              </span>
              <span className="text-rose-400 font-bold">+35% Weight</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-rose-500 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Abnormal Active Interrogation Response (18.6% Resonant Deviation)
              </span>
              <span className="text-purple-400 font-bold">+30% Weight</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Increasing Degradation Trend (-3.2 points/hour velocity)
              </span>
              <span className="text-amber-400 font-bold">+15% Weight</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Operating Load (74% Continuous Burden Stress)
              </span>
              <span className="text-cyan-400 font-bold">+10% Weight</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Vulcanized Core Temperature (46.8 °C Dynamic Thermal Rise)
              </span>
              <span className="text-blue-400 font-bold">+10% Weight</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 7. MAINTENANCE VIEW ---
function MaintenanceView({ joints, onOpenWorkOrder }) {
  return (
    <div className="space-y-6">
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Icon name="wrench" size={18} className="text-cyan-400" />
            Predictive Maintenance Dispatch & Action Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Condition-based scheduling prevents catastrophic overland belt tearing and unscheduled mill downtime.
          </p>
        </div>

        <button
          onClick={onOpenWorkOrder}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all font-mono"
        >
          <Icon name="file-text" size={14} />
          GENERATE DIGITAL WORK ORDER (J03)
        </button>
      </div>

      {/* Action Recommendation Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* J03 High Priority */}
        <div className="industrial-card p-4 rounded-xl border border-rose-500/50 bg-rose-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <strong className="text-rose-400 text-sm">J03 — Splice Joint #03</strong>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                PRIORITY: HIGH
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Recommended Action</span>
                <strong className="text-slate-200 text-xs">Inspect and schedule splice vulcanization overhaul.</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Diagnostic Justification</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Persistent vibration anomaly (7/10) + abnormal active interrogation response (18.6% deviation) + declining health trend (-3.2 pts/hr).
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Action Window</span>
                <strong className="text-amber-400 text-xs">Within 36–48 operating hours</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenWorkOrder}
            className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-900/30"
          >
            <Icon name="clipboard-check" size={14} />
            Dispatch Crew to Ch. 780m
          </button>
        </div>

        {/* J02 Medium Priority */}
        <div className="industrial-card p-4 rounded-xl border border-amber-500/40 bg-amber-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <strong className="text-amber-400 text-sm">J02 — Splice Joint #02</strong>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                PRIORITY: MONITOR
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Recommended Action</span>
                <strong className="text-slate-200 text-xs">Enhanced cycle persistence tracking & visual inspection.</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Diagnostic Justification</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Elevated raw vibration during peak loading, but persistence is low (3/10). Active interrogation shows minor acoustic attenuation.
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Action Window</span>
                <strong className="text-slate-300 text-xs">Within 80–100 operating hours</strong>
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40 text-center text-slate-400 text-[11px]">
            Watchlist Active • Next Scan in 3 cycles
          </div>
        </div>

        {/* J01 Nominal */}
        <div className="industrial-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <strong className="text-emerald-400 text-sm">J01 — Splice Joint #01</strong>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                PRIORITY: NONE
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Recommended Action</span>
                <strong className="text-slate-200 text-xs">No action required. Standard operating schedule.</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Diagnostic Justification</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Vibration nominal (1.2 mm/s), persistence 0/10, active interrogation confirms 99% match with baseline vulcanized steel cord signature.
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Action Window</span>
                <strong className="text-emerald-400 text-xs">&gt; 200 operating hours</strong>
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40 text-center text-emerald-400 text-[11px]">
            Healthy Nominal • Routine Turnaround
          </div>
        </div>
      </div>

      {/* Vulcanization Overhaul Logistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="clock" size={14} className="text-cyan-400" />
            Downtime & Production Impact Planner
          </h4>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Estimated Splice Repair Time:</span><span className="text-slate-200 font-bold">4.5 Hours</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Optimal Maintenance Window:</span><span className="text-emerald-400 font-bold">Night Shift Turnaround (02:00 – 06:30)</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Production Loss Mitigation:</span><span className="text-slate-200">Stockpile Surge Bin Buffer = 6.2 Hours</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Catastrophic Break Cost Avoidance:</span><span className="text-emerald-400 font-bold">,000 USD (Estimated)</span></div>
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-bold text-slate-200 border-b border-slate-700/40 pb-2 mb-3 flex items-center gap-2">
            <Icon name="check-square" size={14} className="text-cyan-400" />
            Required Spares & Tooling Checklist
          </h4>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2"><Icon name="check" size={12} className="text-emerald-400" /><span>ST-2500 Heavy-Duty Splice Vulcanizing Press (1200mm)</span></div>
            <div className="flex items-center gap-2"><Icon name="check" size={12} className="text-emerald-400" /><span>Uncured Intercore Rubber Strips & Cold Bonding Cement</span></div>
            <div className="flex items-center gap-2"><Icon name="check" size={12} className="text-emerald-400" /><span>Hydraulic Belt Clamping Rig & Tension Release Winch</span></div>
            <div className="flex items-center gap-2"><Icon name="check" size={12} className="text-emerald-400" /><span>Ultrasonic Cord Alignment & Cover Thickness Gauge</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- WORK ORDER MODAL ---
function WorkOrderModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="industrial-card w-full max-w-2xl rounded-2xl border border-cyan-500/50 p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-xs font-mono">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icon name="file-text" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">DIGITAL MAINTENANCE WORK ORDER</h3>
              <p className="text-[11px] text-slate-400">WO-2026-CV01-J03 • Generated by SPLICE-GUARD Automated Diagnostics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Work Order Content */}
        <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-slate-300">
          <div className="grid grid-cols-2 gap-3 border-b border-slate-800 pb-3">
            <div><span className="text-slate-500 block">ASSET ID:</span><strong className="text-cyan-400">CONVEYOR CV-01 (TRUNK OVERLAND)</strong></div>
            <div><span className="text-slate-500 block">LOCATION:</span><strong className="text-slate-200">STATION CH. 780 M</strong></div>
            <div><span className="text-slate-500 block">PRIORITY:</span><strong className="text-rose-400">CRITICAL / HIGH (36–48h WINDOW)</strong></div>
            <div><span className="text-slate-500 block">WORK CREW:</span><strong className="text-slate-200">Mechanical Vulcanization Squad B</strong></div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">SYSTEM DIAGNOSTIC SUMMARY:</span>
            <p className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 leading-relaxed">
              Splice Joint J03 flagged for progressive vulcanization core failure. Context-normalized vibration persistence reached 7/10 cycles. Active non-destructive excitation confirmed 18.6% acoustic response deviation indicating internal steel cord debonding. Degradation rate: -3.2 pts/hr.
            </p>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">ACTION STEPS REQUIRED:</span>
            <ol className="list-decimal list-inside space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
              <li>Isolate conveyor power & engage Lock-Out Tag-Out (LOTO) at Drive MCC.</li>
              <li>Position splice J03 directly over inspection gantry at Ch. 780m.</li>
              <li>Perform ultrasonic scan to map internal steel cord pull-out coordinates.</li>
              <li>Strip damaged cover rubber, lay fresh uncured tie-gum, and cure with heating platen at 145°C for 45 min.</li>
              <li>Re-run SPLICE-GUARD active interrogation to verify post-repair baseline signature.</li>
            </ol>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-700">
          <span className="text-[11px] text-slate-500">Status: Ready for SAP / SCADA dispatch</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
              Cancel
            </button>
            <button 
              onClick={() => { alert('Work Order WO-2026-CV01-J03 successfully transmitted to Maintenance SCADA / CMMS queue!'); onClose(); }}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
            >
              <Icon name="send" size={14} />
              Transmit Work Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 8. SYSTEM ARCHITECTURE VIEW ---
function SystemArchitectureView() {
  const [selectedHw, setSelectedHw] = useState(HARDWARE_COMPONENTS[0]);

  return (
    <div className="space-y-6">
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Icon name="network" size={18} className="text-cyan-400" />
            SPLICE-GUARD System Architecture & Edge Flow
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical Iron Ore Conveyor → ESP32 Edge Telemetry → Condition Normalization → Active Interrogation → Cloud SCADA
          </p>
        </div>
        <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-400">
          Protocol: Edge MQTT / REST / Modbus RS-485
        </span>
      </div>

      {/* End-to-End Pipeline Diagram */}
      <div className="industrial-card p-5 rounded-xl border border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-4 border-b border-slate-700/40 pb-2">
          Data Flow: Context-Aware Anomaly Verification Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[11px] font-mono">
          {[
            { step: '1. PHYSICAL CONVEYOR', sub: 'Ore burden & Steel Cord belt' },
            { step: '2. EDGE SENSORS', sub: 'MPU6050, HX711, DS18B20, IR, Piezo' },
            { step: '3. ESP32 GATEWAY', sub: '2kHz sampling, Ring buffer' },
            { step: '4. NORMALIZATION', sub: 'Load & Speed de-biasing' },
            { step: '5. PERSISTENCE (10c)', sub: 'Filters isolated shock spikes' },
            { step: '6. ACTIVE INTERROGATION', sub: 'Controlled acoustic excitation' },
            { step: '7. PREDICT & ACT', sub: 'RUL (36–48h) & SCADA Work Order' }
          ].map((node, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 flex flex-col justify-between">
              <div className="font-bold text-cyan-400 mb-1">{node.step}</div>
              <div className="text-slate-400 text-[10px]">{node.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Hardware Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Component List */}
        <div className="industrial-card p-4 rounded-xl border border-slate-700/50 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-3">
            Edge Hardware Nodes (Click to Inspect)
          </h4>
          {HARDWARE_COMPONENTS.map((hw) => {
            const isSelected = selectedHw.id === hw.id;
            return (
              <div
                key={hw.id}
                onClick={() => setSelectedHw(hw)}
                className={p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs font-mono }
              >
                <div className="flex items-center gap-2.5">
                  <div className={p-1.5 rounded }>
                    <Icon name={hw.icon} size={14} />
                  </div>
                  <div>
                    <strong className={isSelected ? 'text-cyan-300' : 'text-slate-200'}>{hw.name}</strong>
                    <span className="text-[10px] text-slate-500 block">{hw.category}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {hw.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Hardware Details */}
        <div className="industrial-card p-5 rounded-xl border border-slate-700/50 lg:col-span-2 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Icon name={selectedHw.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{selectedHw.name}</h3>
                  <p className="text-slate-400 text-[11px]">{selectedHw.category} • Module ID: {selectedHw.id}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {selectedHw.status}
              </span>
            </div>

            <div className="space-y-4 mb-4 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase mb-1">Technical Specifications:</span>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-cyan-300">
                  {selectedHw.specs}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase mb-1">Operational Role in SPLICE-GUARD:</span>
                <p className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedHw.role}
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase mb-1">Electrical Pinout & Interface:</span>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-amber-300">
                  {selectedHw.pinout}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Edge Bus: I2C (400kHz) + SPI + ADC1</span>
            <span className="text-cyan-400">Ready for physical ESP32 breadboard / RS-485 hookup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col">
      {/* --- TOP HEADER --- */}
      <header className="border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Main Titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold font-display shadow-lg shadow-cyan-500/20">
              <Icon name="shield-check" size={22} className="text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display tracking-wider text-slate-100 flex items-center gap-2">
                  SPLICE-GUARD
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    INDUSTRY 4.0 PROTOTYPE
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Intelligent Conveyor Joint Health Monitoring • Iron Ore Logistics
              </p>
            </div>
          </div>

          {/* System Status Indicators & Actions */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* System Online Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>SYSTEM ONLINE</span>
            </div>

            {/* Conveyor ID */}
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Asset: <strong className="text-cyan-400">CV-01</strong>
            </div>

            {/* Live Clock */}
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hidden sm:block">
              Updated: <strong className="text-slate-100">{currentTime}</strong>
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
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-all"
              title="Toggle Dark / Light Mode"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} className="text-amber-400" />
              <span className="font-sans text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Highlighted Tagline Requirement */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-cyan-400 font-medium italic flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[11px] not-italic">[CORE DOCTRINE]</span>
            "Don't just detect anomalies. Verify them, explain them, and predict when to act."
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Simulated Telemetry Engine:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </header>

      {/* --- DEMO SCENARIOS QUICK BAR --- */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Icon name="play-circle" size={14} className="text-cyan-400" />
            <span>DEMO CONTROLS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[760px] gap-1 font-mono text-[11px]">
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
                  <span className="text-slate-600 font-bold">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* --- MAIN LAYOUT (SIDEBAR + CONTENT) --- */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0 space-y-1.5 font-mono text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
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
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider">
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
                  <div className="flex items-center gap-2">
                    <span className={w-2 h-2 rounded-full }></span>
                    <strong className="text-slate-200">{j.id}</strong>
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
        <main className="flex-1 min-w-0">
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
      <footer className="border-t border-slate-800 bg-slate-950/80 px-4 py-4 mt-auto font-mono text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="text-slate-200">SPLICE-GUARD</strong> | Prototype for Smart Mining & Predictive Maintenance
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Asset ID: CV-01</span>
            <span>Firmware: v2.4-Edge</span>
            <span className="text-cyan-400">MQTT Ready</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="industrial-card w-full max-w-md p-6 rounded-xl border border-cyan-500/50 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Icon name={activeUspModal.icon} size={18} className="text-cyan-400" />
                <strong className="text-sm text-slate-100">Step {activeUspModal.step}: {activeUspModal.label}</strong>
              </div>
              <button onClick={() => setActiveUspModal(null)} className="p-1 rounded bg-slate-800 text-slate-400">
                <Icon name="x" size={14} />
              </button>
            </div>
            <h4 className="font-bold text-cyan-300 text-sm mb-1">{activeUspModal.title}</h4>
            <p className="text-slate-300 mb-4 leading-relaxed">{activeUspModal.desc}</p>
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px]">
              This pipeline stage ensures raw sensor spikes do not trigger unwarranted alarms while ensuring true internal vulcanization decay is interrogated before belt failure.
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setActiveUspModal(null)} className="px-3 py-1.5 rounded bg-cyan-600 text-white font-bold">
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
