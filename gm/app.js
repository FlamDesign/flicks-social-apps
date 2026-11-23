(function () {
  const $ = (id) => document.getElementById(id);
  const G = window.GM;
  const carById = (id) => G.cars.find((c) => c.id === id);

  /* ---------- downloads: one grid video per vehicle, fetched whole into memory ---------- */
  // While the feed hook plays, all three vehicles download (hook car first), so the configurator
  // opens ready and every switch after that plays from memory.
  const blobs = {}, inflight = {}, progress = {};
  function fetchAtlas(carId) {
    const url = G.atlas(carId);
    if (blobs[carId]) return Promise.resolve(blobs[carId]);
    return inflight[carId] = inflight[carId] || (async () => {
      try {
        const r = await fetch(url); if (!r.ok) throw new Error(r.status);
        const total = +r.headers.get('content-length') || 0, rd = r.body.getReader(), parts = []; let got = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; progress[carId] = total ? got/total : 0.5; }
        progress[carId] = 1;
        return (blobs[carId] = URL.createObjectURL(new Blob(parts, { type: 'video/mp4' })));
      } catch (e) { console.warn('[gm] download failed, streaming instead:', url, e); progress[carId] = 1; return (blobs[carId] = url); }
    })();
  }
  const masks = {}, maskInflight = {};
  function fetchMask(carId) {
    if (masks[carId] !== undefined) return Promise.resolve(masks[carId]);
    return maskInflight[carId] = maskInflight[carId] || fetch(G.mask(carId)).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then((b) => (masks[carId] = URL.createObjectURL(b)))
      .catch((e) => { console.warn('[gm] no silhouette for', carId, e); return (masks[carId] = null); });
  }
  async function fetchAll(first) {
    const order = [first, ...G.cars.map((c) => c.id).filter((c) => c !== first)];
    for (const c of order) { const u = await fetchAtlas(c); const m = await fetchMask(c); if (cfg) { cfg.preload(u); if (m) cfg.preload(m); } }
  }
  window.__gmProgress = () => ({ ...progress });
  window.__gmEngine = () => cfg;   // debug: lets tests freeze the exact same frame

  /* ---------- feed hook: a pre-cut film (media/hook.mp4), plays as a plain video ---------- */
  const hv = $('hookVideo');
  let beats = [];
  fetch('media/hook.json').then((r) => r.json()).then((j) => { beats = j; }).catch(() => {});
  const beatNow = () => { let b = beats[0]; for (const x of beats) if (x.t <= hv.currentTime + 0.25) b = x; return b; };
  let lastLabel = '';
  (function caption() {   // caption follows the film; the label changes as the sweep passes
    const b = beatNow(); if (b && b.label !== lastLabel) { lastLabel = b.label; $('hookKicker').textContent = b.label; }
    requestAnimationFrame(caption);
  })();
  const io = new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting && $('pv').hidden && $('loader').hidden;
    if (vis) hv.play().catch(() => {}); else hv.pause();
  }, { threshold: 0.4 });
  io.observe($('hook'));
  fetchAll('sierra');   // download all three vehicles while the film plays

  /* ---------- configurator ---------- */
  let cfg = null;
  const st = { car: 'sierra', color: 0, mod: 'stock', env: 'lake' };
  function ensureCfg() {
    if (!cfg) { cfg = new PaintPlayer($('cfgCanvas'), { focusY: 0.46, grid: G.grid || [6, 2] }); Object.values(blobs).forEach((u) => cfg.preload(u)); Object.values(masks).forEach((u) => u && cfg.preload(u)); }
    return cfg;
  }
  // Every change (vehicle, paint, package, road) goes through here and plays the same light sweep.
  async function apply(animate = true, mode = 'car') {
    const t0 = performance.now();
    const car = carById(st.car), c = car.colors[st.color], src = await fetchAtlas(st.car), mask = await fetchMask(st.car);
    ensureCfg().show(src, G.cell(st.car, st.env, st.mod), c.hex, { spec: c.spec ?? 1, animate, mode, mask });
    (window.__gmSwitchMs = window.__gmSwitchMs || []).push(Math.round(performance.now() - t0));
    $('colName').textContent = c.name;
  }
  function renderCars() {
    $('cars').innerHTML = '';
    G.cars.forEach((c) => {
      const b = document.createElement('button'); b.className = 'car' + (c.id === st.car ? ' on' : ''); b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c.id === st.car); b.setAttribute('aria-label', c.name);
      b.style.backgroundImage = `url(${c.thumb})`; b.classList.add('img'); b.dataset.initial = c.short[0];
      b.onclick = () => { if (st.car === c.id) return; st.car = c.id; st.color = 0; st.mod = 'stock'; renderAll(); apply(); };
      $('cars').appendChild(b);
    });
    const car = carById(st.car); $('carName').textContent = `${car.year} ${car.name}`;
    $('ctaTitle').textContent = car.logo ? car.short : `${car.year} ${car.name}`;
    // CTA: 'testdrive' pages book a test drive on the brand's site (GMC or Chevrolet); others go to Build & Price
    if (G.ctaKind === 'testdrive' && car.testDrive) {
      $('ctaBtn').href = car.testDrive;
      $('ctaSub').textContent = new URL(car.testDrive).hostname.replace(/^www\./, '');   // the brand's site, like a Facebook ad bar
    } else $('ctaBtn').href = car.cta;
    const lg = $('ctaLogo'); if (car.logo) { lg.innerHTML = `<img src="${car.logo}" alt="">`; lg.classList.add('logo'); } else { lg.textContent = 'GM'; lg.classList.remove('logo'); }
  }
  function renderColors() {
    const car = carById(st.car); $('swatches').innerHTML = '';
    car.colors.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'dot' + (i === st.color ? ' on' : '');
      b.style.background = c.spec !== undefined && c.spec < 1 ? c.hex : `radial-gradient(circle at 35% 30%, #ffffff55, transparent 45%), ${c.hex}`;
      b.setAttribute('aria-label', c.name); b.title = c.name;
      b.onclick = () => { if (st.color === i) return; st.color = i; renderColors(); apply(); };
      $('swatches').appendChild(b);
    });
  }
  function renderMods() {
    const car = carById(st.car); $('mods').innerHTML = '';
    car.mods.forEach((m) => {
      const b = document.createElement('button'); b.className = 'chip' + (m.id === st.mod ? ' on' : ''); b.textContent = m.name;
      b.onclick = () => { if (st.mod === m.id) return; st.mod = m.id; renderMods(); apply(); };
      $('mods').appendChild(b);
    });
  }
  function renderEnvs() {
    $('envs').innerHTML = '';
    G.envs.forEach((e) => {
      const b = document.createElement('button'); b.className = 'env env-' + e.id + (e.id === st.env ? ' on' : '');
      b.style.backgroundImage = `url(${e.thumb})`; b.setAttribute('aria-label', e.name); b.title = e.name;
      b.onclick = () => { if (st.env === e.id) return; st.env = e.id; renderEnvs(); apply(true, 'road'); };
      $('envs').appendChild(b);
    });
  }
  // lighter versions switch off a row: packages only on one road, or roads only with the stock vehicle
  const feat = Object.assign({ mods: true, envs: true }, G.features || {});
  if (!feat.mods) $('mods').closest('.row').hidden = true;
  if (!feat.envs) $('envs').closest('.row').hidden = true;
  function renderAll() { renderCars(); renderColors(); if (feat.mods) renderMods(); if (feat.envs) renderEnvs(); }

  async function open() {
    // open on exactly what the film was showing when tapped
    const b = beatNow() || { car: 'sierra', env: 'lake', mod: 'stock', col: '' };
    const car = carById(b.car) ? b.car : 'sierra';
    st.car = car; st.env = b.env; st.mod = carById(car).mods.some((m) => m.id === b.mod) ? b.mod : 'stock';
    st.color = Math.max(0, carById(car).colors.findIndex((c) => c.hex.toLowerCase() === (b.col || '').toLowerCase()));
    hv.pause();
    $('loader').hidden = false; $('fb').setAttribute('aria-hidden', 'true');
    const bar = $('loadBar'); let shown = 0;
    // real progress of this vehicle's download (already done if the hook played long enough)
    const prog = setInterval(() => { shown = Math.max(shown, Math.min(96, (progress[st.car] || 0) * 96)); bar.style.width = shown + '%'; $('loadPct').textContent = `Loading, ${Math.round(shown)}% complete`; }, 80);
    renderAll(); $('pv').hidden = false; $('pv').classList.add('behind');
    ensureCfg(); await fetchAtlas(st.car); await apply(false);
    await new Promise((r) => { const v = cfg.preload(blobs[st.car]); if (v.readyState >= 3) r(); else v.addEventListener('canplay', r, { once: true }); });
    clearInterval(prog); bar.style.width = '100%'; $('loadPct').textContent = 'Loading, 100% complete';
    setTimeout(() => { $('loader').hidden = true; $('pv').classList.remove('behind'); }, 200);
  }
  function close() {
    $('pv').hidden = true; $('loader').hidden = true; $('fb').removeAttribute('aria-hidden'); if (cfg) cfg.pause();
    io.unobserve($('hook')); io.observe($('hook'));
  }
  $('hook').onclick = open; $('hookCta').onclick = open;
  $('pvX').onclick = close; $('loaderX').onclick = close;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('pv').hidden) close(); });
})();
