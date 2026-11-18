/* Configurator engine.
   Each vehicle is ONE video: a 6x2 grid of 540x960 cells, one per (road, package), all frame-synced.
   Switching road or package moves to another cell of the same playing video, so it is instant.
   Switching vehicle swaps to another (preloaded) video, resynced to the same moment.
   Every change plays the same diagonal light sweep: the new state is revealed behind a soft bright band.
   Paint is recoloured live from the magenta key: diffuse = magenta minus white, reflections kept. */
(function () {
  const VS = `attribute vec2 p; varying vec2 uv; uniform vec4 crop;
  void main(){ uv = crop.xy + (p*0.5+0.5)*crop.zw; uv.y = 1.0-uv.y; gl_Position = vec4(p,0.,1.); }`;
  const FS = `precision mediump float; varying vec2 uv;
  uniform sampler2D tA, tB;            // A = state before the change, B = state after
  uniform vec4 cellA, cellB;           // xy = cell offset, zw = cell size (texture space)
  uniform vec2 pxA, pxB;               // one source pixel in texture space
  uniform float wipe, band;            // sweep position, band strength
  uniform vec4 colA, colB;             // paint before / after (rgb linear, a = gloss)
  vec3 lin(vec3 c){ return pow(max(c,0.0), vec3(2.2)); }
  vec3 srgb(vec3 c){ return pow(clamp(c,0.0,1.0), vec3(1.0/2.2)); }
  vec3 key(vec3 l){
    float spec = min(l.g, min(l.r, l.b));
    float rd = l.r - spec, bd = l.b - spec, mx = max(max(l.r, l.b), 1e-5);
    float sat = (mx - l.g)/mx, ratio = bd/max(rd, 1e-5);
    float m = smoothstep(0.22, 0.45, sat) * smoothstep(0.012, 0.06, ratio) * (1.0 - smoothstep(2.6, 4.0, ratio)) * smoothstep(0.002, 0.008, mx);
    return vec3(m, spec, (rd + bd)/0.85);
  }
  vec3 shade(sampler2D t, vec4 cell, vec2 px, vec4 col){
    vec2 q = cell.xy + clamp(uv, 0.002, 0.998)*cell.zw;
    vec3 l = lin(texture2D(t, q).rgb); vec3 k = key(l);
    float D = k.z*0.4 + 0.15*(key(lin(texture2D(t, q+vec2(px.x,0.)).rgb)).z + key(lin(texture2D(t, q-vec2(px.x,0.)).rgb)).z
                            + key(lin(texture2D(t, q+vec2(0.,px.y)).rgb)).z + key(lin(texture2D(t, q-vec2(0.,px.y)).rgb)).z);
    vec3 o = col.rgb*D + vec3(k.y)*col.a + col.rgb*k.y*(1.0-col.a)*0.6;
    return mix(l, o, k.x);
  }
  void main(){
    float pos = uv.x*0.75 + uv.y*0.25;
    float t = smoothstep(wipe-0.05, wipe+0.05, pos);          // 1 = band not there yet: still A
    vec3 c = mix(shade(tB, cellB, pxB, colB), shade(tA, cellA, pxA, colA), t);
    c += vec3(0.30)*exp(-pow((pos-wipe)/0.03, 2.0))*band;   // the shine
    gl_FragColor = vec4(srgb(c), 1.0);
  }`;
  const hex = (h, spec = 1) => { const n = parseInt(h.slice(1), 16); return [(n>>16&255)/255, (n>>8&255)/255, (n&255)/255].map((c) => Math.pow(c, 2.2)).concat([spec]); };
  const GRID = [6, 2];
  const cellOf = (i) => [ (i % GRID[0])/GRID[0], Math.floor(i / GRID[0])/GRID[1], 1/GRID[0], 1/GRID[1] ];

  class PaintPlayer {
    constructor(canvas, { aspect = 9/16, focusY = 0.45 } = {}) {
      this.c = canvas; this.aspect = aspect; this.focusY = focusY;
      const gl = this.gl = canvas.getContext('webgl', { premultipliedAlpha: false });
      if (!gl) throw new Error('WebGL unavailable');
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {}; ['tA','tB','cellA','cellB','pxA','pxB','wipe','band','colA','colB','crop'].forEach((n) => this.u[n] = gl.getUniformLocation(pr, n));
      gl.uniform1i(this.u.tA, 0); gl.uniform1i(this.u.tB, 1);
      this.tex = new Map(); this.pool = new Map();
      this.A = null; this.B = null; this.wipe = 2; this.bandOn = 0; this.pending = null;
      this.raf = this.raf.bind(this); requestAnimationFrame(this.raf);
      new ResizeObserver(() => this.fit()).observe(canvas); this.fit();
    }
    fit() { const r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.c.width = Math.max(2, Math.round(r.width*dpr)); this.c.height = Math.max(2, Math.round(r.height*dpr)); this.view = r.width / Math.max(1, r.height); }
    crop() { const src = this.aspect, dst = this.view || src; let sx = 1, sy = 1;
      if (dst > src) sy = src/dst; else sx = dst/src;
      const ox = (1-sx)/2, oy = Math.min(Math.max(this.focusY - sy/2, 0), 1-sy); return [ox, 1-oy-sy, sx, sy]; }
    preload(url) {                     // a muted looping video kept in the pool
      let v = this.pool.get(url); if (v) return v;
      v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline',''); v.crossOrigin = 'anonymous';
      v.src = url; v.load(); this.pool.set(url, v);
      v.addEventListener('loadeddata', () => { if (!this.B || this.B.v !== v) v.play().then(() => { if (!this.B || this.B.v !== v) v.pause(); }).catch(() => {}); }, { once: true });
      return v;
    }
    texFor(v) { let t = this.tex.get(v); if (t) return t; const gl = this.gl; t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0])); this.tex.set(v, t); return t; }
    /* Show cell `cell` of video `url` in colour `colHex`, with the sweep from whatever is on screen. */
    show(url, cell, colHex, { spec = 1, animate = true } = {}) {
      const v = this.preload(url), next = { v, cell: cellOf(cell), col: hex(colHex, spec) }, t0 = performance.now();
      const go = () => {
        v.play().catch(() => {});
        (window.__gmVisibleMs = window.__gmVisibleMs || []).push(Math.round(performance.now() - t0));
        if (!this.B || !animate) { this.A = this.B = next; this.wipe = 2; this.bandOn = 0; return; }
        if (this.wipe < 1.2) this.A = this.B;   // a sweep was already running: start the new one from its target
        this.B = next; this.wipe = -0.12; this.bandOn = 1;
      };
      this.pending = go;
      if (v.readyState >= 3) go();
      else v.addEventListener('canplay', () => { if (this.pending === go) go(); }, { once: true });
    }
    loaded(url) { const v = this.pool.get(url); return !!v && v.readyState >= 3; }
    play() { if (this.B) this.B.v.play().catch(() => {}); }
    pause() { for (const v of this.pool.values()) v.pause(); }
    raf(ts) {
      const gl = this.gl, dt = this.last ? Math.min((ts - this.last)/1000, 0.05) : 0.016; this.last = ts;
      if (this.wipe < 1.2) { this.wipe += dt/0.75; if (this.wipe >= 1.2) { this.bandOn = 0; if (this.A && this.A.v !== this.B.v) this.A.v.pause(); this.A = this.B; } }
      if (this.B) {
        const up = new Set();
        [[0, this.A], [1, this.B]].forEach(([unit, s]) => {
          gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, this.texFor(s.v));
          if (!up.has(s.v) && s.v.readyState >= 2) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, s.v); up.add(s.v); }
        });
        const px = (s) => [1/(s.v.videoWidth || 3240), 1/(s.v.videoHeight || 1920)];
        gl.uniform4fv(this.u.cellA, this.A.cell); gl.uniform4fv(this.u.cellB, this.B.cell);
        gl.uniform2fv(this.u.pxA, px(this.A)); gl.uniform2fv(this.u.pxB, px(this.B));
        gl.uniform4fv(this.u.colA, this.A.col); gl.uniform4fv(this.u.colB, this.B.col);
        gl.uniform1f(this.u.wipe, this.wipe); gl.uniform1f(this.u.band, this.bandOn);
        gl.uniform4fv(this.u.crop, this.crop());
        gl.viewport(0, 0, this.c.width, this.c.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(this.raf);
    }
  }
  window.PaintPlayer = PaintPlayer;
})();
