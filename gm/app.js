(function () {
  const $ = (id) => document.getElementById(id);
  const G = window.GM;
  // media/manifest.json lists the files that exist, so missing clips never 404 in the console
  const manifest = fetch('media/manifest.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => []);
  const exists = (url) => manifest.then((list) => list.includes(url.replace(/^media\//, '')));
  const resolveClip = async (car, env, mod) => {
    const tries = [G.clip(car, env, mod), G.clip(car, env, 'stock'), G.clip(car, 'lake', 'stock')];
    for (const u of tries) if (await exists(u)) return { url: u, exact: u === tries[0] };
    return { url: window.MEDIA_FALLBACK, exact: false };
  };
  const carById = (id) => G.cars.find((c) => c.id === id);

  /* ---------- feed hook ---------- */
  const hook = new PaintPlayer($('hookCanvas'), { focusY: 0.42 });
  const hookState = { car: 0, color: 0, env: 0, step: 0, on: false, timer: 0 };
  async function hookShow() {
    const car = G.cars[hookState.car], env = G.envs[hookState.env];
    const { url } = await resolveClip(car.id, env.id, 'stock');
    await hook.load(url, { sync: false });
    const c = car.colors[hookState.color]; hook.setColor(c.hex, { animate: false, spec: c.spec ?? 1 });
    $('hookKicker').textContent = car.short;
  }
  function hookTick() {
    if (!hookState.on) return;
    const car = G.cars[hookState.car];
    hookState.step++;
    if (hookState.step % 4 === 0) { // every 4th beat: next vehicle (or next road)
      hookState.car = (hookState.car + 1) % G.cars.length; hookState.env = (hookState.env + 1) % G.envs.length; hookState.color = 0;
      const nc = G.cars[hookState.car];
      resolveClip(nc.id, G.envs[hookState.env].id, 'stock').then(({ url }) => hook.load(url, { sync: false }).then(() => {
        const c = nc.colors[0]; hook.setColor(c.hex, { animate: false, spec: c.spec ?? 1 }); $('hookKicker').textContent = nc.short; }));
    } else {
      hookState.color = (hookState.color + 1) % car.colors.length;
      const c = car.colors[hookState.color]; hook.setColor(c.hex, { spec: c.spec ?? 1 });
      $('hookKicker').textContent = `${car.short} · ${c.name}`;
    }
    hookState.timer = setTimeout(hookTick, 1900);
  }
  const io = new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting && $('pv').hidden && $('loader').hidden;
    if (vis && !hookState.on) { hookState.on = true; hook.play(); hookState.timer = setTimeout(hookTick, 1600); }
    if (!vis && hookState.on) { hookState.on = false; clearTimeout(hookState.timer); hook.pause(); }
  }, { threshold: 0.4 });
  hookShow().then(() => io.observe($('hook')));

  /* ---------- configurator ---------- */
  let cfg = null;
  const st = { car: 'sierra', color: 0, mod: 'stock', env: 'lake' };
  function ensureCfg() { if (!cfg) cfg = new PaintPlayer($('cfgCanvas'), { focusY: 0.46 }); return cfg; }

  async function applyClip() {
    const { url, exact } = await resolveClip(st.car, st.env, st.mod);
    await ensureCfg().load(url, { sync: true });
    $('pv').classList.toggle('pending', !exact);
  }
  function applyColor(animate) {
    const c = carById(st.car).colors[st.color];
    ensureCfg().setColor(c.hex, { animate, spec: c.spec ?? 1 });
    $('colName').textContent = c.name;
  }
  function renderCars() {
    $('cars').innerHTML = '';
    G.cars.forEach((c) => {
      const b = document.createElement('button'); b.className = 'car' + (c.id === st.car ? ' on' : ''); b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c.id === st.car); b.setAttribute('aria-label', c.name);
      exists(c.thumb).then((ok) => { if (ok) { b.style.backgroundImage = `url(${c.thumb})`; b.classList.add('img'); } }); b.dataset.initial = c.short[0];
      b.onclick = () => { if (st.car === c.id) return; st.car = c.id; st.color = 0; st.mod = 'stock'; renderAll(); applyClip(); applyColor(false); };
      $('cars').appendChild(b);
    });
    const car = carById(st.car); $('carName').textContent = `${car.year} ${car.name}`;
    $('ctaTitle').textContent = `${car.year} ${car.name}`; $('ctaBtn').href = car.cta;
    const lg = $('ctaLogo'); if (car.logo) { lg.innerHTML = `<img src="${car.logo}" alt="">`; lg.classList.add('logo'); } else { lg.textContent = car.id === 'corvette' ? 'CHEV' : 'GM'; lg.classList.remove('logo'); }
  }
  function renderColors() {
    const car = carById(st.car); $('swatches').innerHTML = '';
    car.colors.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'dot' + (i === st.color ? ' on' : '');
      b.style.background = c.spec !== undefined && c.spec < 1 ? c.hex : `radial-gradient(circle at 35% 30%, #ffffff55, transparent 45%), ${c.hex}`;
      b.setAttribute('aria-label', c.name); b.title = c.name;
      b.onclick = () => { if (st.color === i) return; st.color = i; renderColors(); applyColor(true); };
      $('swatches').appendChild(b);
    });
  }
  function renderMods() {
    const car = carById(st.car); $('mods').innerHTML = '';
    car.mods.forEach((m) => {
      const b = document.createElement('button'); b.className = 'chip' + (m.id === st.mod ? ' on' : ''); b.textContent = m.name;
      b.onclick = () => { if (st.mod === m.id) return; st.mod = m.id; renderMods(); applyClip(); };
      $('mods').appendChild(b);
    });
  }
  function renderEnvs() {
    $('envs').innerHTML = '';
    G.envs.forEach((e) => {
      const b = document.createElement('button'); b.className = 'env env-' + e.id + (e.id === st.env ? ' on' : '');
      exists(e.thumb).then((ok) => { if (ok) b.style.backgroundImage = `url(${e.thumb})`; }); b.setAttribute('aria-label', e.name); b.title = e.name;
      b.onclick = () => { if (st.env === e.id) return; st.env = e.id; renderEnvs(); applyClip(); };
      $('envs').appendChild(b);
    });
  }
  function renderAll() { renderCars(); renderColors(); renderMods(); renderEnvs(); }

  async function open() {
    const fromCar = G.cars[hookState.car];
    st.car = fromCar.id; st.color = hookState.color; st.mod = 'stock'; st.env = G.envs[hookState.env].id;
    hookState.on = false; clearTimeout(hookState.timer); hook.pause();
    $('loader').hidden = false; $('fb').setAttribute('aria-hidden', 'true');
    let p = 0; const bar = $('loadBar');
    const prog = setInterval(() => { p = Math.min(96, p + 7 + Math.random() * 9); bar.style.width = p + '%'; $('loadPct').textContent = `Loading, ${Math.round(p)}% complete`; }, 90);
    renderAll(); $('pv').hidden = false; $('pv').classList.add('behind');
    ensureCfg(); await applyClip(); applyColor(false);
    // warm the cache for this car's other clips
    G.envs.forEach((e) => carById(st.car).mods.forEach((m) => exists(G.clip(st.car, e.id, m.id))));
    await new Promise((r) => setTimeout(r, 900));
    clearInterval(prog); bar.style.width = '100%'; $('loadPct').textContent = 'Loading, 100% complete';
    setTimeout(() => { $('loader').hidden = true; $('pv').classList.remove('behind'); }, 220);
  }
  function close() {
    $('pv').hidden = true; $('loader').hidden = true; $('fb').removeAttribute('aria-hidden'); if (cfg) cfg.pause();
    io.unobserve($('hook')); io.observe($('hook'));
  }
  $('hook').onclick = open; $('hookCta').onclick = open;
  $('pvX').onclick = close; $('loaderX').onclick = close;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('pv').hidden) close(); });
})();
