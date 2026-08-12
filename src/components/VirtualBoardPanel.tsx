import React from 'react';
import { Cpu, Thermometer, Droplets, RotateCcw, AlertTriangle, Radio, Activity, Volume2, Sparkles } from 'lucide-react';
import { VirtualStm32Mcu } from '../services/virtualStm32';
import { RGB_COLORS, MotorState } from '../types';

interface VirtualBoardPanelProps {
  virtualMcu: VirtualStm32Mcu;
  motorState: MotorState;
  motorSpeed: number;
  rgbColorIndex: number;
  onRefreshState: () => void;
  onClose: () => void;
}

export const VirtualBoardPanel: React.FC<VirtualBoardPanelProps> = ({
  virtualMcu,
  motorState,
  motorSpeed,
  rgbColorIndex,
  onRefreshState,
  onClose,
}) => {
  const currentColor = RGB_COLORS[rgbColorIndex % RGB_COLORS.length];

  const handleKey1 = () => {
    virtualMcu.pressKey1();
    onRefreshState();
  };

  const handleKey2 = () => {
    virtualMcu.pressKey2();
    onRefreshState();
  };

  const handleRgbKey = () => {
    virtualMcu.pressRgbButton();
    onRefreshState();
  };

  const handleReset = () => {
    virtualMcu.reset();
    onRefreshState();
  };

  const toggleFault = () => {
    virtualMcu.env.sensorFault = !virtualMcu.env.sensorFault;
    virtualMcu.sendSensorTelemetry();
    onRefreshState();
  };

  return (
    <div className="bg-[#161b22] border-2 border-[#00E5FF]/40 rounded-xl p-4 md:p-5 shadow-2xl relative">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30">
            <Cpu className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
              <span>STM32F103C8 & HTS221 HARDWARE EMULATOR</span>
              <span className="text-[10px] bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 px-2 py-0.5 rounded font-mono">
                ARM CORTEX-M3
              </span>
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Firmware Execution Simulator — Physical Pins, Interrupts (EXTI), Timers (TIM3 PWM), and I2C Sensor
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-white bg-[#21262d] hover:bg-[#30363d] p-1.5 rounded-lg border border-[#30363d] text-xs font-mono"
        >
          ✕ CLOSE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Virtual STM32 Board Layout (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d1117] border border-[#30363d] rounded-lg p-4 relative overflow-hidden">
          {/* PCB Watermark / Grid */}
          <div className="absolute top-2 right-2 text-[9px] font-mono text-[#30363d] uppercase tracking-widest pointer-events-none">
            STM32-BLUEPILL-REV1.0
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-[#a5b4fc] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
              ON-BOARD HARDWARE INTERRUPTS & CONTROLS
            </span>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-[#da3633]/20 hover:bg-[#da3633] text-[#f85149] hover:text-white border border-[#da3633]/40 text-[10px] font-mono px-2 py-1 rounded transition-colors"
              title="Reset STM32 Microcontroller"
            >
              <RotateCcw className="w-3 h-3" />
              <span>NRST (RESET)</span>
            </button>
          </div>

          {/* Interactive Hardware Keys on Board */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* KEY1 (PA6) */}
            <div className="bg-[#161b22] border border-[#30363d] rounded p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#8b949e]">GPIO: PA6</div>
                <div className="text-xs font-bold text-[#c9d1d9] mt-0.5">KEY1: MOTOR</div>
                <div className="text-[9px] text-[#8b949e] mt-0.5">Cycle STOP/FWD/REV</div>
              </div>
              <button
                id="btn-virtual-key1"
                onClick={handleKey1}
                className="mt-2.5 w-full bg-[#21262d] hover:bg-[#005cc5] text-[#00E5FF] hover:text-white text-xs font-mono font-bold py-1.5 px-2 rounded border border-[#30363d] active:scale-95 transition-all shadow"
              >
                PRESS KEY1
              </button>
            </div>

            {/* KEY2 (PA7 EXTI) */}
            <div className="bg-[#161b22] border border-[#30363d] rounded p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#8b949e]">EXTI9_5: PA7</div>
                <div className="text-xs font-bold text-[#c9d1d9] mt-0.5">KEY2: SPEED</div>
                <div className="text-[9px] text-[#8b949e] mt-0.5">+10% Throttle Step</div>
              </div>
              <button
                id="btn-virtual-key2"
                onClick={handleKey2}
                className="mt-2.5 w-full bg-[#21262d] hover:bg-[#005cc5] text-[#FFDD00] hover:text-white text-xs font-mono font-bold py-1.5 px-2 rounded border border-[#30363d] active:scale-95 transition-all shadow"
              >
                PRESS KEY2
              </button>
            </div>

            {/* RGB Button (PA1 EXTI) */}
            <div className="bg-[#161b22] border border-[#30363d] rounded p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#8b949e]">EXTI1: PA1</div>
                <div className="text-xs font-bold text-[#c9d1d9] mt-0.5">RGB KEY</div>
                <div className="text-[9px] text-[#8b949e] mt-0.5">Cycle 8 Colors</div>
              </div>
              <button
                id="btn-virtual-rgb-key"
                onClick={handleRgbKey}
                className="mt-2.5 w-full bg-[#21262d] hover:bg-[#005cc5] text-[#FF3366] hover:text-white text-xs font-mono font-bold py-1.5 px-2 rounded border border-[#30363d] active:scale-95 transition-all shadow"
              >
                PRESS RGB KEY
              </button>
            </div>
          </div>

          {/* Real-time Hardware Indicators & Pin Status */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-3">
            <span className="text-[10px] font-mono text-[#8b949e] block mb-2 font-bold uppercase">
              Live Peripheral Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/50">
                <span className="text-[9px] text-[#8b949e] block">USART2 (PA2/PA3)</span>
                <span className="text-[#00FF66] font-bold">115200 8N1</span>
              </div>
              <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/50">
                <span className="text-[9px] text-[#8b949e] block">TIM3 CH3/4 (PB0/PB1)</span>
                <span className="text-[#00E5FF] font-bold">
                  {motorState === MotorState.STOP ? '0% PWM' : `${motorSpeed}% PWM`}
                </span>
              </div>
              <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/50">
                <span className="text-[9px] text-[#8b949e] block">RGB LED (PB2/10/11)</span>
                <span className="font-bold" style={{ color: currentColor.hex !== '#161b22' ? currentColor.hex : '#8b949e' }}>
                  {currentColor.name}
                </span>
              </div>
              <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/50">
                <span className="text-[9px] text-[#8b949e] block">I2C1 (PB6/PB7)</span>
                <span className={virtualMcu.env.sensorFault ? 'text-[#FF3366] font-bold' : 'text-[#00FF66] font-bold'}>
                  {virtualMcu.env.sensorFault ? 'NACK / FAULT' : 'HTS221 OK'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Environment & Sensor Generator (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d1117] border border-[#30363d] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[#30363d] pb-2">
              <span className="text-xs font-mono font-bold text-[#a5b4fc] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF3366]" />
                ENVIRONMENT SIMULATOR
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">HTS221 I2C TARGET</span>
            </div>

            {/* Ambient Temperature Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[#8b949e] flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#FF3366]" /> Ambient Temp:
                </span>
                <span className="text-[#FF3366] font-bold font-mono">
                  {virtualMcu.env.baseTemp.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                step="0.5"
                value={virtualMcu.env.baseTemp}
                onChange={(e) => {
                  virtualMcu.env.baseTemp = Number(e.target.value);
                  virtualMcu.sendSensorTelemetry();
                  onRefreshState();
                }}
                className="w-full h-1.5 bg-[#161b22] rounded-lg appearance-none cursor-pointer accent-[#FF3366] border border-[#30363d]"
              />
            </div>

            {/* Ambient Humidity Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[#8b949e] flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#00E5FF]" /> Ambient Humidity:
                </span>
                <span className="text-[#00E5FF] font-bold font-mono">
                  {virtualMcu.env.baseHum.toFixed(1)} %
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="1"
                value={virtualMcu.env.baseHum}
                onChange={(e) => {
                  virtualMcu.env.baseHum = Number(e.target.value);
                  virtualMcu.sendSensorTelemetry();
                  onRefreshState();
                }}
                className="w-full h-1.5 bg-[#161b22] rounded-lg appearance-none cursor-pointer accent-[#00E5FF] border border-[#30363d]"
              />
            </div>

            {/* Environment Presets */}
            <div className="mb-3">
              <span className="text-[10px] font-mono text-[#8b949e] block mb-1.5">QUICK PRESETS:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    virtualMcu.env.baseTemp = 24.5;
                    virtualMcu.env.baseHum = 45.0;
                    virtualMcu.sendSensorTelemetry();
                    onRefreshState();
                  }}
                  className="bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-[10px] font-mono py-1 px-1.5 rounded border border-[#30363d]"
                >
                  Room (24.5°C)
                </button>
                <button
                  onClick={() => {
                    virtualMcu.env.baseTemp = 42.0;
                    virtualMcu.env.baseHum = 18.0;
                    virtualMcu.sendSensorTelemetry();
                    onRefreshState();
                  }}
                  className="bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-[10px] font-mono py-1 px-1.5 rounded border border-[#30363d]"
                >
                  Server (42.0°C)
                </button>
                <button
                  onClick={() => {
                    virtualMcu.env.baseTemp = 32.5;
                    virtualMcu.env.baseHum = 88.0;
                    virtualMcu.sendSensorTelemetry();
                    onRefreshState();
                  }}
                  className="bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-[10px] font-mono py-1 px-1.5 rounded border border-[#30363d]"
                >
                  Tropical (88%)
                </button>
              </div>
            </div>
          </div>

          {/* Fault Injection Button */}
          <button
            id="btn-toggle-sensor-fault"
            onClick={toggleFault}
            className={`w-full py-2 px-3 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all border ${
              virtualMcu.env.sensorFault
                ? 'bg-[#da3633] text-white border-[#da3633] shadow-[0_0_12px_rgba(218,54,51,0.4)] animate-pulse'
                : 'bg-[#21262d] hover:bg-[#30363d] text-[#f85149] border-[#da3633]/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {virtualMcu.env.sensorFault
                ? 'RESTORE HTS221 SENSOR'
                : 'SIMULATE I2C SENSOR FAULT'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
