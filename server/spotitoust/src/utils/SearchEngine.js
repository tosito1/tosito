import { getTasteMatrix } from './DiscoveryEngine';

/**
 * 1. Full-Text Search (FTS) Normalization
 * Converts text to lowercase and removes diacritics (accents).
 */
export const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 ]/g, "")      // remove special chars
    .trim();
};

/**
 * 2. Fuzzy Search (Typo Tolerance) using Levenshtein Distance
 * Calculates the mathematical distance between two strings.
 */
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,       // deletion
        matrix[j - 1][i] + 1,       // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
};

/**
 * Calculates a fuzzy match score for a given target string against the query.
 * Lower distance is better. Returns a score boost where exact matches give high points.
 */
const getFuzzyScore = (queryStr, targetStr, weight) => {
  if (!targetStr) return 0;
  
  // Exact match bonus
  if (queryStr === targetStr) return 15 * weight;
  
  // Partial match (e.g. searching "taylor" matches "taylor swift" exactly at the start)
  if (targetStr.includes(queryStr)) return 5 * weight;
  
  // Fuzzy match (Levenshtein) on each word
  const targetWords = targetStr.split(' ');
  const queryWords = queryStr.split(' ');
  
  let totalScore = 0;
  
  for (const qWord of queryWords) {
      if (qWord.length < 3) continue; // Skip very short words for typo tolerance
      
      let bestWordScore = 0;
      for (const tWord of targetWords) {
          const distance = levenshteinDistance(qWord, tWord);
          
          // Typo tolerance: Max 2 errors allowed for words > 4 chars, 1 error for smaller.
          const maxDistance = qWord.length > 4 ? 2 : 1;
          
          if (distance <= maxDistance) {
              // 0 distance = perfect match (3 points)
              // 1 distance = 2 points
              // 2 distance = 1 point
              const points = (3 - distance);
              if (points > bestWordScore) bestWordScore = points;
          }
      }
      totalScore += (bestWordScore * weight);
  }
  
  return totalScore;
};

/**
 * 3. & 4. Ranking and Relevance Algorithm
 * Searches an array of tracks/artists and returns top ranked results.
 * @param {string} query The raw user input
 * @param {Array} dataset Array of track objects to search through
 * @param {number} limit Maximum number of results to return
 */
export const advancedSearch = (query, dataset, limit = 5) => {
  if (!query || query.trim().length < 2) return [];
  if (!dataset || dataset.length === 0) return [];

  const normalizedQuery = normalizeText(query);
  const tasteMatrix = getTasteMatrix();
  const scoredResults = [];

  for (const item of dataset) {
    let score = 0;
    
    const normTitle = normalizeText(item.title);
    const normArtist = normalizeText(item.artist);
    const normAlbum = normalizeText(item.album);

    // Weights: Artist (3x), Album (2x), Title (1.5x)
    score += getFuzzyScore(normalizedQuery, normArtist, 3);
    score += getFuzzyScore(normalizedQuery, normAlbum, 2);
    score += getFuzzyScore(normalizedQuery, normTitle, 1.5);

    // Only consider items that actually scored something
    if (score > 0) {
      // Bonus: Popularity from Taste Matrix (Discovery Engine)
      if (tasteMatrix.tracks && tasteMatrix.tracks[item.id]) {
        // Add 10% of their historical score as a minor rank booster
        score += (tasteMatrix.tracks[item.id].score * 0.1); 
      }
      if (tasteMatrix.artists && item.artist) {
          // Fallback to name if artistId is not in dataset
          const artistScore = tasteMatrix.artists[item.artistId] || tasteMatrix.artists[item.artist];
          if (artistScore) score += (artistScore.score * 0.05);
      }

      scoredResults.push({ item, score });
    }
  }

  // Sort by score descending and return the top items
  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item);
};
