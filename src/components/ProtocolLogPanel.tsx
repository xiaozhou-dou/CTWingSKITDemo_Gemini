import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, Copy, Check, ArrowDown, Filter } from 'lucide-react';
import { ProtocolLogEntry } from '../types';

interface ProtocolLogPanelProps {
  logs: ProtocolLogEntry[];
  onClearLogs: () => void;
}

export const ProtocolLogPanel: React.FC<ProtocolLogPanelProps> = ({ logs, onClearLogs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterTag, setFilterTag] = useState<string>('ALL');

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.tag}] ${l.message} ${l.rawHex ? `(${l.rawHex})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = filterTag === 'ALL' ? logs : logs.filter((l) => l.tag === filterTag);

  const getTagColor = (tag: ProtocolLogEntry['tag']) => {
    switch (tag) {
      case 'SYS':
        return 'text-[#00E5FF]';
      case 'TX':
        return 'text-[#FF9900]';
      case 'RX':
        return 'text-[#00FF66]';
      case 'ERR':
        return 'text-[#FF3366]';
      default:
        return 'text-[#c9d1d9]';
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-md flex flex-col h-full min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-[#00E5FF] font-bold text-xs md:text-sm tracking-wider uppercase">
            PROTOCOL LOG
          </h2>
          <span className="text-[10px] font-mono text-[#8b949e]">({logs.length})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tag filter */}
          <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-[10px] font-mono">
            <Filter className="w-3 h-3 text-[#8b949e] mr-1" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-transparent text-[#8b949e] focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL</option>
              <option value="SYS">SYS</option>
              <option value="TX">TX</option>
              <option value="RX">RX</option>
              <option value="ERR">ERR</option>
            </select>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear button */}
          <button
            id="btn-clear-protocol-log"
            onClick={onClearLogs}
            className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] font-mono font-bold px-2 py-1 rounded border border-[#30363d] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">CLEAR LOG</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={scrollRef}
        className="flex-1 bg-[#010409] border border-[#30363d] rounded p-3 font-mono text-xs overflow-y-auto space-y-1 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-[#8b949e] italic py-8 text-center">
            No protocol logs recorded yet. Connect to start session.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="leading-relaxed break-words hover:bg-[#161b22]/40 px-1 py-0.5 rounded">
              <span className="text-[#8b949e] text-[11px] mr-2">[{log.timestamp}]</span>
              <span className={`font-bold mr-1.5 ${getTagColor(log.tag)}`}>[{log.tag}]</span>
              <span className="text-[#c9d1d9]">{log.message}</span>
              {log.rawHex && (
                <span className="text-[#8b949e] ml-2 text-[11px] font-mono">({log.rawHex})</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] pt-2 px-1">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-[#30363d] text-[#00E5FF] focus:ring-0 bg-[#0d1117]"
          />
          <span>Auto-scroll to bottom</span>
        </label>
        <span>Protocol: 0x5A 0xA5 Frame</span>
      </div>
    </div>
  );
};
