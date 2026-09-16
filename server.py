# SPLICE-GUARD Hardware Gateway (Flask)
# Receives real ESP32 sensor POSTs, runs the VERIFY/CONFIRM logic, and serves
# state in the EXACT shape app.js already expects (drop-in, no frontend mapping needed).

import os
import time
from collections import deque
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)  # allow the GitHub Pages / local frontend to fetch across origins

# ---- Tunable thresholds (adjust to your real sensor calibration) ----
VIB_NOMINAL = 2.5      # mm/s — below this: healthy
VIB_WARN = 4.0         # mm/s — above this: anomaly flag for persistence buffer
PERSIST_WINDOW = 10    # rolling cycle window (matches the README's 10-cycle VERIFY buffer)

JOINTS = ['J01', 'J02', 'J03']
LOCATIONS = {'J01': 220, 'J02': 500, 'J03': 780}

def blank_joint(jid):
    return {
        'id': jid, 'name': f'Splice Joint #{jid[1:]}', 'location': f'{LOCATIONS[jid]} m',
        'distMeters': LOCATIONS[jid], 'healthScore': 96, 'vibration': 'Normal',
        'rawVibValue': 1.2, 'normVibValue': 1.1, 'persistence': '0/10', 'persistCount': 0,
        'confidence': '98%', 'confValue': 98, 'rul': '> 200 h', 'rulRange': '210–240 h',
        'probableCause': 'Healthy / Nominal vulcanization bond', 'status': 'NORMAL',
        'statusColor': 'emerald', 'velocity': '-0.1 pts/hr', 'lastInspected': 'Live feed',
        'tensileLoad': '72 kN', 'temperature': '38.4 °C', 'anomalyState': 'NONE',
        'interrogationResult': 'BASELINE MATCH', 'interrogationDev': 1.4,
        'interrogationConf': 99, 'history': [96, 96, 96, 96, 96, 96, 96],
    }

# In-memory live state
state = {
    'telemetry': {
        'speed': 0.0, 'load': 0.0, 'temp': 0.0, 'vibration': 0.0,
        'speedHistory': [0]*7, 'loadHistory': [0]*7, 'tempHistory': [0]*7, 'vibrationHistory': [0]*7,
    },
    'joints': {jid: blank_joint(jid) for jid in JOINTS},
    'buffers': {jid: deque(maxlen=PERSIST_WINDOW) for jid in JOINTS},
    'last_seen': {jid: None for jid in JOINTS},
}

def push_hist(arr, val):
    arr.append(round(val, 2))
    return arr[-7:]

def recompute_joint(jid, raw_vib, load_pct, temp_c):
    j = state['joints'][jid]
    norm_vib = max(0.1, raw_vib - (load_pct - 70) * 0.02)  # crude load-normalization
    is_anomaly = norm_vib > VIB_WARN
    state['buffers'][jid].append(1 if is_anomaly else 0)
    persist_count = sum(state['buffers'][jid])
    window = len(state['buffers'][jid])

    confidence = min(99, 50 + persist_count * 5)
    health_score = max(10, round(100 - persist_count * 6 - max(0, norm_vib - VIB_NOMINAL) * 4))

    if health_score > 85:
        status, color, vib_label = 'NORMAL', 'emerald', 'Normal'
    elif health_score >= 70:
        status, color, vib_label = 'WATCH', 'amber', 'Elevated'
    elif health_score >= 45:
        status, color, vib_label = 'INSPECT', 'rose', 'High'
    else:
        status, color, vib_label = 'CRITICAL', 'rose', 'Critical'

    j.update({
        'rawVibValue': round(raw_vib, 2), 'normVibValue': round(norm_vib, 2),
        'vibration': vib_label, 'persistence': f'{persist_count}/{window}',
        'persistCount': persist_count, 'confidence': f'{confidence}%', 'confValue': confidence,
        'healthScore': health_score, 'status': status, 'statusColor': color,
        'temperature': f'{temp_c:.1f} °C',
        'anomalyState': 'PERSISTENT ANOMALY' if persist_count >= 6 else ('BORDERLINE' if persist_count >= 3 else 'NONE'),
        'probableCause': 'Splice degradation / rubber cord pullout risk' if health_score < 70 else 'Healthy / Nominal vulcanization bond',
        'history': push_hist(j['history'], health_score),
    })
    state['last_seen'][jid] = time.time()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

# ---- ESP32 -> backend ----
# POST JSON: { "joint_id": "J03", "vibration_rms_mms": 4.7, "load_percent": 74,
#              "temperature_c": 46.8, "speed_mps": 2.8 }
@app.route('/api/ingest', methods=['POST'])
def api_ingest():
    data = request.get_json(force=True)
    jid = data.get('joint_id', 'J03')
    if jid not in JOINTS:
        return jsonify({'error': f'unknown joint_id {jid}'}), 400

    vib = float(data.get('vibration_rms_mms', 0))
    load = float(data.get('load_percent', state['telemetry']['load']))
    temp = float(data.get('temperature_c', state['telemetry']['temp']))
    speed = float(data.get('speed_mps', state['telemetry']['speed']))

    t = state['telemetry']
    t['speed'] = speed; t['load'] = load; t['temp'] = temp; t['vibration'] = vib
    t['speedHistory'] = push_hist(t['speedHistory'], speed)
    t['loadHistory'] = push_hist(t['loadHistory'], load)
    t['tempHistory'] = push_hist(t['tempHistory'], temp)
    t['vibrationHistory'] = push_hist(t['vibrationHistory'], vib)

    recompute_joint(jid, vib, load, temp)
    return jsonify({'status': 'ok', 'joint': state['joints'][jid]})

# ---- Frontend -> backend (polled every ~1s by app.js) ----
@app.route('/api/telemetry')
def api_telemetry():
    return jsonify(state['telemetry'])

@app.route('/api/joints')
def api_joints():
    return jsonify(state['joints'])

@app.route('/api/health')
def api_health():
    return jsonify({
        'status': 'ONLINE', 'system': 'SPLICE-GUARD Edge Engine',
        'timestamp': time.time(), 'last_seen': state['last_seen'],
    })

# Kept for the on-page demo buttons when no hardware is attached yet
@app.route('/api/scenarios/<scenario_name>', methods=['POST', 'GET'])
def api_scenario(scenario_name):
    return jsonify({'status': 'OK', 'active_scenario': scenario_name.upper()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f'SPLICE-GUARD gateway listening on http://0.0.0.0:{port}  (POST sensor data to /api/ingest)')
    app.run(host='0.0.0.0', port=port, debug=False)
