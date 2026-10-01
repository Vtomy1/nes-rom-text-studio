import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint to parse natural language or complex description into NES ROM Header specs
app.post('/api/gemini/parse-header', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt text is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment secrets.',
      });
    }

    const systemInstruction = `You are an expert NES / Famicom homebrew and emulation hardware engineer.
Given a user query or game description (e.g. "Super Mario Bros", "Castlevania 3 with MMC5", "Homebrew action RPG with 512KB PRG, 256KB CHR, battery save, NES 2.0 format", or any custom specs), determine the exact 16-byte iNES or NES 2.0 header.
Header format specification:
Byte 0-3: 0x4E, 0x45, 0x53, 0x1A ("NES\\x1A")
Byte 4: PRG ROM size in 16KB units (LSB)
Byte 5: CHR ROM size in 8KB units (0 = CHR RAM)
Byte 6: Flags 6 (bit 0: mirroring [0=horizontal, 1=vertical], bit 1: battery, bit 2: trainer [512B], bit 3: four-screen VRAM, bits 4-7: mapper lower nibble)
Byte 7: Flags 7 (bit 0: VS Unisystem, bit 1: PlayChoice-10, bits 2-3: NES 2.0 flag [equal to 2/0b10 if NES 2.0], bits 4-7: mapper upper nibble)
Byte 8: Flags 8 (NES 2.0 mapper bits 8-11 in bits 0-3, submapper in bits 4-7. In iNES 1.0: PRG-RAM size in 8KB)
Byte 9: Flags 9 (NES 2.0: PRG MSB in bits 0-3, CHR MSB in bits 4-7. In iNES 1.0: TV system 0=NTSC, 1=PAL)
Byte 10: Flags 10 (NES 2.0 PRG RAM sizes)
Byte 11: Flags 11 (NES 2.0 CHR RAM sizes)
Byte 12: Flags 12 (NES 2.0 CPU/PPU timing: 0=NTSC, 1=PAL, 2=Multi, 3=Dendy)
Byte 13: Flags 13 (NES 2.0 console type)
Byte 14: Flags 14 (NES 2.0 misc ROMs)
Byte 15: Flags 15 (NES 2.0 default expansion device: 1=standard controller, etc.)

Return ONLY valid JSON matching this schema:
{
  "title": string, // Identified game or setup title
  "format": "ines1" | "nes2",
  "mapper": number, // integer mapper number (0-4095)
  "submapper": number, // integer 0-15
  "prgRomBytes": number, // PRG ROM in bytes, e.g. 32768, 131072, 524288
  "chrRomBytes": number, // CHR ROM in bytes (0 if CHR RAM)
  "chrRamBytes": number, // CHR RAM in bytes (e.g. 8192 if chrRomBytes is 0)
  "prgRamBytes": number, // PRG RAM in bytes (e.g. 8192)
  "mirroring": "horizontal" | "vertical" | "four_screen",
  "battery": boolean,
  "trainer": boolean,
  "tvSystem": "ntsc" | "pal" | "dual" | "dendy",
  "expansionDevice": number, // 0=unspecified, 1=standard controller, etc.
  "bytes": number[], // array of exactly 16 numbers (0-255) for bytes 0 to 15
  "explanation": string // concise technical breakdown of mapper, memory map, and quirks
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating header with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to parse NES ROM header with AI',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
