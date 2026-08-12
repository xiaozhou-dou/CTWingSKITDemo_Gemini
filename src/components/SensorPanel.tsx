import React from 'react';
import { Thermometer, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { SensorData } from '../types';

interface SensorPanelProps {
  sensorData: SensorData | null;
  history: SensorData[];
}

export const SensorPanel: React.FC<SensorPanelProps> = ({ sensorData, history }) => {
  const isError = sensorData?.isError ?? false;
  const tempStr = isError ? 'ERR' : sensorData ? sensorData.temperature.toFixed(1) : '--.-';
  const humStr = isError ? 'ERR' : sensorData ? sensorData.humidity.toFixed(1) : '--.-';

  // Compute stats
  const validHistory = history.filter(h => !h.isError);
  const minTemp = validHistory.length > 0 ? Math.min(...validHistory.map(h => h.temperature)) : null;
  const maxTemp = validHistory.length > 0 ? Math.max(...validHistory.map(h => h.temperature)) : null;
  const minHum = validHistory.length > 0 ? Math.min(...validHistory.map(h => h.humidity)) : null;
  const maxHum = validHistory.length > 0 ? Math.max(...validHistory.map(h => h.humidity)) : null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 relative shadow-md flex flex-col justify-between h-full">
      {/* Title with badge */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-[#00E5FF] font-bold text-xs md:text-sm tracking-wider uppercase">
            CORE SENSORS (HTS221)
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
          I2C: 0xBE
        </span>
      </div>

      {/* Main Digital Readouts */}
      <div className="grid grid-cols-1 gap-4 py-2">
        {/* Temperature Block */}
        <div className="bg-[#0d1117] border border-[#30363d]/80 rounded-md p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#FF3366]/10 border border-[#FF3366]/30">
              <Thermometer className="w-5 h-5 text-[#FF3366]" />
            </div>
            <div>
              <span className="text-[#8b949e] font-mono font-bold text-xs tracking-wider">TEMP</span>
              <div className="text-[10px] text-[#8b949e]">Ambient Thermal</div>
            </div>
          </div>

          <div className="flex items-baseline font-mono w-[140px]">
            <span
              id="lbl-temperature"
              className={`inline-block w-[110px] text-left text-3xl md:text-4xl font-bold tracking-tight ${
                isError ? 'text-[#FF3366] animate-pulse' : 'text-[#FF3366]'
              }`}
            >
              {tempStr}
            </span>
            {!isError && <span className="inline-block w-[30px] text-left text-xl font-bold text-[#FF3366]">℃</span>}
          </div>
        </div>

        {/* Humidity Block */}
        <div className="bg-[#0d1117] border border-[#30363d]/80 rounded-md p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30">
              <Droplets className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div>
              <span className="text-[#8b949e] font-mono font-bold text-xs tracking-wider">HUM</span>
              <div className="text-[10px] text-[#8b949e]">Relative Humidity</div>
            </div>
          </div>

          <div className="flex items-baseline font-mono w-[140px]">
            <span
              id="lbl-humidity"
              className={`inline-block w-[110px] text-left text-3xl md:text-4xl font-bold tracking-tight ${
                isError ? 'text-[#FF3366] animate-pulse' : 'text-[#00E5FF]'
              }`}
            >
              {humStr}
            </span>
            {!isError && <span className="inline-block w-[30px] text-left text-xl font-bold text-[#00E5FF]">%</span>}
          </div>
        </div>
      </div>

      {/* Sensor fault alert or stats */}
      {isError ? (
        <div className="mt-2 bg-[#da3633]/20 border border-[#da3633] text-[#f85149] px-3 py-1.5 rounded text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-mono font-semibold">HTS221 I2C Comm Failure! Sensor disconnected or timeout.</span>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#30363d]/40">
          <div>
            <span>TEMP RANGE: </span>
            <span className="text-[#c9d1d9]">
              {minTemp !== null ? `${minTemp.toFixed(1)}°` : '--'} ~ {maxTemp !== null ? `${maxTemp.toFixed(1)}°C` : '--'}
            </span>
          </div>
          <div className="text-right">
            <span>HUM RANGE: </span>
            <span className="text-[#c9d1d9]">
              {minHum !== null ? `${minHum.toFixed(1)}%` : '--'} ~ {maxHum !== null ? `${maxHum.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
