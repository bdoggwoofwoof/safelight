// Safelight's JPEG writer: baseline JPEG, 4:4:4 (no color smearing at painted edges), fed one strip of rows at a time,
// so a full-size photo never has to fit in one canvas (iPhone Safari caps a canvas at about 16 megapixels).
// It can embed an ICC profile, which is how a Display P3 export keeps its wider colors.
"use strict";
(function () {
  const ZZ = new Uint8Array([0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53,
    10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63]);
  const YQT = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
  const CQT = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99]
    .concat(new Array(32).fill(99));
  const AASF = [1, 1.387039845, 1.306562965, 1.175875602, 1, .785694958, .5411961, .275899379];
  const DC_Y_N = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], DC_Y_V = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const AC_Y_N = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
  const AC_Y_V = [0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];
  const DC_C_N = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], DC_C_V = DC_Y_V;
  const AC_C_N = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
  const AC_C_V = [0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
    0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
    0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
    0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
    0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
    0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];

  function huff(n, v) {   // value -> [code, length]
    const t = []; let code = 0, pos = 0;
    for (let k = 1; k <= 16; k++) { for (let j = 0; j < n[k]; j++) t[v[pos++]] = [code++, k]; code *= 2; }
    return t;
  }
  const HDY = huff(DC_Y_N, DC_Y_V), HAY = huff(AC_Y_N, AC_Y_V), HDC = huff(DC_C_N, DC_C_V), HAC = huff(AC_C_N, AC_C_V);

  function tables(quality) {
    const q = Math.max(1, Math.min(100, quality)), sf = q < 50 ? 5000 / q : 200 - q * 2;
    const mk = base => { const zz = new Uint8Array(64); for (let i = 0; i < 64; i++) zz[ZZ[i]] = Math.max(1, Math.min(255, Math.floor((base[i] * sf + 50) / 100))); return zz; };
    const yz = mk(YQT), cz = mk(CQT), fy = new Float32Array(64), fc = new Float32Array(64);
    for (let r = 0, k = 0; r < 8; r++) for (let c = 0; c < 8; c++, k++) {
      fy[k] = 1 / (yz[ZZ[k]] * AASF[r] * AASF[c] * 8); fc[k] = 1 / (cz[ZZ[k]] * AASF[r] * AASF[c] * 8);
    }
    return { yz, cz, fy, fc };
  }

  function fdct(d) {   // AAN forward DCT in place
    for (let o = 0; o < 64; o += 8) {
      const t0 = d[o] + d[o + 7], t7 = d[o] - d[o + 7], t1 = d[o + 1] + d[o + 6], t6 = d[o + 1] - d[o + 6];
      const t2 = d[o + 2] + d[o + 5], t5 = d[o + 2] - d[o + 5], t3 = d[o + 3] + d[o + 4], t4 = d[o + 3] - d[o + 4];
      let a = t0 + t3, b = t0 - t3, c = t1 + t2, e = t1 - t2;
      d[o] = a + c; d[o + 4] = a - c;
      const z1 = (e + b) * .707106781; d[o + 2] = b + z1; d[o + 6] = b - z1;
      a = t4 + t5; c = t5 + t6; e = t6 + t7;
      const z5 = (a - e) * .382683433, z2 = .5411961 * a + z5, z4 = 1.306562965 * e + z5, z3 = c * .707106781, z11 = t7 + z3, z13 = t7 - z3;
      d[o + 5] = z13 + z2; d[o + 3] = z13 - z2; d[o + 1] = z11 + z4; d[o + 7] = z11 - z4;
    }
    for (let o = 0; o < 8; o++) {
      const t0 = d[o] + d[o + 56], t7 = d[o] - d[o + 56], t1 = d[o + 8] + d[o + 48], t6 = d[o + 8] - d[o + 48];
      const t2 = d[o + 16] + d[o + 40], t5 = d[o + 16] - d[o + 40], t3 = d[o + 24] + d[o + 32], t4 = d[o + 24] - d[o + 32];
      let a = t0 + t3, b = t0 - t3, c = t1 + t2, e = t1 - t2;
      d[o] = a + c; d[o + 32] = a - c;
      const z1 = (e + b) * .707106781; d[o + 16] = b + z1; d[o + 48] = b - z1;
      a = t4 + t5; c = t5 + t6; e = t6 + t7;
      const z5 = (a - e) * .382683433, z2 = .5411961 * a + z5, z4 = 1.306562965 * e + z5, z3 = c * .707106781, z11 = t7 + z3, z13 = t7 - z3;
      d[o + 40] = z13 + z2; d[o + 24] = z13 - z2; d[o + 8] = z11 + z4; d[o + 56] = z11 - z4;
    }
  }

  class JpegStream {
    constructor(width, height, quality = 95, icc = null) {
      this.w = width; this.h = height; this.T = tables(quality);
      this.parts = []; this.buf = new Uint8Array(1 << 16); this.n = 0; this.bits = 0; this.nbits = 0;
      this.dc = [0, 0, 0]; this.rowsDone = 0; this.carry = null;
      this.blk = new Float32Array(64); this.du = new Int32Array(64);
      const bw = Math.ceil(width / 8) * 8;
      this.Y = new Float32Array(bw * 8); this.Cb = new Float32Array(bw * 8); this.Cr = new Float32Array(bw * 8); this.bw = bw;
      this.header(icc);
    }
    byte(b) { if (this.n === this.buf.length) { this.parts.push(this.buf); this.buf = new Uint8Array(1 << 16); this.n = 0; } this.buf[this.n++] = b; }
    word(v) { this.byte((v >> 8) & 255); this.byte(v & 255); }
    header(icc) {
      const T = this.T;
      this.word(0xffd8);
      this.word(0xffe0); this.word(16); [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0].forEach(b => this.byte(b)); this.word(1); this.word(1); this.byte(0); this.byte(0);
      if (icc) {
        this.word(0xffe2); this.word(2 + 14 + icc.length);
        for (const ch of "ICC_PROFILE") this.byte(ch.charCodeAt(0));
        this.byte(0); this.byte(1); this.byte(1);
        for (let i = 0; i < icc.length; i++) this.byte(icc[i]);
      }
      this.word(0xffdb); this.word(132);
      this.byte(0); for (let i = 0; i < 64; i++) this.byte(T.yz[i]);
      this.byte(1); for (let i = 0; i < 64; i++) this.byte(T.cz[i]);
      this.word(0xffc0); this.word(17); this.byte(8); this.word(this.h); this.word(this.w); this.byte(3);
      this.byte(1); this.byte(0x11); this.byte(0); this.byte(2); this.byte(0x11); this.byte(1); this.byte(3); this.byte(0x11); this.byte(1);
      this.word(0xffc4); this.word(0x01a2);
      for (const [cls, n, v] of [[0x00, DC_Y_N, DC_Y_V], [0x10, AC_Y_N, AC_Y_V], [0x01, DC_C_N, DC_C_V], [0x11, AC_C_N, AC_C_V]]) {
        this.byte(cls); for (let k = 1; k <= 16; k++) this.byte(n[k]); for (const x of v) this.byte(x);
      }
      this.word(0xffda); this.word(12); this.byte(3); this.byte(1); this.byte(0); this.byte(2); this.byte(0x11); this.byte(3); this.byte(0x11);
      this.byte(0); this.byte(0x3f); this.byte(0);
    }
    put([code, len]) {
      this.bits = (this.bits << len) | code; this.nbits += len;
      while (this.nbits >= 8) {
        const b = (this.bits >> (this.nbits - 8)) & 255; this.byte(b); if (b === 255) this.byte(0);
        this.nbits -= 8; this.bits &= (1 << this.nbits) - 1;
      }
    }
    unit(fd, dcIdx, HD, HA) {
      const d = this.blk, du = this.du; fdct(d);
      for (let i = 0; i < 64; i++) { const v = d[i] * fd[i]; du[ZZ[i]] = v > 0 ? (v + .5) | 0 : (v - .5) | 0; }
      const diff = du[0] - this.dc[dcIdx]; this.dc[dcIdx] = du[0];
      this.coef(diff, HD, 0);
      let end = 63; while (end > 0 && du[end] === 0) end--;
      if (end === 0) { this.put(HA[0]); return; }
      for (let i = 1; i <= end;) {
        const start = i; while (du[i] === 0 && i <= end) i++;
        let z = i - start; for (; z >= 16; z -= 16) this.put(HA[0xf0]);
        this.coef(du[i], HA, z << 4); i++;
      }
      if (end !== 63) this.put(HA[0]);
    }
    coef(v, H, run) {
      const a = v < 0 ? -v : v; let cat = 0; while ((1 << cat) <= a) cat++;
      this.put(H[run + cat]);
      if (cat) this.put([v < 0 ? v + (1 << cat) - 1 : v, cat]);
    }
    band(rowOff, px, w) {   // one band of 8 rows: rowOff[r] is where row r starts in the RGBA bytes px
      const { Y, Cb, Cr, bw, blk, T } = this;
      for (let r = 0; r < 8; r++) {
        const ro = rowOff[r], ri = r * bw;
        for (let x = 0; x < bw; x++) {
          const i = ro + (x < w ? x : w - 1) * 4, R = px[i], G = px[i + 1], B = px[i + 2];
          Y[ri + x] = .299 * R + .587 * G + .114 * B - 128;
          Cb[ri + x] = -.168736 * R - .331264 * G + .5 * B;
          Cr[ri + x] = .5 * R - .418688 * G - .081312 * B;
        }
      }
      for (let bx = 0; bx < bw; bx += 8) {
        for (const [P, fd, k, HD, HA] of [[Y, T.fy, 0, HDY, HAY], [Cb, T.fc, 1, HDC, HAC], [Cr, T.fc, 2, HDC, HAC]]) {
          for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) blk[r * 8 + c] = P[r * bw + bx + c];
          this.unit(fd, k, HD, HA);
        }
      }
    }
    // rgba: RGBA bytes for `rows` full-width rows. Bands of 8 are encoded; leftover rows wait for the next strip.
    add(rgba, rows) {
      const w = this.w, rb = w * 4;
      let data = rgba, have = rows;
      if (this.carry) { const c = this.carry, m = new Uint8ClampedArray(c.length + rows * rb); m.set(c); m.set(rgba.subarray(0, rows * rb), c.length); data = m; have = c.length / rb + rows; this.carry = null; }
      const last = this.rowsDone + have >= this.h;
      let y = 0;
      for (; y + 8 <= have || (last && y < have); y += 8) {
        const offs = []; for (let r = 0; r < 8; r++) offs.push(Math.min(y + r, have - 1) * rb);
        this.band(offs, data, w);
      }
      if (y < have) this.carry = data.slice(y * rb, have * rb);
      this.rowsDone += Math.min(y, have);
    }
    finish() {
      if (this.nbits > 0) this.put([(1 << (8 - this.nbits)) - 1, 8 - this.nbits]);
      this.word(0xffd9);
      this.parts.push(this.buf.subarray(0, this.n));
      return new Blob(this.parts, { type: "image/jpeg" });
    }
  }

  // A small ICC v2 profile for Display P3 (P3 primaries, D65 white adapted to D50, sRGB tone curve).
  function p3Profile() {
    const tags = [], add = (sig, bytes) => tags.push({ sig, bytes });
    const ascii = s => [...s].map(c => c.charCodeAt(0));
    const u32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255], s15 = v => u32(Math.round(v * 65536) | 0);
    const name = "Display P3";
    add("desc", [...ascii("desc"), 0, 0, 0, 0, ...u32(name.length + 1), ...ascii(name), 0, ...u32(0), ...u32(0), 0, 0, 0, ...new Array(67).fill(0)]);
    add("cprt", [...ascii("text"), 0, 0, 0, 0, ...ascii("No copyright"), 0]);
    const xyz = (x, y, z) => [...ascii("XYZ "), 0, 0, 0, 0, ...s15(x), ...s15(y), ...s15(z)];
    add("wtpt", xyz(.9642, 1, .8249));
    add("rXYZ", xyz(.5151187, .2411892, -.0010505));
    add("gXYZ", xyz(.2919778, .6922441, .0418791));
    add("bXYZ", xyz(.1571035, .0665668, .7840713));
    const n = 1024, curve = [...ascii("curv"), 0, 0, 0, 0, ...u32(n)];
    for (let i = 0; i < n; i++) { const x = i / (n - 1), y = x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4), v = Math.round(y * 65535); curve.push(v >> 8, v & 255); }
    add("rTRC", curve); add("gTRC", null); add("bTRC", null);
    const pad = a => { while (a.length % 4) a.push(0); return a; };
    let off = 128 + 4 + tags.length * 12; const body = [], table = [...u32(tags.length)];
    let trc = null;
    for (const t of tags) {
      if (t.bytes) {
        const b = pad(t.bytes.slice()), at = off; body.push(...b); off += b.length;
        if (t.sig === "rTRC") trc = [at, t.bytes.length];
        table.push(...ascii(t.sig), ...u32(at), ...u32(t.bytes.length));
      } else table.push(...ascii(t.sig), ...u32(trc[0]), ...u32(trc[1]));
    }
    const size = off, head = [...u32(size), 0, 0, 0, 0, 2, 0x10, 0, 0, ...ascii("mntrRGB XYZ "), 2026 >> 8, 2026 & 255, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,
      ...ascii("acsp"), ...new Array(24).fill(0), 0, 0, 0, 0, ...s15(.9642), ...s15(1), ...s15(.8249)];
    while (head.length < 128) head.push(0);
    return new Uint8Array([...head, ...table, ...body]);
  }

  window.JpegStream = JpegStream; window.p3Profile = p3Profile;
})();
