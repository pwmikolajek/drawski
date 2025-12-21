/**
 * Calculate the Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one word into another.
 *
 * Uses the Wagner-Fischer algorithm (dynamic programming approach).
 *
 * @param word1 - First string to compare
 * @param word2 - Second string to compare
 * @returns The edit distance between the two strings
 *
 * @example
 * calculateLevenshteinDistance('cat', 'bat') // Returns 1 (substitute c with b)
 * calculateLevenshteinDistance('cat', 'cart') // Returns 1 (insert r)
 * calculateLevenshteinDistance('elephant', 'elephent') // Returns 1 (delete a)
 */
export function calculateLevenshteinDistance(word1: string, word2: string): number {
  // Handle edge cases
  if (word1 === word2) return 0;
  if (word1.length === 0) return word2.length;
  if (word2.length === 0) return word1.length;

  const len1 = word1.length;
  const len2 = word2.length;

  // Create a 2D array to store distances
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column (deletion from word1)
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  // Initialize first row (insertion to word1)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}
