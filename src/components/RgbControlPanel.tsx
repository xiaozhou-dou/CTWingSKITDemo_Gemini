import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle2 } from 'lucide-react';
import { RGB_COLORS } from '../types';

interface RgbControlPanelProps {
  currentColorIndex: number;
  onSetRgbColor: (colorIndex: number) => void;
}

export const RgbControlPanel: React.FC<RgbControlPanelProps> = ({
  currentColorIndex,
  onSetRgbColor,
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(currentColorIndex);

  // Sync selected index when external state changes
  useEffect(() => {
    setSelectedColorIndex(currentColorIndex);
  }, [currentColorIndex]);

  const currentColor = RGB_COLORS[currentColorIndex % RGB_COLORS.length];
  const selectedColor = RGB_COLORS[selectedColorIndex % RGB_COLORS.length];

  const handleEngage = () => {
    onSetRgbColor(selectedColorIndex);
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-md flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-[#00E5FF] font-bold text-xs md:text-sm tracking-wider uppercase">
            RGB ILLUMINATION
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
          GPIO: PB2(R) PB10(G) PB11(B)
        </span>
      </div>

      {/* Control row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Color dropdown */}
        <div className="flex-1 min-w-[140px]">
          <select
            id="combo-rgb-selector"
            value={selectedColorIndex}
            onChange={(e) => setSelectedColorIndex(Number(e.target.value))}
            className="w-full bg-[#0d1117] text-[#c9d1d9] font-mono text-xs md:text-sm font-bold border border-[#30363d] rounded px-3 py-2 focus:border-[#00E5FF] focus:outline-none cursor-pointer"
          >
            {RGB_COLORS.map((col, idx) => (
              <option key={col.name} value={idx}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Engage Button */}
        <button
          id="btn-rgb-engage"
          onClick={handleEngage}
          className="bg-[#005cc5] hover:bg-[#0366d6] text-white text-xs font-mono font-bold px-4 py-2 rounded transition-all shadow-md active:scale-95"
        >
          ENGAGE
        </button>

        {/* Status Label */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 flex items-center gap-2 font-mono">
          <span className="text-xs text-[#8b949e]">COLOR:</span>
          <span
            id="lbl-rgb-active"
            className="text-xs font-bold text-[#c9d1d9]"
            style={{ color: currentColor.hex !== '#161b22' ? currentColor.hex : '#8b949e' }}
          >
            [ {currentColor.name} ]
          </span>
        </div>
      </div>

      {/* Quick Color Swatches & Visual LED Glow Preview */}
      <div className="bg-[#0d1117] border border-[#30363d]/80 rounded p-3 flex items-center justify-between">
        {/* Quick color buttons */}
        <div className="flex items-center gap-1.5">
          {RGB_COLORS.map((col, idx) => {
            const isSelected = idx === currentColorIndex;
            return (
              <button
                key={col.name}
                onClick={() => {
                  setSelectedColorIndex(idx);
                  onSetRgbColor(idx);
                }}
                className={`w-5 h-5 rounded-full border transition-transform relative ${
                  isSelected
                    ? 'border-white scale-125 shadow-lg'
                    : 'border-[#30363d] hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: col.hex,
                  boxShadow: isSelected && col.hex !== '#161b22' ? `0 0 12px ${col.hex}` : undefined,
                }}
                title={`Switch to ${col.name}`}
              />
            );
          })}
        </div>

        {/* GPIO Pin State indicators (Active Low logic as in STM32 hardware) */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e]">
          <span
            className={`px-1.5 py-0.5 rounded border ${
              currentColor.rPin
                ? 'bg-[#FF3366]/20 border-[#FF3366] text-[#FF3366]'
                : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
            }`}
          >
            R:{currentColor.rPin ? '0' : '1'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              currentColor.gPin
                ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]'
                : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
            }`}
          >
            G:{currentColor.gPin ? '0' : '1'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              currentColor.bPin
                ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
            }`}
          >
            B:{currentColor.bPin ? '0' : '1'}
          </span>
        </div>
      </div>
    </div>
  );
};
