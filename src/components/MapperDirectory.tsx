import React, { useState } from 'react';
import { Search, ArrowRight, Cpu, Layers } from 'lucide-react';
import { KNOWN_MAPPERS } from '../types/nes';
import { buildHeaderBytes } from '../utils/nesHeader';

interface MapperDirectoryProps {
  onSelectMapper: (headerBytes: Uint8Array) => void;
}

export const MapperDirectory: React.FC<MapperDirectoryProps> = ({ onSelectMapper }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMappers = KNOWN_MAPPERS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.number.toString().includes(searchTerm) ||
      m.boardClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.notableGames.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApply = (mapperNum: number) => {
    const bytes = buildHeaderBytes({
      mapper: mapperNum,
      prgRomBytes: mapperNum === 0 ? 32768 : 131072,
      chrRomBytes: mapperNum === 2 || mapperNum === 7 ? 0 : 65536,
      mirroring: mapperNum === 7 ? 'single_screen' : 'vertical',
      battery: mapperNum === 1 || mapperNum === 5,
    });
    onSelectMapper(bytes);
  };

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="bg-[#12151e] border border-[#212736] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2533]">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              NES / Famicom Mapper Architecture Catalog
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Search over iconic NES ASIC mappers and discrete logic boards to inspect registers and memory topologies.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mapper #, game, chip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Mapper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {filteredMappers.map((mapper) => (
            <div
              key={mapper.number}
              className="bg-[#0e1118] border border-[#1e2330] rounded-lg p-4 flex flex-col justify-between hover:border-[#333d52] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/60 border border-amber-800/50 text-amber-300">
                      MAPPER {mapper.number}
                    </span>
                    <h3 className="text-sm font-semibold text-white font-mono">{mapper.name}</h3>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-neutral-400 mb-2 truncate">
                  Boards: <span className="text-neutral-300">{mapper.boardClass}</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                  {mapper.description}
                </p>

                <div className="mb-3">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">
                    Notable Games
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mapper.notableGames.map((game, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#161a24] text-neutral-300 border border-[#232938]"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApply(mapper.number)}
                className="w-full mt-2 py-1.5 px-3 rounded text-xs font-mono font-semibold text-white bg-[#1b212e] hover:bg-red-600 border border-[#2b3447] hover:border-red-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Load into Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
