# Lightweight Industry 4.0 Backend Server for SPLICE-GUARD
import os
import time
import math
import random
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

# Simulated Fleet State
fleet_state = {
    'conveyor_id': 'CV-01',
    'status': 'RUNNING',
    'belt_speed': 2.8,
    'load_pct': 74.0,
    'temperature': 43.2,
    'vibration_rms': 4.72,
    'acoustic_status': 'ABNORMAL',
    'current_scenario': 'NORMAL',
    'joints': {
        'J01': {
            'id': 'J01',
            'location_m': 220,
            'health_score': 96,
            'vibration_rms': 1.24,
            'persistence': '0/10',
            'confidence': 0.98,
            'rul_hours': '210–240 h',
            'status': 'NORMAL'
        },
        'J02': {
            'id': 'J02',
            'location_m': 500,
            'health_score': 82,
            'vibration_rms': 3.12,
            'persistence': '3/10',
            'confidence': 0.78,
            'rul_hours': '80–100 h',
            'status': 'WATCH'
        },
        'J03': {
            'id': 'J03',
            'location_m': 780,
            'health_score': 61,
            'vibration_rms': 4.72,
            'persistence': '7/10',
            'confidence': 0.91,
            'rul_hours': '36–48 h',
            'status': 'INSPECT'
        }
    }
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

@app.route('/api/health')
def api_health():
    return jsonify({
        'status': 'ONLINE',
        'system': 'SPLICE-GUARD Edge Engine',
        'conveyor_id': fleet_state['conveyor_id'],
        'timestamp': time.time(),
        'active_cycle': 1482,
        'tonnage_rate_tph': 3840
    })

@app.route('/api/telemetry')
def api_telemetry():
    # Subtle realistic drift
    noise = (random.random() - 0.5) * 0.05
    fleet_state['vibration_rms'] = round(fleet_state['vibration_rms'] + noise, 2)
    return jsonify({
        'conveyor_id': fleet_state['conveyor_id'],
        'speed_mps': fleet_state['belt_speed'],
        'load_percent': fleet_state['load_pct'],
        'temperature_c': fleet_state['temperature'],
        'vibration_rms_mms': fleet_state['vibration_rms'],
        'acoustic_status': fleet_state['acoustic_status'],
        'scenario': fleet_state['current_scenario'],
        'timestamp': time.time()
    })

@app.route('/api/joints')
def api_joints():
    return jsonify(fleet_state['joints'])

@app.route('/api/interrogate/<joint_id>', methods=['POST', 'GET'])
def api_interrogate(joint_id):
    joint = fleet_state['joints'].get(joint_id)
    if not joint:
        return jsonify({'error': 'Unknown joint'}), 404
        
    time.sleep(0.1) # Simulate round-trip excitation latency
    if joint_id == 'J03':
        return jsonify({
            'joint_id': 'J03',
            'excitation_energy_joules': 5.0,
            'response_deviation_pct': 18.6,
            'interrogation_confidence': 0.94,
            'damping_ratio': 0.178,
            'baseline_damping_ratio': 0.062,
            'outcome': 'SPLICE DEGRADATION CONFIRMED',
            'recommended_action': 'PLAN MAINTENANCE WITHIN 36-48 HOURS',
            'disclaimer': 'Prototype active interrogation - simulated non-destructive excitation demo'
        })
    else:
        return jsonify({
            'joint_id': joint_id,
            'excitation_energy_joules': 5.0,
            'response_deviation_pct': 1.4,
            'interrogation_confidence': 0.99,
            'damping_ratio': 0.064,
            'baseline_damping_ratio': 0.062,
            'outcome': 'NOMINAL BASELINE MATCH',
            'recommended_action': 'CONTINUE MONITORING',
            'disclaimer': 'Prototype active interrogation - simulated non-destructive excitation demo'
        })

@app.route('/api/scenarios/<scenario_name>', methods=['POST', 'GET'])
def api_scenario(scenario_name):
    fleet_state['current_scenario'] = scenario_name.upper()
    return jsonify({
        'status': 'OK',
        'active_scenario': fleet_state['current_scenario']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f'Starting SPLICE-GUARD Industrial Gateway on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=False)
