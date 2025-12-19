import { getMixedDifficultyWords } from '../utils/wordList';
import type { WordWithDifficulty } from '../models/GameState';

class WordService {
  // Get random word options for the drawer (one from each difficulty)
  getWordOptions(): WordWithDifficulty[] {
    return getMixedDifficultyWords();
  }

  // Create display word with blanks (underscores)
  createDisplayWord(word: string): string {
    return '_'.repeat(word.length);
  }

  // Reveal a random hidden letter
  revealHint(word: string, currentDisplay: string): string {
    const displayArray = currentDisplay.split('');
    const hiddenIndices: number[] = [];

    // Find all hidden positions
    for (let i = 0; i < word.length; i++) {
      if (displayArray[i] === '_') {
        hiddenIndices.push(i);
      }
    }

    // If no hidden letters, return current display
    if (hiddenIndices.length === 0) {
      return currentDisplay;
    }

    // Pick a random hidden position
    const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    displayArray[randomIndex] = word[randomIndex];

    return displayArray.join('');
  }

  // Check if a guess matches the word
  checkGuess(guess: string, word: string): boolean {
    return guess.trim().toLowerCase() === word.toLowerCase();
  }
}

export const wordService = new WordService();
