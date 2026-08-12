import { MotorState, DeviceState } from '../types';
import {
  ProtocolStreamParser,
  buildSensorTelemetryFrame,
  buildDeviceStateFrame,
} from '../utils/protocol';

export interface VirtualEnvironment {
  baseTemp: number; // e.g. 26.5
  baseHum: number;  // e.g. 48.0
  noise: boolean;
  sensorFault: boolean; // simulated I2C read failure (temp <= -90.0)
}

export class VirtualStm32Mcu {
  // Firmware state
  private motorState: MotorState = MotorState.STOP;
  private motorSpeed: number = 50;
  private rgbColorIndex: number = 0;

  // Environment simulation
  public env: VirtualEnvironment = {
    baseTemp: 25.4,
    baseHum: 52.0,
    noise: true,
    sensorFault: false,
  };

  // Hardware counters
  private timerInterval: any = null;
  private parser = new ProtocolStreamParser();
  private onTransmitCallback: ((bytes: Uint8Array) => void) | null = null;
  private isRunning: boolean = false;

  constructor() {}

  public setOnTransmit(callback: (bytes: Uint8Array) => void): void {
    this.onTransmitCallback = callback;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.parser.clear();

    // Send initial state sync frame
    this.sendDeviceState();

    // Periodic 1000ms sensor upload as in main.c (if HAL_GetTick() - last_upload_time > 1000)
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.sendSensorTelemetry();
    }, 1000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public reset(): void {
    this.motorState = MotorState.STOP;
    this.motorSpeed = 50;
    this.rgbColorIndex = 0;
    this.env.sensorFault = false;
    this.parser.clear();
    this.sendDeviceState();
    this.sendSensorTelemetry();
  }

  public getState(): DeviceState {
    return {
      motorState: this.motorState,
      motorSpeed: this.motorSpeed,
      rgbColorIndex: this.rgbColorIndex,
    };
  }

  // Receive bytes over USART2 (from host computer / terminal)
  public receiveFromHost(bytes: Uint8Array): void {
    if (!this.isRunning) return;

    const packets = this.parser.append(bytes);
    for (const pkt of packets) {
      this.handleCommand(pkt.cmd, pkt.data);
    }
  }

  private handleCommand(cmd: number, data: Uint8Array): void {
    // 0x0A: Motor state
    if (cmd === 0x0a && data.length >= 1) {
      const state = data[0];
      if (state >= 0 && state <= 2) {
        this.motorState = state as MotorState;
        this.sendDeviceState();
      }
    }
    // 0x0B: RGB color
    else if (cmd === 0x0b && data.length >= 1) {
      this.rgbColorIndex = data[0] % 8;
      this.sendDeviceState();
    }
    // 0x0C: Motor speed
    else if (cmd === 0x0c && data.length >= 1) {
      this.motorSpeed = Math.min(100, Math.max(0, data[0]));
      this.sendDeviceState();
    }
  }

  // Hardware button triggers (EXTI and GPIO polling)
  // KEY1 (PA6): Toggle motor state: STOP -> FORWARD -> REVERSE -> STOP
  public pressKey1(): void {
    switch (this.motorState) {
      case MotorState.STOP:
        this.motorState = MotorState.FORWARD;
        break;
      case MotorState.FORWARD:
        this.motorState = MotorState.REVERSE;
        break;
      case MotorState.REVERSE:
        this.motorState = MotorState.STOP;
        break;
      default:
        this.motorState = MotorState.STOP;
    }
    this.sendDeviceState();
  }

  // KEY2 (PA7 / EXTI9_5): Speed step (+10%, wraps to 0 if > 100)
  public pressKey2(): void {
    if (this.motorState !== MotorState.STOP) {
      this.motorSpeed += 10;
      if (this.motorSpeed > 100) {
        this.motorSpeed = 0;
      }
      this.sendDeviceState();
    }
  }

  // PA1 EXTI1: RGB color cycle
  public pressRgbButton(): void {
    this.rgbColorIndex = (this.rgbColorIndex + 1) % 8;
    this.sendDeviceState();
  }

  // I2C sensor read simulation
  public readSensor(): { temp: number; hum: number } {
    if (this.env.sensorFault) {
      return { temp: -99.9, hum: -99.9 };
    }

    let t = this.env.baseTemp;
    let h = this.env.baseHum;

    if (this.env.noise) {
      // Add slight micro-fluctuations simulating 12-bit ADC / delta-sigma noise
      t += (Math.random() - 0.5) * 0.4;
      h += (Math.random() - 0.5) * 0.8;
    }

    // Round to 1 decimal place as in 0.1°C resolution
    t = Math.round(t * 10) / 10;
    h = Math.round(h * 10) / 10;

    return { temp: t, hum: h };
  }

  public sendSensorTelemetry(): void {
    const { temp, hum } = this.readSensor();
    const frame = buildSensorTelemetryFrame(temp, hum);
    if (this.onTransmitCallback) {
      this.onTransmitCallback(frame);
    }
  }

  public sendDeviceState(): void {
    const frame = buildDeviceStateFrame(this.motorState, this.rgbColorIndex, this.motorSpeed);
    if (this.onTransmitCallback) {
      this.onTransmitCallback(frame);
    }
  }
}
