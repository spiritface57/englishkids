// Vocabulary for the word game. Loaded lazily (dynamic import) so it doesn't weigh down the first page load.
import actions from './words/actions.json';
import animalsNature from './words/animals-nature.json';
import bodyFeelings from './words/body-feelings.json';
import describeTime from './words/describe-time.json';
import everyday from './words/everyday.json';
import food from './words/food.json';
import homeClothes from './words/home-clothes.json';
import placesPlay from './words/places-play.json';
import schoolPeople from './words/school-people.json';
import scienceWorld from './words/science-world.json';

export type Word = { en: string; fa: string; e: string; s: string; c: string };

const lists: Word[][] = [
  animalsNature,
  food,
  homeClothes,
  schoolPeople,
  bodyFeelings,
  describeTime,
  placesPlay,
  scienceWorld,
  everyday,
  actions,
];

// Some words appear in several topic lists ("fish" is an animal, a food and a verb); keep one, preferring one with an emoji.
const byWord = new Map<string, Word>();
for (const w of lists.flat()) {
  const key = w.en.toLowerCase();
  const prev = byWord.get(key);
  if (!prev || (!prev.e && w.e)) byWord.set(key, w);
}

export const words = [...byWord.values()];
