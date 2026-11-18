/* Vehicles, colours, mod packages and environments.
   Colour names are the real 2027 palettes; hex values are on-screen approximations.
   Clip files: media/<car>_<env>_<mod>.mp4 (all in magenta key paint, 9:16, same length).
   Until a clip exists, MEDIA_FALLBACK is used so the flow can be reviewed. */
window.GM = {
  envs: [
    { id: 'lake',   name: 'Mountain lake', thumb: 'media/env_lake.jpg' },
    { id: 'desert', name: 'Desert canyon', thumb: 'media/env_desert.jpg' },
    { id: 'coast',  name: 'Coast road',    thumb: 'media/env_coast.jpg' },
  ],
  cars: [
    {
      id: 'sierra', name: 'GMC Sierra 1500', short: 'Sierra 1500', year: 2027,
      thumb: 'media/car_sierra.jpg', cta: 'https://www.gmc.com/trucks/sierra/1500',
      colors: [
        { name: 'Summit White', hex: '#f1f1ed' },
        { name: 'Onyx Black', hex: '#0c0c0e' },
        { name: 'Sterling Metallic', hex: '#a7abb0' },
        { name: 'Dark Ridge Metallic', hex: '#4b4e52' },
        { name: 'Azurite Blue Metallic', hex: '#1e3d6a' },
        { name: 'Mesa Red', hex: '#8d1a1f' },
        { name: 'Coastal Dune', hex: '#b8a487' },
      ],
      mods: [
        { id: 'stock', name: 'Stock' },
        { id: 'at4x', name: 'AT4X kit' },
        { id: 'aev', name: 'AEV Edition' },
        { id: 'denali', name: 'Denali' },
      ],
    },
    {
      id: 'corvette', name: 'Chevrolet Corvette Grand Sport', short: 'Corvette Grand Sport', year: 2027,
      thumb: 'media/car_corvette.jpg', cta: 'https://www.chevrolet.com/performance/corvette',
      colors: [
        { name: 'Torch Red', hex: '#c8102e' },
        { name: 'Competition Yellow Tintcoat', hex: '#f2c200' },
        { name: 'Admiral Blue Metallic', hex: '#1b2e5c' },
        { name: 'Sebring Orange Tintcoat', hex: '#df561a' },
        { name: 'Roswell Green Metallic', hex: '#2e4939' },
        { name: 'Arctic White', hex: '#f3f3f1' },
        { name: 'Black', hex: '#0a0a0b' },
        { name: 'Blade Silver Metallic', hex: '#b3b7bb' },
      ],
      mods: [
        { id: 'stock', name: 'Stock' },
        { id: 'aero', name: 'Carbon Aero' },
        { id: 'wheels', name: 'Carbon wheels' },
        { id: 'stripes', name: 'Racing stripes' },
      ],
    },
    {
      id: 'hummer', name: 'GMC HUMMER EV SUV', short: 'HUMMER EV SUV', year: 2027,
      thumb: 'media/car_hummer.jpg', cta: 'https://www.gmc.com/electric/hummer-ev/suv',
      colors: [
        { name: 'ICON', hex: '#f1c000' },
        { name: 'Dark Ridge', hex: '#4b4e52' },
        { name: 'Azurite Blue', hex: '#1e3d6a' },
        { name: 'Dark Ember', hex: '#5b2b22' },
        { name: 'Deep Void Matte', hex: '#1c1d20', spec: 0.25 },
      ],
      mods: [
        { id: 'stock', name: 'Stock' },
        { id: 'wheels22', name: '22" wheels' },
        { id: 'offroad', name: 'Off-road kit' },
        { id: 'icon', name: 'ICON | 25' },
      ],
    },
  ],
  clip: (car, env, mod) => `media/${car}_${env}_${mod}.mp4`,
};
window.MEDIA_FALLBACK = 'media/sierra_lake_stock.mp4';
