import doodleStar from './doodles/star.webp';
import doodleStar2 from './doodles/star-2.webp';
import doodleBurst from './doodles/burst.webp';
import fullbodyCut from './characters/fullbody-cutout.webp';
import mainFlat from './characters/main-flat.webp';
import mainInk from './characters/main-ink.webp';
import mainBack from './characters/main-back.webp';
import readingFlat from './characters/reading-flat.webp';
import readingInk from './characters/reading-ink.webp';
import readingBack from './characters/reading-back.webp';
import fullFlat from './characters/full-flat.webp';
import fullInk from './characters/full-ink.webp';
import fullBack from './characters/full-back.webp';
import silhouette from './characters/silhouette.webp';
import grainTile from './textures/grain-tile.svg';

// Every image the site uses. Templates read these as {{asset.<name>}}; data files import ASSETS directly.
export const ASSETS = {
  doodleStar,
  doodleStar2,
  doodleBurst,
  fullbodyCut,
  mainFlat,
  mainInk,
  mainBack,
  readingFlat,
  readingInk,
  readingBack,
  fullFlat,
  fullInk,
  fullBack,
  silhouette,
  grainTile
};

// Small hand-drawn doodles used by the playground.
export const ART = { star: doodleStar, star2: doodleStar2, burst: doodleBurst };
