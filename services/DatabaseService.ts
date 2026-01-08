import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('smart_irrigation.db');

export interface MotorLog {
  id: number;
  startTime: string; 
  durationSeconds: number;
  moistureAtTrigger: number;
  mode: string; 
}

export interface MotorState {
  id: number;
  autoControl: boolean;
  moistureThreshold: number;
  autoDurationSeconds: number;
  manualDurationSeconds: number;
  isOn: boolean;
}

export interface IrrigationSchedule {
  id: number;
  days: string; 
  durationInSeconds: number;
  repeatDaily: boolean;
  specificDate?: string | null;
  time: string; 
  active: boolean;
}

export interface SensorData {
  id: number;
  soilMoisturePercent: number;
  batteryPercent: number;
  timestamp: string;
}

export interface TemperatureConfig {
  id: number;
  threshold: number;
  extraSeconds: number;
  active: boolean;
  updatedAt: string;
}

export const initDatabase = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS motor_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        moisture_at_trigger REAL,
        mode TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS motor_state (
        id INTEGER PRIMARY KEY,
        auto_control INTEGER DEFAULT 0,
        moisture_threshold REAL DEFAULT 30.0,
        auto_duration_seconds INTEGER DEFAULT 10,
        manual_duration_seconds INTEGER DEFAULT 10,
        is_on INTEGER DEFAULT 0
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS irrigation_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        days TEXT, 
        duration_in_seconds INTEGER,
        repeat_daily INTEGER DEFAULT 0,
        specific_date TEXT,
        time TEXT,
        active INTEGER DEFAULT 1
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        soil_moisture_percent REAL,
        battery_percent REAL,
        timestamp TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS temperature_config (
        id INTEGER PRIMARY KEY,
        threshold REAL DEFAULT 25.0,
        extra_seconds INTEGER DEFAULT 0,
        active INTEGER DEFAULT 0,
        updated_at TEXT
      );
    `);

    initDefaultSettings();
    console.log("DB and tables are ready.");
  } catch (error) {
    console.error("DB initialization error: ", error);
  }
};

const initDefaultSettings = () => {
  const motorState = db.getFirstSync('SELECT * FROM motor_state WHERE id = 1');
  if (!motorState) {
    db.runSync(`
      INSERT INTO motor_state (id, auto_control, moisture_threshold, auto_duration_seconds, manual_duration_seconds, is_on) 
      VALUES (1, 0, 30.0, 10, 10, 0)
    `);
  }

  const tempConfig = db.getFirstSync('SELECT * FROM temperature_config WHERE id = 1');
  if (!tempConfig) {
    db.runSync(`
      INSERT INTO temperature_config (id, threshold, extra_seconds, active, updated_at) 
      VALUES (1, 30.0, 5, 0, ?)
    `, [new Date().toISOString()]);
  }
};

export const saveSensorData = (moisture: number, battery: number) => {
  db.runSync(
    'INSERT INTO sensor_data (soil_moisture_percent, battery_percent, timestamp) VALUES (?, ?, ?)',
    [moisture, battery, new Date().toISOString()]
  );
};

export const getLatestSensorHistory = (): SensorData[] => {
  const result = db.getAllSync('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 50');
  return result.map((row: any) => ({
    id: row.id,
    soilMoisturePercent: row.soil_moisture_percent,
    batteryPercent: row.battery_percent,
    timestamp: row.timestamp
  }));
};

export const addMotorLog = (log: Omit<MotorLog, 'id'>) => {
  db.runSync(
    'INSERT INTO motor_log (start_time, duration_seconds, moisture_at_trigger, mode) VALUES (?, ?, ?, ?)',
    [log.startTime, log.durationSeconds, log.moistureAtTrigger, log.mode]
  );
};

export const getMotorLogs = (): MotorLog[] => {
  const result = db.getAllSync('SELECT * FROM motor_log ORDER BY start_time DESC');
  return result.map((row: any) => ({
    id: row.id,
    startTime: row.start_time,
    durationSeconds: row.duration_seconds,
    moistureAtTrigger: row.moisture_at_trigger,
    mode: row.mode
  }));
};

export const addSchedule = (schedule: Omit<IrrigationSchedule, 'id'>) => {
  db.runSync(
    `INSERT INTO irrigation_schedule (days, duration_in_seconds, repeat_daily, specific_date, time, active) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      schedule.days, 
      schedule.durationInSeconds,
      schedule.repeatDaily ? 1 : 0,
      schedule.specificDate,
      schedule.time,
      schedule.active ? 1 : 0
    ]
  );
};

export const getSchedules = (): IrrigationSchedule[] => {
  const result = db.getAllSync('SELECT * FROM irrigation_schedule');
  return result.map((row: any) => ({
    id: row.id,
    days: row.days, 
    durationInSeconds: row.duration_in_seconds,
    repeatDaily: row.repeat_daily === 1,
    specificDate: row.specific_date,
    time: row.time,
    active: row.active === 1
  }));
};

export const deleteSchedule = (id: number) => {
  db.runSync('DELETE FROM irrigation_schedule WHERE id = ?', [id]);
};

export const toggleSchedule = (id: number, active: boolean) => {
  db.runSync('UPDATE irrigation_schedule SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
};

export const getMotorState = (): MotorState => {
  const row: any = db.getFirstSync('SELECT * FROM motor_state WHERE id = 1');
  return {
    id: row.id,
    autoControl: row.auto_control === 1,
    moistureThreshold: row.moisture_threshold,
    autoDurationSeconds: row.auto_duration_seconds,
    manualDurationSeconds: row.manual_duration_seconds,
    isOn: row.is_on === 1
  };
};

export const updateMotorState = (settings: Partial<MotorState>) => {
  if (settings.autoControl !== undefined) 
    db.runSync('UPDATE motor_state SET auto_control = ? WHERE id = 1', [settings.autoControl ? 1 : 0]);
  
  if (settings.moistureThreshold !== undefined)
    db.runSync('UPDATE motor_state SET moisture_threshold = ? WHERE id = 1', [settings.moistureThreshold]);
    
  if (settings.manualDurationSeconds !== undefined)
    db.runSync('UPDATE motor_state SET manual_duration_seconds = ? WHERE id = 1', [settings.manualDurationSeconds]);
};

export const getTemperatureConfig = (): TemperatureConfig => {
  const row: any = db.getFirstSync('SELECT * FROM temperature_config WHERE id = 1');
  return {
    id: row.id,
    threshold: row.threshold,
    extraSeconds: row.extra_seconds,
    active: row.active === 1,
    updatedAt: row.updated_at
  };
};

export const updateSchedule = (id: number, schedule: Partial<IrrigationSchedule>) => {
  const updates: string[] = [];
  const args: any[] = [];

  if (schedule.time !== undefined) { updates.push("time = ?"); args.push(schedule.time); }
  if (schedule.days !== undefined) { updates.push("days = ?"); args.push(schedule.days); } // JSON String
  if (schedule.durationInSeconds !== undefined) { updates.push("duration_in_seconds = ?"); args.push(schedule.durationInSeconds); }
  if (schedule.repeatDaily !== undefined) { updates.push("repeat_daily = ?"); args.push(schedule.repeatDaily ? 1 : 0); }
  if (schedule.specificDate !== undefined) { updates.push("specific_date = ?"); args.push(schedule.specificDate); }
  if (schedule.active !== undefined) { updates.push("active = ?"); args.push(schedule.active ? 1 : 0); }

  if (updates.length === 0) return;

  args.push(id);
  db.runSync(`UPDATE irrigation_schedule SET ${updates.join(", ")} WHERE id = ?`, args);
};

export const updateTemperatureConfig = (config: Partial<TemperatureConfig>) => {
  if (config.threshold !== undefined)
    db.runSync('UPDATE temperature_config SET threshold = ? WHERE id = 1', [config.threshold]);
  
  if (config.extraSeconds !== undefined)
    db.runSync('UPDATE temperature_config SET extra_seconds = ? WHERE id = 1', [config.extraSeconds]);
  
  if (config.active !== undefined)
    db.runSync('UPDATE temperature_config SET active = ? WHERE id = 1', [config.active ? 1 : 0]);

  db.runSync('UPDATE temperature_config SET updated_at = ? WHERE id = 1', [new Date().toISOString()]);
};