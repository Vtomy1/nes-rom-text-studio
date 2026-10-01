export interface NesHeaderData {
  bytes: Uint8Array; // Exactly 16 bytes
  format: 'ines1' | 'nes2';
  mapper: number;
  submapper: number;
  prgRomBytes: number;
  chrRomBytes: number;
  prgRamBytes: number;
  prgNvramBytes: number;
  chrRamBytes: number;
  chrNvramBytes: number;
  mirroring: 'horizontal' | 'vertical' | 'four_screen' | 'single_screen';
  battery: boolean;
  trainer: boolean;
  fourScreen: boolean;
  vsUnisystem: boolean;
  playChoice10: boolean;
  tvSystem: 'ntsc' | 'pal' | 'dual' | 'dendy';
  consoleType: number;
  expansionDevice: number;
  hasDiskDudeCorruption: boolean;
  warnings: string[];
}

export interface NesMapperInfo {
  number: number;
  name: string;
  boardClass: string;
  description: string;
  notableGames: string[];
  defaultMirroring?: 'horizontal' | 'vertical' | 'mapper_controlled' | 'single_screen';
  hasChrRamDefault?: boolean;
}

export interface NesPreset {
  id: string;
  name: string;
  category: 'commercial' | 'homebrew';
  description: string;
  bytes: number[];
}

export const KNOWN_MAPPERS: NesMapperInfo[] = [
  {
    number: 0,
    name: 'NROM',
    boardClass: 'NROM-128 / NROM-256',
    description: 'No bank switching. Fixed 16KB or 32KB PRG-ROM and 8KB CHR-ROM.',
    notableGames: ['Super Mario Bros.', 'Donkey Kong', 'Pac-Man', 'Duck Hunt', 'Excitebike'],
    defaultMirroring: 'vertical',
  },
  {
    number: 1,
    name: 'MMC1 / SxROM',
    boardClass: 'SAROM, SBROM, SCROM, SEROM, SGROM, SKROM, SLROM, SNROM, SOROM',
    description: 'Nintendo multi-memory controller. Serial bus register, switchable PRG/CHR banks, configurable mirroring.',
    notableGames: ['The Legend of Zelda', 'Metroid', 'Mega Man 2', 'Kid Icarus', 'Dragon Warrior'],
    defaultMirroring: 'mapper_controlled',
  },
  {
    number: 2,
    name: 'UNROM / UOROM / UxROM',
    boardClass: 'UNROM, UOROM',
    description: 'Simple 74HC161/74HC32 discrete logic. Bankswitched PRG-ROM, 8KB CHR-RAM, fixed last 16KB bank.',
    notableGames: ['Contra', 'Castlevania', 'DuckTales', 'Mega Man', 'Metal Gear'],
    hasChrRamDefault: true,
  },
  {
    number: 3,
    name: 'CNROM',
    boardClass: 'CNROM',
    description: 'Fixed 32KB PRG-ROM with up to 32KB CHR-ROM bank switching (8KB banks).',
    notableGames: ['Solomon\'s Key', 'Adventure Island', 'Arkanoid', 'Gradius (JP)', 'Milon\'s Secret Castle'],
  },
  {
    number: 4,
    name: 'MMC3 / TxROM',
    boardClass: 'TBROM, TEROM, TFROM, TGROM, TKROM, TLROM, TLSROM, TNROM, TQROM, TR1ROM, TSROM, TVROM',
    description: 'Most popular ASIC mapper. Scanline counter IRQ, fine 1KB/2KB CHR bank switching, PRG banking, PRG-RAM protection.',
    notableGames: ['Super Mario Bros. 3', 'Mega Man 3-6', 'Kirby\'s Adventure', 'Ninja Gaiden II/III', 'Batman'],
    defaultMirroring: 'mapper_controlled',
  },
  {
    number: 5,
    name: 'MMC5 / ExROM',
    boardClass: 'EKROM, ELROM, ETROM, EWROM',
    description: 'Nintendo\'s most complex custom ASIC. Extended attribute table, sound expansion (2 pulse + PCM), vertical split screen, 1KB CHR switching, 8KB PRG switching.',
    notableGames: ['Castlevania III: Dracula\'s Curse', 'Just Breed', 'Romance of the Three Kingdoms II', 'Laser Invasion'],
    defaultMirroring: 'mapper_controlled',
  },
  {
    number: 7,
    name: 'AxROM / AOROM',
    boardClass: 'AMROM, ANROM, AOROM',
    description: 'Rare discrete logic mapper. Single-screen mirroring switchable via bank register, 32KB PRG banking, 8KB CHR-RAM.',
    notableGames: ['Battletoads', 'Marble Madness', 'Cobra Triangle', 'Solar Jetman', 'Archon'],
    defaultMirroring: 'single_screen',
    hasChrRamDefault: true,
  },
  {
    number: 9,
    name: 'MMC2 / PxROM',
    boardClass: 'PNROM, PEOROM',
    description: 'Specialized mapper with automatic tile-fetch latch switching for animated backgrounds and large character portraits.',
    notableGames: ['Mike Tyson\'s Punch-Out!!'],
    defaultMirroring: 'horizontal',
  },
  {
    number: 10,
    name: 'MMC4 / FxROM',
    boardClass: 'FJROM, FKROM',
    description: 'Successor to MMC2. 16KB PRG banking and automatic CHR latch switching.',
    notableGames: ['Fire Emblem', 'Fire Emblem Gaiden'],
  },
  {
    number: 11,
    name: 'Color Dreams',
    boardClass: 'Color Dreams discrete logic',
    description: 'Unlicensed mapper used for Christian and unlicensed games.',
    notableGames: ['Bible Adventures', 'Baby Boomer', 'Captain Comic', 'Crystal Mines'],
  },
  {
    number: 19,
    name: 'Namco 163',
    boardClass: 'NROM-like + Namcot 163 ASIC',
    description: 'Namco custom chip with up to 8 wavetable sound channels and battery-backed RAM.',
    notableGames: ['Final Lap', 'Erika to Satoru no Yume Bouken', 'Rolling Thunder (JP)'],
  },
  {
    number: 24,
    name: 'Konami VRC6a',
    boardClass: 'VRC6',
    description: 'Konami custom chip with 2 pulse waves + 1 sawtooth audio expansion.',
    notableGames: ['Akumajou Densetsu (Castlevania 3 JP)', 'Madara'],
  },
  {
    number: 69,
    name: 'Sunsoft 5B / FME-7',
    boardClass: 'Sunsoft-5A, Sunsoft-5B, FME-7',
    description: 'Advanced Sunsoft mapper. Sunsoft 5B variant includes YM2149 / AY-3-8910 sound generator (3 square waves).',
    notableGames: ['Gimmick!', 'Batman: Return of the Joker', 'Hebereke'],
  },
  {
    number: 71,
    name: 'Camerica / Codemasters',
    boardClass: 'BF9093, BF9096, BF9097',
    description: 'Discrete logic mapper for Codemasters games, similar to UNROM but with single-screen mirroring control.',
    notableGames: ['Micro Machines', 'FireHawk', 'The Fantastic Adventures of Dizzy'],
  },
  {
    number: 85,
    name: 'Konami VRC7',
    boardClass: 'VRC7',
    description: 'Konami FM synthesis chip based on Yamaha YM2413 (OPLL) with 6 FM audio channels.',
    notableGames: ['Lagrange Point'],
  },
  {
    number: 228,
    name: 'Action 52 / Active Enterprises',
    boardClass: 'Active 52 multicart',
    description: 'Multicart board used for infamous unlicensed multi-game cart.',
    notableGames: ['Action 52', 'Cheetahmen II'],
  },
];

export const NES_EXPANSION_DEVICES: { id: number; name: string }[] = [
  { id: 0, name: 'Unspecified / Default' },
  { id: 1, name: 'Standard NES Controllers (Two 2-button gamepads)' },
  { id: 2, name: 'NES Four Score / Satellite (4 Players)' },
  { id: 3, name: 'NES Zapper Light Gun' },
  { id: 4, name: 'Two Zappers' },
  { id: 5, name: 'Bandai Hyper Shot' },
  { id: 6, name: 'Power Pad / Family Trainer (Side A)' },
  { id: 7, name: 'Power Pad / Family Trainer (Side B)' },
  { id: 8, name: 'Family Computer Keyboard' },
  { id: 9, name: 'Subor Keyboard' },
  { id: 10, name: 'Family Computer Cassette Data Recorder' },
  { id: 12, name: 'Arkanoid Vaus Paddle (NES)' },
  { id: 13, name: 'Arkanoid Vaus Paddle (Famicom)' },
  { id: 18, name: 'SNES Mouse' },
];

export const PRESET_HEADERS: NesPreset[] = [
  {
    id: 'smb1',
    name: 'Super Mario Bros. (NROM-256)',
    category: 'commercial',
    description: '32KB PRG, 8KB CHR, Mapper 0 (NROM), Vertical Mirroring, NTSC',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'zelda1',
    name: 'The Legend of Zelda (MMC1, Battery)',
    category: 'commercial',
    description: '128KB PRG, 8KB CHR-RAM, Mapper 1 (MMC1), Battery Backed RAM, Horizontal Mirroring',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x00, 0x12, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'smb3',
    name: 'Super Mario Bros. 3 (MMC3)',
    category: 'commercial',
    description: '384KB PRG, 128KB CHR, Mapper 4 (MMC3), Vertical Mirroring',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x18, 0x10, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'contra',
    name: 'Contra (UNROM)',
    category: 'commercial',
    description: '128KB PRG, 0 CHR (8KB CHR RAM), Mapper 2 (UNROM), Vertical Mirroring',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'castlevania3',
    name: 'Castlevania III: Dracula\'s Curse (MMC5)',
    category: 'commercial',
    description: '256KB PRG, 128KB CHR, Mapper 5 (MMC5), Vertical Mirroring, 8KB PRG RAM',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x10, 0x10, 0x51, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'megaman2',
    name: 'Mega Man 2 (MMC1)',
    category: 'commercial',
    description: '256KB PRG, 0 CHR (8KB CHR RAM), Mapper 1 (MMC1), Vertical Mirroring',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x10, 0x00, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'battletoads',
    name: 'Battletoads (AOROM)',
    category: 'commercial',
    description: '256KB PRG, 0 CHR (8KB CHR RAM), Mapper 7 (AxROM), Single-screen Mirroring',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x10, 0x00, 0x70, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'punchout',
    name: 'Mike Tyson\'s Punch-Out!! (MMC2)',
    category: 'commercial',
    description: '128KB PRG, 128KB CHR, Mapper 9 (MMC2), Horizontal Mirroring, Tile-latch switching',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'homebrew-nrom',
    name: 'Homebrew Starter (NROM-128)',
    category: 'homebrew',
    description: '16KB PRG, 8KB CHR, Mapper 0, Vertical Mirroring, clean standard header',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  {
    id: 'homebrew-nes2-mmc3',
    name: 'Modern Homebrew (NES 2.0 MMC3)',
    category: 'homebrew',
    description: 'NES 2.0 format, 512KB PRG, 256KB CHR, 8KB PRG-RAM with Battery, NTSC timing',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x20, 0x20, 0x42, 0x08, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x01],
  },
  {
    id: 'homebrew-unrom512',
    name: 'UNROM 512 Flash Cart (Mapper 30)',
    category: 'homebrew',
    description: '512KB PRG, 32KB CHR-RAM, Mapper 30 (UNROM 512), 1-screen mirroring, 4-screen option',
    bytes: [0x4e, 0x45, 0x53, 0x1a, 0x20, 0x00, 0xe0, 0x18, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x01],
  },
];
