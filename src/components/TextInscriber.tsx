import React, { useState } from 'react';
import { Sparkles, ArrowRight, Type, Check, RefreshCw } from 'lucide-react';
import { NesHeaderData } from '../types/nes';
import { buildHeaderBytes } from '../utils/nesHeader';

interface TextInscriberProps {
  currentHeader: NesHeaderData;
  onApplyBytes: (bytes: Uint8Array) => void;
}

export const TextInscriber: React.FC<TextInscriberProps> = ({
  currentHeader,
  onApplyBytes,
}) => {
  const [inscribedText, setInscribedText] = useState('MYHOMEBREW');
  const [targetSlot, setTargetSlot] = useState<'padding' | 'full'>('padding');

  // Extract ASCII representation from current header bytes
  const currentAscii = Array.from(currentHeader.bytes)
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');

  const paddingAscii = Array.from(currentHeader.bytes.slice(8, 16))
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');

  const handleInscribe = () => {
    const newBytes = new Uint8Array(currentHeader.bytes);

    if (targetSlot === 'padding') {
      // Inscribe text in bytes 8 to 15 (up to 8 characters)
      const asciiBytes = new TextEncoder().encode(inscribedText.slice(0, 8));
      for (let i = 0; i < 8; i++) {
        newBytes[8 + i] = i < asciiBytes.length ? asciiBytes[i] : 0;
      }
    } else {
      // Direct 16-byte text mapping (preserves magic NES\x1A in bytes 0..3)
      const textToInscribe = inscribedText.slice(0, 12);
      const asciiBytes = new TextEncoder().encode(textToInscribe);
      for (let i = 0; i < 12; i++) {
        newBytes[4 + i] = i < asciiBytes.length ? asciiBytes[i] : 0;
      }
    }

    onApplyBytes(newBytes);
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-5 space-y-4">
      <div className="pb-3 border-b border-[#1f2533]">
        <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <Type className="w-5 h-5 text-purple-400" />
          ASCII Text to Header Inscriber & Steganography
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Encode homebrew project titles, signatures, build IDs, or release watermarks directly into the 16-byte header payload.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Encoder Panel */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <div className="text-xs font-mono font-semibold text-neutral-300">
            1. Inscribe Text String
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">
              Text to Inscribe ({targetSlot === 'padding' ? 'Max 8 chars' : 'Max 12 chars'})
            </label>
            <input
              type="text"
              maxLength={targetSlot === 'padding' ? 8 : 12}
              value={inscribedText}
              onChange={(e) => setInscribedText(e.target.value)}
              placeholder="e.g. HOMEBREW"
              className="w-full bg-[#141822] border border-[#262e40] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">
              Target Header Bytes
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTargetSlot('padding')}
                className={`p-2 rounded border text-left transition-colors ${
                  targetSlot === 'padding'
                    ? 'bg-purple-950/40 border-purple-600 text-purple-300'
                    : 'bg-[#141822] border-[#222837] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Bytes $08 - $0F</div>
                <div className="text-[10px] text-neutral-400">iNES unused padding (safe)</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetSlot('full')}
                className={`p-2 rounded border text-left transition-colors ${
                  targetSlot === 'full'
                    ? 'bg-purple-950/40 border-purple-600 text-purple-300'
                    : 'bg-[#141822] border-[#222837] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Bytes $04 - $0F</div>
                <div className="text-[10px] text-neutral-400">Payload bytes (custom ID)</div>
              </button>
            </div>
          </div>

          {/* ASCII to Hex Character Table */}
          <div>
            <div className="text-[11px] font-mono text-neutral-400 mb-1">
              Character Byte Mapping Preview:
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {Array.from(inscribedText.slice(0, targetSlot === 'padding' ? 8 : 12)).map(
                (char, i) => {
                  const code = char.charCodeAt(0);
                  return (
                    <div
                      key={i}
                      className="px-2 py-1 rounded bg-[#161a24] border border-[#232a3a] flex flex-col items-center"
                    >
                      <span className="text-white font-bold">{char}</span>
                      <span className="text-[10px] text-purple-400">
                        ${code.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleInscribe}
            className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-purple-950"
          >
            <span>Inscribe into Active Header</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Decoder / Inspector Panel */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <div className="text-xs font-mono font-semibold text-neutral-300">
            2. Active Header Text Scan
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-neutral-400 mb-1">Full 16-Byte ASCII View:</div>
              <div className="p-2.5 rounded bg-[#141822] border border-[#232a3a] text-emerald-400 font-mono tracking-wider break-all">
                {currentAscii}
              </div>
            </div>

            <div>
              <div className="text-neutral-400 mb-1">Bytes $08..$0F String (Padding Area):</div>
              <div className="p-2.5 rounded bg-[#141822] border border-[#232a3a] text-purple-300 font-mono tracking-wider">
                "{paddingAscii}"
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-[#12151e] border border-[#202534] text-xs text-neutral-400 leading-relaxed">
            <span className="text-neutral-200 font-medium">Historical Note:</span> In the early 1990s, pirate copiers (such as Super Magic Drive and Bung Doctor PC-Jr) and early emulator authors often placed ASCII text like "DiskDude!" or release group acronyms in the unused trailing bytes of the iNES 1.0 header. While iNES 1.0 ignored these bytes, modern NES 2.0 uses bytes 7-15 for extended mappers and RAM sizes.
          </div>
        </div>
      </div>
    </div>
  );
};
