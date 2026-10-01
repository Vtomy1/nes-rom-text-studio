import { NesHeaderData, KNOWN_MAPPERS, NES_EXPANSION_DEVICES } from '../types/nes';

// Helper to decode NES 2.0 RAM size: 64 << count
function decodeRamSize(count: number): number {
  if (count === 0) return 0;
  return 64 << count;
}

// Helper to encode RAM size to NES 2.0 shift count
export function encodeRamSize(bytes: number): number {
  if (bytes <= 0) return 0;
  let count = 1;
  while ((64 << count) < bytes && count < 15) {
    count++;
  }
  return count;
}

export function parseHeaderBytes(rawBytes: Uint8Array): NesHeaderData {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = rawBytes[i] || 0;
  }

  const warnings: string[] = [];

  // Check magic "NES\x1A"
  const isMagicValid =
    bytes[0] === 0x4e && bytes[1] === 0x45 && bytes[2] === 0x53 && bytes[3] === 0x1a;

  if (!isMagicValid) {
    warnings.push('Header does not start with magic signature "NES\\x1A" (0x4E 0x45 0x53 0x1A).');
  }

  // Check for DiskDude! corruption in bytes 7..15
  const signature7to15 = String.fromCharCode(...bytes.slice(7, 16));
  const hasDiskDudeCorruption = signature7to15.includes('DiskDude') || signature7to15.includes('DISKDUD');
  if (hasDiskDudeCorruption) {
    warnings.push('Archaic "DiskDude!" signature detected in upper bytes; mapper bits may be corrupted.');
  }

  // NES 2.0 identification: (byte 7 & 0x0C) === 0x08
  const isNes2 = (bytes[7] & 0x0c) === 0x08;
  const format: 'ines1' | 'nes2' = isNes2 ? 'nes2' : 'ines1';

  // Mapper
  let mapper = 0;
  let submapper = 0;

  if (isNes2) {
    mapper = ((bytes[8] & 0x0f) << 8) | (bytes[7] & 0xf0) | (bytes[6] >> 4);
    submapper = (bytes[8] >> 4) & 0x0f;
  } else {
    // Standard iNES 1.0 (mask byte 7 upper nibble only if not DiskDude)
    const upperNibble = hasDiskDudeCorruption ? 0 : bytes[7] & 0xf0;
    mapper = upperNibble | (bytes[6] >> 4);
  }

  // PRG ROM Size
  let prgRomBytes = 0;
  if (isNes2) {
    const prgMsb = bytes[9] & 0x0f;
    if (prgMsb === 0x0f) {
      // Exponent multiplier
      const exponent = bytes[4] >> 2;
      const multiplier = (bytes[4] & 0x03) * 2 + 1;
      prgRomBytes = (1 << exponent) * multiplier;
    } else {
      prgRomBytes = ((prgMsb << 8) | bytes[4]) * 16384;
    }
  } else {
    prgRomBytes = bytes[4] * 16384;
  }

  // CHR ROM Size
  let chrRomBytes = 0;
  if (isNes2) {
    const chrMsb = (bytes[9] >> 4) & 0x0f;
    if (chrMsb === 0x0f) {
      const exponent = bytes[5] >> 2;
      const multiplier = (bytes[5] & 0x03) * 2 + 1;
      chrRomBytes = (1 << exponent) * multiplier;
    } else {
      chrRomBytes = ((chrMsb << 8) | bytes[5]) * 8192;
    }
  } else {
    chrRomBytes = bytes[5] * 8192;
  }

  // Flags 6
  const mirroring: NesHeaderData['mirroring'] =
    (bytes[6] & 0x08) !== 0
      ? 'four_screen'
      : (bytes[6] & 0x01) !== 0
      ? 'vertical'
      : 'horizontal';

  const battery = (bytes[6] & 0x02) !== 0;
  const trainer = (bytes[6] & 0x04) !== 0;
  const fourScreen = (bytes[6] & 0x08) !== 0;

  // Flags 7
  const vsUnisystem = (bytes[7] & 0x01) !== 0;
  const playChoice10 = (bytes[7] & 0x02) !== 0;

  // RAM sizes
  let prgRamBytes = 0;
  let prgNvramBytes = 0;
  let chrRamBytes = 0;
  let chrNvramBytes = 0;

  if (isNes2) {
    prgRamBytes = decodeRamSize(bytes[10] & 0x0f);
    prgNvramBytes = decodeRamSize((bytes[10] >> 4) & 0x0f);
    chrRamBytes = decodeRamSize(bytes[11] & 0x0f);
    chrNvramBytes = decodeRamSize((bytes[11] >> 4) & 0x0f);
  } else {
    // iNES 1.0 PRG RAM in byte 8 (value 0 usually implies 8KB for compatibility)
    const ramUnits = bytes[8];
    prgRamBytes = (ramUnits === 0 ? 1 : ramUnits) * 8192;
    // If CHR ROM size is 0, system provides 8KB CHR RAM
    if (chrRomBytes === 0) {
      chrRamBytes = 8192;
    }
  }

  // TV System & Timing
  let tvSystem: NesHeaderData['tvSystem'] = 'ntsc';
  if (isNes2) {
    const timing = bytes[12] & 0x03;
    if (timing === 0) tvSystem = 'ntsc';
    else if (timing === 1) tvSystem = 'pal';
    else if (timing === 2) tvSystem = 'dual';
    else if (timing === 3) tvSystem = 'dendy';
  } else {
    tvSystem = (bytes[9] & 0x01) === 0 ? 'ntsc' : 'pal';
  }

  const consoleType = isNes2 ? bytes[13] & 0x0f : 0;
  const expansionDevice = isNes2 ? bytes[15] & 0x3f : 0;

  return {
    bytes,
    format,
    mapper,
    submapper,
    prgRomBytes,
    chrRomBytes,
    prgRamBytes,
    prgNvramBytes,
    chrRamBytes,
    chrNvramBytes,
    mirroring,
    battery,
    trainer,
    fourScreen,
    vsUnisystem,
    playChoice10,
    tvSystem,
    consoleType,
    expansionDevice,
    hasDiskDudeCorruption,
    warnings,
  };
}

export function buildHeaderBytes(config: Partial<NesHeaderData>): Uint8Array {
  const bytes = new Uint8Array(16);

  // Magic NES\x1A
  bytes[0] = 0x4e;
  bytes[1] = 0x45;
  bytes[2] = 0x53;
  bytes[3] = 0x1a;

  const isNes2 = config.format === 'nes2';
  const mapper = config.mapper ?? 0;
  const submapper = config.submapper ?? 0;

  // PRG ROM units (16KB)
  const prgBytes = config.prgRomBytes ?? 32768;
  const prgUnits = Math.max(1, Math.round(prgBytes / 16384));
  bytes[4] = prgUnits & 0xff;

  // CHR ROM units (8KB)
  const chrBytes = config.chrRomBytes ?? 8192;
  const chrUnits = Math.round(chrBytes / 8192);
  bytes[5] = chrUnits & 0xff;

  // Flags 6: Lower mapper nibble, mirroring, battery, trainer, four-screen
  let f6 = 0;
  if (config.mirroring === 'vertical') f6 |= 0x01;
  if (config.mirroring === 'four_screen' || config.fourScreen) f6 |= 0x08;
  if (config.battery) f6 |= 0x02;
  if (config.trainer) f6 |= 0x04;
  f6 |= (mapper & 0x0f) << 4;
  bytes[6] = f6;

  // Flags 7: Upper mapper nibble, VS, PlayChoice, NES 2.0 identifier
  let f7 = 0;
  if (config.vsUnisystem) f7 |= 0x01;
  if (config.playChoice10) f7 |= 0x02;
  if (isNes2) {
    f7 |= 0x08; // NES 2.0 flag: bits 2-3 = 0b10
  }
  f7 |= (mapper & 0xf0);
  bytes[7] = f7;

  if (isNes2) {
    // Flags 8: Mapper bits 8-11 and Submapper
    bytes[8] = ((submapper & 0x0f) << 4) | ((mapper >> 8) & 0x0f);

    // Flags 9: PRG MSB (bits 0-3) and CHR MSB (bits 4-7)
    const prgMsb = (prgUnits >> 8) & 0x0f;
    const chrMsb = (chrUnits >> 8) & 0x0f;
    bytes[9] = (chrMsb << 4) | prgMsb;

    // Flags 10: PRG-RAM sizes (unbacked & battery)
    const prgRamShift = encodeRamSize(config.prgRamBytes ?? 0);
    const prgNvramShift = encodeRamSize(config.prgNvramBytes ?? (config.battery ? 8192 : 0));
    bytes[10] = ((prgNvramShift & 0x0f) << 4) | (prgRamShift & 0x0f);

    // Flags 11: CHR-RAM sizes (unbacked & battery)
    const chrRamShift = encodeRamSize(config.chrRamBytes ?? (chrBytes === 0 ? 8192 : 0));
    const chrNvramShift = encodeRamSize(config.chrNvramBytes ?? 0);
    bytes[11] = ((chrNvramShift & 0x0f) << 4) | (chrRamShift & 0x0f);

    // Flags 12: Timing
    let timing = 0;
    if (config.tvSystem === 'pal') timing = 1;
    else if (config.tvSystem === 'dual') timing = 2;
    else if (config.tvSystem === 'dendy') timing = 3;
    bytes[12] = timing & 0x03;

    // Flags 13: Console type
    bytes[13] = (config.consoleType ?? 0) & 0x0f;

    // Flags 14: Misc ROMs
    bytes[14] = 0;

    // Flags 15: Expansion Device
    bytes[15] = (config.expansionDevice ?? 1) & 0x3f;
  } else {
    // iNES 1.0
    // Byte 8: PRG RAM 8KB units
    const ramUnits = Math.ceil((config.prgRamBytes ?? 8192) / 8192);
    bytes[8] = ramUnits & 0xff;

    // Byte 9: TV system (0=NTSC, 1=PAL)
    bytes[9] = config.tvSystem === 'pal' ? 1 : 0;

    // Bytes 10-15: zero padding
    bytes[10] = 0;
    bytes[11] = 0;
    bytes[12] = 0;
    bytes[13] = 0;
    bytes[14] = 0;
    bytes[15] = 0;
  }

  return bytes;
}

// Robust deterministic text to header parser
export function parseTextToHeader(rawInput: string): {
  bytes: Uint8Array;
  detectedFormat: string;
  interpretedConfig?: Partial<NesHeaderData>;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      bytes: buildHeaderBytes({ mapper: 0, prgRomBytes: 32768, chrRomBytes: 8192 }),
      detectedFormat: 'default',
    };
  }

  // 1. Check if input is hex numbers (e.g. "4E 45 53 1A 02 01..." or "0x4E, 0x45..." or continuous hex)
  // Clean comments and code delimiters
  const hexCandidates = trimmed.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/[\r\n\t,;{}]/g, ' ');
  const hexTokens = hexCandidates.trim().split(/\s+/).filter(Boolean);

  // Check if all tokens look like hex bytes
  const isHexList =
    hexTokens.length >= 8 &&
    hexTokens.length <= 32 &&
    hexTokens.every((tok) => /^(0x|\$)?([0-9a-fA-F]{1,2})$/.test(tok) || tok.toUpperCase() === '"NES"');

  if (isHexList) {
    const bytes = new Uint8Array(16);
    let byteIdx = 0;
    for (const tok of hexTokens) {
      if (byteIdx >= 16) break;
      if (tok.toUpperCase() === '"NES"') {
        bytes[byteIdx++] = 0x4e;
        bytes[byteIdx++] = 0x45;
        bytes[byteIdx++] = 0x53;
      } else {
        const clean = tok.replace(/^(0x|\$)/, '');
        bytes[byteIdx++] = parseInt(clean, 16);
      }
    }
    // If user provided fewer than 16 bytes, pad remaining with 0
    return {
      bytes,
      detectedFormat: 'hex_bytes',
    };
  }

  // 2. Continuous 32-char hex string: "4e45531a020101000000000000000000"
  const cleanHex = trimmed.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length === 32) {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return {
      bytes,
      detectedFormat: 'continuous_hex',
    };
  }

  // 3. Check JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.bytes) && parsed.bytes.length === 16) {
        return {
          bytes: new Uint8Array(parsed.bytes),
          detectedFormat: 'json_bytes',
        };
      }
      if (parsed.mapper !== undefined || parsed.prgRomBytes !== undefined || parsed.format) {
        const bytes = buildHeaderBytes(parsed);
        return {
          bytes,
          detectedFormat: 'json_spec',
          interpretedConfig: parsed,
        };
      }
    } catch {
      // not valid json, fall through
    }
  }

  // 4. Natural language & Text specification parser
  const lower = trimmed.toLowerCase();
  const config: Partial<NesHeaderData> = {
    mapper: 0,
    prgRomBytes: 32768,
    chrRomBytes: 8192,
    mirroring: 'horizontal',
    battery: false,
    trainer: false,
    tvSystem: 'ntsc',
    format: 'ines1',
  };

  // Format
  if (lower.includes('nes 2.0') || lower.includes('nes2') || lower.includes('nes 2')) {
    config.format = 'nes2';
  }

  // Mapper matching
  // Check known names first:
  if (lower.includes('mmc3') || lower.includes('txrom')) config.mapper = 4;
  else if (lower.includes('mmc1') || lower.includes('sxrom')) config.mapper = 1;
  else if (lower.includes('unrom') || lower.includes('uorom') || lower.includes('uxrom')) {
    config.mapper = 2;
    config.chrRomBytes = 0; // UNROM defaults to CHR-RAM
  } else if (lower.includes('cnrom')) config.mapper = 3;
  else if (lower.includes('mmc5') || lower.includes('exrom')) config.mapper = 5;
  else if (lower.includes('aorom') || lower.includes('axrom') || lower.includes('battletoads')) {
    config.mapper = 7;
    config.chrRomBytes = 0;
    config.mirroring = 'single_screen';
  } else if (lower.includes('mmc2') || lower.includes('punch-out')) config.mapper = 9;
  else if (lower.includes('mmc4')) config.mapper = 10;
  else if (lower.includes('nrom')) config.mapper = 0;
  else if (lower.includes('vrc6')) config.mapper = 24;
  else if (lower.includes('vrc7')) config.mapper = 85;
  else if (lower.includes('fme-7') || lower.includes('sunsoft 5b') || lower.includes('gimmick')) config.mapper = 69;
  else if (lower.includes('namco 163')) config.mapper = 19;
  else if (lower.includes('action 52') || lower.includes('action52')) config.mapper = 228;

  // Numeric mapper: "mapper 4", "mapper: 1", "map 2"
  const mapperMatch = lower.match(/(?:mapper|map|board)[\s:=#]+([0-9]+)/);
  if (mapperMatch) {
    config.mapper = parseInt(mapperMatch[1], 10);
  }

  // Submapper
  const submapperMatch = lower.match(/submapper[\s:=#]+([0-9]+)/);
  if (submapperMatch) {
    config.submapper = parseInt(submapperMatch[1], 10);
    config.format = 'nes2';
  }

  // PRG ROM size: "256k prg", "prg: 512kb", "prg-rom 128k", "1mb prg"
  const prgMbMatch = lower.match(/([0-9.]+)\s*(?:mb|megabyte)s?\s*(?:prg|program|rom)/) ||
                     lower.match(/(?:prg|program)[\s:=]+([0-9.]+)\s*(?:mb|megabyte)/);
  if (prgMbMatch) {
    config.prgRomBytes = Math.round(parseFloat(prgMbMatch[1]) * 1024 * 1024);
  } else {
    const prgKbMatch = lower.match(/([0-9]+)\s*(?:k|kb|kilobyte)s?\s*(?:prg|program|rom)/) ||
                       lower.match(/(?:prg|program)[\s:=]+([0-9]+)\s*(?:k|kb)?/);
    if (prgKbMatch) {
      config.prgRomBytes = parseInt(prgKbMatch[1], 10) * 1024;
    }
  }

  // CHR ROM size: "128k chr", "chr: 0", "chr ram", "8kb chr", "no chr rom"
  if (lower.includes('chr ram') || lower.includes('0 chr') || lower.includes('no chr rom') || lower.includes('chr-ram')) {
    config.chrRomBytes = 0;
    config.chrRamBytes = 8192;
  } else {
    const chrKbMatch = lower.match(/([0-9]+)\s*(?:k|kb|kilobyte)s?\s*(?:chr|character|vrom)/) ||
                       lower.match(/(?:chr|vrom)[\s:=]+([0-9]+)\s*(?:k|kb)?/);
    if (chrKbMatch) {
      config.chrRomBytes = parseInt(chrKbMatch[1], 10) * 1024;
    }
  }

  // Mirroring: "vertical", "horizontal", "four screen", "4-screen", "single screen"
  if (lower.includes('four screen') || lower.includes('four-screen') || lower.includes('4-screen') || lower.includes('4 screen')) {
    config.mirroring = 'four_screen';
    config.fourScreen = true;
  } else if (lower.includes('vert') || lower.includes('v-mirror')) {
    config.mirroring = 'vertical';
  } else if (lower.includes('horiz') || lower.includes('h-mirror')) {
    config.mirroring = 'horizontal';
  } else if (lower.includes('single screen') || lower.includes('1-screen')) {
    config.mirroring = 'single_screen';
  }

  // Battery: "battery", "battery-backed", "save", "nvram"
  if (lower.includes('battery') || lower.includes('save ram') || lower.includes('nvram')) {
    config.battery = true;
    config.prgNvramBytes = 8192;
  }

  // Trainer: "trainer", "512 byte trainer"
  if (lower.includes('trainer')) {
    config.trainer = true;
  }

  // TV System
  if (lower.includes('pal')) {
    config.tvSystem = 'pal';
  } else if (lower.includes('dendy')) {
    config.tvSystem = 'dendy';
    config.format = 'nes2';
  } else if (lower.includes('ntsc')) {
    config.tvSystem = 'ntsc';
  }

  // Expansion device
  if (lower.includes('four score') || lower.includes('4 players')) {
    config.expansionDevice = 2;
    config.format = 'nes2';
  } else if (lower.includes('zapper') || lower.includes('light gun')) {
    config.expansionDevice = 3;
    config.format = 'nes2';
  } else if (lower.includes('vaus') || lower.includes('paddle')) {
    config.expansionDevice = 12;
    config.format = 'nes2';
  }

  const bytes = buildHeaderBytes(config);
  return {
    bytes,
    detectedFormat: 'text_specification',
    interpretedConfig: config,
  };
}

// Export formats
export function exportToHex(bytes: Uint8Array, separator: string = ' ', prefix: string = ''): string {
  return Array.from(bytes)
    .map((b) => `${prefix}${b.toString(16).toUpperCase().padStart(2, '0')}`)
    .join(separator);
}

export function exportToCa65(header: NesHeaderData): string {
  const b = header.bytes;
  const isNes2 = header.format === 'nes2';
  const prgKb = Math.round(header.prgRomBytes / 1024);
  const chrKb = Math.round(header.chrRomBytes / 1024);

  return `; ==============================================================================
; ca65 NES ROM Header (${isNes2 ? 'NES 2.0' : 'iNES 1.0'})
; Generated by NES ROM Header Studio
; ==============================================================================
.segment "HEADER"
    .byte "NES", $1A             ; Magic identification string (4 bytes)
    .byte $${b[4].toString(16).padStart(2, '0')}                    ; PRG-ROM size: ${prgKb} KB (${b[4]} x 16 KB units)
    .byte $${b[5].toString(16).padStart(2, '0')}                    ; CHR-ROM size: ${chrKb} KB (${b[5]} x 8 KB units${chrKb === 0 ? ' - uses CHR-RAM' : ''})
    .byte %${b[6].toString(2).padStart(8, '0')}            ; Flags 6: Mapper ${header.mapper & 0xf}, ${header.mirroring} mirroring${header.battery ? ', battery' : ''}${header.trainer ? ', trainer' : ''}
    .byte %${b[7].toString(2).padStart(8, '0')}            ; Flags 7: Mapper ${(header.mapper >> 4) & 0xf}${isNes2 ? ', NES 2.0 identifier' : ''}
${
  isNes2
    ? `    .byte %${b[8].toString(2).padStart(8, '0')}            ; Flags 8: Mapper bits 8-11 ($${(b[8] & 0xf).toString(16)}), Submapper ($${(b[8] >> 4).toString(16)})
    .byte %${b[9].toString(2).padStart(8, '0')}            ; Flags 9: PRG MSB ($${(b[9] & 0xf).toString(16)}), CHR MSB ($${(b[9] >> 4).toString(16)})
    .byte %${b[10].toString(2).padStart(8, '0')}            ; Flags 10: PRG-RAM (${header.prgRamBytes / 1024} KB vol, ${header.prgNvramBytes / 1024} KB bat)
    .byte %${b[11].toString(2).padStart(8, '0')}            ; Flags 11: CHR-RAM (${header.chrRamBytes / 1024} KB vol, ${header.chrNvramBytes / 1024} KB bat)
    .byte %${b[12].toString(2).padStart(8, '0')}            ; Flags 12: Timing (${header.tvSystem.toUpperCase()})
    .byte %${b[13].toString(2).padStart(8, '0')}            ; Flags 13: Extended console type ($${b[13].toString(16)})
    .byte %${b[14].toString(2).padStart(8, '0')}            ; Flags 14: Misc ROMs count ($${b[14].toString(16)})
    .byte %${b[15].toString(2).padStart(8, '0')}            ; Flags 15: Expansion device ($${b[15].toString(16)})`
    : `    .byte $${b[8].toString(16).padStart(2, '0')}                    ; Flags 8: PRG-RAM size (${b[8] * 8 || 8} KB)
    .byte $${b[9].toString(16).padStart(2, '0')}                    ; Flags 9: TV system (${header.tvSystem.toUpperCase()})
    .byte $00, $00, $00, $00     ; Flags 10-13: Unused zero padding
    .byte $00, $00               ; Flags 14-15: Unused zero padding`
}
`;
}

export function exportToNesAsm(header: NesHeaderData): string {
  const b = header.bytes;
  const isNes2 = header.format === 'nes2';
  return `; NESASM 16-byte Header
    .inesprg ${b[4]}              ; ${Math.round(header.prgRomBytes / 1024)} KB PRG
    .ineschr ${b[5]}              ; ${Math.round(header.chrRomBytes / 1024)} KB CHR
    .inesmap ${header.mapper}             ; Mapper ${header.mapper}
    .inesmir ${header.mirroring === 'vertical' ? 1 : 0}              ; 0: Horizontal, 1: Vertical
; Raw bytes:
    .db $4E, $45, $53, $1A, $${b[4].toString(16)}, $${b[5].toString(16)}, $${b[6].toString(16)}, $${b[7].toString(16)}
    .db $${b[8].toString(16)}, $${b[9].toString(16)}, $${b[10].toString(16)}, $${b[11].toString(16)}, $${b[12].toString(16)}, $${b[13].toString(16)}, $${b[14].toString(16)}, $${b[15].toString(16)}
`;
}

export function exportToAsm6(header: NesHeaderData): string {
  const b = header.bytes;
  return `; ASM6 Header Definition
    db "NES", $1A
    db $${b[4].toString(16).padStart(2, '0')}, $${b[5].toString(16).padStart(2, '0')}, $${b[6].toString(16).padStart(2, '0')}, $${b[7].toString(16).padStart(2, '0')}
    db $${b[8].toString(16).padStart(2, '0')}, $${b[9].toString(16).padStart(2, '0')}, $${b[10].toString(16).padStart(2, '0')}, $${b[11].toString(16).padStart(2, '0')}
    db $${b[12].toString(16).padStart(2, '0')}, $${b[13].toString(16).padStart(2, '0')}, $${b[14].toString(16).padStart(2, '0')}, $${b[15].toString(16).padStart(2, '0')}
`;
}

export function exportToC(header: NesHeaderData): string {
  const b = header.bytes;
  const isNes2 = header.format === 'nes2';
  return `/**
 * NES ROM Header (${isNes2 ? 'NES 2.0' : 'iNES 1.0'})
 * Mapper: ${header.mapper} | PRG: ${header.prgRomBytes / 1024} KB | CHR: ${header.chrRomBytes / 1024} KB
 */
#include <stdint.h>

const uint8_t nes_header[16] = {
    0x4E, 0x45, 0x53, 0x1A, // 'N', 'E', 'S', 0x1A (DOS EOF)
    0x${b[4].toString(16).toUpperCase().padStart(2, '0')},                   // Byte 4: PRG-ROM size ($${b[4].toString(16).toUpperCase()})
    0x${b[5].toString(16).toUpperCase().padStart(2, '0')},                   // Byte 5: CHR-ROM size ($${b[5].toString(16).toUpperCase()})
    0x${b[6].toString(16).toUpperCase().padStart(2, '0')},                   // Byte 6: Flags 6 (Mirroring: ${header.mirroring}, Battery: ${header.battery})
    0x${b[7].toString(16).toUpperCase().padStart(2, '0')},                   // Byte 7: Flags 7 (Format: ${header.format})
    0x${b[8].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[9].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[10].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[11].toString(16).toUpperCase().padStart(2, '0')},
    0x${b[12].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[13].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[14].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[15].toString(16).toUpperCase().padStart(2, '0')}
};
`;
}

export function exportToRust(header: NesHeaderData): string {
  const b = header.bytes;
  return `/// 16-byte NES ROM Header
pub const NES_HEADER: [u8; 16] = [
    0x4E, 0x45, 0x53, 0x1A,
    0x${b[4].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[5].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[6].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[7].toString(16).toUpperCase().padStart(2, '0')},
    0x${b[8].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[9].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[10].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[11].toString(16).toUpperCase().padStart(2, '0')},
    0x${b[12].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[13].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[14].toString(16).toUpperCase().padStart(2, '0')}, 0x${b[15].toString(16).toUpperCase().padStart(2, '0')},
];
`;
}

export function exportToDisassemblyReport(header: NesHeaderData): string {
  const b = header.bytes;
  const mapperInfo = KNOWN_MAPPERS.find((m) => m.number === header.mapper);
  const expansionInfo = NES_EXPANSION_DEVICES.find((d) => d.id === header.expansionDevice);

  return `================================================================================
NES ROM HEADER DISASSEMBLY & SPECIFICATION REPORT
================================================================================
Header Hex Dump:
${Array.from(b)
  .map((v, i) => `[Byte ${i.toString().padStart(2, '0')}]: 0x${v.toString(16).toUpperCase().padStart(2, '0')} (${v.toString(2).padStart(8, '0')}b)`)
  .join('\n')}

Format:            ${header.format === 'nes2' ? 'NES 2.0 (Modern Extended)' : 'iNES 1.0 (Classic)'}
Mapper Number:     ${header.mapper} ${mapperInfo ? `(${mapperInfo.name})` : ''}
${header.format === 'nes2' ? `Submapper:         ${header.submapper}\n` : ''}PRG-ROM Size:      ${header.prgRomBytes / 1024} KB (${header.prgRomBytes.toLocaleString()} bytes)
CHR-ROM Size:      ${header.chrRomBytes / 1024} KB (${header.chrRomBytes.toLocaleString()} bytes${header.chrRomBytes === 0 ? ' [uses CHR-RAM]' : ''})
PRG-RAM Size:      ${header.prgRamBytes / 1024} KB volatile
PRG-NVRAM Size:    ${header.prgNvramBytes / 1024} KB battery-backed
CHR-RAM Size:      ${header.chrRamBytes / 1024} KB volatile
CHR-NVRAM Size:    ${header.chrNvramBytes / 1024} KB battery-backed

Mirroring Mode:    ${header.mirroring.toUpperCase()}
Battery Present:   ${header.battery ? 'YES (PRG-RAM retains data on power-off)' : 'NO'}
512-Byte Trainer:  ${header.trainer ? 'YES (Present between header and PRG-ROM)' : 'NO'}
Four-Screen VRAM:  ${header.fourScreen ? 'YES (Additional 2KB VRAM on cartridge)' : 'NO'}
VS Unisystem:      ${header.vsUnisystem ? 'YES' : 'NO'}
PlayChoice-10:     ${header.playChoice10 ? 'YES' : 'NO'}
TV System / Clock: ${header.tvSystem.toUpperCase()}
${header.format === 'nes2' ? `Console Type:      ${header.consoleType === 0 ? 'Standard NES / Famicom' : header.consoleType}\nExpansion Device:  ${expansionInfo ? expansionInfo.name : header.expansionDevice}\n` : ''}
${mapperInfo ? `Hardware Notes:   ${mapperInfo.description}\n` : ''}================================================================================`;
}

// Generate valid, playable test skeleton ROM with standard 6502 reset vector
export function generateSkeletonRom(headerBytes: Uint8Array): Uint8Array {
  const header = parseHeaderBytes(headerBytes);
  const trainerSize = header.trainer ? 512 : 0;
  const prgSize = Math.max(16384, header.prgRomBytes);
  const chrSize = header.chrRomBytes;

  const totalSize = 16 + trainerSize + prgSize + chrSize;
  const rom = new Uint8Array(totalSize);

  // 1. Copy Header
  rom.set(headerBytes.slice(0, 16), 0);

  // 2. Trainer offset
  let offset = 16;
  if (trainerSize > 0) {
    // Fill trainer with NOPs (0xEA)
    rom.fill(0xea, offset, offset + 512);
    offset += 512;
  }

  // 3. PRG ROM offset
  const prgOffset = offset;
  // Fill PRG with 0xFF
  rom.fill(0xff, prgOffset, prgOffset + prgSize);

  // Write simple 6502 startup code at start of PRG ($8000)
  // SEI ($78), CLD ($D8), LDA #$00 ($A9, $00), STA $2000 ($8D, $00, $20), STA $2001 ($8D, $01, $20), JMP $8000 ($4C, $00, $80)
  const code = new Uint8Array([
    0x78,             // SEI
    0xd8,             // CLD
    0xa9, 0x00,       // LDA #$00
    0x8d, 0x00, 0x20, // STA $2000 (Disable NMI)
    0x8d, 0x01, 0x20, // STA $2001 (Disable Rendering)
    0x4c, 0x00, 0x80, // JMP $8000 (Infinite safe loop)
  ]);
  rom.set(code, prgOffset);

  // Write 6502 interrupt vectors at the very end of PRG ROM ($FFFA-$FFFF):
  // NMI ($FFFA-$FFFB) -> $8000
  // RESET ($FFFC-$FFFD) -> $8000
  // IRQ/BRK ($FFFE-$FFFF) -> $8000
  const vectorsOffset = prgOffset + prgSize - 6;
  rom[vectorsOffset + 0] = 0x00; // NMI LSB
  rom[vectorsOffset + 1] = 0x80; // NMI MSB ($8000)
  rom[vectorsOffset + 2] = 0x00; // RESET LSB
  rom[vectorsOffset + 3] = 0x80; // RESET MSB ($8000)
  rom[vectorsOffset + 4] = 0x00; // IRQ LSB
  rom[vectorsOffset + 5] = 0x80; // IRQ MSB ($8000)

  // 4. CHR ROM
  offset += prgSize;
  if (chrSize > 0) {
    // Fill CHR with zero or pattern
    rom.fill(0x00, offset, offset + chrSize);
  }

  return rom;
}
