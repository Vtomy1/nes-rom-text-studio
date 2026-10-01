import React from 'react';
import { NesHeaderData } from '../types/nes';

interface HexVisualizerProps {
  header: NesHeaderData;
  selectedByteIndex: number;
  onSelectByte: (index: number) => void;
  onByteChange: (index: number, value: number) => void;
}

const BYTE_DEFINITIONS: { name: string; tag: string; color: string; desc: string }[] = [
  { name: 'Byte 0', tag: 'MAGIC', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400', desc: "ASCII 'N' (0x4E)" },
  { name: 'Byte 1', tag: 'MAGIC', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400', desc: "ASCII 'E' (0x45)" },
  { name: 'Byte 2', tag: 'MAGIC', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400', desc: "ASCII 'S' (0x53)" },
  { name: 'Byte 3', tag: 'MAGIC', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400', desc: 'MS-DOS EOF (0x1A)' },
  { name: 'Byte 4', tag: 'PRG ROM', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', desc: 'PRG ROM size (16KB units)' },
  { name: 'Byte 5', tag: 'CHR ROM', color: 'border-teal-500/40 bg-teal-500/10 text-teal-400', desc: 'CHR ROM size (8KB units, 0=RAM)' },
  { name: 'Byte 6', tag: 'FLAGS 6', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400', desc: 'Mapper D0-D3, Mirroring, Battery, Trainer' },
  { name: 'Byte 7', tag: 'FLAGS 7', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400', desc: 'Mapper D4-D7, NES 2.0 id, VS, PlayChoice' },
  { name: 'Byte 8', tag: 'FLAGS 8', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400', desc: 'NES2: Mapper D8-D11 & Submapper / iNES: PRG RAM' },
  { name: 'Byte 9', tag: 'FLAGS 9', color: 'border-violet-500/40 bg-violet-500/10 text-violet-400', desc: 'NES2: PRG/CHR ROM MSB / iNES: TV System' },
  { name: 'Byte 10', tag: 'FLAGS 10', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', desc: 'NES2: PRG-RAM shift counts (vol/nvram)' },
  { name: 'Byte 11', tag: 'FLAGS 11', color: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400', desc: 'NES2: CHR-RAM shift counts (vol/nvram)' },
  { name: 'Byte 12', tag: 'FLAGS 12', color: 'border-rose-500/40 bg-rose-500/10 text-rose-400', desc: 'NES2: CPU/PPU Timing (NTSC/PAL/Dendy)' },
  { name: 'Byte 13', tag: 'FLAGS 13', color: 'border-neutral-500/40 bg-neutral-500/10 text-neutral-400', desc: 'NES2: Extended console type' },
  { name: 'Byte 14', tag: 'FLAGS 14', color: 'border-neutral-500/40 bg-neutral-500/10 text-neutral-400', desc: 'NES2: Misc ROMs count' },
  { name: 'Byte 15', tag: 'FLAGS 15', color: 'border-neutral-500/40 bg-neutral-500/10 text-neutral-400', desc: 'NES2: Default expansion device' },
];

export const HexVisualizer: React.FC<HexVisualizerProps> = ({
  header,
  selectedByteIndex,
  onSelectByte,
  onByteChange,
}) => {
  const bytes = header.bytes;

  const handleHexInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') return;
    const num = parseInt(val, 16);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      onByteChange(index, num);
    }
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#1f2533] gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            16-Byte Header Memory Matrix ($0000 - $000F)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Click any byte cell to inspect its bitfield structure and hardware function.
          </p>
        </div>

        {/* Quick specs overview */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-[#1a202c] border border-[#2d3748] text-neutral-300">
            {header.format === 'nes2' ? 'NES 2.0' : 'iNES 1.0'}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1a202c] border border-[#2d3748] text-emerald-400">
            Mapper {header.mapper}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1a202c] border border-[#2d3748] text-sky-400">
            PRG: {header.prgRomBytes / 1024}K
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1a202c] border border-[#2d3748] text-teal-400">
            CHR: {header.chrRomBytes / 1024}K
          </span>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
        {Array.from({ length: 16 }).map((_, idx) => {
          const byteVal = bytes[idx];
          const isSelected = selectedByteIndex === idx;
          const def = BYTE_DEFINITIONS[idx];
          const hexStr = byteVal.toString(16).toUpperCase().padStart(2, '0');
          const asciiChar = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '·';

          return (
            <div
              key={idx}
              onClick={() => onSelectByte(idx)}
              className={`relative cursor-pointer rounded-lg p-2 flex flex-col items-center justify-between border transition-all select-none ${
                isSelected
                  ? 'border-red-500 bg-[#251f28] shadow-md shadow-red-950/50 ring-1 ring-red-500'
                  : 'border-[#222836] bg-[#161a24] hover:border-[#384259] hover:bg-[#1b212e]'
              }`}
            >
              {/* Byte Offset */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>${idx.toString(16).toUpperCase().padStart(2, '0')}</span>
                <span className="text-[9px] text-neutral-400">{asciiChar}</span>
              </div>

              {/* Hex Value */}
              <div className="my-0.5">
                <span
                  className={`text-lg font-mono font-bold tracking-wider ${
                    isSelected ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {hexStr}
                </span>
              </div>

              {/* Functional Tag */}
              <span className={`text-[9px] font-mono font-medium px-1 py-0.2 rounded mt-1 truncate max-w-full ${def.color}`}>
                {def.tag}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick continuous hex bar with copy option */}
      <div className="mt-4 pt-3 border-t border-[#1c2230] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-neutral-400 text-[11px] shrink-0">RAW HEX:</span>
          <code className="text-neutral-300 font-mono tracking-widest bg-[#0b0d13] px-2.5 py-1 rounded border border-[#1e2330]">
            {Array.from(bytes)
              .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
              .join(' ')}
          </code>
        </div>
        <div className="text-[11px] text-neutral-400">
          Selected Byte: <span className="text-white font-bold">${selectedByteIndex.toString(16).toUpperCase().padStart(2, '0')}</span> (0x{bytes[selectedByteIndex].toString(16).toUpperCase().padStart(2, '0')} · {bytes[selectedByteIndex]} dec · %{bytes[selectedByteIndex].toString(2).padStart(8, '0')}b)
        </div>
      </div>
    </div>
  );
};
