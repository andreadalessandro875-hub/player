import type { File } from 'expo-file-system';

/** Titolo, artista e copertina letti dai tag del file (ID3 per MP3, atomi per M4A/MP4). */
export type Tags = { title?: string; artist?: string; art?: { bytes: Uint8Array; ext: 'jpg' | 'png' } };

type Reader = { size: number; read(off: number, len: number): Promise<Uint8Array>; close(): void };

function openReader(file: File): Reader {
  const handle = file.open();
  const size = file.size;
  return {
    size,
    async read(off, len) {
      const n = Math.max(0, Math.min(len, size - off));
      if (!n) return new Uint8Array(0);
      handle.offset = off;
      return await handle.readBytes(n);
    },
    close() { try { handle.close(); } catch { /* già chiuso */ } },
  };
}

/* ---------- Decodifica del testo (Hermes non garantisce TextDecoder per tutte le codifiche) ---------- */
const latin1 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
function utf8(b: Uint8Array) {
  let out = '', i = 0;
  while (i < b.length) {
    const c = b[i++];
    if (c < 0x80) out += String.fromCharCode(c);
    else if (c >= 0xc0 && c < 0xe0 && i < b.length) out += String.fromCharCode(((c & 0x1f) << 6) | (b[i++] & 0x3f));
    else if (c >= 0xe0 && c < 0xf0 && i + 1 < b.length) {
      const c2 = b[i++], c3 = b[i++];
      out += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
    } else if (c >= 0xf0 && i + 2 < b.length) {
      const c2 = b[i++], c3 = b[i++], c4 = b[i++];
      const cp = (((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f)) - 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}
function utf16(b: Uint8Array, be: boolean) {
  let s = '';
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(be ? (b[i] << 8) | b[i + 1] : b[i] | (b[i + 1] << 8));
  return s;
}
const clean = (s: string) => s.replace(/^﻿/, '').split('\0')[0].trim();

function decodeText(data: Uint8Array) {
  const enc = data[0];
  let b = data.subarray(1);
  if (enc === 1) {
    if (b[0] === 0xfe && b[1] === 0xff) return clean(utf16(b.subarray(2), true));
    if (b[0] === 0xff && b[1] === 0xfe) return clean(utf16(b.subarray(2), false));
    return clean(utf16(b, false));
  }
  if (enc === 2) return clean(utf16(b, true));
  if (enc === 3) return clean(utf8(b));
  return clean(latin1(b));
}

/* ---------- ID3v2 ---------- */
const syncsafe = (b: Uint8Array, o: number) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]);

function parsePic(data: Uint8Array, ver: number): Tags['art'] {
  const enc = data[0];
  let i: number, ext: 'jpg' | 'png';
  if (ver === 2) {
    ext = latin1(data.subarray(1, 4)).toUpperCase() === 'PNG' ? 'png' : 'jpg';
    i = 4;
  } else {
    i = 1;
    while (i < data.length && data[i] !== 0) i++;
    ext = latin1(data.subarray(1, i)).toLowerCase().includes('png') ? 'png' : 'jpg';
    i++;
  }
  i++; // tipo di immagine
  if (enc === 1 || enc === 2) { while (i + 1 < data.length && !(data[i] === 0 && data[i + 1] === 0)) i += 2; i += 2; }
  else { while (i < data.length && data[i] !== 0) i++; i++; }
  return i < data.length ? { bytes: data.slice(i), ext } : undefined;
}

async function readID3(r: Reader, head: Uint8Array): Promise<Tags> {
  const ver = head[3], flags = head[5], size = Math.min(syncsafe(head, 6), 12 * 1024 * 1024);
  const buf = await r.read(10, size);
  const out: Tags = {};
  let p = 0;
  if (flags & 0x40 && ver > 2) p = ver === 4 ? syncsafe(buf, 0) : u32(buf, 0) + 4;
  const idLen = ver === 2 ? 3 : 4, hdrLen = ver === 2 ? 6 : 10;
  while (p + hdrLen < buf.length) {
    const id = latin1(buf.subarray(p, p + idLen));
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const fsize = ver === 2 ? (buf[p + 3] << 16) | (buf[p + 4] << 8) | buf[p + 5] : ver === 4 ? syncsafe(buf, p + 4) : u32(buf, p + 4);
    const start = p + hdrLen, end = start + fsize;
    if (fsize <= 0 || end > buf.length) break;
    const data = buf.subarray(start, end);
    if (id === 'TIT2' || id === 'TT2') out.title = decodeText(data);
    else if (id === 'TPE1' || id === 'TP1') out.artist = decodeText(data);
    else if ((id === 'APIC' || id === 'PIC') && !out.art) out.art = parsePic(data, ver);
    p = end;
  }
  return out;
}

/* ---------- MP4 / M4A ---------- */
type Atom = { type: string; start: number; end: number };
function atoms(b: Uint8Array, start: number, end: number): Atom[] {
  const out: Atom[] = [];
  let p = start;
  while (p + 8 <= end) {
    const size = u32(b, p);
    if (size < 8 || p + size > end) break;
    out.push({ type: latin1(b.subarray(p + 4, p + 8)), start: p + 8, end: p + size });
    p += size;
  }
  return out;
}
async function readMP4(r: Reader): Promise<Tags> {
  let off = 0, moov: Uint8Array | null = null;
  while (off + 8 <= r.size) {
    const h = await r.read(off, 16);
    let size = u32(h, 0), hdr = 8;
    const type = latin1(h.subarray(4, 8));
    if (size === 1) { size = u32(h, 8) * 4294967296 + u32(h, 12); hdr = 16; } else if (size === 0) size = r.size - off;
    if (size < 8) break;
    if (type === 'moov') { moov = await r.read(off + hdr, Math.min(size - hdr, 16 * 1024 * 1024)); break; }
    off += size;
  }
  if (!moov) return {};
  const find = (list: Atom[], t: string) => list.find(a => a.type === t);
  const top = atoms(moov, 0, moov.length);
  const udta = find(top, 'udta');
  const meta = (udta && find(atoms(moov, udta.start, udta.end), 'meta')) || find(top, 'meta');
  if (!meta) return {};
  const ilst = find(atoms(moov, meta.start + 4, meta.end), 'ilst');
  if (!ilst) return {};
  const out: Tags = {};
  for (const item of atoms(moov, ilst.start, ilst.end)) {
    const data = find(atoms(moov, item.start, item.end), 'data');
    if (!data) continue;
    const kind = u32(moov, data.start) & 0xffffff;
    const payload = moov.subarray(data.start + 8, data.end);
    if (item.type === '©nam') out.title = utf8(payload).trim();
    else if (item.type === '©ART') out.artist = utf8(payload).trim();
    else if (item.type === 'covr') out.art = { bytes: payload.slice(), ext: kind === 14 ? 'png' : 'jpg' };
  }
  return out;
}

export async function readTags(file: File): Promise<Tags> {
  let r: Reader | null = null;
  try {
    r = openReader(file);
    const head = await r.read(0, 12);
    if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return await readID3(r, head);
    if (latin1(head.subarray(4, 8)) === 'ftyp') return await readMP4(r);
  } catch {
    // tag illeggibili: si usa il nome del file
  } finally {
    r?.close();
  }
  return {};
}

/** "Artista - Titolo.mp3" → { artist, title } */
export function parseName(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const m = base.match(/^(.+?)\s+-\s+(.+)$/);
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: 'Artista sconosciuto', title: base };
}
