import { MotorState, SensorData, DeviceState } from '../types';

export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map(b => (b & 0xff).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

export function hexToBytes(hexString: string): Uint8Array {
  const cleanHex = hexString.replace(/[\s\n\r,;0x#]/g, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of digits');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character near index ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

export function buildProtocolFrame(cmd: number, data: number[]): Uint8Array {
  const length = 1 + data.length;
  const frame = new Uint8Array(3 + length + 1);
  frame[0] = 0x5A;
  frame[1] = 0xA5;
  frame[2] = length;
  frame[3] = cmd;

  for (let i = 0; i < data.length; i++) {
    frame[4 + i] = data[i];
  }

  // XOR checksum: length ^ cmd ^ data[0] ^ data[1] ...
  let checksum = length;
  checksum ^= cmd;
  for (let i = 0; i < data.length; i++) {
    checksum ^= data[i];
  }
  frame[3 + length] = checksum;

  return frame;
}

export function buildMotorStateCmd(state: MotorState): Uint8Array {
  return buildProtocolFrame(0x0A, [state]);
}

export function buildRgbColorCmd(colorIndex: number): Uint8Array {
  return buildProtocolFrame(0x0B, [colorIndex % 8]);
}

export function buildMotorSpeedCmd(speed: number): Uint8Array {
  const clamped = Math.max(0, Math.min(100, Math.round(speed)));
  return buildProtocolFrame(0x0C, [clamped]);
}

export function buildSensorTelemetryFrame(temp: number, hum: number): Uint8Array {
  // temp and hum multiplied by 10 as int16 big-endian
  const t = Math.round(temp * 10);
  const h = Math.round(hum * 10);

  const tHi = (t >> 8) & 0xff;
  const tLo = t & 0xff;
  const hHi = (h >> 8) & 0xff;
  const hLo = h & 0xff;

  return buildProtocolFrame(0x01, [tHi, tLo, hHi, hLo]);
}

export function buildDeviceStateFrame(motorState: MotorState, rgbIdx: number, speed: number): Uint8Array {
  return buildProtocolFrame(0x02, [motorState, rgbIdx % 8, Math.max(0, Math.min(100, speed))]);
}

export interface ParsedPacket {
  cmd: number;
  data: Uint8Array;
  rawFrame: Uint8Array;
}

export class ProtocolStreamParser {
  private buffer: number[] = [];

  public append(data: Uint8Array): ParsedPacket[] {
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data[i]);
    }

    const packets: ParsedPacket[] = [];

    while (this.buffer.length >= 4) {
      if (this.buffer[0] === 0x5a && this.buffer[1] === 0xa5) {
        const length = this.buffer[2];
        const totalFrameLen = 3 + length + 1;

        if (this.buffer.length >= totalFrameLen) {
          let calcChecksum = length;
          for (let i = 0; i < length; i++) {
            calcChecksum ^= this.buffer[3 + i];
          }

          const receivedChecksum = this.buffer[3 + length];
          if (calcChecksum === receivedChecksum) {
            const cmd = this.buffer[3];
            const dataBytes = new Uint8Array(this.buffer.slice(4, 3 + length));
            const rawFrame = new Uint8Array(this.buffer.slice(0, totalFrameLen));

            packets.push({ cmd, data: dataBytes, rawFrame });
            this.buffer.splice(0, totalFrameLen);
            continue;
          } else {
            // Checksum mismatch, discard header
            this.buffer.shift();
          }
        } else {
          // Need more bytes
          break;
        }
      } else {
        this.buffer.shift();
      }
    }

    // Safety buffer limit
    if (this.buffer.length > 1024) {
      this.buffer = [];
    }

    return packets;
  }

  public clear(): void {
    this.buffer = [];
  }
}

export function decodeSensorData(data: Uint8Array): SensorData {
  if (data.length < 4) {
    return { temperature: -99.9, humidity: -99.9, isError: true, timestamp: Date.now() };
  }

  // Two signed 16-bit big-endian integers
  let rawTemp = (data[0] << 8) | data[1];
  if (rawTemp & 0x8000) {
    rawTemp = rawTemp - 0x10000;
  }

  let rawHum = (data[2] << 8) | data[3];
  if (rawHum & 0x8000) {
    rawHum = rawHum - 0x10000;
  }

  const temp = rawTemp / 10.0;
  const hum = rawHum / 10.0;

  const isError = temp <= -90.0;

  return {
    temperature: isError ? -99.9 : temp,
    humidity: isError ? -99.9 : hum,
    isError,
    timestamp: Date.now(),
  };
}

export function decodeDeviceState(data: Uint8Array): DeviceState {
  const motorState: MotorState = data.length > 0 && data[0] <= 2 ? data[0] : MotorState.STOP;
  const rgbColorIndex = data.length > 1 ? data[1] % 8 : 0;
  const motorSpeed = data.length > 2 ? Math.min(100, Math.max(0, data[2])) : 50;

  return {
    motorState,
    rgbColorIndex,
    motorSpeed,
  };
}
