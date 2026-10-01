import React, { useState } from 'react';
import { Sparkles, Terminal, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parseTextToHeader } from '../utils/nesHeader';
import { NesHeaderData } from '../types/nes';

interface TextPromptParserProps {
  onApplyBytes: (bytes: Uint8Array, sourceInfo?: string) => void;
  currentHeader: NesHeaderData;
}

const EXAMPLE_PROMPTS = [
  { label: 'Super Mario Bros.', text: 'Super Mario Bros (NROM, 32KB PRG, 8KB CHR, Vertical mirroring)' },
  { label: 'Zelda 1 (Battery)', text: 'The Legend of Zelda: MMC1, 128KB PRG, 8KB CHR RAM, Battery-backed save, Horizontal mirroring' },
  { label: 'Castlevania III (MMC5)', text: 'Castlevania III: MMC5 mapper 5, 256KB PRG, 128KB CHR, 8KB PRG RAM, Vertical' },
  { label: 'Contra (UNROM)', text: 'Contra: UNROM mapper 2, 128KB PRG, 0 CHR (CHR-RAM), Vertical' },
  { label: 'Modern NES 2.0 MMC3', text: 'NES 2.0 format, Mapper 4 MMC3, 512KB PRG, 256KB CHR, 8KB Battery PRG-RAM, NTSC' },
  { label: 'Homebrew 1MB Cart', text: 'Mapper 30 (UNROM 512), 1024KB PRG, 32KB CHR RAM, NES 2.0, 1-screen' },
  { label: 'Raw Hex String', text: '4E 45 53 1A 02 01 01 00 00 00 00 00 00 00 00 00' },
  { label: 'ASM Directive', text: '.byte "NES", $1A, $08, $00, $12, $00, $01, $00, $00, $00, $00, $00, $00, $00, $00, $00' },
];

export const TextPromptParser: React.FC<TextPromptParserProps> = ({
  onApplyBytes,
  currentHeader,
}) => {
  const [inputText, setInputText] = useState('');
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deterministic local parsing on text change
  const handleInputChange = (text: string) => {
    setInputText(text);
    setErrorMessage(null);

    if (!text.trim()) {
      setDetectedFormat('');
      return;
    }

    try {
      const result = parseTextToHeader(text);
      setDetectedFormat(result.detectedFormat);
      onApplyBytes(result.bytes, `Local text parser (${result.detectedFormat})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error parsing text');
    }
  };

  const handleApplyPreset = (text: string) => {
    setInputText(text);
    handleInputChange(text);
  };

  const handleGeminiQuery = async () => {
    const prompt = inputText.trim() || 'Modern NES 2.0 homebrew RPG with MMC3, 512KB PRG, 256KB CHR, and battery save';
    setAiLoading(true);
    setErrorMessage(null);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/gemini/parse-header', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error from Gemini API');
      }

      const data = await response.json();
      if (Array.isArray(data.bytes) && data.bytes.length === 16) {
        const bytes = new Uint8Array(data.bytes);
        onApplyBytes(bytes, `Gemini AI: ${data.title || 'Generated Header'}`);
        setDetectedFormat('gemini_ai');
        if (data.explanation) {
          setAiExplanation(data.explanation);
        }
      } else {
        throw new Error('Invalid response format received from AI model');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate header with AI');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#1f2533] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
              Text to NES ROM Header Converter
            </h2>
            <p className="text-xs text-neutral-400">
              Type or paste game titles, hardware specs, raw hex strings, ASM directives, or C arrays.
            </p>
          </div>
        </div>

        {detectedFormat && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Format: {detectedFormat}</span>
          </div>
        )}
      </div>

      {/* Input Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder='e.g., "Mega Man 2: MMC1 mapper 1, 256KB PRG, 0 CHR (uses 8KB CHR-RAM), vertical mirroring" or "4E 45 53 1A 02 01 01 00..."'
          className="w-full bg-[#0a0c11] border border-[#222736] rounded-lg p-3 text-sm font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors resize-y leading-relaxed"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Quick example chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-[11px] text-neutral-400">Try quick text:</span>
            {EXAMPLE_PROMPTS.slice(0, 5).map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(ex.text)}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#161a24] hover:bg-[#1f2533] border border-[#262c3d] text-neutral-300 hover:text-white transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={aiLoading}
              onClick={handleGeminiQuery}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm shadow-red-950/60"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ask Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Explanation feedback */}
      {aiExplanation && (
        <div className="mt-3 p-3 rounded-lg bg-[#0e121a] border border-[#232b3b] text-xs text-neutral-300">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Architecture Breakdown</span>
          </div>
          <p className="leading-relaxed text-neutral-300">{aiExplanation}</p>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
