import type { WordWithDifficulty, WordDifficulty } from '../models/GameState';

// Word list for drawing game - organized by difficulty
export const EASY_WORDS = [
  'cat', 'dog', 'sun', 'moon', 'star', 'tree', 'house', 'car', 'ball', 'book',
  'fish', 'bird', 'apple', 'pizza', 'cake', 'flower', 'clock', 'phone', 'shoe', 'hat',
  'chair', 'table', 'door', 'window', 'bed', 'lamp', 'cup', 'plate', 'fork', 'spoon',
  'pen', 'key', 'bag', 'box', 'gift', 'heart', 'smile', 'eye', 'hand', 'foot',
];

export const MEDIUM_WORDS = [
  'elephant', 'giraffe', 'rainbow', 'mountain', 'ocean', 'guitar', 'piano', 'camera', 'bicycle', 'rocket',
  'dragon', 'castle', 'treasure', 'pirate', 'robot', 'dinosaur', 'butterfly', 'hamburger', 'sandwich', 'umbrella',
  'computer', 'keyboard', 'monitor', 'airplane', 'helicopter', 'submarine', 'volcano', 'island', 'pyramid', 'bridge',
  'crown', 'sword', 'shield', 'potion', 'wizard', 'knight', 'princess', 'monster', 'spaceship', 'telescope',
];

export const HARD_WORDS = [
  'microscope', 'saxophone', 'skyscraper', 'rollercoaster', 'refrigerator', 'chandelier', 'trampoline', 'xylophone',
  'constellation', 'architecture', 'kaleidoscope', 'periscope', 'photography', 'hieroglyphics', 'trapezoid',
  'pentagon', 'octagon', 'parallelogram', 'thermometer', 'barometer', 'accelerator', 'incubator', 'excavator',
  'helicopter', 'submarine', 'parachute', 'gondola', 'caterpillar', 'rhinoceros', 'hippopotamus',
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
