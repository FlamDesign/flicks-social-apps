# Flicks in social apps: demos

Phone mock-ups showing Flam's Flicks (interactive video ads) inside social apps.

- `instagram/` is the Instagram demo, served at `/instagram/`
- `meta/` is the Facebook, Messenger and Marketplace demo, served at `/meta/`
- `the-ordinary-hair-or-skin/` is a Branched Flick for The Ordinary (US): an intro with Hair and Skin hotspots, each opening a 3-product Flick. Plain static files; branch clips load only when their hotspot is tapped.
- `dc-pick-your-path/` is a Branched Flick for DC (US): intro into a loop with Superman, Green Lantern and Lois Lane tap points; each tap opens that hero's Flick straight away, with three versions, their own tagline and BOOK NOW / SHOP NOW CTA. Plain static files; autoplays muted. Like The Ordinary, each Flick is one video with its three versions stacked (switching shows another third, so versions stay in sync), plus each version's soundtrack locked to it. A Flick's files load only when its hero is tapped.
- `gm/` is the GM configurator Flick on Facebook, served at `/gm/`. Plain static files, no build step. Clips are generated in a magenta key paint and recoloured live in WebGL (`gm/engine.js`); run `gm/media/build-manifest.sh` after adding clips.
- `gm-paint-packages/` and `gm-paint-roads/` are lighter versions of the GM configurator (paint + packages on one road; paint + roads with stock vehicles). Each has only its own `config.js`, grid videos and intro film, and shares `gm/`'s data, renderer, app and feed assets, so changes to `gm/engine.js` or `gm/app.js` apply to all three. Grid videos are built with `gm/media/build_grid.sh`. Each version also ships `media/mask_<car>.mp4`: a small car-silhouette video in the same grid layout at half size (built with `gm/media/make_masks.py` and `gm/media/build_mask_grid.sh`). The renderer uses it to treat pale sky reflections on the paint as paint, so recoloured cars don't show magenta veins or blocky patches.

Those folders hold the built sites that GitHub Pages serves. `source/<app>/` holds the project each one is built from: run `npm install` and `npm run build` there, then copy its `dist/` over the matching top-level folder.

The app code under `source/<app>/src/components`, `src/data` and `public` is taken unchanged from the Lovable projects. Only the page shell (`index.html`, `src/main.tsx`) and the build setup differ, so that the sites run as plain static files.

Organic accounts, posts, counts and prices are invented. Built by Flam for partner conversations. Not affiliated with or endorsed by Instagram, Meta or the advertisers shown.

## Flick tags are locked

The Flick embed wrappers (`flick-frame.html`) and the list of Flick ids are pinned in `locks/flick-tags.lock`.
`locks/verify.sh` runs on every push and fails if they differ. Do not change a Flick tag without Ari's approval.
