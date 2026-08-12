import { ConnectionMode, SerialPortOption } from '../types';
import { VirtualStm32Mcu } from './virtualStm32';

export interface SerialCallbacks {
  onDataReceived: (data: Uint8Array) => void;
  onDataSent: (data: Uint8Array) => void;
  onLog: (tag: 'SYS' | 'TX' | 'RX' | 'ERR', message: string, rawHex?: string) => void;
  onStatusChanged: (connected: boolean, portName: string) => void;
}

export class SerialConnectionManager {
  private mode: ConnectionMode = 'virtual';
  private connected: boolean = false;
  private currentPortName: string = 'COM3 (Virtual STM32F103)';
  private baudRate: number = 115200;

  // Virtual MCU instance
  public virtualMcu: VirtualStm32Mcu = new VirtualStm32Mcu();

  // Web Serial API handles
  private webSerialPort: any = null;
  private webSerialReader: any = null;
  private webSerialWriter: any = null;
  private isReadingWebSerial: boolean = false;

  private callbacks: Partial<SerialCallbacks> = {};

  constructor() {
    this.virtualMcu.setOnTransmit((bytes) => {
      if (this.connected && this.mode === 'virtual') {
        this.callbacks.onDataReceived?.(bytes);
      }
    });
  }

  public setCallbacks(cbs: Partial<SerialCallbacks>): void {
    this.callbacks = cbs;
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getPortName(): string {
    return this.currentPortName;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  public setBaudRate(rate: number): void {
    this.baudRate = rate;
  }

  public getAvailablePorts(): SerialPortOption[] {
    return [
      { id: 'v-com3', name: 'COM3 (Virtual STM32F103)', type: 'virtual' },
      { id: 'v-com4', name: 'COM4 (Virtual ST-Link VCP)', type: 'virtual' },
      { id: 'v-ttyusb0', name: '/dev/ttyUSB0 (Virtual CP2102)', type: 'virtual' },
      { id: 'v-ttyacm0', name: '/dev/ttyACM0 (Virtual STM32)', type: 'virtual' },
      { id: 'webserial-device', name: '⚡ Physical USB-UART (Web Serial)', type: 'physical' },
    ];
  }

  public async connect(portId: string): Promise<boolean> {
    const isPhysical = portId === 'webserial-device';

    if (isPhysical) {
      return this.connectPhysical();
    } else {
      return this.connectVirtual(portId);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.mode === 'virtual') {
      this.virtualMcu.stop();
    } else if (this.mode === 'webserial') {
      await this.disconnectPhysical();
    }

    this.connected = false;
    this.callbacks.onStatusChanged?.(false, this.currentPortName);
    this.callbacks.onLog?.('SYS', 'Data Link Terminated.');
  }

  private connectVirtual(portId: string): boolean {
    const ports = this.getAvailablePorts();
    const port = ports.find(p => p.id === portId) || ports[0];

    this.mode = 'virtual';
    this.currentPortName = port.name;
    this.connected = true;

    this.virtualMcu.start();
    this.callbacks.onStatusChanged?.(true, this.currentPortName);
    this.callbacks.onLog?.('SYS', `Data Link Established: ${this.currentPortName} @ ${this.baudRate} bps`);

    return true;
  }

  private async connectPhysical(): Promise<boolean> {
    if (!('serial' in navigator)) {
      this.callbacks.onLog?.('ERR', 'Web Serial API is not supported in this browser. Use Chrome/Edge or switch to Virtual STM32.');
      return false;
    }

    try {
      // Prompt user to select physical serial port
      const nav = navigator as any;
      this.webSerialPort = await nav.serial.requestPort();
      await this.webSerialPort.open({ baudRate: this.baudRate });

      this.mode = 'webserial';
      this.currentPortName = 'Physical Serial Port';
      this.connected = true;

      this.callbacks.onStatusChanged?.(true, this.currentPortName);
      this.callbacks.onLog?.('SYS', `Physical Port Connected @ ${this.baudRate} bps`);

      this.startWebSerialReadLoop();
      return true;
    } catch (err: any) {
      this.callbacks.onLog?.('ERR', `Web Serial connection failed: ${err?.message || err}`);
      return false;
    }
  }

  private async startWebSerialReadLoop(): Promise<void> {
    this.isReadingWebSerial = true;
    while (this.webSerialPort && this.webSerialPort.readable && this.isReadingWebSerial) {
      try {
        this.webSerialReader = this.webSerialPort.readable.getReader();
        while (true) {
          const { value, done } = await this.webSerialReader.read();
          if (done) break;
          if (value && value.length > 0) {
            this.callbacks.onDataReceived?.(value);
          }
        }
      } catch (err: any) {
        if (this.isReadingWebSerial) {
          this.callbacks.onLog?.('ERR', `Serial read error: ${err?.message || err}`);
        }
      } finally {
        if (this.webSerialReader) {
          this.webSerialReader.releaseLock();
          this.webSerialReader = null;
        }
      }
    }
  }

  private async disconnectPhysical(): Promise<void> {
    this.isReadingWebSerial = false;
    try {
      if (this.webSerialReader) {
        await this.webSerialReader.cancel();
        this.webSerialReader.releaseLock();
        this.webSerialReader = null;
      }
      if (this.webSerialWriter) {
        this.webSerialWriter.releaseLock();
        this.webSerialWriter = null;
      }
      if (this.webSerialPort) {
        await this.webSerialPort.close();
        this.webSerialPort = null;
      }
    } catch (err: any) {
      console.error('Error closing physical serial port:', err);
    }
  }

  public async transmit(bytes: Uint8Array): Promise<void> {
    if (!this.connected) {
      this.callbacks.onLog?.('ERR', 'Port offline! Connect to a port first.');
      return;
    }

    this.callbacks.onDataSent?.(bytes);

    if (this.mode === 'virtual') {
      this.virtualMcu.receiveFromHost(bytes);
    } else if (this.mode === 'webserial' && this.webSerialPort?.writable) {
      try {
        const writer = this.webSerialPort.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
      } catch (err: any) {
        this.callbacks.onLog?.('ERR', `Write error: ${err?.message || err}`);
      }
    }
  }
}
