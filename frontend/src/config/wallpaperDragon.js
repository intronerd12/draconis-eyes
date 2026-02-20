const WALLPAPER_DRAGON_PATHS = [
  '/wallpaper-dragon/wallpaper-01.jpeg',
  '/wallpaper-dragon/wallpaper-02.jpg',
  '/wallpaper-dragon/wallpaper-03.jpg',
  '/wallpaper-dragon/wallpaper-04.jpg',
  '/wallpaper-dragon/wallpaper-05.jpg',
  '/wallpaper-dragon/wallpaper-06.jpg',
  '/wallpaper-dragon/wallpaper-07.png',
  '/wallpaper-dragon/wallpaper-08.jpg',
  '/wallpaper-dragon/wallpaper-09.jpg',
  '/wallpaper-dragon/wallpaper-10.jpg',
  '/wallpaper-dragon/wallpaper-11.jpg',
]

export const WALLPAPER_DRAGON_IMAGES = WALLPAPER_DRAGON_PATHS.map((src, index) => ({
  src,
  label: `Wallpaper Dragon ${String(index + 1).padStart(2, '0')}`,
}))

function shuffleImages(images) {
  const copy = [...images]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getRandomWallpaperSet(count = 6) {
  if (count <= WALLPAPER_DRAGON_IMAGES.length) {
    return shuffleImages(WALLPAPER_DRAGON_IMAGES).slice(0, count)
  }

  const selected = []
  while (selected.length < count) {
    selected.push(...shuffleImages(WALLPAPER_DRAGON_IMAGES))
  }
  return selected.slice(0, count)
}
