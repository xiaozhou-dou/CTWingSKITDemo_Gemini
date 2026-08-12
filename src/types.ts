export enum MotorState {
  STOP = 0,
  FORWARD = 1,
  REVERSE = 2,
}

export interface SensorData {
  temperature: number; // in Celsius (-99.9 represents error)
  humidity: number;    // in % (-99.9 represents error)
  isError: boolean;
  timestamp: number;
}

export interface DeviceState {
  motorState: MotorState;
  rgbColorIndex: number;
  motorSpeed: number; // 0 to 100
}

export interface ProtocolLogEntry {
  id: string;
  timestamp: string;
  tag: 'SYS' | 'TX' | 'RX' | 'ERR';
  message: string;
  rawHex?: string;
}

export interface RgbColorDef {
  name: string;
  hex: string;
  rPin: boolean; // active low
  gPin: boolean; // active low
  bPin: boolean; // active low
}

export const RGB_COLORS: RgbColorDef[] = [
  { name: 'Black', hex: '#161b22', rPin: false, gPin: false, bPin: false },
  { name: 'Red', hex: '#FF3366', rPin: true, gPin: false, bPin: false },
  { name: 'Green', hex: '#00FF66', rPin: false, gPin: true, bPin: false },
  { name: 'Yellow', hex: '#FFDD00', rPin: true, gPin: true, bPin: false },
  { name: 'Blue', hex: '#0088FF', rPin: false, gPin: false, bPin: true },
  { name: 'Magenta', hex: '#FF00FF', rPin: true, gPin: false, bPin: true },
  { name: 'Cyan', hex: '#00E5FF', rPin: false, gPin: true, bPin: true },
  { name: 'White', hex: '#FFFFFF', rPin: true, gPin: true, bPin: true },
];

export type ConnectionMode = 'virtual' | 'webserial';

export interface SerialPortOption {
  id: string;
  name: string;
  type: 'virtual' | 'physical';
}
