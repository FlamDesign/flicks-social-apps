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
  async function fetchAll(first) {
    const order = [first, ...G.cars.map((c) => c.id).filter((c) => c !== first)];
    for (const c of order) { const u = await fetchAtlas(c); if (cfg) cfg.preload(u); }
  }
  window.__gmProgress = () => ({ ...progress });

  /* ---------- feed hook ---------- */
  const hook = new PaintPlayer($('hookCanvas'), { focusY: 0.42 });
  const hookState = { car: 0, color: 0, env: 0, mod: 0, step: 0, on: false, timer: 0 };
  const hookPaint = () => { const c = G.cars[hookState.car].colors[hookState.color]; return [c.hex, c.spec ?? 1]; };
  async function hookShow(animate) {
    const car = G.cars[hookState.car], src = await fetchAtlas(car.id);
    const [hex, spec] = hookPaint();
    hook.show(src, G.cell(car.id, G.envs[hookState.env].id, car.mods[hookState.mod].id), hex, { spec, animate });
  }
  const hookBeats = ['color', 'mod', 'env', 'color', 'car'];
  function hookTick() {
    if (!hookState.on) return;
    const beat = hookBeats[hookState.step++ % hookBeats.length];
    let car = G.cars[hookState.car], label;
    if (beat === 'color') { hookState.color = (hookState.color + 1) % car.colors.length; label = car.colors[hookState.color].name; }
    else if (beat === 'mod') { hookState.mod = hookState.mod ? 0 : 1 + (hookState.step % 3); label = car.mods[hookState.mod].name; }
    else if (beat === 'env') { hookState.env = (hookState.env + 1) % G.envs.length; label = G.envs[hookState.env].name; }
    else { hookState.car = (hookState.car + 1) % G.cars.length; hookState.color = 0; hookState.mod = 0; car = G.cars[hookState.car]; }
    hookShow(true);
    $('hookKicker').textContent = label ? `${car.short} · ${label}` : car.short;
    hookState.timer = setTimeout(hookTick, 1700);
  }
  const io = new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting && $('pv').hidden && $('loader').hidden;
    if (vis && !hookState.on) { hookState.on = true; hook.play(); hookState.timer = setTimeout(hookTick, 1500); }
    if (!vis && hookState.on) { hookState.on = false; clearTimeout(hookState.timer); hook.pause(); }
  }, { threshold: 0.4 });
  $('hookKicker').textContent = G.cars[0].short;
  hookShow(false).then(() => io.observe($('hook')));
  fetchAll(G.cars[0].id);

  /* ---------- configurator ---------- */
  let cfg = null;
  const st = { car: 'sierra', color: 0, mod: 'stock', env: 'lake' };
  function ensureCfg() {
    if (!cfg) { cfg = new PaintPlayer($('cfgCanvas'), { focusY: 0.46 }); Object.values(blobs).forEach((u) => cfg.preload(u)); }
    return cfg;
  }
  // Every change (vehicle, paint, package, road) goes through here and plays the same light sweep.
  async function apply(animate = true) {
    const t0 = performance.now();
    const car = carById(st.car), c = car.colors[st.color], src = await fetchAtlas(st.car);
    ensureCfg().show(src, G.cell(st.car, st.env, st.mod), c.hex, { spec: c.spec ?? 1, animate });
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
    $('ctaTitle').textContent = `${car.year} ${car.logo ? car.short : car.name}`; $('ctaBtn').href = car.cta;
    const lg = $('ctaLogo'); if (car.logo) { lg.innerHTML = `<img src="${car.logo}" alt="">`; lg.classList.add('logo'); } else { lg.textContent = car.id === 'corvette' ? 'CHEV' : 'GM'; lg.classList.remove('logo'); }
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
      b.onclick = () => { if (st.env === e.id) return; st.env = e.id; renderEnvs(); apply(); };
      $('envs').appendChild(b);
    });
  }
  function renderAll() { renderCars(); renderColors(); renderMods(); renderEnvs(); }

  async function open() {
    const fromCar = G.cars[hookState.car];
    st.car = fromCar.id; st.color = hookState.color; st.mod = fromCar.mods[hookState.mod].id; st.env = G.envs[hookState.env].id;
    hookState.on = false; clearTimeout(hookState.timer); hook.pause();
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
