# SPLICE-GUARD: Context-Aware, Active & Predictive Conveyor Belt Joint Monitoring

**Industry 4.0 Iron Ore Mining Conveyor Belt Splice Health Monitoring Prototype**

[![System Status](https://img.shields.io/badge/System-ONLINE-10b981.svg)]()
[![Asset](https://img.shields.io/badge/Conveyor-CV--01-06b6d4.svg)]()
[![Prototype](https://img.shields.io/badge/Status-Industry%204.0%20Demo-a855f7.svg)]()

> *\"Don't just detect anomalies. Verify them, explain them, and predict when to act.\"*

---

## 🚀 Core USP & Pipeline

Traditional conveyor condition monitoring systems trigger widespread false alarms whenever ore loading shifts or when an oversize rock hits an idler roll. **SPLICE-GUARD** solves this via a 7-stage deterministic diagnostic pipeline:

`
CONTEXT → DETECT → VERIFY → INTERROGATE → CONFIRM → PREDICT → ACT
`

1. **CONTEXT**: Ingests real-time operating conditions: Belt Speed (.8\text{ m/s}$), Material Burden Load (\%$), Ambient & Bearing Temperatures, and Drive State.
2. **DETECT**: Continuously acquires multi-sensor streams: Triaxial Vibration RMS (MPU6050), Tension Strain (HX711), Contact Temp (DS18B20), Speed (Optical Tachometer), and Dynamic Acoustic Signals (Piezo).
3. **VERIFY**: Applies multi-cycle persistence logic across a rolling 10-cycle window. Transient rock impacts (/10$ cycles) are filtered out, while repeated splice-synchronous anomalies are verified.
4. **INTERROGATE**: Upon detecting a suspicious joint, triggers controlled non-destructive excitation (NDT acoustic pulse). Captures the dynamic ring-down response and compares it against healthy baseline stiffness.
5. **CONFIRM**: Calculates anomaly confidence (\%$), joint health score (/100$), and identifies the probable structural failure mechanism (*rubber core pullout / vulcanization delamination*).
6. **PREDICT**: Estimates degradation velocity ($-3.2\text{ pts/hr}$) and Remaining Useful Life (–48\text{ operating hours}$) with shaded Bayesian uncertainty bounds at \%$ confidence.
7. **ACT**: Categorizes maintenance recommendations: NORMAL $\rightarrow$ WATCH $\rightarrow$ INSPECT $\rightarrow$ PLAN MAINTENANCE $\rightarrow$ CRITICAL.

---

## 🖥️ Operational Views

The web dashboard provides 8 specialized Industry 4.0 views via sidebar navigation:

1. **Main Dashboard**: High-level KPIs, moving digital twin preview, live sensor sparklines, anomaly verification card, quick interrogation card, and false alarm demo suite.
2. **Conveyor Monitor**: Full mechanical schematic showing 450 kW drive motor, 1,000 m endless belt loop, take-up gravity tensioner (.4\text{ kN}$), and real-time transit counter. Includes live speed adjustment slider and emergency stop/start controls.
3. **Joint Health**: Fleet comparison table & cards for all monitored splices (J01, J02, J03) with click-to-open deep diagnostic drawer.
4. **Sensor Analytics**: Deep signal dive with live updating time-series charts for vibration, load, temperature, speed, and acoustic spectral density.
5. **Active Interrogation Lab**: Interactive laboratory bench for triggering calibrated \text{ J}$ excitation pulses, visualizing dual waveforms (*Healthy Baseline vs. Current Response*), and evaluating loss factor damping.
6. **Prediction & RUL**: Degradation curve with shaded confidence interval (–48\text{ h}$), degradation velocity, and Explainable AI breakdown explaining the mathematical weights of the prediction.
7. **Maintenance Operations**: Priority dispatch queue, vulcanization downtime calculator (.5\text{ h}$ repair window, $\,000$ cost avoidance), tooling checklist, and interactive Digital Work Order generator.
8. **System Architecture**: Complete edge-to-SCADA data flow diagram and interactive hardware component inspector (ESP32, MPU6050, HX711, IR Speed, DS18B20, Piezo Sensor, Pulse Actuator).

---

## 🕹️ Interactive Demo Controls

Easily demonstrate the prototype's intelligence with one-click scenario triggers:

- **NORMAL OPERATION**: All splices healthy, nominal baseline vibration (.24\text{ mm/s}$).
- **LOAD CHANGE**: Load jumps to \%$, raw vibration surges by \%$, but context normalization prevents false alarms $\rightarrow$ **NO FALSE ALARM**.
- **TRANSIENT VIBRATION**: Simulates a boulder impact. Peak hits .8\text{ mm/s}$, persistence stays at /10$ cycles $\rightarrow$ **IGNORE TRANSIENT**.
- **PERSISTENT JOINT FAULT**: Splice J03 exhibits recurring abnormal response across /10$ cycles with \%$ confidence $\rightarrow$ **PERSISTENT ANOMALY**.
- **ACTIVE INTERROGATION**: Fires pulse into J03, captures .6\%$ acoustic deviation $\rightarrow$ **SPLICE DEGRADATION CONFIRMED**.
- **CRITICAL DEGRADATION**: J03 health drops to \%$, RUL drops to –18\text{ h}$, triggers emergency maintenance dispatch.

---

## 🌓 Dark & Light Theme Support

Switch between **Industrial Dark Theme** (high-contrast mining telemetry) and **Control-Room Light Theme** with one click in the top header. Preferences are saved automatically to localStorage.

---

## 🛠️ How to Run

### Option 1: Direct Browser Launch (Zero Installation)
Simply double-click index.html or open it in any modern browser:
`powershell
start index.html
`

### Option 2: Lightweight Python Server & REST API
Run the included Python backend to serve static files and expose REST endpoints for simulated ESP32/SCADA feeds:
`powershell
python server.py
`
Then visit: http://localhost:8000

#### REST Endpoints:
- GET /api/health - Gateway status and cycle counter
- GET /api/telemetry - Live sensor data stream
- GET /api/joints - Monitored fleet condition
- POST /api/interrogate/J03 - Trigger active NDT excitation on a joint
- POST /api/scenarios/<SCENARIO_NAME> - Inject fault scenarios remotely

---

## ⚠️ Prototype Disclaimer
*RUL and active interrogation readings shown are prototype estimates generated from simulated conveyor degradation physics for demonstration purposes and are not industrial-certified predictions.*
