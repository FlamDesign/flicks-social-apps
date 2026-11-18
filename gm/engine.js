/* Live paint engine.
   Every clip is generated with the body in a glossy magenta key paint (sRGB 230,0,200).
   The shader separates diffuse paint (magenta minus white) from specular (the white part),
   swaps the paint albedo for the chosen colour and adds the reflections back, so the sky,
   chrome reflections and highlights stay real. Clips crossfade on swap; colours change
   under a soft light sweep. */
(function () {
  const VS = `attribute vec2 p; varying vec2 uv; uniform vec4 crop;
  void main(){ uv = crop.xy + (p*0.5+0.5)*crop.zw; uv.y = 1.0-uv.y; gl_Position = vec4(p,0.,1.); }`;
  const FS = `precision mediump float; varying vec2 uv;
  uniform sampler2D tA, tB; uniform float mixAB, wipe, sweepOn; uniform vec2 px;
  uniform vec4 colFrom, colTo;
  vec3 lin(vec3 c){ return pow(max(c,0.0), vec3(2.2)); }
  vec3 srgb(vec3 c){ return pow(clamp(c,0.0,1.0), vec3(1.0/2.2)); }
  vec3 src(vec2 p){ return lin(mix(texture2D(tA,p).rgb, texture2D(tB,p).rgb, mixAB)); }
  // key: magenta chroma (r and b above g) -> mask, specular (white part), diffuse amount
  vec3 key(vec3 l){
    float spec = min(l.g, min(l.r, l.b));
    float rd = l.r - spec, bd = l.b - spec, mx = max(max(l.r, l.b), 1e-5);
    float sat = (mx - l.g)/mx, ratio = bd/max(rd, 1e-5);
    float m = smoothstep(0.22, 0.45, sat) * smoothstep(0.012, 0.06, ratio) * (1.0 - smoothstep(2.6, 4.0, ratio)) * smoothstep(0.002, 0.008, mx);
    return vec3(m, spec, (rd + bd)/0.85);
  }
  void main(){
    vec3 l = src(uv); vec3 k = key(l);
    // denoise the diffuse term only (keeps reflections sharp)
    float D = k.z*0.4;
    D += key(src(uv+vec2(px.x,0.))).z*0.15 + key(src(uv-vec2(px.x,0.))).z*0.15;
    D += key(src(uv+vec2(0.,px.y))).z*0.15 + key(src(uv-vec2(0.,px.y))).z*0.15;
    float pos = uv.x*0.75 + uv.y*0.25;
    vec4 tgt = mix(colTo, colFrom, smoothstep(wipe-0.06, wipe+0.06, pos));
    vec3 o = tgt.rgb*D + vec3(k.y)*tgt.a + tgt.rgb*k.y*(1.0-tgt.a)*0.6;
    // despill: anything left with magenta chroma in the soft edge takes the target hue
    vec3 res = mix(l, o, k.x);
    float band = exp(-pow((pos-wipe)/0.035, 2.0)) * k.x * sweepOn;
    res += vec3(0.35)*band;
    gl_FragColor = vec4(srgb(res), 1.0);
  }`;
  const hex = (h, spec = 1) => { const n = parseInt(h.slice(1), 16); return [(n>>16&255)/255, (n>>8&255)/255, (n&255)/255].map((c) => Math.pow(c, 2.2)).concat([spec]); };

  class PaintPlayer {
    constructor(canvas, { aspect = 9/16, focusY = 0.45, onFrame } = {}) {
      this.c = canvas; this.aspect = aspect; this.focusY = focusY; this.onFrame = onFrame;
      const gl = this.gl = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL unavailable');
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {}; ['tA','tB','mixAB','wipe','sweepOn','colFrom','colTo','crop','px'].forEach((n) => this.u[n] = gl.getUniformLocation(pr, n));
      this.tex = [0,1].map((i) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0])); return t; });
      gl.uniform1i(this.u.tA, 0); gl.uniform1i(this.u.tB, 1);
      this.v = [0,1].map(() => { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline',''); v.preload = 'auto'; v.crossOrigin = 'anonymous'; return v; });
      this.cur = 0; this.mixT = 1; this.mixing = false;
      this.colFrom = this.colTo = hex('#888888'); this.wipe = 2; this.sweepOn = 0;
      this.ready = [false,false];
      this.raf = this.raf.bind(this); requestAnimationFrame(this.raf);
      new ResizeObserver(() => this.fit()).observe(canvas); this.fit();
    }
    fit() { const r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.c.width = Math.max(2, Math.round(r.width*dpr)); this.c.height = Math.max(2, Math.round(r.height*dpr)); this.view = r.width / Math.max(1, r.height); }
    crop() { // cover-fit the 9:16 source into the canvas, keeping focusY in view
      const src = this.aspect, dst = this.view || src; let sx = 1, sy = 1;
      if (dst > src) sy = src/dst; else sx = dst/src;
      const ox = (1-sx)/2, oy = Math.min(Math.max(this.focusY - sy/2, 0), 1-sy);
      return [ox, 1-oy-sy, sx, sy];
    }
    load(url, { sync = true } = {}) {
      const nxt = 1 - this.cur, v = this.v[nxt], cv = this.v[this.cur];
      if (this.ready[this.cur] && (cv.src === url || cv.src.endsWith(url))) return Promise.resolve();
      this.ready[nxt] = false;
      return new Promise((res) => {
        const go = () => {
          v.removeEventListener('loadeddata', go);
          const t = sync && this.ready[this.cur] ? (cv.currentTime + 0.12) % (v.duration || 1e9) : 0;
          const start = () => { v.removeEventListener('seeked', start); v.play().catch(() => {}); this.ready[nxt] = true; this.cur = nxt; this.mixT = 0; this.mixing = true; res(); };
          if (t > 0) { v.addEventListener('seeked', start); v.currentTime = t; } else start();
        };
        v.addEventListener('loadeddata', go); if (url.startsWith('blob:')) v.removeAttribute('crossorigin'); else v.crossOrigin = 'anonymous'; v.src = url; v.load();
      });
    }
    setColor(h, { animate = true, spec = 1 } = {}) {
      const c = hex(h, spec);
      if (!animate) { this.colFrom = this.colTo = c; this.wipe = 2; return; }
      this.colFrom = this.colTo; this.colTo = c; this.wipe = -0.15; this.sweepOn = 1;
    }
    play() { this.v.forEach((v, i) => { if (this.ready[i] && i === this.cur) v.play().catch(() => {}); }); }
    pause() { this.v.forEach((v) => v.pause()); }
    raf(ts) {
      const gl = this.gl, dt = this.last ? Math.min((ts - this.last)/1000, 0.05) : 0.016; this.last = ts;
      if (this.mixing) { this.mixT = Math.min(1, this.mixT + dt/0.28); if (this.mixT >= 1) { this.mixing = false; this.v[1-this.cur].pause(); } }
      if (this.wipe < 1.2) { this.wipe += dt/0.9; if (this.wipe >= 1.2) { this.sweepOn = 0; this.colFrom = this.colTo; } }
      const a = 1 - this.cur, b = this.cur; // tA = previous, tB = current
      [[0,a],[1,b]].forEach(([unit, idx]) => { const v = this.v[idx];
        if (this.ready[idx] && v.readyState >= 2 && (idx === b || this.mixing)) { gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D, this.tex[unit]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v); } });
      gl.viewport(0, 0, this.c.width, this.c.height);
      gl.uniform1f(this.u.mixAB, this.mixing ? this.mixT : 1);
      gl.uniform1f(this.u.wipe, this.wipe); gl.uniform1f(this.u.sweepOn, this.sweepOn);
      gl.uniform4fv(this.u.colFrom, this.colFrom); gl.uniform4fv(this.u.colTo, this.colTo);
      gl.uniform4fv(this.u.crop, this.crop()); const vw = this.v[this.cur].videoWidth || 720, vh = this.v[this.cur].videoHeight || 1280; gl.uniform2f(this.u.px, 1/vw, 1/vh);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (this.onFrame) this.onFrame(this.v[this.cur].currentTime);
      requestAnimationFrame(this.raf);
    }
  }
  window.PaintPlayer = PaintPlayer;
})();
