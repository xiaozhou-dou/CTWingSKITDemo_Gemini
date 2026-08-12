import React from 'react';
import { Power, RefreshCw, Cpu, Usb, Radio, Sparkles } from 'lucide-react';
import { ConnectionMode, SerialPortOption } from '../types';

interface HeaderBarProps {
  ports: SerialPortOption[];
  selectedPortId: string;
  onSelectPortId: (id: string) => void;
  baudRate: number;
  onChangeBaudRate: (rate: number) => void;
  isConnected: boolean;
  onToggleConnect: () => void;
  onRefreshPorts: () => void;
  mode: ConnectionMode;
  onToggleVirtualInspector: () => void;
  showVirtualInspector: boolean;
  txCount: number;
  rxCount: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  ports,
  selectedPortId,
  onSelectPortId,
  baudRate,
  onChangeBaudRate,
  isConnected,
  onToggleConnect,
  onRefreshPorts,
  mode,
  onToggleVirtualInspector,
  showVirtualInspector,
  txCount,
  rxCount,
}) => {
  return (
    <header className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Link Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></span>
            <span className="text-[#a5b4fc] font-bold text-xs md:text-sm tracking-wider uppercase">
              LINK INTERFACE:
            </span>
          </div>

          {/* Port selector */}
          <div className="relative">
            <select
              id="port-selector-dropdown"
              disabled={isConnected}
              value={selectedPortId}
              onChange={(e) => onSelectPortId(e.target.value)}
              className="bg-[#0d1117] text-[#c9d1d9] font-mono text-xs md:text-sm font-semibold border border-[#30363d] rounded px-3 py-1.5 focus:border-[#00E5FF] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pr-8"
            >
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          {/* Baud rate */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1">
            <span className="text-[10px] text-[#8b949e] font-mono">BAUD:</span>
            <select
              id="baudrate-selector"
              disabled={isConnected}
              value={baudRate}
              onChange={(e) => onChangeBaudRate(Number(e.target.value))}
              className="bg-transparent text-[#a5b4fc] font-mono text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={38400}>38400</option>
              <option value={57600}>57600</option>
              <option value={115200}>115200</option>
            </select>
          </div>

          {/* Scan ports */}
          <button
            id="btn-scan-ports"
            onClick={onRefreshPorts}
            disabled={isConnected}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-bold px-3 py-1.5 rounded border border-[#30363d] transition-colors disabled:opacity-50"
            title="Scan available serial ports"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SCAN PORTS</span>
          </button>

          {/* Connect / Disconnect button */}
          <button
            id="btn-toggle-connection"
            onClick={onToggleConnect}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded transition-all shadow-md ${
              isConnected
                ? 'bg-[#da3633] hover:bg-[#f85149] text-white shadow-[#da3633]/20'
                : 'bg-[#238636] hover:bg-[#2ea043] text-white shadow-[#238636]/20'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isConnected ? '⏹ DISCONNECT' : '▶ CONNECT'}</span>
          </button>
        </div>

        {/* Right: Telemetry stats & Virtual Hardware Drawer Toggle */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Packet telemetry */}
          <div className="hidden lg:flex items-center gap-3 bg-[#0d1117] border border-[#30363d] px-3 py-1 rounded text-[11px] font-mono">
            <span className="flex items-center gap-1 text-[#FF9900]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900]"></span>
              TX: {txCount}B
            </span>
            <span className="text-[#30363d]">|</span>
            <span className="flex items-center gap-1 text-[#00FF66]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]"></span>
              RX: {rxCount}B
            </span>
          </div>

          {/* Virtual MCU Inspector toggle button */}
          <button
            id="btn-toggle-virtual-board"
            onClick={onToggleVirtualInspector}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded border transition-all ${
              showVirtualInspector
                ? 'bg-[#005cc5] border-[#00E5FF] text-white shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                : 'bg-[#21262d] border-[#30363d] text-[#00E5FF] hover:bg-[#30363d]'
            }`}
            title="Open Virtual STM32 Hardware Board and Sensor Controls"
          >
            <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>STM32 BOARD SIMULATOR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
