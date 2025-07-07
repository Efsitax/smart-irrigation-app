export interface SensorDataDto {
  soilMoisturePercent: number;  // Soil moisture as a percentage (0–100)
  batteryPercent: number;       // Battery level as a percentage (0–100)
  timestamp: string;            // ISO 8601 timestamp
}

export interface UpdateMotorStateDto {
  autoControl: boolean;         // Enable or disable automatic control
  moistureThreshold: number;    // Threshold (%) to trigger auto irrigation
  autoDurationSeconds: number;  // Duration in seconds when auto control runs
  manualDurationSeconds: number;// Duration in seconds for manual on/off
}

export interface MotorStateDto {
  autoControl: boolean;          // Is auto control enabled?
  moistureThreshold: number;     // Moisture threshold for auto irrigation (%)
  autoDurationSeconds: number;   // Duration for auto irrigation in seconds
  manualDurationSeconds: number; // Duration for manual operation in seconds
  isOn: boolean;           // Is the motor currently running?
}

export interface MotorLogDto {
  id: number;                  // Unique identifier for the log entry
  mode: string;      // Operation mode
  startTime: string;            // ISO 8601 timestamp when motor started
  durationSeconds: number;      // Run duration in seconds
  moistureAtTrigger: number;    // Soil moisture (%) at start
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface CreateScheduleDto {
  time: string;                 // "HH:mm:ss" format, local time
  days: DayOfWeek[];            // Days of week to repeat
  durationInSeconds: number;      // Irrigation duration in seconds
  repeatDaily: boolean;         // If false, uses specificDate instead
  specificDate?: string;        // "YYYY-MM-DD" format, optional one-time date
}

export interface UpdateScheduleDto extends CreateScheduleDto {
  // You can also make all fields optional via Partial<CreateScheduleDto> if preferred
}

export interface ScheduleResponseDto {
  id: number;
  time: string;
  days: DayOfWeek[];
  durationInSeconds: number;
  repeatDaily: boolean;
  specificDate?: string;
  active: boolean;
}

export interface TemperatureConfigDto {
  threshold: number;     // Temperature threshold in Celsius
  extraSeconds: number;         // Extra irrigation seconds when threshold exceeded
  active: boolean;       // Is temperature control active?
  updatedAt: string;            // ISO 8601 timestamp of last update
}