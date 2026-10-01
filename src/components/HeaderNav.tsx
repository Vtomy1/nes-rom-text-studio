import React from 'react';
import { Download, Cpu, HardDrive, FileCode, Wrench, Sparkles } from 'lucide-react';
import { PRESET_HEADERS } from '../types/nes';

interface HeaderNavProps {
  activeTab: 'studio' | 'mappers' | 'patcher' | 'inscriber';
  onTabChange: (tab: 'studio' | 'mappers' | 'patcher' | 'inscriber') => void;
  onSelectPreset: (bytes: number[]) => void;
  onDownloadBin: () => void;
  onDownloadSkeletonRom: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  onSelectPreset,
  onDownloadBin,
  onDownloadSkeletonRom,
}) => {
  return (
    <header className="border-b border-[#222734] bg-[#11141c]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-950/40 text-white font-mono font-bold text-sm tracking-wider">
            NES
          </div>
          <span className="text-base font-bold tracking-tight text-white font-mono">
            NES ROM Header Studio
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0b0d13] p-1 rounded-lg border border-[#1e2330]">
          <button
            onClick={() => onTabChange('studio')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-[#1e2433] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            Header Studio
          </button>
          <button
            onClick={() => onTabChange('mappers')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'mappers'
                ? 'bg-[#1e2433] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            Mapper Catalog
          </button>
          <button
            onClick={() => onTabChange('patcher')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'patcher'
                ? 'bg-[#1e2433] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            ROM Injector & Fixer
          </button>
          <button
            onClick={() => onTabChange('inscriber')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inscriber'
                ? 'bg-[#1e2433] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            ASCII Inscriber
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="hidden sm:block">
            <select
              aria-label="Preset ROM Header"
              onChange={(e) => {
                const preset = PRESET_HEADERS.find((p) => p.id === e.target.value);
                if (preset) onSelectPreset(preset.bytes);
              }}
              defaultValue=""
              className="bg-[#161a24] border border-[#2a3042] text-neutral-300 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              <option value="" disabled>
                Load Preset Game...
              </option>
              <optgroup label="Commercial Classics">
                {PRESET_HEADERS.filter((p) => p.category === 'commercial').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Homebrew Boards">
                {PRESET_HEADERS.filter((p) => p.category === 'homebrew').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Export 16B header binary */}
          <button
            onClick={onDownloadBin}
            title="Download exact 16-byte raw header binary file (.header / .bin)"
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-200 bg-[#1e2433] hover:bg-[#283144] border border-[#2e374d] rounded transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">16B</span> .bin
          </button>

          {/* Generate Test Skeleton ROM */}
          <button
            onClick={onDownloadSkeletonRom}
            title="Download bootable test .nes ROM with reset vectors pointing to harmless spinloop"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded shadow-sm shadow-red-950 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Test ROM</span>
          </button>
        </div>
      </div>
    </header>
  );
};
