import React from 'react';
import { NesHeaderData, KNOWN_MAPPERS, NES_EXPANSION_DEVICES } from '../types/nes';
import { buildHeaderBytes } from '../utils/nesHeader';

interface HardwareControlsProps {
  header: NesHeaderData;
  onChangeHeader: (newHeaderBytes: Uint8Array) => void;
}

const PRG_SIZES = [
  { label: '16 KB (1 x 16K)', bytes: 16384 },
  { label: '32 KB (2 x 16K - NROM-256)', bytes: 32768 },
  { label: '64 KB (4 x 16K)', bytes: 65536 },
  { label: '128 KB (8 x 16K - UNROM/MMC1)', bytes: 131072 },
  { label: '256 KB (16 x 16K - MMC1/MMC3)', bytes: 262144 },
  { label: '384 KB (24 x 16K - SMB3)', bytes: 393216 },
  { label: '512 KB (32 x 16K - Kirby)', bytes: 524288 },
  { label: '1024 KB / 1 MB (64 x 16K)', bytes: 1048576 },
  { label: '2048 KB / 2 MB (128 x 16K)', bytes: 2097152 },
  { label: '4096 KB / 4 MB (256 x 16K)', bytes: 4194304 },
];

const CHR_SIZES = [
  { label: '0 KB (Uses Board CHR-RAM)', bytes: 0 },
  { label: '8 KB (1 x 8K - NROM/Standard)', bytes: 8192 },
  { label: '16 KB (2 x 8K)', bytes: 16384 },
  { label: '32 KB (4 x 8K - CNROM)', bytes: 32768 },
  { label: '64 KB (8 x 8K)', bytes: 65536 },
  { label: '128 KB (16 x 8K - MMC3/MMC5)', bytes: 131072 },
  { label: '256 KB (32 x 8K)', bytes: 262144 },
  { label: '512 KB (64 x 8K)', bytes: 524288 },
];

export const HardwareControls: React.FC<HardwareControlsProps> = ({
  header,
  onChangeHeader,
}) => {
  const isNes2 = header.format === 'nes2';

  const updateField = (partial: Partial<NesHeaderData>) => {
    const updated = buildHeaderBytes({
      ...header,
      ...partial,
    });
    onChangeHeader(updated);
  };

  const currentMapperInfo = KNOWN_MAPPERS.find((m) => m.number === header.mapper);

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f2533]">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
          Hardware & Board Architecture
        </h3>

        {/* Format Toggle */}
        <div className="flex items-center gap-1 bg-[#0b0d13] p-1 rounded-lg border border-[#1e2330]">
          <button
            onClick={() => updateField({ format: 'ines1' })}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              !isNes2 ? 'bg-[#1e2433] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            iNES 1.0
          </button>
          <button
            onClick={() => updateField({ format: 'nes2' })}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              isNes2 ? 'bg-red-950/70 border border-red-800/60 text-red-300 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            NES 2.0 (Extended)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mapper Selection */}
        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            Mapper Number (0 - 4095)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={4095}
              value={header.mapper}
              onChange={(e) => updateField({ mapper: parseInt(e.target.value, 10) || 0 })}
              className="w-24 bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
            />
            <select
              aria-label="Mapper Preset"
              value={header.mapper}
              onChange={(e) => updateField({ mapper: parseInt(e.target.value, 10) })}
              className="flex-1 bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500 truncate"
            >
              {KNOWN_MAPPERS.map((m) => (
                <option key={m.number} value={m.number}>
                  {m.number}: {m.name}
                </option>
              ))}
            </select>
          </div>
          {currentMapperInfo && (
            <p className="text-[11px] text-neutral-400 mt-1 truncate">
              {currentMapperInfo.name} · {currentMapperInfo.boardClass}
            </p>
          )}
        </div>

        {/* Submapper (NES 2.0 only) */}
        {isNes2 ? (
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              Submapper Variant (0 - 15)
            </label>
            <input
              type="number"
              min={0}
              max={15}
              value={header.submapper}
              onChange={(e) => updateField({ submapper: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Specifies board revisions (e.g. MMC3 wiring quirks)
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              TV System (iNES 1.0)
            </label>
            <select
              aria-label="TV System"
              value={header.tvSystem}
              onChange={(e) => updateField({ tvSystem: e.target.value as any })}
              className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500"
            >
              <option value="ntsc">NTSC (60 Hz - USA / Japan)</option>
              <option value="pal">PAL (50 Hz - Europe / Australia)</option>
            </select>
            <p className="text-[11px] text-neutral-400 mt-1">
              Byte 9 bit 0 timing mode
            </p>
          </div>
        )}

        {/* PRG ROM Size */}
        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            PRG-ROM Size
          </label>
          <select
            aria-label="PRG-ROM Size"
            value={header.prgRomBytes}
            onChange={(e) => updateField({ prgRomBytes: parseInt(e.target.value, 10) })}
            className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500"
          >
            {PRG_SIZES.map((s) => (
              <option key={s.bytes} value={s.bytes}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-400 mt-1">
            {header.prgRomBytes.toLocaleString()} bytes ({header.prgRomBytes / 16384} x 16KB units)
          </p>
        </div>

        {/* CHR ROM Size */}
        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            CHR-ROM Size
          </label>
          <select
            aria-label="CHR-ROM Size"
            value={header.chrRomBytes}
            onChange={(e) => updateField({ chrRomBytes: parseInt(e.target.value, 10) })}
            className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500"
          >
            {CHR_SIZES.map((s) => (
              <option key={s.bytes} value={s.bytes}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-400 mt-1">
            {header.chrRomBytes === 0
              ? 'Board contains CHR-RAM (tiles loaded dynamically)'
              : `${header.chrRomBytes.toLocaleString()} bytes (${header.chrRomBytes / 8192} x 8KB units)`}
          </p>
        </div>

        {/* Mirroring */}
        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            Nametable Mirroring
          </label>
          <select
            aria-label="Nametable Mirroring"
            value={header.mirroring}
            onChange={(e) => updateField({ mirroring: e.target.value as any })}
            className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500"
          >
            <option value="horizontal">Horizontal (Vertical Arrangement)</option>
            <option value="vertical">Vertical (Horizontal Arrangement)</option>
            <option value="four_screen">Four-Screen VRAM Layout</option>
            <option value="single_screen">Single-Screen Mirroring</option>
          </select>
          <p className="text-[11px] text-neutral-400 mt-1">
            Controls CIRAM A10 wiring on cartridge
          </p>
        </div>

        {/* TV Timing (NES 2.0) */}
        {isNes2 && (
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              CPU/PPU Timing (NES 2.0)
            </label>
            <select
              aria-label="CPU/PPU Timing"
              value={header.tvSystem}
              onChange={(e) => updateField({ tvSystem: e.target.value as any })}
              className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500"
            >
              <option value="ntsc">RP2A03 (NTSC NES - 60 Hz)</option>
              <option value="pal">RP2A07 (PAL NES - 50 Hz)</option>
              <option value="dual">Universal / Multi-region</option>
              <option value="dendy">UA6538 (Dendy Famiclone)</option>
            </select>
            <p className="text-[11px] text-neutral-400 mt-1">
              Byte 12 timing specification
            </p>
          </div>
        )}

        {/* Expansion Device (NES 2.0) */}
        {isNes2 && (
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              Default Expansion Device
            </label>
            <select
              aria-label="Default Expansion Device"
              value={header.expansionDevice}
              onChange={(e) => updateField({ expansionDevice: parseInt(e.target.value, 10) })}
              className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-red-500 truncate"
            >
              {NES_EXPANSION_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-400 mt-1">
              Byte 15 default controller / peripheral
            </p>
          </div>
        )}
      </div>

      {/* Checkbox feature toggles */}
      <div className="mt-4 pt-3 border-t border-[#1c2230] flex flex-wrap gap-4 text-xs font-mono">
        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={header.battery}
            onChange={(e) => updateField({ battery: e.target.checked })}
            className="rounded bg-[#0a0c11] border-[#252b3b] text-red-600 focus:ring-0"
          />
          <span>Battery-Backed PRG-RAM ($6000-$7FFF)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={header.trainer}
            onChange={(e) => updateField({ trainer: e.target.checked })}
            className="rounded bg-[#0a0c11] border-[#252b3b] text-red-600 focus:ring-0"
          />
          <span>512-Byte Trainer ($7000-$71FF)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={header.vsUnisystem}
            onChange={(e) => updateField({ vsUnisystem: e.target.checked })}
            className="rounded bg-[#0a0c11] border-[#252b3b] text-red-600 focus:ring-0"
          />
          <span>VS Unisystem Arcade Cartridge</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={header.playChoice10}
            onChange={(e) => updateField({ playChoice10: e.target.checked })}
            className="rounded bg-[#0a0c11] border-[#252b3b] text-red-600 focus:ring-0"
          />
          <span>PlayChoice-10 Arcade Cartridge</span>
        </label>
      </div>
    </div>
  );
};
