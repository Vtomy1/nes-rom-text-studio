import React, { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';
import { NesHeaderData } from '../types/nes';
import { parseHeaderBytes, buildHeaderBytes } from '../utils/nesHeader';

interface RomPatcherProps {
  currentStudioHeader: NesHeaderData;
  onLoadHeaderIntoStudio: (bytes: Uint8Array) => void;
}

export const RomPatcher: React.FC<RomPatcherProps> = ({
  currentStudioHeader,
  onLoadHeaderIntoStudio,
}) => {
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    rawBuffer: Uint8Array;
    parsedHeader: NesHeaderData;
  } | null>(null);

  const [fixApplied, setFixApplied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = new Uint8Array(event.target?.result as ArrayBuffer);
      if (buffer.length < 16) {
        alert('File is too small to be a valid NES ROM (must be at least 16 bytes).');
        return;
      }

      const headerBytes = buffer.slice(0, 16);
      const parsed = parseHeaderBytes(headerBytes);

      setUploadedFile({
        name: file.name,
        size: file.size,
        rawBuffer: buffer,
        parsedHeader: parsed,
      });
      setFixApplied(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyStudioHeader = () => {
    if (!uploadedFile) return;

    // Create copy of buffer with new 16-byte header
    const newBuf = new Uint8Array(uploadedFile.rawBuffer);
    newBuf.set(currentStudioHeader.bytes, 0);

    setUploadedFile({
      ...uploadedFile,
      rawBuffer: newBuf,
      parsedHeader: parseHeaderBytes(currentStudioHeader.bytes),
    });
    setFixApplied(true);
  };

  const handleFixDiskDude = () => {
    if (!uploadedFile) return;
    const cleanHeaderBytes = new Uint8Array(uploadedFile.rawBuffer.slice(0, 16));
    // Clear archaic bytes 7..15 that contain 'DiskDude!'
    for (let i = 7; i < 16; i++) {
      cleanHeaderBytes[i] = 0;
    }
    // Re-encode byte 7 mapper upper nibble as 0
    cleanHeaderBytes[7] = 0;

    const newBuf = new Uint8Array(uploadedFile.rawBuffer);
    newBuf.set(cleanHeaderBytes, 0);

    setUploadedFile({
      ...uploadedFile,
      rawBuffer: newBuf,
      parsedHeader: parseHeaderBytes(cleanHeaderBytes),
    });
    setFixApplied(true);
  };

  const handleUpgradeToNes2 = () => {
    if (!uploadedFile) return;
    const h = uploadedFile.parsedHeader;
    const nes2Bytes = buildHeaderBytes({
      ...h,
      format: 'nes2',
      prgRamBytes: h.prgRamBytes || 8192,
      chrRamBytes: h.chrRomBytes === 0 ? 8192 : 0,
      tvSystem: h.tvSystem || 'ntsc',
    });

    const newBuf = new Uint8Array(uploadedFile.rawBuffer);
    newBuf.set(nes2Bytes, 0);

    setUploadedFile({
      ...uploadedFile,
      rawBuffer: newBuf,
      parsedHeader: parseHeaderBytes(nes2Bytes),
    });
    setFixApplied(true);
  };

  const handleDownloadPatched = () => {
    if (!uploadedFile) return;
    const blob = new Blob([uploadedFile.rawBuffer.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile.name.replace(/\.nes$/i, '') + '_patched.nes';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12151e] border border-[#212736] rounded-xl p-5">
      <div className="pb-4 mb-4 border-b border-[#1f2533]">
        <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          NES ROM File Injector, Verifier & Header Patcher
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Upload any existing .nes ROM to inspect its actual header, repair archaic "DiskDude!" corruptions, upgrade to NES 2.0, or inject the Studio header directly.
        </p>
      </div>

      {!uploadedFile ? (
        <div className="border-2 border-dashed border-[#262d3e] rounded-xl p-8 text-center bg-[#0b0e14]/50 hover:border-red-500/50 transition-colors">
          <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-200 font-mono mb-1">
            Drag and drop your .nes file here, or click to browse
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Supports all iNES 1.0 and NES 2.0 ROM files.
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#1e2433] hover:bg-[#283144] border border-[#2e374d] cursor-pointer transition-colors shadow-sm">
            <span>Select .nes ROM File</span>
            <input
              type="file"
              accept=".nes,.bin,.rom"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ROM Details Banner */}
          <div className="bg-[#0b0e14] border border-[#1e2433] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{uploadedFile.name}</span>
                <span className="text-xs font-mono text-neutral-400">
                  ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
                {fixApplied && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Patched
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-neutral-400">
                <span>Format: <strong className="text-neutral-200">{uploadedFile.parsedHeader.format.toUpperCase()}</strong></span>
                <span>·</span>
                <span>Mapper: <strong className="text-emerald-400">{uploadedFile.parsedHeader.mapper}</strong></span>
                <span>·</span>
                <span>PRG: <strong className="text-sky-400">{uploadedFile.parsedHeader.prgRomBytes / 1024}K</strong></span>
                <span>·</span>
                <span>CHR: <strong className="text-teal-400">{uploadedFile.parsedHeader.chrRomBytes / 1024}K</strong></span>
                <span>·</span>
                <span>Mirroring: <strong className="text-neutral-200">{uploadedFile.parsedHeader.mirroring}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoadHeaderIntoStudio(uploadedFile.parsedHeader.bytes)}
                className="px-3 py-1.5 text-xs font-mono font-medium text-neutral-200 bg-[#161a24] hover:bg-[#202636] border border-[#2a3246] rounded transition-colors"
              >
                Load into Studio
              </button>
              <label className="px-3 py-1.5 text-xs font-mono font-medium text-neutral-200 bg-[#161a24] hover:bg-[#202636] border border-[#2a3246] rounded cursor-pointer transition-colors">
                Change File
                <input
                  type="file"
                  accept=".nes,.bin,.rom"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Corruption / Diagnostics Warnings */}
          {uploadedFile.parsedHeader.warnings.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400 font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>Header Diagnostics Detected Issues:</span>
              </div>
              {uploadedFile.parsedHeader.warnings.map((w, i) => (
                <div key={i} className="pl-5 text-neutral-300">
                  • {w}
                </div>
              ))}
            </div>
          )}

          {/* Action Operations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleApplyStudioHeader}
              className="p-3 rounded-lg bg-[#141822] hover:bg-[#1c2230] border border-[#242b3d] text-left transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                  Inject Current Studio Header
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Overwrite the file's first 16 bytes with your active configuration in Header Studio.
                </p>
              </div>
              <span className="text-[11px] text-red-400 font-mono mt-2 font-medium">Apply & Patch →</span>
            </button>

            {uploadedFile.parsedHeader.hasDiskDudeCorruption && (
              <button
                onClick={handleFixDiskDude}
                className="p-3 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-700/60 text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Clean "DiskDude!" Signature
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Zero-out the corrupted bytes in 7-15 to restore clean mapper detection in modern emulators.
                  </p>
                </div>
                <span className="text-[11px] text-amber-400 font-mono mt-2 font-medium">Clean Header →</span>
              </button>
            )}

            <button
              onClick={handleUpgradeToNes2}
              className="p-3 rounded-lg bg-[#141822] hover:bg-[#1c2230] border border-[#242b3d] text-left transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Upgrade to NES 2.0
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Converts standard iNES 1.0 to modern NES 2.0 with explicit RAM sizes and timing specs.
                </p>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono mt-2 font-medium">Upgrade Header →</span>
            </button>
          </div>

          {/* Download Patched ROM */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleDownloadPatched}
              className="px-4 py-2 rounded-lg text-xs font-bold font-mono text-white bg-red-600 hover:bg-red-500 shadow-sm shadow-red-950 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Patched .nes ROM</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
