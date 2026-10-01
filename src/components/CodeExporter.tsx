import React, { useState } from 'react';
import { Copy, Check, Download, FileCode2 } from 'lucide-react';
import { NesHeaderData } from '../types/nes';
import {
  exportToCa65,
  exportToNesAsm,
  exportToAsm6,
  exportToC,
  exportToRust,
  exportToHex,
  exportToDisassemblyReport,
} from '../utils/nesHeader';

interface CodeExporterProps {
  header: NesHeaderData;
}

type ExportLanguage = 'ca65' | 'nesasm' | 'asm6' | 'c' | 'rust' | 'hex' | 'report' | 'json';

export const CodeExporter: React.FC<CodeExporterProps> = ({ header }) => {
  const [lang, setLang] = useState<ExportLanguage>('ca65');
  const [copied, setCopied] = useState(false);

  const getCodeString = (): string => {
    switch (lang) {
      case 'ca65':
        return exportToCa65(header);
      case 'nesasm':
        return exportToNesAsm(header);
      case 'asm6':
        return exportToAsm6(header);
      case 'c':
        return exportToC(header);
      case 'rust':
        return exportToRust(header);
      case 'hex':
        return exportToHex(header.bytes, ' ', '$');
      case 'report':
        return exportToDisassemblyReport(header);
      case 'json':
        return JSON.stringify(
          {
            format: header.format,
            mapper: header.mapper,
            submapper: header.submapper,
            prgRomBytes: header.prgRomBytes,
            chrRomBytes: header.chrRomBytes,
            mirroring: header.mirroring,
            battery: header.battery,
            trainer: header.trainer,
            tvSystem: header.tvSystem,
            hex: exportToHex(header.bytes, ' '),
            bytes: Array.from(header.bytes),
          },
          null,
          2
        );
      default:
        return '';
    }
  };

  const code = getCodeString();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<ExportLanguage, string> = {
      ca65: 's',
      nesasm: 'asm',
      asm6: 'asm',
      c: 'h',
      rust: 'rs',
      hex: 'hex',
      report: 'txt',
      json: 'json',
    };
    const filename = `nes_header_${header.format}_mapper${header.mapper}.${extMap[lang]}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#1f2533] gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
              Text & Source Code Exporter
            </h3>
            <p className="text-xs text-neutral-400">
              Export 16-byte header to assembly, C, Rust, or formatted disassembly report.
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#0b0d13] p-1 rounded-lg border border-[#1e2330]">
          {(
            [
              { id: 'ca65', label: 'ca65' },
              { id: 'nesasm', label: 'NESASM' },
              { id: 'asm6', label: 'ASM6' },
              { id: 'c', label: 'C / C++' },
              { id: 'rust', label: 'Rust' },
              { id: 'hex', label: 'Hex' },
              { id: 'report', label: 'Report' },
              { id: 'json', label: 'JSON' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setLang(item.id)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${
                lang === item.id
                  ? 'bg-[#1e2433] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative">
        <pre className="bg-[#090b10] border border-[#1e2330] rounded-lg p-3 text-xs font-mono text-neutral-200 overflow-x-auto max-h-80 leading-relaxed">
          <code>{code}</code>
        </pre>

        {/* Float Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded text-xs font-mono bg-[#161a24] hover:bg-[#202636] border border-[#2d364a] text-neutral-300 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 rounded text-xs font-mono bg-[#161a24] hover:bg-[#202636] border border-[#2d364a] text-neutral-300 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
