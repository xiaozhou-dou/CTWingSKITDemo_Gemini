import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { SensorPanel } from './components/SensorPanel';
import { MotorControlPanel } from './components/MotorControlPanel';
import { RgbControlPanel } from './components/RgbControlPanel';
import { ProtocolLogPanel } from './components/ProtocolLogPanel';
import { RawTransceiverPanel } from './components/RawTransceiverPanel';
import { VirtualBoardPanel } from './components/VirtualBoardPanel';
import { SerialConnectionManager } from './services/serialConnection';
import {
  MotorState,
  SensorData,
  ProtocolLogEntry,
  RGB_COLORS,
  SerialPortOption,
} from './types';
import {
  ProtocolStreamParser,
  decodeSensorData,
  decodeDeviceState,
  buildMotorStateCmd,
  buildMotorSpeedCmd,
  buildRgbColorCmd,
  bytesToHex,
} from './utils/protocol';

export const App: React.FC = () => {
  // Connection manager instance
  const serialManager = useMemo(() => new SerialConnectionManager(), []);
  const parserRef = useRef<ProtocolStreamParser>(new ProtocolStreamParser());

  // Connection State
  const [ports, setPorts] = useState<SerialPortOption[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string>('v-com3');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [portName, setPortName] = useState<string>('COM3 (Virtual STM32F103)');
  const [showVirtualInspector, setShowVirtualInspector] = useState<boolean>(false);

  // Device Telemetry & State
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [motorState, setMotorState] = useState<MotorState>(MotorState.STOP);
  const [motorSpeed, setMotorSpeed] = useState<number>(50);
  const [rgbColorIndex, setRgbColorIndex] = useState<number>(0);

  // Packet & Terminal State
  const [protocolLogs, setProtocolLogs] = useState<ProtocolLogEntry[]>([]);
  const [rawRxBytes, setRawRxBytes] = useState<Uint8Array[]>([]);
  const [txCount, setTxCount] = useState<number>(0);
  const [rxCount, setRxCount] = useState<number>(0);

  // Helper to add system log
  const addLog = useCallback((tag: 'SYS' | 'TX' | 'RX' | 'ERR', message: string, rawHex?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;

    const newEntry: ProtocolLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: timeStr,
      tag,
      message,
      rawHex,
    };

    setProtocolLogs((prev) => [...prev.slice(-499), newEntry]);
  }, []);

  // Initialize and refresh ports
  const refreshPorts = useCallback(() => {
    const available = serialManager.getAvailablePorts();
    setPorts(available);
  }, [serialManager]);

  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  // Handle incoming data packets
  const handleDataReceived = useCallback(
    (data: Uint8Array) => {
      setRxCount((c) => c + data.length);
      setRawRxBytes((prev) => [...prev.slice(-50), data]);

      const packets = parserRef.current.append(data);
      for (const pkt of packets) {
        if (pkt.cmd === 0x01) {
          // Sensor Telemetry Frame
          const decoded = decodeSensorData(pkt.data);
          setSensorData(decoded);
          setSensorHistory((prev) => [...prev.slice(-30), decoded]);

          if (decoded.isError) {
            addLog('ERR', 'HTS221 I2C Comm Failure! Check sensor bus.', bytesToHex(pkt.rawFrame));
          } else {
            addLog(
              'RX',
              `Telemetry: ${decoded.temperature.toFixed(1)}°C, ${decoded.humidity.toFixed(1)}%`,
              bytesToHex(pkt.rawFrame)
            );
          }
        } else if (pkt.cmd === 0x02) {
          // Device State Frame
          const state = decodeDeviceState(pkt.data);
          setMotorState(state.motorState);
          setMotorSpeed(state.motorSpeed);
          setRgbColorIndex(state.rgbColorIndex);

          const mNames = ['STOP', 'FORWARD', 'REVERSE'];
          const colorName = RGB_COLORS[state.rgbColorIndex % RGB_COLORS.length].name;
          addLog(
            'RX',
            `State Sync: Motor=${mNames[state.motorState]}, Speed=${state.motorSpeed}%, RGB=${colorName}`,
            bytesToHex(pkt.rawFrame)
          );
        }
      }
    },
    [addLog]
  );

  // Configure Serial Callbacks
  useEffect(() => {
    serialManager.setCallbacks({
      onDataReceived: handleDataReceived,
      onDataSent: (data) => {
        setTxCount((c) => c + data.length);
      },
      onLog: (tag, msg, hex) => {
        addLog(tag, msg, hex);
      },
      onStatusChanged: (connected, name) => {
        setIsConnected(connected);
        setPortName(name);
      },
    });
  }, [serialManager, handleDataReceived, addLog]);

  // Connect / Disconnect Action
  const toggleConnection = async () => {
    if (!isConnected) {
      serialManager.setBaudRate(baudRate);
      await serialManager.connect(selectedPortId);
    } else {
      await serialManager.disconnect();
    }
  };

  // Motor State Change
  const handleSetMotorState = async (state: MotorState) => {
    if (!isConnected) {
      addLog('ERR', 'Port offline!');
      return;
    }
    const frame = buildMotorStateCmd(state);
    addLog('TX', `Cmd:0x0A [Motor State=${state}]`, bytesToHex(frame));
    await serialManager.transmit(frame);
  };

  // Motor Speed Change
  const handleSetMotorSpeed = async (speed: number) => {
    if (!isConnected) {
      addLog('ERR', 'Port offline!');
      return;
    }
    const frame = buildMotorSpeedCmd(speed);
    addLog('TX', `Cmd:0x0C [Motor Speed=${speed}%]`, bytesToHex(frame));
    await serialManager.transmit(frame);
  };

  // RGB Color Change
  const handleSetRgbColor = async (colorIdx: number) => {
    if (!isConnected) {
      addLog('ERR', 'Port offline!');
      return;
    }
    const frame = buildRgbColorCmd(colorIdx);
    const colorName = RGB_COLORS[colorIdx % RGB_COLORS.length].name;
    addLog('TX', `Cmd:0x0B [RGB Color=${colorName}]`, bytesToHex(frame));
    await serialManager.transmit(frame);
  };

  // Raw Transmit
  const handleTransmitRaw = async (bytes: Uint8Array) => {
    if (!isConnected) {
      addLog('ERR', 'Port offline!');
      return;
    }
    addLog('TX', `RAW TRANSMIT: ${bytes.length} bytes`, bytesToHex(bytes));
    await serialManager.transmit(bytes);
  };

  const handleRefreshState = () => {
    const st = serialManager.virtualMcu.getState();
    setMotorState(st.motorState);
    setMotorSpeed(st.motorSpeed);
    setRgbColorIndex(st.rgbColorIndex);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col p-2.5 md:p-4 gap-3 max-w-[1600px] mx-auto font-sans">
      {/* 1. Top Link Interface Bar */}
      <HeaderBar
        ports={ports}
        selectedPortId={selectedPortId}
        onSelectPortId={setSelectedPortId}
        baudRate={baudRate}
        onChangeBaudRate={setBaudRate}
        isConnected={isConnected}
        onToggleConnect={toggleConnection}
        onRefreshPorts={refreshPorts}
        mode={serialManager.getMode()}
        onToggleVirtualInspector={() => setShowVirtualInspector(!showVirtualInspector)}
        showVirtualInspector={showVirtualInspector}
        txCount={txCount}
        rxCount={rxCount}
      />

      {/* Virtual STM32 Hardware Emulator Drawer */}
      {showVirtualInspector && (
        <VirtualBoardPanel
          virtualMcu={serialManager.virtualMcu}
          motorState={motorState}
          motorSpeed={motorSpeed}
          rgbColorIndex={rgbColorIndex}
          onRefreshState={handleRefreshState}
          onClose={() => setShowVirtualInspector(false)}
        />
      )}

      {/* 2. Middle: Dashboard / Telemetry & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Sensor Block (Left: 5 cols) */}
        <div className="lg:col-span-5">
          <SensorPanel sensorData={sensorData} history={sensorHistory} />
        </div>

        {/* Control Blocks (Right: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <MotorControlPanel
            motorState={motorState}
            motorSpeed={motorSpeed}
            onSetMotorState={handleSetMotorState}
            onSetMotorSpeed={handleSetMotorSpeed}
          />
          <RgbControlPanel
            currentColorIndex={rgbColorIndex}
            onSetRgbColor={handleSetRgbColor}
          />
        </div>
      </div>

      {/* 3. Bottom: Communication Terminals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        {/* Protocol Log (Left: 6 cols) */}
        <div className="lg:col-span-6">
          <ProtocolLogPanel
            logs={protocolLogs}
            onClearLogs={() => setProtocolLogs([])}
          />
        </div>

        {/* Raw Transceiver (Right: 6 cols) */}
        <div className="lg:col-span-6">
          <RawTransceiverPanel
            rawRxBytes={rawRxBytes}
            onClearRx={() => setRawRxBytes([])}
            onTransmitRaw={handleTransmitRaw}
          />
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-[11px] font-mono text-[#8b949e] py-1 border-t border-[#30363d]/40 flex flex-wrap items-center justify-between">
        <span>STM32 Industrial Terminal [Cyber Edition] • STM32F103C8 + HTS221 + PWM Driver</span>
        <span>Baud: 115200 8-N-1 • Protocol: 0x5A 0xA5 Frame</span>
      </footer>
    </div>
  );
};
