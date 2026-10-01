import React from 'react';
import { NesHeaderData } from '../types/nes';

interface BitfieldEditorProps {
  header: NesHeaderData;
  selectedByteIndex: number;
  onByteChange: (index: number, val: number) => void;
}

interface BitDescription {
  bit: number;
  label: string;
  desc: string;
}

function getByteDetails(
  byteIndex: number,
  header: NesHeaderData
): {
  title: string;
  purpose: string;
  bits: BitDescription[];
} {
  const isNes2 = header.format === 'nes2';

  switch (byteIndex) {
    case 0:
      return {
        title: "Byte 0: Constant 'N' ($4E)",
        purpose: 'First byte of magic identification string "NES\\x1A". Must be 0x4E (ASCII 78).',
        bits: [
          { bit: 7, label: '0', desc: 'ASCII 78 bit 7 (0)' },
          { bit: 6, label: '1', desc: 'ASCII 78 bit 6 (1)' },
          { bit: 5, label: '0', desc: 'ASCII 78 bit 5 (0)' },
          { bit: 4, label: '0', desc: 'ASCII 78 bit 4 (0)' },
          { bit: 3, label: '1', desc: 'ASCII 78 bit 3 (1)' },
          { bit: 2, label: '1', desc: 'ASCII 78 bit 2 (1)' },
          { bit: 1, label: '1', desc: 'ASCII 78 bit 1 (1)' },
          { bit: 0, label: '0', desc: 'ASCII 78 bit 0 (0)' },
        ],
      };
    case 1:
      return {
        title: "Byte 1: Constant 'E' ($45)",
        purpose: 'Second byte of magic identification string. Must be 0x45 (ASCII 69).',
        bits: [
          { bit: 7, label: '0', desc: 'Bit 7 (0)' },
          { bit: 6, label: '1', desc: 'Bit 6 (1)' },
          { bit: 5, label: '0', desc: 'Bit 5 (0)' },
          { bit: 4, label: '0', desc: 'Bit 4 (0)' },
          { bit: 3, label: '0', desc: 'Bit 3 (0)' },
          { bit: 2, label: '1', desc: 'Bit 2 (1)' },
          { bit: 1, label: '0', desc: 'Bit 1 (0)' },
          { bit: 0, label: '1', desc: 'Bit 0 (1)' },
        ],
      };
    case 2:
      return {
        title: "Byte 2: Constant 'S' ($53)",
        purpose: 'Third byte of magic identification string. Must be 0x53 (ASCII 83).',
        bits: [
          { bit: 7, label: '0', desc: 'Bit 7 (0)' },
          { bit: 6, label: '1', desc: 'Bit 6 (1)' },
          { bit: 5, label: '0', desc: 'Bit 5 (0)' },
          { bit: 4, label: '1', desc: 'Bit 4 (1)' },
          { bit: 3, label: '0', desc: 'Bit 3 (0)' },
          { bit: 2, label: '0', desc: 'Bit 2 (0)' },
          { bit: 1, label: '1', desc: 'Bit 1 (1)' },
          { bit: 0, label: '1', desc: 'Bit 0 (1)' },
        ],
      };
    case 3:
      return {
        title: 'Byte 3: MS-DOS EOF Character ($1A)',
        purpose: 'ASCII 26 (Ctrl-Z / End-of-file). Stops MS-DOS "type rom.nes" command from outputting binary garbage.',
        bits: [
          { bit: 7, label: '0', desc: 'Bit 7 (0)' },
          { bit: 6, label: '0', desc: 'Bit 6 (0)' },
          { bit: 5, label: '0', desc: 'Bit 5 (0)' },
          { bit: 4, label: '1', desc: 'Bit 4 (1)' },
          { bit: 3, label: '1', desc: 'Bit 3 (1)' },
          { bit: 2, label: '0', desc: 'Bit 2 (0)' },
          { bit: 1, label: '1', desc: 'Bit 1 (1)' },
          { bit: 0, label: '0', desc: 'Bit 0 (0)' },
        ],
      };
    case 4:
      return {
        title: 'Byte 4: PRG-ROM Size LSB',
        purpose: 'Size of PRG-ROM in 16,384 byte ($4000 / 16 KB) units. In NES 2.0, combined with Byte 9 bits 0-3.',
        bits: Array.from({ length: 8 }).map((_, i) => ({
          bit: 7 - i,
          label: `D${7 - i}`,
          desc: `PRG-ROM unit count bit ${7 - i} (Weight: ${(1 << (7 - i)) * 16} KB)`,
        })),
      };
    case 5:
      return {
        title: 'Byte 5: CHR-ROM Size LSB',
        purpose: 'Size of CHR-ROM in 8,192 byte ($2000 / 8 KB) units. Value 0 means board uses CHR-RAM.',
        bits: Array.from({ length: 8 }).map((_, i) => ({
          bit: 7 - i,
          label: `D${7 - i}`,
          desc: `CHR-ROM unit count bit ${7 - i} (Weight: ${(1 << (7 - i)) * 8} KB)`,
        })),
      };
    case 6:
      return {
        title: 'Byte 6: Flags 6 (Mapper low & Cartridge features)',
        purpose: 'Defines Nametable Mirroring, Battery RAM, 512B Trainer, Four-Screen VRAM, and Mapper bits 0-3.',
        bits: [
          { bit: 7, label: 'Mapper D3', desc: 'Mapper number bit 3' },
          { bit: 6, label: 'Mapper D2', desc: 'Mapper number bit 2' },
          { bit: 5, label: 'Mapper D1', desc: 'Mapper number bit 1' },
          { bit: 4, label: 'Mapper D0', desc: 'Mapper number bit 0' },
          { bit: 3, label: 'Four-Screen', desc: '1: Four-screen VRAM layout (overrides bit 0)' },
          { bit: 2, label: 'Trainer', desc: '1: 512-byte Trainer present at $7000-$71FF' },
          { bit: 1, label: 'Battery', desc: '1: Battery-backed PRG-RAM ($6000-$7FFF) or persistent memory' },
          { bit: 0, label: 'Mirroring', desc: '0: Horizontal (vertical arrangement), 1: Vertical (horizontal arrangement)' },
        ],
      };
    case 7:
      return {
        title: 'Byte 7: Flags 7 (Mapper high & NES 2.0 Identifier)',
        purpose: 'Defines Mapper bits 4-7, VS Unisystem, PlayChoice-10, and NES 2.0 format signature (bits 2-3 = 0b10).',
        bits: [
          { bit: 7, label: 'Mapper D7', desc: 'Mapper number bit 7' },
          { bit: 6, label: 'Mapper D6', desc: 'Mapper number bit 6' },
          { bit: 5, label: 'Mapper D5', desc: 'Mapper number bit 5' },
          { bit: 4, label: 'Mapper D4', desc: 'Mapper number bit 4' },
          { bit: 3, label: 'NES 2.0 D1', desc: 'NES 2.0 identifier bit 1 (must be 1 for NES 2.0)' },
          { bit: 2, label: 'NES 2.0 D0', desc: 'NES 2.0 identifier bit 0 (must be 0 for NES 2.0)' },
          { bit: 1, label: 'PlayChoice-10', desc: '1: PlayChoice-10 arcade game' },
          { bit: 0, label: 'VS System', desc: '1: VS Unisystem arcade game' },
        ],
      };
    case 8:
      return isNes2
        ? {
            title: 'Byte 8: NES 2.0 Mapper bits 8-11 & Submapper',
            purpose: 'Extended 12-bit mapper number and submapper variant (for board revisions).',
            bits: [
              { bit: 7, label: 'Submap D3', desc: 'Submapper number bit 3' },
              { bit: 6, label: 'Submap D2', desc: 'Submapper number bit 2' },
              { bit: 5, label: 'Submap D1', desc: 'Submapper number bit 1' },
              { bit: 4, label: 'Submap D0', desc: 'Submapper number bit 0' },
              { bit: 3, label: 'Mapper D11', desc: 'Mapper number bit 11' },
              { bit: 2, label: 'Mapper D10', desc: 'Mapper number bit 10' },
              { bit: 1, label: 'Mapper D9', desc: 'Mapper number bit 9' },
              { bit: 0, label: 'Mapper D8', desc: 'Mapper number bit 8' },
            ],
          }
        : {
            title: 'Byte 8: iNES 1.0 PRG-RAM Size',
            purpose: 'Size of PRG-RAM in 8,192 byte ($2000 / 8 KB) units. Value 0 infers 8 KB for backward compatibility.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: `D${7 - i}`,
              desc: `PRG-RAM size unit bit ${7 - i}`,
            })),
          };
    case 9:
      return isNes2
        ? {
            title: 'Byte 9: NES 2.0 PRG-ROM & CHR-ROM MSB',
            purpose: 'Upper 4 bits for PRG-ROM and CHR-ROM size multipliers, enabling multi-megabyte ROMs.',
            bits: [
              { bit: 7, label: 'CHR MSB 3', desc: 'CHR-ROM upper bit 11' },
              { bit: 6, label: 'CHR MSB 2', desc: 'CHR-ROM upper bit 10' },
              { bit: 5, label: 'CHR MSB 1', desc: 'CHR-ROM upper bit 9' },
              { bit: 4, label: 'CHR MSB 0', desc: 'CHR-ROM upper bit 8' },
              { bit: 3, label: 'PRG MSB 3', desc: 'PRG-ROM upper bit 11' },
              { bit: 2, label: 'PRG MSB 2', desc: 'PRG-ROM upper bit 10' },
              { bit: 1, label: 'PRG MSB 1', desc: 'PRG-ROM upper bit 9' },
              { bit: 0, label: 'PRG MSB 0', desc: 'PRG-ROM upper bit 8' },
            ],
          }
        : {
            title: 'Byte 9: iNES 1.0 TV System',
            purpose: 'TV System specification (0 = NTSC, 1 = PAL). Bits 1-7 are reserved.',
            bits: [
              ...Array.from({ length: 7 }).map((_, i) => ({
                bit: 7 - i,
                label: 'Reserved',
                desc: 'Reserved bit, should be 0',
              })),
              { bit: 0, label: 'TV System', desc: '0: NTSC (60Hz), 1: PAL (50Hz)' },
            ],
          };
    case 10:
      return isNes2
        ? {
            title: 'Byte 10: NES 2.0 PRG-RAM & PRG-NVRAM Size',
            purpose: 'Shift counts for non-volatile (battery) and volatile PRG-RAM: Size = 64 << count.',
            bits: [
              { bit: 7, label: 'NVRAM D3', desc: 'PRG-NVRAM shift count bit 3' },
              { bit: 6, label: 'NVRAM D2', desc: 'PRG-NVRAM shift count bit 2' },
              { bit: 5, label: 'NVRAM D1', desc: 'PRG-NVRAM shift count bit 1' },
              { bit: 4, label: 'NVRAM D0', desc: 'PRG-NVRAM shift count bit 0' },
              { bit: 3, label: 'RAM D3', desc: 'PRG-RAM shift count bit 3' },
              { bit: 2, label: 'RAM D2', desc: 'PRG-RAM shift count bit 2' },
              { bit: 1, label: 'RAM D1', desc: 'PRG-RAM shift count bit 1' },
              { bit: 0, label: 'RAM D0', desc: 'PRG-RAM shift count bit 0' },
            ],
          }
        : {
            title: 'Byte 10: iNES 1.0 Unused Padding',
            purpose: 'Unofficially used in some archaic emulators for TV system / PRG-RAM; should be 0x00.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Unused / zero padding',
            })),
          };
    case 11:
      return isNes2
        ? {
            title: 'Byte 11: NES 2.0 CHR-RAM & CHR-NVRAM Size',
            purpose: 'Shift counts for volatile and battery CHR-RAM: Size = 64 << count.',
            bits: [
              { bit: 7, label: 'NVRAM D3', desc: 'CHR-NVRAM shift count bit 3' },
              { bit: 6, label: 'NVRAM D2', desc: 'CHR-NVRAM shift count bit 2' },
              { bit: 5, label: 'NVRAM D1', desc: 'CHR-NVRAM shift count bit 1' },
              { bit: 4, label: 'NVRAM D0', desc: 'CHR-NVRAM shift count bit 0' },
              { bit: 3, label: 'RAM D3', desc: 'CHR-RAM shift count bit 3' },
              { bit: 2, label: 'RAM D2', desc: 'CHR-RAM shift count bit 2' },
              { bit: 1, label: 'RAM D1', desc: 'CHR-RAM shift count bit 1' },
              { bit: 0, label: 'RAM D0', desc: 'CHR-RAM shift count bit 0' },
            ],
          }
        : {
            title: 'Byte 11: iNES 1.0 Zero Padding',
            purpose: 'Reserved zero padding byte in standard iNES 1.0.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Reserved zero padding',
            })),
          };
    case 12:
      return isNes2
        ? {
            title: 'Byte 12: NES 2.0 CPU/PPU Timing',
            purpose: 'Specifies hardware timing mode (0=RP2A03 NTSC, 1=RP2A07 PAL, 2=Universal, 3=Dendy).',
            bits: [
              ...Array.from({ length: 6 }).map((_, i) => ({
                bit: 7 - i,
                label: 'Reserved',
                desc: 'Reserved bit (0)',
              })),
              { bit: 1, label: 'Timing D1', desc: 'Timing mode bit 1' },
              { bit: 0, label: 'Timing D0', desc: 'Timing mode bit 0 (0: NTSC, 1: PAL, 2: Multi, 3: Dendy)' },
            ],
          }
        : {
            title: 'Byte 12: iNES 1.0 Zero Padding',
            purpose: 'Reserved zero padding byte in standard iNES 1.0.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Reserved zero padding',
            })),
          };
    case 13:
      return isNes2
        ? {
            title: 'Byte 13: NES 2.0 Extended Console Type',
            purpose: 'Hardware target: Standard NES, Vs. System, PlayChoice-10, Famicom Network System, etc.',
            bits: [
              { bit: 7, label: 'Data D3', desc: 'Console specific data bit 3' },
              { bit: 6, label: 'Data D2', desc: 'Console specific data bit 2' },
              { bit: 5, label: 'Data D1', desc: 'Console specific data bit 1' },
              { bit: 4, label: 'Data D0', desc: 'Console specific data bit 0' },
              { bit: 3, label: 'Type D3', desc: 'Console type bit 3' },
              { bit: 2, label: 'Type D2', desc: 'Console type bit 2' },
              { bit: 1, label: 'Type D1', desc: 'Console type bit 1' },
              { bit: 0, label: 'Type D0', desc: 'Console type bit 0 (0: NES/Famicom, 1: Vs., 2: PC10)' },
            ],
          }
        : {
            title: 'Byte 13: iNES 1.0 Zero Padding',
            purpose: 'Reserved zero padding byte in standard iNES 1.0.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Reserved zero padding',
            })),
          };
    case 14:
      return isNes2
        ? {
            title: 'Byte 14: NES 2.0 Miscellaneous ROMs',
            purpose: 'Indicates presence of auxiliary ROMs (sound chips, character data, BIOS).',
            bits: [
              ...Array.from({ length: 6 }).map((_, i) => ({
                bit: 7 - i,
                label: 'Reserved',
                desc: 'Reserved (0)',
              })),
              { bit: 1, label: 'Misc D1', desc: 'Misc ROM count bit 1' },
              { bit: 0, label: 'Misc D0', desc: 'Misc ROM count bit 0' },
            ],
          }
        : {
            title: 'Byte 14: iNES 1.0 Zero Padding',
            purpose: 'Reserved zero padding byte in standard iNES 1.0.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Reserved zero padding',
            })),
          };
    case 15:
      return isNes2
        ? {
            title: 'Byte 15: NES 2.0 Default Expansion Device',
            purpose: 'Preferred input controller: Standard gamepads (1), Four Score (2), Zapper (3), Vaus paddle (12), etc.',
            bits: [
              { bit: 7, label: 'Reserved', desc: 'Reserved (0)' },
              { bit: 6, label: 'Reserved', desc: 'Reserved (0)' },
              { bit: 5, label: 'Dev D5', desc: 'Device ID bit 5' },
              { bit: 4, label: 'Dev D4', desc: 'Device ID bit 4' },
              { bit: 3, label: 'Dev D3', desc: 'Device ID bit 3' },
              { bit: 2, label: 'Dev D2', desc: 'Device ID bit 2' },
              { bit: 1, label: 'Dev D1', desc: 'Device ID bit 1' },
              { bit: 0, label: 'Dev D0', desc: 'Device ID bit 0' },
            ],
          }
        : {
            title: 'Byte 15: iNES 1.0 Zero Padding',
            purpose: 'Reserved zero padding byte in standard iNES 1.0.',
            bits: Array.from({ length: 8 }).map((_, i) => ({
              bit: 7 - i,
              label: 'Padding',
              desc: 'Reserved zero padding',
            })),
          };
    default:
      return {
        title: `Byte ${byteIndex}`,
        purpose: 'Header byte',
        bits: [],
      };
  }
}

export const BitfieldEditor: React.FC<BitfieldEditorProps> = ({
  header,
  selectedByteIndex,
  onByteChange,
}) => {
  const currentByte = header.bytes[selectedByteIndex];
  const details = getByteDetails(selectedByteIndex, header);

  const toggleBit = (bitPos: number) => {
    const mask = 1 << bitPos;
    const newVal = currentByte ^ mask;
    onByteChange(selectedByteIndex, newVal);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (!val) return;
    const num = parseInt(val, 16);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      onByteChange(selectedByteIndex, num);
    }
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-4 sm:p-5">
      {/* Header and Value editor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1f2533] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-950/70 border border-red-800/60 text-red-300">
              Byte ${selectedByteIndex.toString(16).toUpperCase().padStart(2, '0')}
            </span>
            <h3 className="text-sm font-semibold text-white font-mono">{details.title}</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">{details.purpose}</p>
        </div>

        {/* Value inputs */}
        <div className="flex items-center gap-3 bg-[#0c0e14] px-3 py-2 rounded-lg border border-[#1d2331]">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-neutral-400">HEX:</span>
            <span className="text-red-400 font-bold">$</span>
            <input
              type="text"
              maxLength={2}
              value={currentByte.toString(16).toUpperCase().padStart(2, '0')}
              onChange={handleHexInput}
              aria-label="Byte value in hex"
              className="w-10 bg-[#161a24] text-white font-mono font-bold text-center border border-[#2b3347] rounded px-1 py-0.5 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="h-4 w-px bg-[#222838]" />
          <div className="text-xs font-mono text-neutral-400">
            DEC: <span className="text-neutral-200">{currentByte}</span>
          </div>
          <div className="h-4 w-px bg-[#222838]" />
          <div className="text-xs font-mono text-neutral-400">
            BIN: <span className="text-emerald-400">%{currentByte.toString(2).padStart(8, '0')}</span>
          </div>
        </div>
      </div>

      {/* 8-Bit Interactive Switch Strip */}
      <div className="mb-4">
        <div className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Bitfield Array (Bit 7 down to Bit 0)</span>
          <span className="text-neutral-400">Click bit box to toggle bit (0 ↔ 1)</span>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {details.bits.map((b) => {
            const isSet = (currentByte & (1 << b.bit)) !== 0;
            return (
              <button
                key={b.bit}
                onClick={() => toggleBit(b.bit)}
                className={`flex flex-col items-center justify-between p-2 rounded-lg border transition-all ${
                  isSet
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400 shadow-sm shadow-emerald-950/40'
                    : 'bg-[#151923] border-[#222837] text-neutral-400 hover:border-[#333d52] hover:bg-[#1a202c]'
                }`}
              >
                <span className="text-[10px] font-mono text-neutral-400">Bit {b.bit}</span>
                <span
                  className={`text-base font-mono font-bold my-1 ${
                    isSet ? 'text-emerald-300' : 'text-neutral-400'
                  }`}
                >
                  {isSet ? '1' : '0'}
                </span>
                <span className="text-[9px] font-mono truncate max-w-full text-neutral-400">
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed breakdown list */}
      <div className="bg-[#0e1017] rounded-lg border border-[#1b202c] divide-y divide-[#171b26] text-xs">
        {details.bits.map((b) => {
          const isSet = (currentByte & (1 << b.bit)) !== 0;
          return (
            <div key={b.bit} className="p-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                    isSet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isSet ? '1' : '0'}
                </span>
                <div className="font-mono text-neutral-300 font-medium">
                  Bit {b.bit} [{b.label}]
                </div>
              </div>
              <div className="text-neutral-400 text-right font-sans text-xs">
                {b.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
