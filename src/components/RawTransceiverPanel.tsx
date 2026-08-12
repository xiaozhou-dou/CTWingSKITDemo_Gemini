import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Binary, Sparkles, AlertCircle } from 'lucide-react';
import { bytesToHex, hexToBytes, buildProtocolFrame } from '../utils/protocol';

interface RawTransceiverPanelProps {
  rawRxBytes: Uint8Array[];
  onClearRx: () => void;
  onTransmitRaw: (bytes: Uint8Array) => void;
}

export const RawTransceiverPanel: React.FC<RawTransceiverPanelProps> = ({
  rawRxBytes,
  onClearRx,
  onTransmitRaw,
}) => {
  const [rxFormat, setRxFormat] = useState<'HEX' | 'ASCII'>('HEX');
  const [txFormat, setTxFormat] = useState<'HEX' | 'ASCII'>('HEX');
  const [txInput, setTxInput] = useState<string>('5A A5 02 0A 01 09');
  const [txError, setTxError] = useState<string | null>(null);

  const rxScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rxScrollRef.current) {
      rxScrollRef.current.scrollTop = rxScrollRef.current.scrollHeight;
    }
  }, [rawRxBytes]);

  const handleSend = () => {
    setTxError(null);
    if (!txInput.trim()) return;

    try {
      let dataToSend: Uint8Array;
      if (txFormat === 'HEX') {
        dataToSend = hexToBytes(txInput);
      } else {
        dataToSend = new TextEncoder().encode(txInput);
      }
      onTransmitRaw(dataToSend);
    } catch (err: any) {
      setTxError(err.message || 'Invalid format');
    }
  };

  // Convert raw rx byte arrays to display text
  const formatRxData = () => {
    if (rawRxBytes.length === 0) return '';
    return rawRxBytes
      .map((chunk) => {
        if (rxFormat === 'HEX') {
          return bytesToHex(chunk);
        } else {
          return new TextDecoder().decode(chunk);
        }
      })
      .join(' ');
  };

  const applyPreset = (cmd: number, payload: number[]) => {
    const frame = buildProtocolFrame(cmd, payload);
    const hex = bytesToHex(frame);
    setTxFormat('HEX');
    setTxInput(hex);
    setTxError(null);
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-md flex flex-col h-full min-h-[300px]">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-[#00E5FF] font-bold text-xs md:text-sm tracking-wider uppercase">
            RAW TRANSCEIVER (LOOPBACK TEST)
          </h2>
        </div>
      </div>

      {/* RX Section */}
      <div className="flex-1 flex flex-col mb-3">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[#a5b4fc] font-bold">RX DATA:</span>
            <div className="flex items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer text-[#a5b4fc]">
                <input
                  type="radio"
                  name="rx-format"
                  value="ASCII"
                  checked={rxFormat === 'ASCII'}
                  onChange={() => setRxFormat('ASCII')}
                  className="text-[#00E5FF] focus:ring-0 bg-[#0d1117]"
                />
                <span>ASCII</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[#a5b4fc]">
                <input
                  type="radio"
                  name="rx-format"
                  value="HEX"
                  checked={rxFormat === 'HEX'}
                  onChange={() => setRxFormat('HEX')}
                  className="text-[#00E5FF] focus:ring-0 bg-[#0d1117]"
                />
                <span>HEX</span>
              </label>
            </div>
          </div>

          <button
            id="btn-clear-rx"
            onClick={onClearRx}
            className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#30363d] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR RX</span>
          </button>
        </div>

        <div
          ref={rxScrollRef}
          className="flex-1 bg-[#010409] border border-[#30363d] rounded p-2.5 font-mono text-xs text-[#E5E5E5] overflow-y-auto min-h-[90px] break-all select-text"
        >
          {rawRxBytes.length === 0 ? (
            <span className="text-[#8b949e] italic">No raw bytes received yet.</span>
          ) : (
            formatRxData()
          )}
        </div>
      </div>

      {/* TX Section */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[#a5b4fc] font-bold">TX DATA:</span>
            <div className="flex items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer text-[#a5b4fc]">
                <input
                  type="radio"
                  name="tx-format"
                  value="ASCII"
                  checked={txFormat === 'ASCII'}
                  onChange={() => setTxFormat('ASCII')}
                  className="text-[#00E5FF] focus:ring-0 bg-[#0d1117]"
                />
                <span>ASCII</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[#a5b4fc]">
                <input
                  type="radio"
                  name="tx-format"
                  value="HEX"
                  checked={txFormat === 'HEX'}
                  onChange={() => setTxFormat('HEX')}
                  className="text-[#00E5FF] focus:ring-0 bg-[#0d1117]"
                />
                <span>HEX</span>
              </label>
            </div>
          </div>

          {/* Quick Presets Dropdown/Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyPreset(0x0a, [0x01])}
              className="text-[9px] font-mono bg-[#21262d] hover:bg-[#30363d] text-[#00FF66] px-1.5 py-0.5 rounded border border-[#30363d]"
              title="Set Motor Forward"
            >
              FWD
            </button>
            <button
              onClick={() => applyPreset(0x0a, [0x00])}
              className="text-[9px] font-mono bg-[#21262d] hover:bg-[#30363d] text-[#FF3366] px-1.5 py-0.5 rounded border border-[#30363d]"
              title="Set Motor Stop"
            >
              STOP
            </button>
            <button
              onClick={() => applyPreset(0x0b, [0x06])}
              className="text-[9px] font-mono bg-[#21262d] hover:bg-[#30363d] text-[#00E5FF] px-1.5 py-0.5 rounded border border-[#30363d]"
              title="Set RGB Cyan"
            >
              RGB:CYAN
            </button>
            <button
              onClick={() => applyPreset(0x0c, [0x50])}
              className="text-[9px] font-mono bg-[#21262d] hover:bg-[#30363d] text-[#FFDD00] px-1.5 py-0.5 rounded border border-[#30363d]"
              title="Set Speed 80%"
            >
              SPD:80%
            </button>
          </div>
        </div>

        {/* Input box */}
        <textarea
          id="txt-raw-tx-input"
          value={txInput}
          onChange={(e) => {
            setTxInput(e.target.value);
            setTxError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSend();
            }
          }}
          rows={2}
          placeholder="Enter hex bytes (e.g. 5A A5 02 0A 01 09) or ASCII text..."
          className="w-full bg-[#0d1117] border border-[#005cc5] rounded p-2 text-xs font-mono text-[#00E5FF] focus:border-[#00E5FF] focus:outline-none resize-none mb-2"
        />

        {txError && (
          <div className="text-[11px] text-[#FF3366] flex items-center gap-1 font-mono mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{txError}</span>
          </div>
        )}

        <button
          id="btn-transmit-raw"
          onClick={handleSend}
          className="w-full bg-[#005cc5] hover:bg-[#0366d6] text-white text-xs font-mono font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 shadow"
        >
          <Send className="w-3.5 h-3.5" />
          <span>TRANSMIT RAW DATA</span>
        </button>
      </div>
    </div>
  );
};
