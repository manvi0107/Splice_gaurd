#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// =====================================================
// WIFI
// =====================================================

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Leave this empty for now.
// We will put your actual API/backend endpoint here
// once the dashboard communication layer is ready.
const char* SERVER_URL = "";

// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// =====================================================
// PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22

#define IR2_PIN 35

#define MOTOR_IN1 18
#define MOTOR_IN2 19
#define MOTOR_ENA 23

#define RED_LED 5

// =====================================================
// MPU6050
// =====================================================

Adafruit_MPU6050 mpu1;
Adafruit_MPU6050 mpu2;

bool mpu1Available = false;
bool mpu2Available = false;

// =====================================================
// VARIABLES
// =====================================================

int ir2Value = 0;

float vibration1 = 0;
float vibration2 = 0;

float temperature1 = 0;
float temperature2 = 0;

float healthScore = 100;
float rulHours = 48;

String systemStatus = "HEALTHY";

unsigned long lastTelemetry = 0;
unsigned long lastDisplay = 0;

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("      SPLICE-GUARD STARTING");
  Serial.println("================================");

  // ---------------------------------------------------
  // I2C
  // ---------------------------------------------------

  Wire.begin(SDA_PIN, SCL_PIN);

  // ---------------------------------------------------
  // OLED
  // ---------------------------------------------------

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {

    Serial.println("OLED NOT FOUND!");

  } else {

    Serial.println("OLED FOUND!");

    display.clearDisplay();

    display.setTextColor(SSD1306_WHITE);

    display.setTextSize(1);

    display.setCursor(20, 10);
    display.println("SPLICE-GUARD");

    display.setCursor(20, 30);
    display.println("Starting...");

    display.display();

    delay(1500);
  }

  // ---------------------------------------------------
  // IR2
  // ---------------------------------------------------

  pinMode(IR2_PIN, INPUT);

  Serial.println("IR2 initialized");

  // ---------------------------------------------------
  // MOTOR
  // ---------------------------------------------------

  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT);

  // Motor OFF at startup
  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);
  analogWrite(MOTOR_ENA, 0);

  // ---------------------------------------------------
  // LED
  // ---------------------------------------------------

  pinMode(RED_LED, OUTPUT);
  digitalWrite(RED_LED, LOW);

  // ---------------------------------------------------
  // MPU #1
  // ---------------------------------------------------

  Serial.println("Checking MPU #1 at 0x68...");

  if (mpu1.begin(0x68, &Wire)) {

    mpu1Available = true;

    Serial.println("MPU #1 FOUND at 0x68");

    mpu1.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu1.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu1.setFilterBandwidth(MPU6050_BAND_21_HZ);

  } else {

    Serial.println("MPU #1 NOT FOUND");

  }

  // ---------------------------------------------------
  // MPU #2
  // ---------------------------------------------------

  Serial.println("Checking MPU #2 at 0x69...");

  if (mpu2.begin(0x69, &Wire)) {

    mpu2Available = true;

    Serial.println("MPU #2 FOUND at 0x69");

    mpu2.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu2.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu2.setFilterBandwidth(MPU6050_BAND_21_HZ);

  } else {

    Serial.println("MPU #2 NOT FOUND");

  }

  // ---------------------------------------------------
  // WIFI
  // ---------------------------------------------------

  connectWiFi();

  Serial.println();
  Serial.println("================================");
  Serial.println("     SPLICE-GUARD READY");
  Serial.println("================================");
  Serial.println();
}


// =====================================================
// WIFI CONNECTION
// =====================================================

void connectWiFi() {

  if (
    strcmp(WIFI_SSID, "YOUR_WIFI_NAME") == 0 ||
    strlen(WIFI_SSID) == 0
  ) {

    Serial.println("WiFi credentials not configured.");

    return;
  }

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 20
  ) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi connected!");

    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());

  } else {

    Serial.println("WiFi connection failed.");

  }
}


// =====================================================
// READ MPU #1
// =====================================================

void readMPU1() {

  if (!mpu1Available) {

    // Demo fallback
    vibration1 = 0.35;
    temperature1 = 31.5;

    return;
  }

  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t temp;

  mpu1.getEvent(
    &accel,
    &gyro,
    &temp
  );

  float magnitude = sqrt(
    accel.acceleration.x * accel.acceleration.x +
    accel.acceleration.y * accel.acceleration.y +
    accel.acceleration.z * accel.acceleration.z
  );

  vibration1 = magnitude;

  temperature1 = temp.temperature;
}


// =====================================================
// READ MPU #2
// =====================================================

void readMPU2() {

  if (!mpu2Available) {

    // Demo fallback
    vibration2 = 0.42;
    temperature2 = 32.0;

    return;
  }

  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t temp;

  mpu2.getEvent(
    &accel,
    &gyro,
    &temp
  );

  float magnitude = sqrt(
    accel.acceleration.x * accel.acceleration.x +
    accel.acceleration.y * accel.acceleration.y +
    accel.acceleration.z * accel.acceleration.z
  );

  vibration2 = magnitude;

  temperature2 = temp.temperature;
}


// =====================================================
// READ IR2
// =====================================================

void readIR2() {

  ir2Value = digitalRead(IR2_PIN);

}


// =====================================================
// CALCULATE HEALTH
// =====================================================

void calculateHealth() {

  float vibration = max(
    vibration1,
    vibration2
  );

  // Demo health model
  // This can later be replaced by your actual
  // trained/validated degradation model.

  if (ir2Value == 0) {

    healthScore -= 0.3;

  }

  if (vibration > 15) {

    healthScore -= 2;

  } else if (vibration > 10) {

    healthScore -= 1;

  }

  // Keep within range

  if (healthScore > 100)
    healthScore = 100;

  if (healthScore < 0)
    healthScore = 0;


  // Determine system state

  if (healthScore >= 80) {

    systemStatus = "HEALTHY";

    digitalWrite(RED_LED, LOW);

  }

  else if (healthScore >= 50) {

    systemStatus = "WARNING";

    digitalWrite(RED_LED, HIGH);

  }

  else {

    systemStatus = "CRITICAL";

    digitalWrite(RED_LED, HIGH);

  }


  // RUL approximation

  rulHours = healthScore * 0.48;

}


// =====================================================
// OLED DISPLAY
// =====================================================

void updateOLED() {

  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);

  // Title

  display.setTextSize(1);

  display.setCursor(0, 0);

  display.println("SPLICE-GUARD");

  // Status

  display.setCursor(0, 12);

  display.print("STATUS: ");

  display.println(systemStatus);

  // Health

  display.setCursor(0, 24);

  display.print("HEALTH: ");

  display.print(healthScore, 0);

  display.println("%");

  // RUL

  display.setCursor(0, 36);

  display.print("RUL: ");

  display.print(rulHours, 1);

  display.println(" hrs");

  // IR

  display.setCursor(0, 48);

  display.print("JOINT: ");

  if (ir2Value == 0)
    display.println("DETECTED");
  else
    display.println("CLEAR");

  display.display();
}


// =====================================================
// PRINT TELEMETRY
// =====================================================

void printTelemetry() {

  Serial.println();
  Serial.println("========== TELEMETRY ==========");

  Serial.print("IR2: ");
  Serial.println(ir2Value);

  Serial.print("Vibration 1: ");
  Serial.println(vibration1, 2);

  Serial.print("Vibration 2: ");
  Serial.println(vibration2, 2);

  Serial.print("Temperature 1: ");
  Serial.println(temperature1, 2);

  Serial.print("Temperature 2: ");
  Serial.println(temperature2, 2);

  Serial.print("Health Score: ");
  Serial.println(healthScore, 1);

  Serial.print("RUL: ");
  Serial.println(rulHours, 1);

  Serial.print("Status: ");
  Serial.println(systemStatus);

  Serial.println("===============================");
}


// =====================================================
// CREATE JSON TELEMETRY
// =====================================================

String createJSON() {

  String json = "{";

  json += "\"device\":\"SPLICE-GUARD\",";
  json += "\"ir2\":";
  json += String(ir2Value);
  json += ",";

  json += "\"vibration1\":";
  json += String(vibration1, 2);
  json += ",";

  json += "\"vibration2\":";
  json += String(vibration2, 2);
  json += ",";

  json += "\"temperature1\":";
  json += String(temperature1, 2);
  json += ",";

  json += "\"temperature2\":";
  json += String(temperature2, 2);
  json += ",";

  json += "\"health\":";
  json += String(healthScore, 1);
  json += ",";

  json += "\"rul_hours\":";
  json += String(rulHours, 1);
  json += ",";

  json += "\"status\":\"";
  json += systemStatus;
  json += "\"";

  json += "}";

  return json;
}


// =====================================================
// SEND DATA TO SERVER
// =====================================================

void sendTelemetry() {

  if (
    strlen(SERVER_URL) == 0 ||
    WiFi.status() != WL_CONNECTED
  ) {

    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  String json = createJSON();

  int responseCode = http.POST(json);

  Serial.print("Server response: ");
  Serial.println(responseCode);

  if (responseCode > 0) {

    String response = http.getString();

    Serial.println("Server:");
    Serial.println(response);

  }

  http.end();
}


// =====================================================
// MOTOR FUNCTIONS
// =====================================================

void motorForward(int speedValue) {

  speedValue = constrain(
    speedValue,
    0,
    255
  );

  digitalWrite(MOTOR_IN1, HIGH);
  digitalWrite(MOTOR_IN2, LOW);

  analogWrite(
    MOTOR_ENA,
    speedValue
  );
}


void motorStop() {

  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);

  analogWrite(
    MOTOR_ENA,
    0
  );
}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // Read sensors

  readIR2();

  readMPU1();

  readMPU2();


  // Process data

  calculateHealth();


  // OLED

  if (
    millis() - lastDisplay >= 500
  ) {

    updateOLED();

    lastDisplay = millis();
  }


  // Telemetry

  if (
    millis() - lastTelemetry >= 1000
  ) {

    printTelemetry();

    String json = createJSON();

    Serial.println("JSON:");
    Serial.println(json);

    sendTelemetry();

    lastTelemetry = millis();
  }


  delay(50);
}
