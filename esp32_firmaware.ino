// SPLICE-GUARD ESP32 Edge Node
// Libraries needed (Library Manager): Adafruit MPU6050, Adafruit Unified Sensor,
// HX711 (bogde/hx711), OneWire, DallasTemperature, ArduinoJson

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <HX711.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ---- CONFIG: fill these in ----
const char* WIFI_SSID   = "YOUR_WIFI_SSID";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL  = "http://192.168.1.50:8000/api/ingest"; // your laptop's LAN IP
const char* JOINT_ID    = "J03"; // which joint this node is monitoring

// ---- Pins ----
#define HX711_DOUT  16
#define HX711_SCK   17
#define ONE_WIRE_PIN 15
#define IR_SPEED_PIN 4

Adafruit_MPU6050 mpu;
HX711 scale;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature tempSensor(&oneWire);

volatile unsigned long pulseCount = 0;
unsigned long lastSpeedCalc = 0;

void IRAM_ATTR onSpeedPulse() { pulseCount++; }

void setup() {
  Serial.begin(115200);
  Wire.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println(" connected: " + WiFi.localIP().toString());

  if (!mpu.begin()) {
    Serial.println("MPU6050 not found — check wiring (SDA/SCL)");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(2280.f);   // calibrate: known weight / raw reading
  scale.tare();              // zero with no load

  tempSensor.begin();

  pinMode(IR_SPEED_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(IR_SPEED_PIN), onSpeedPulse, FALLING);
}

// Rolling buffer of accel magnitudes to compute a simple vibration RMS
#define VIB_SAMPLES 50
float vibBuf[VIB_SAMPLES];
int vibIdx = 0;

float readVibrationRMS() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float mag = sqrt(a.acceleration.x * a.acceleration.x +
                    a.acceleration.y * a.acceleration.y +
                    a.acceleration.z * a.acceleration.z) - 9.81; // remove gravity
  vibBuf[vibIdx % VIB_SAMPLES] = mag;
  vibIdx++;

  float sumSq = 0;
  int n = min(vibIdx, VIB_SAMPLES);
  for (int i = 0; i < n; i++) sumSq += vibBuf[i] * vibBuf[i];
  float rms = sqrt(sumSq / n);
  return rms * 1000.0; // scale to roughly mm/s-ish range for the dashboard thresholds
}

float readLoadPercent() {
  float kg = scale.get_units(5);       // average of 5 readings
  float pct = (kg / 50.0) * 100.0;     // 50kg full-scale placeholder — calibrate to your rig
  return constrain(pct, 0, 100);
}

float readTempC() {
  tempSensor.requestTemperatures();
  return tempSensor.getTempCByIndex(0);
}

float readSpeedMps() {
  unsigned long now = millis();
  float dt = (now - lastSpeedCalc) / 1000.0;
  lastSpeedCalc = now;
  noInterrupts();
  unsigned long pulses = pulseCount;
  pulseCount = 0;
  interrupts();
  const float PULLEY_CIRCUMFERENCE_M = 0.5; // measure your pulley, adjust
  const float PULSES_PER_REV = 1.0;
  if (dt <= 0) return 0;
  return (pulses / PULSES_PER_REV) * PULLEY_CIRCUMFERENCE_M / dt;
}

void sendTelemetry(float vib, float load, float temp, float speed) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["joint_id"] = JOINT_ID;
  doc["vibration_rms_mms"] = vib;
  doc["load_percent"] = load;
  doc["temperature_c"] = temp;
  doc["speed_mps"] = speed;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("POST %s -> %d\n", SERVER_URL, code);
  http.end();
}

void loop() {
  float vib = readVibrationRMS();
  float load = readLoadPercent();
  float temp = readTempC();
  float speed = readSpeedMps();

  Serial.printf("vib=%.2f load=%.1f temp=%.1f speed=%.2f\n", vib, load, temp, speed);
  sendTelemetry(vib, load, temp, speed);

  delay(1000); // matches the ~1s poll rate on the dashboard
}
