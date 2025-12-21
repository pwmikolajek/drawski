import type { WordWithDifficulty, WordDifficulty } from '../models/GameState';

// Word list for drawing game - organized by difficulty
export const EASY_WORDS = [
  'cat', 'dog', 'sun', 'moon', 'star', 'tree', 'house', 'car', 'ball', 'book',
  'fish', 'bird', 'apple', 'pizza', 'cake', 'flower', 'clock', 'phone', 'shoe', 'hat',
  'chair', 'table', 'door', 'window', 'bed', 'lamp', 'cup', 'plate', 'fork', 'spoon',
  'pen', 'key', 'bag', 'box', 'gift', 'heart', 'smile', 'eye', 'hand', 'foot',
  'guitar', 'piano', 'camera', 'rocket', 'hamburger', 'sandwich', 'umbrella',
  // Animals
  'penguin', 'rabbit', 'duck', 'owl', 'frog', 'whale', 'shark', 'seal', 'bear', 'fox',
  // Objects
  'mirror', 'candle', 'kite', 'flag', 'coin', 'ring', 'watch', 'brush', 'towel', 'pillow',
  // Nature
  'cloud', 'rain', 'snow', 'wind', 'leaf', 'stone', 'grass', 'river', 'hill', 'beach',
  // Food
  'bread', 'soup', 'rice', 'meat', 'egg', 'milk', 'tea', 'ice', 'corn', 'bean',
];

export const MEDIUM_WORDS = [
  'elephant', 'giraffe', 'rainbow', 'mountain', 'ocean', 'bicycle',
  'dragon', 'castle', 'dinosaur', 'butterfly',
  'computer', 'keyboard', 'monitor', 'airplane', 'helicopter', 'submarine', 'volcano', 'island', 'pyramid', 'bridge',
  'crown', 'sword', 'shield', 'potion', 'knight', 'spaceship',
  'caterpillar', 'rhinoceros', 'hippopotamus', 'parachute', 'gondola', 'snowflake', 'labyrinth',
  // Animals
  'kangaroo', 'crocodile', 'cheetah', 'peacock', 'parrot', 'squirrel', 'hedgehog', 'beaver',
  // Objects
  'carousel', 'fountain', 'lantern', 'microphone', 'trumpet', 'compass', 'anchor', 'helmet',
  // Nature
  'waterfall', 'canyon', 'desert', 'jungle', 'glacier', 'lightning', 'earthquake', 'comet',
  // Food
  'spaghetti', 'pancake', 'sushi', 'burrito', 'croissant', 'pretzel', 'muffin', 'smoothie',
  // Professions
  'firefighter', 'detective', 'astronaut', 'surgeon', 'architect',
];

export const HARD_WORDS = [
  'microscope', 'saxophone', 'skyscraper', 'rollercoaster', 'refrigerator', 'chandelier', 'trampoline', 'xylophone',
  'constellation', 'architecture', 'kaleidoscope', 'periscope', 'photography', 'hieroglyphics', 'trapezoid',
  'pentagon', 'octagon', 'parallelogram', 'thermometer', 'barometer', 'accelerator', 'incubator', 'excavator',
  'treasure', 'pirate', 'robot', 'wizard', 'princess', 'monster', 'telescope', 'journalist',
  // Objects
  'stethoscope', 'metronome', 'harmonica', 'binoculars',
  // Nature
  'phenomenon', 'hurricane', 'tornado', 'avalanche', 'ecosystem', 'equinox',
  // Abstract
  'philosophy', 'encyclopedia', 'democracy', 'ceremony', 'navigation', 'revolution',
  // Scientific
  'molecule', 'observatory', 'laboratory', 'machinery', 'transformation',
  // Architecture
  'amphitheater', 'monument', 'cathedral', 'pavilion', 'sanctuary',
];

// Tagged words with difficulty
export const WORD_POOL: WordWithDifficulty[] = [
  ...EASY_WORDS.map(word => ({ word, difficulty: 'easy' as WordDifficulty })),
  ...MEDIUM_WORDS.map(word => ({ word, difficulty: 'medium' as WordDifficulty })),
  ...HARD_WORDS.map(word => ({ word, difficulty: 'hard' as WordDifficulty })),
];

export function getRandomWords(count: number = 3, difficulty?: WordDifficulty): WordWithDifficulty[] {
  let wordPool: WordWithDifficulty[];

  if (difficulty) {
    wordPool = WORD_POOL.filter(w => w.difficulty === difficulty);
  } else {
    wordPool = WORD_POOL;
  }

  const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get one word from each difficulty level
export function getMixedDifficultyWords(): WordWithDifficulty[] {
  const easy = WORD_POOL.filter(w => w.difficulty === 'easy');
  const medium = WORD_POOL.filter(w => w.difficulty === 'medium');
  const hard = WORD_POOL.filter(w => w.difficulty === 'hard');

  return [
    easy[Math.floor(Math.random() * easy.length)],
    medium[Math.floor(Math.random() * medium.length)],
    hard[Math.floor(Math.random() * hard.length)],
  ];
}
