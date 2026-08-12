import React from 'react';
import { RotateCw, RotateCcw, Octagon, Gauge, Zap } from 'lucide-react';
import { MotorState } from '../types';

interface MotorControlPanelProps {
  motorState: MotorState;
  motorSpeed: number;
  onSetMotorState: (state: MotorState) => void;
  onSetMotorSpeed: (speed: number) => void;
}

export const MotorControlPanel: React.FC<MotorControlPanelProps> = ({
  motorState,
  motorSpeed,
  onSetMotorState,
  onSetMotorSpeed,
}) => {
  const getMotorStatusText = () => {
    switch (motorState) {
      case MotorState.FORWARD:
        return 'FORWARD';
      case MotorState.REVERSE:
        return 'REVERSE';
      case MotorState.STOP:
      default:
        return 'STOP';
    }
  };

  const handleStepSpeed = () => {
    let next = motorSpeed + 10;
    if (next > 100) next = 0;
    onSetMotorSpeed(next);
  };

  const isStopped = motorState === MotorState.STOP;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-md flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-[#00E5FF] font-bold text-xs md:text-sm tracking-wider uppercase">
            DRIVE & SPEED CONTROL
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
          TIM3 PWM (PA7)
        </span>
      </div>

      {/* Status Bar */}
      <div className="bg-[#0d1117] border border-[#30363d]/80 rounded p-2.5 flex items-center justify-between font-mono mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">STATUS:</span>
          <span
            id="lbl-motor-status"
            className={`text-sm font-bold px-2 py-0.5 rounded ${
              motorState === MotorState.FORWARD
                ? 'text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/30'
                : motorState === MotorState.REVERSE
                ? 'text-[#FFDD00] bg-[#FFDD00]/10 border border-[#FFDD00]/30'
                : 'text-[#8b949e] bg-[#21262d] border border-[#30363d]'
            }`}
          >
            [ {getMotorStatusText()} ]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isStopped && (
            <span id="lbl-motor-speed" className="text-sm font-bold text-[#00E5FF]">
              SPEED: [ {motorSpeed}% ]
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Forward */}
        <button
          id="btn-motor-fwd"
          onClick={() => onSetMotorState(MotorState.FORWARD)}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-bold font-mono transition-all border ${
            motorState === MotorState.FORWARD
              ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.25)]'
              : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${motorState === MotorState.FORWARD ? 'animate-spin' : ''}`} />
          <span>FORWARD</span>
        </button>

        {/* Stop (Danger) */}
        <button
          id="btn-motor-stop"
          onClick={() => onSetMotorState(MotorState.STOP)}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-bold font-mono transition-all border ${
            motorState === MotorState.STOP
              ? 'bg-[#da3633] border-[#da3633] text-white shadow-[0_0_10px_rgba(218,54,51,0.3)]'
              : 'bg-[#da3633]/80 hover:bg-[#da3633] text-white border-transparent'
          }`}
        >
          <Octagon className="w-3.5 h-3.5" />
          <span>STOP</span>
        </button>

        {/* Reverse */}
        <button
          id="btn-motor-rev"
          onClick={() => onSetMotorState(MotorState.REVERSE)}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-bold font-mono transition-all border ${
            motorState === MotorState.REVERSE
              ? 'bg-[#FFDD00]/20 border-[#FFDD00] text-[#FFDD00] shadow-[0_0_10px_rgba(255,221,0,0.25)]'
              : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${motorState === MotorState.REVERSE ? 'animate-spin' : ''}`} />
          <span>REVERSE</span>
        </button>
      </div>

      {/* Throttle slider & Step */}
      <div className="bg-[#0d1117] border border-[#30363d]/80 rounded p-3">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-[#a5b4fc] font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#00E5FF]" /> THROTTLE:
          </span>
          <span className="text-[#00E5FF] font-bold">{motorSpeed}%</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="slider-motor-speed"
            type="range"
            min="0"
            max="100"
            step="10"
            value={motorSpeed}
            onChange={(e) => onSetMotorSpeed(Number(e.target.value))}
            className="w-full h-2 bg-[#161b22] rounded-lg appearance-none cursor-pointer accent-[#00E5FF] border border-[#30363d]"
          />

          <button
            id="btn-step-speed"
            onClick={handleStepSpeed}
            className="bg-[#005cc5] hover:bg-[#0366d6] text-white text-xs font-mono font-bold px-3 py-1.5 rounded transition-colors whitespace-nowrap shadow"
            title="Step throttle by +10%"
          >
            +10%
          </button>
        </div>

        {/* Tick labels */}
        <div className="flex justify-between text-[9px] font-mono text-[#8b949e] mt-1 px-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
