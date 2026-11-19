/* GM configurator: paint and roads: a lighter version of the GM configurator (../gm/), sharing its data, renderer and app.
   This folder only holds its own grid videos (one per vehicle) and its own intro film. */
(function () {
  const G = window.GM;
  const shared = (p) => (p && !p.startsWith('../') ? '../gm/' + p : p);   // thumbnails and logos come from ../gm/media
  G.cars.forEach((c) => { c.thumb = shared(c.thumb); c.logo = shared(c.logo); });
  G.envs.forEach((e) => { e.thumb = shared(e.thumb); });
  G.atlas = (car) => `media/atlas_${car}.mp4`;
  G.grid = [3, 1];
  G.features = { mods: false };
  G.cell = function (car, env) { return Math.max(0, this.envs.findIndex((e) => e.id === env)); };
})();
