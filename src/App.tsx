/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HexVisualizer } from './components/HexVisualizer';
import { BitfieldEditor } from './components/BitfieldEditor';
import { TextPromptParser } from './components/TextPromptParser';
import { HardwareControls } from './components/HardwareControls';
import { CodeExporter } from './components/CodeExporter';
import { MapperDirectory } from './components/MapperDirectory';
import { RomPatcher } from './components/RomPatcher';
import { TextInscriber } from './components/TextInscriber';
import { NesHeaderData, PRESET_HEADERS } from './types/nes';
import { parseHeaderBytes, generateSkeletonRom } from './utils/nesHeader';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'mappers' | 'patcher' | 'inscriber'>('studio');
  
  // Default to Super Mario Bros header
  const [headerBytes, setHeaderBytes] = useState<Uint8Array>(
    new Uint8Array(PRESET_HEADERS[0].bytes)
  );
  const [selectedByteIndex, setSelectedByteIndex] = useState<number>(4); // default select PRG-ROM byte
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const headerData: NesHeaderData = parseHeaderBytes(headerBytes);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleByteChange = (index: number, value: number) => {
    const updated = new Uint8Array(headerBytes);
    updated[index] = value & 0xff;
    setHeaderBytes(updated);
  };

  const handleApplyBytes = (bytes: Uint8Array, sourceInfo?: string) => {
    setHeaderBytes(bytes);
    if (sourceInfo) {
      showStatus(`Applied header from ${sourceInfo}`);
    }
  };

  const handleSelectPreset = (presetBytes: number[]) => {
    setHeaderBytes(new Uint8Array(presetBytes));
    showStatus('Preset loaded into Header Studio');
  };

  const handleDownloadBin = () => {
    const blob = new Blob([headerBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nes_header_m${headerData.mapper}_${headerData.format}.bin`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Downloaded 16-byte raw header binary');
  };

  const handleDownloadSkeletonRom = () => {
    const rom = generateSkeletonRom(headerBytes);
    const blob = new Blob([rom.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_boot_m${headerData.mapper}.nes`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Downloaded valid bootable test skeleton .nes ROM');
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#e2e8f0] flex flex-col font-sans">
      {/* Top Bar */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onDownloadBin={handleDownloadBin}
        onDownloadSkeletonRom={handleDownloadSkeletonRom}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Toast Notification */}
        {statusMessage && (
          <div className="p-3 rounded-lg bg-[#162032] border border-[#2b3d5e] text-xs font-mono text-sky-300 flex items-center justify-between shadow-lg shadow-sky-950/20 animate-in fade-in">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Studio View */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* 1. Text to Header Natural Language & Spec Input */}
            <TextPromptParser
              onApplyBytes={handleApplyBytes}
              currentHeader={headerData}
            />

            {/* 2. 16-Byte Hex Memory Matrix */}
            <HexVisualizer
              header={headerData}
              selectedByteIndex={selectedByteIndex}
              onSelectByte={setSelectedByteIndex}
              onByteChange={handleByteChange}
            />

            {/* 3. Interactive Bitfield Editor for Selected Byte */}
            <BitfieldEditor
              header={headerData}
              selectedByteIndex={selectedByteIndex}
              onByteChange={handleByteChange}
            />

            {/* 4. Hardware and Board Controls */}
            <HardwareControls
              header={headerData}
              onChangeHeader={handleApplyBytes}
            />

            {/* 5. Source Code and Text Exporter */}
            <CodeExporter header={headerData} />
          </div>
        )}

        {/* Mapper Catalog View */}
        {activeTab === 'mappers' && (
          <MapperDirectory
            onSelectMapper={(bytes) => {
              setHeaderBytes(bytes);
              setActiveTab('studio');
              showStatus('Selected mapper loaded into Studio');
            }}
          />
        )}

        {/* ROM Injector & Fixer View */}
        {activeTab === 'patcher' && (
          <RomPatcher
            currentStudioHeader={headerData}
            onLoadHeaderIntoStudio={(bytes) => {
              setHeaderBytes(bytes);
              setActiveTab('studio');
              showStatus('ROM header loaded into Studio');
            }}
          />
        )}

        {/* ASCII Inscriber View */}
        {activeTab === 'inscriber' && (
          <TextInscriber
            currentHeader={headerData}
            onApplyBytes={(bytes) => {
              setHeaderBytes(bytes);
              showStatus('Inscribed text into header');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1c212d] bg-[#0c0e14] py-6 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-300">NES ROM Header Studio</span>
            <span>·</span>
            <span>iNES 1.0 & NES 2.0 Specification Compliant</span>
          </div>
          <div className="text-neutral-400 font-mono text-[11px]">
            Compatible with Mesen, FCEUX, Nestopia, BizHawk, and ca65/cc65 toolchains.
          </div>
        </div>
      </footer>
    </div>
  );
}
