// news-image-20261127 — entry for make.fun
// Draws a 1024x1024 newspaper front page summing up the world news of
// Friday 27 November 2026 and writes it to /output/entry.png.
// Node 22, standard library only. No network. Deterministic: the same
// input always produces the same bytes, so two runs write identical files.
// The text is drawn with a 1-bit bitmap font (DejaVu Sans Bold, 18px,
// rendered to bits) embedded below as FONT: each glyph is its width and
// 22 rows of hex-packed bits, top row first, baseline near row 17.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;
const FONT_H = 22;
type Glyph = { w: number; rows: string[] };
const FONT: Record<string, Glyph> = {
" ": { "w": 6, "rows": [] },
"'": { "w": 3, "rows": ["0", "0", "0", "0", "0", "0", "6", "6", "6", "6", "6", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"] },
",": { "w": 5, "rows": ["00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "38", "38", "38", "38", "70", "60"] },
"-": { "w": 7, "rows": ["00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "00", "7e", "7e", "7e", "00", "00", "00", "00", "00", "00", "00"] },
".": { "w": 4, "rows": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "7", "7", "7", "0", "0", "0"] },
"0": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "0f8", "3fc", "39e", "78e", "70f", "70f", "70f", "70f", "70f", "78e", "39e", "3fc", "0f8", "000", "000", "000"] },
"1": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "7c0", "fc0", "dc0", "1c0", "1c0", "1c0", "1c0", "1c0", "1c0", "1c0", "1c0", "ff8", "ff8", "000", "000", "000"] },
"2": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "3f0", "ff8", "e3c", "03c", "03c", "03c", "078", "0f0", "1e0", "3c0", "780", "ffc", "ffc", "000", "000", "000"] },
"4": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "03c", "07c", "0fc", "1fc", "19c", "39c", "71c", "61c", "7ff", "7ff", "01c", "01c", "01c", "000", "000", "000"] },
"5": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "7f8", "7f8", "700", "700", "7f0", "7f8", "43c", "01c", "01c", "01c", "c3c", "ff8", "3f0", "000", "000", "000"] },
"6": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "1f8", "3fc", "784", "700", "ff0", "ffc", "f1c", "f1e", "f1e", "f1c", "71c", "3f8", "1f0", "000", "000", "000"] },
"7": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "ffc", "ffc", "03c", "038", "078", "070", "0f0", "0f0", "0e0", "1e0", "1c0", "3c0", "380", "000", "000", "000"] },
"9": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "1f8", "3fc", "79e", "70e", "70e", "70e", "79e", "3fe", "1fe", "00e", "21c", "3f8", "1f0", "000", "000", "000"] },
":": { "w": 4, "rows": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "e", "e", "e", "0", "0", "0", "0", "e", "e", "e", "0", "0", "0"] },
";": { "w": 5, "rows": ["00", "00", "00", "00", "00", "00", "00", "00", "00", "70", "70", "70", "00", "00", "00", "00", "70", "70", "70", "70", "e0", "c0"] },
"A": { "w": 14, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "0780", "0fc0", "0fc0", "0fc0", "1de0", "1ce0", "3ce0", "3870", "3ff0", "7ff8", "7038", "7038", "f03c", "0000", "0000", "0000"] },
"B": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "7f8", "7fc", "71e", "71e", "71e", "7fc", "7fc", "71e", "70e", "70e", "71e", "7fe", "7f8", "000", "000", "000"] },
"C": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "07e0", "1ff0", "3c10", "7800", "7800", "7800", "7000", "7800", "7800", "7800", "3c10", "1ff0", "07e0", "0000", "0000", "0000"] },
"D": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "7f80", "7fe0", "71f0", "7070", "7078", "7078", "7078", "7078", "7078", "7070", "71f0", "7fe0", "7f80", "0000", "0000", "0000"] },
"E": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "7fc", "7fc", "700", "700", "700", "7fc", "7fc", "700", "700", "700", "700", "7fc", "7fc", "000", "000", "000"] },
"F": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "7fc", "7fc", "700", "700", "700", "7fc", "7fc", "700", "700", "700", "700", "700", "700", "000", "000", "000"] },
"G": { "w": 14, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "07f0", "1ff8", "3e18", "7800", "7800", "7800", "70fc", "78fc", "783c", "783c", "3c3c", "1ffc", "07f0", "0000", "0000", "0000"] },
"H": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "7070", "7070", "7070", "7070", "7070", "7ff0", "7ff0", "7070", "7070", "7070", "7070", "7070", "7070", "0000", "0000", "0000"] },
"I": { "w": 5, "rows": ["00", "00", "00", "00", "00", "00", "70", "70", "70", "70", "70", "70", "70", "70", "70", "70", "70", "70", "70", "00", "00", "00"] },
"J": { "w": 8, "rows": ["00", "00", "00", "00", "00", "00", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "0e", "1e", "1e", "7c"] },
"K": { "w": 14, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "70f0", "71e0", "73c0", "7780", "7f00", "7e00", "7e00", "7f00", "7780", "73c0", "71e0", "70f0", "7078", "0000", "0000", "0000"] },
"L": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "700", "700", "700", "700", "700", "700", "700", "700", "700", "700", "700", "7fc", "7fc", "000", "000", "000"] },
"M": { "w": 16, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "781e", "7c3e", "7c3e", "7e7e", "7e7e", "77ee", "77ee", "73ce", "73ce", "718e", "700e", "700e", "700e", "0000", "0000", "0000"] },
"N": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "7870", "7870", "7c70", "7c70", "7e70", "7670", "7770", "73f0", "73f0", "71f0", "71f0", "70f0", "70f0", "0000", "0000", "0000"] },
"O": { "w": 15, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "07e0", "1ff0", "3c78", "783c", "781c", "781c", "701c", "781c", "781c", "783c", "3c78", "1ff0", "07e0", "0000", "0000", "0000"] },
"P": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "7f8", "7fc", "71e", "70e", "70e", "70e", "71e", "7fc", "7f8", "700", "700", "700", "700", "000", "000", "000"] },
"R": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "7f80", "7fc0", "71e0", "71e0", "71e0", "71c0", "7f80", "7f80", "73c0", "71e0", "70e0", "70f0", "7070", "0000", "0000", "0000"] },
"S": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "3f8", "7fc", "70c", "e00", "f00", "7f0", "7fc", "1fc", "03e", "01e", "c1c", "ffc", "7f8", "000", "000", "000"] },
"T": { "w": 13, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "fff0", "fff0", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0f00", "0000", "0000", "0000"] },
"U": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "707", "707", "707", "707", "707", "707", "707", "707", "70f", "70f", "78f", "3fe", "1f8", "000", "000", "000"] },
"V": { "w": 14, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "f03c", "7038", "7078", "7878", "3870", "3cf0", "3ce0", "1ce0", "1fe0", "0fc0", "0fc0", "0fc0", "0780", "0000", "0000", "0000"] },
"W": { "w": 20, "rows": ["00000", "00000", "00000", "00000", "00000", "00000", "70f0e", "70f0e", "70f1e", "79f1e", "39f9c", "39b9c", "399bc", "3f9bc", "1f9f8", "1f1f8", "1f0f8", "1f0f8", "1f0f0", "00000", "00000", "00000"] },
"Y": { "w": 15, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "783c", "3c78", "3c78", "1ef0", "0fe0", "0fe0", "07c0", "0380", "0380", "0380", "0380", "0380", "0380", "0000", "0000", "0000"] },
"a": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "3f8", "3fc", "01c", "01e", "3fe", "7fe", "71e", "71e", "7fe", "3de", "000", "000", "000"] },
"b": { "w": 12, "rows": ["000", "000", "000", "000", "000", "f00", "f00", "f00", "f00", "f78", "ffc", "f9e", "f0e", "f0e", "f0e", "f0e", "f9e", "ffc", "f78", "000", "000", "000"] },
"c": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "0f8", "3fc", "780", "700", "700", "700", "700", "780", "3fc", "0f8", "000", "000", "000"] },
"d": { "w": 12, "rows": ["000", "000", "000", "000", "000", "00e", "00e", "00e", "00e", "1ee", "3fe", "79e", "70e", "70e", "70e", "70e", "79e", "3fe", "1ee", "000", "000", "000"] },
"e": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "1f8", "3fc", "79e", "70e", "7fe", "7fe", "700", "786", "3fe", "1fc", "000", "000", "000"] },
"f": { "w": 8, "rows": ["00", "00", "00", "00", "00", "1f", "3f", "38", "38", "ff", "ff", "38", "38", "38", "38", "38", "38", "38", "38", "00", "00", "00"] },
"g": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "1ee", "3fe", "79e", "70e", "70e", "70e", "70e", "79e", "3fe", "1ee", "00e", "21e", "3fc"] },
"h": { "w": 11, "rows": ["000", "000", "000", "000", "000", "f00", "f00", "f00", "f00", "f78", "ffc", "f9c", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "000", "000", "000"] },
"i": { "w": 4, "rows": ["0", "0", "0", "0", "0", "f", "f", "f", "0", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "0", "0", "0"] },
"j": { "w": 6, "rows": ["00", "00", "00", "00", "00", "3c", "3c", "3c", "00", "3c", "3c", "3c", "3c", "3c", "3c", "3c", "3c", "3c", "3c", "3c", "38", "f8"] },
"k": { "w": 12, "rows": ["000", "000", "000", "000", "000", "f00", "f00", "f00", "f00", "f1c", "f38", "f70", "fe0", "fc0", "fe0", "ff0", "f78", "f3c", "f1e", "000", "000", "000"] },
"l": { "w": 4, "rows": ["0", "0", "0", "0", "0", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "0", "0", "0"] },
"m": { "w": 17, "rows": ["00000", "00000", "00000", "00000", "00000", "00000", "00000", "00000", "00000", "f71e0", "ffbf0", "fbe70", "f1c70", "f1c70", "f1c70", "f1c70", "f1c70", "f1c70", "f1c70", "00000", "00000", "00000"] },
"n": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "f78", "ffc", "f9c", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "000", "000", "000"] },
"o": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "1f8", "3fc", "79e", "70e", "70f", "70f", "70e", "79e", "3fc", "1f8", "000", "000", "000"] },
"p": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "f78", "ffc", "f9e", "f0e", "f0e", "f0e", "f0e", "f9e", "ffc", "f78", "f00", "f00", "f00"] },
"q": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "1ee", "3fe", "79e", "70e", "70e", "70e", "70e", "79e", "3fe", "1ee", "00e", "00e", "00e"] },
"r": { "w": 8, "rows": ["00", "00", "00", "00", "00", "00", "00", "00", "00", "f7", "ff", "f8", "f0", "f0", "f0", "f0", "f0", "f0", "f0", "00", "00", "00"] },
"s": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "3f0", "7f8", "708", "700", "7f0", "3fc", "03c", "63c", "7f8", "3f0", "000", "000", "000"] },
"t": { "w": 9, "rows": ["000", "000", "000", "000", "000", "000", "380", "380", "380", "ff0", "ff0", "380", "380", "380", "380", "380", "380", "3f0", "1f0", "000", "000", "000"] },
"u": { "w": 11, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "f1c", "73c", "7fc", "3dc", "000", "000", "000"] },
"v": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "f0e", "70e", "71e", "39c", "39c", "3b8", "1f8", "1f8", "1f0", "0f0", "000", "000", "000"] },
"w": { "w": 16, "rows": ["0000", "0000", "0000", "0000", "0000", "0000", "0000", "0000", "0000", "71c7", "71c7", "73ce", "7bee", "3b6e", "3b6e", "3f7c", "1e7c", "1e3c", "1e3c", "0000", "0000", "0000"] },
"x": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "71e", "79c", "3f8", "1f8", "0f0", "1f0", "1f8", "3bc", "79c", "70e", "000", "000", "000"] },
"y": { "w": 12, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "f0e", "70e", "71e", "39c", "39c", "3f8", "1f8", "1f8", "0f0", "0f0", "0f0", "0e0", "3e0"] },
"z": { "w": 10, "rows": ["000", "000", "000", "000", "000", "000", "000", "000", "000", "7fc", "7fc", "078", "078", "0f0", "1e0", "3c0", "780", "7fc", "7fc", "000", "000", "000"] },
};

// ---- pixel buffer ----
type RGB = [number, number, number];
const PAPER: RGB = [244, 239, 228];
const NAVY: RGB = [15, 42, 68];
const GOLD: RGB = [242, 183, 5];
const INK: RGB = [22, 33, 43];
const BODY: RGB = [51, 51, 51];
const MUTED: RGB = [90, 107, 122];
const WHITE: RGB = [255, 255, 255];
const LIGHT: RGB = [200, 214, 226];
const RED: RGB = [192, 57, 43];
const PURPLE: RGB = [125, 60, 152];
const OCHRE: RGB = [185, 119, 14];
const TEAL: RGB = [17, 122, 101];
const SLATE: RGB = [46, 64, 83];
const BLUE: RGB = [26, 82, 118];

const px = new Uint8Array(W * H * 3);
function fillAll(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2];
  }
}
function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}

// ---- text: nearest-neighbour scaled 1-bit glyphs ----
// A glyph's advance is its width plus 2 units of side bearing, times scale.
function glyphAdvance(ch: string, scale: number): number {
  const g = FONT[ch];
  if (!g) return 8 * scale;
  return (g.w + 2) * scale;
}
function textWidth(s: string, scale: number): number {
  let w = 0;
  for (const ch of s) w += glyphAdvance(ch, scale);
  return w;
}
function drawGlyph(x: number, y: number, ch: string, scale: number, c: RGB): void {
  // Pixel writes need whole-number coordinates: a fractional x would make
  // every setPx a no-op on the typed array, so the glyph would vanish.
  x = Math.floor(x);
  y = Math.floor(y);
  const g = FONT[ch];
  if (!g || g.rows.length === 0) return;
  const outW = Math.ceil(g.w * scale);
  const outH = Math.ceil(FONT_H * scale);
  for (let oy = 0; oy < outH; oy++) {
    const sy = Math.min(FONT_H - 1, Math.floor(oy / scale));
    const rowHex = g.rows[sy];
    if (!rowHex) continue;
    const rowVal = parseInt(rowHex, 16);
    const bits = rowHex.length * 4;
    for (let ox = 0; ox < outW; ox++) {
      const sx = Math.min(g.w - 1, Math.floor(ox / scale));
      const bit = (rowVal >> (bits - 1 - sx)) & 1;
      if (bit) setPx(x + ox, y + oy, c);
    }
  }
}
function drawText(x: number, y: number, s: string, scale: number, c: RGB): number {
  let cx = x;
  for (const ch of s) {
    drawGlyph(cx, y, ch, scale, c);
    cx += glyphAdvance(ch, scale);
  }
  return cx;
}
function wrapText(s: string, scale: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const t = cur ? cur + " " + word : word;
    if (textWidth(t, scale) <= maxW || !cur) {
      cur = t;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(x: number, y: number, s: string, scale: number, c: RGB, maxW: number, leading: number): number {
  const lines = wrapText(s, scale, maxW);
  let yy = y;
  for (const ln of lines) {
    drawText(x, yy, ln, scale, c);
    yy += leading;
  }
  return yy;
}
function drawTag(x: number, y: number, label: string, bg: RGB): void {
  const tw = textWidth(label, 1);
  rect(x, y, tw + 20, 24, bg);
  drawText(x + 10, y + 1, label, 1, WHITE);
}

// ---- PNG encoding (stdlib zlib + hand-rolled CRC32) ----
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- layout: the front page ----
// Header
fillAll(PAPER);
rect(0, 0, W, 168, NAVY);
drawText(36, 18, "WORLD NEWS - IN ONE IMAGE", 1, GOLD);
drawText(36, 42, "The World Today", 3, WHITE);
drawText(36, 108, "Friday, 27 November 2026", 2, WHITE);
drawText(36, 146, "The day's most consequential stories, from every region.", 1, LIGHT);

// Lead story
const LX = 28;
const LW = W - 56;
rect(LX, 178, LW, 150, WHITE);
rect(LX, 178, 8, 150, RED);
drawTag(LX + 20, 194, "MIDDLE EAST - CONFLICT", RED);
drawText(LX + 20, 226, "Drone attack in Kuwait kills two Italians", 1.5, INK);
drawPara(LX + 20, 268, "Two Italian defence technicians were killed in a drone strike on a Kuwaiti air-defence site. Kuwait and Italy blame Iranian drones; Iran denies it.", 1, BODY, LW - 40, 24);

// Six stories, two columns by three rows
type Card = { color: RGB; tag: string; head: string; body: string };
const CARDS: Card[] = [
  { color: NAVY, tag: "EUROPE - DIPLOMACY", head: "Trump urges Putin to end aggression in Europe", body: "President Trump said he told Vladimir Putin to stop military aggression across Europe." },
  { color: PURPLE, tag: "ASIA - CONFLICT", head: "North Korea reportedly halts arms aid to Russia", body: "Ukrainian intelligence said Pyongyang has suspended missile and artillery deliveries to Moscow." },
  { color: OCHRE, tag: "AFRICA - HEALTH", head: "Congo Ebola cases pass 12,000", body: "The outbreak has reached 12,021 cases and 5,904 deaths, the fastest-growing Ebola outbreak on record." },
  { color: TEAL, tag: "TRADE - USA", head: "US partners reject new tariff case", body: "China, Japan and other partners rejected US tariffs on 14 economies, worth about half of world output." },
  { color: SLATE, tag: "EUROPE - ECONOMY", head: "EU picks De Cos as next ECB chief", body: "European leaders chose Pablo Hernandez de Cos to succeed Christine Lagarde at the ECB on 7 February." },
  { color: BLUE, tag: "USA - WEATHER", head: "Thanksgiving storm cuts power to 900,000", body: "A storm on Thanksgiving left more than 900,000 without power in the US and cancelled 400 flights." },
];
const GX = 28;
const GAP = 14;
const CW = (W - 56 - GAP) / 2;
const ROW_H = 204;
const GY = 338;
for (let i = 0; i < CARDS.length; i++) {
  const card = CARDS[i];
  const r = Math.floor(i / 2);
  const c = i % 2;
  const x = GX + c * (CW + GAP);
  const y = GY + r * (ROW_H + 10);
  rect(x, y, CW, ROW_H, WHITE);
  rect(x, y, CW, 5, card.color);
  drawTag(x + 16, y + 14, card.tag, card.color);
  drawPara(x + 16, y + 48, card.head, 1.5, INK, CW - 32, 36);
  const bodyY = y + 48 + 72;
  drawPara(x + 16, bodyY, card.body, 1, BODY, CW - 32, 24);
}

// Footer
const FY = 968;
drawText(36, FY, "All events happened or were first reported on 27 November 2026.", 1, NAVY);
drawText(36, FY + 22, "Sources: Associated Press, Reuters, BBC, CNN, Washington Post, Financial Times.", 1, MUTED);

// ---- main ----
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG());
