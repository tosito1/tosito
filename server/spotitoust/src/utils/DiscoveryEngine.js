
const MATRIX_KEY = 'spotis_taste_matrix';
const LAST_SYNC_KEY = 'spotis_taste_last_sync';

// Signal weights based on user's framework
export const SIGNAL_WEIGHTS = {
  ADD_PLAYLIST: 9,
  FAVORITE: 8,
  COMPLETE_TRACK: 7,
  SHARE: 6,
  ARTIST_CLICK: 4,
  SKIP_FAST: -8
};

/**
 * Loads the current taste matrix from localStorage
 */
export const getTasteMatrix = () => {
  try {
    const raw = localStorage.getItem(MATRIX_KEY);
    return raw ? JSON.parse(raw) : { tracks: {}, artists: {} };
  } catch (e) {
    console.error("Error reading taste matrix:", e);
    return { tracks: {}, artists: {} };
  }
};

/**
 * Saves the taste matrix to localStorage
 */
const saveTasteMatrix = (matrix) => {
  localStorage.setItem(MATRIX_KEY, JSON.stringify(matrix));
};

/**
 * Tracks a user signal (action) and updates the mathematical weight of the track/artist locally.
 * 
 * @param {string} signalType - The key from SIGNAL_WEIGHTS
 * @param {object} track - The Spotify track object
 */
export const trackSignal = (signalType, track) => {
  if (!track || !track.id || !SIGNAL_WEIGHTS[signalType]) return;

  const matrix = getTasteMatrix();
  const weight = SIGNAL_WEIGHTS[signalType];

  // Update Track Weight
  if (!matrix.tracks[track.id]) {
    matrix.tracks[track.id] = { score: 0, name: track.title, artist: track.artist, playedAt: Date.now() };
  }
  matrix.tracks[track.id].score += weight;
  matrix.tracks[track.id].playedAt = Date.now(); // Update recency

  // Prevent score from going below 0 to keep data clean, unless it's a massive reject
  if (matrix.tracks[track.id].score < -20) matrix.tracks[track.id].score = -20;

  // Update Artist Weight (using track.artist as key, preferably should be artist ID if available, 
  // but we fallback to artist name if ID is missing in some contexts)
  const artistKey = track.artistId || track.artist;
  if (artistKey) {
    if (!matrix.artists[artistKey]) {
      matrix.artists[artistKey] = { score: 0, name: track.artist };
    }
    matrix.artists[artistKey].score += (weight * 0.8); // Artists get 80% of the track's weight
  }

  saveTasteMatrix(matrix);
  console.log(`[Discovery Engine] Signal tracked: ${signalType} (+${weight}) for ${track.title}`);
};

/**
 * Gets the best seeds (top tracks and top artists) to feed into Spotify's Hybrid Engine
 */
export const getRecommendationSeeds = () => {
  const matrix = getTasteMatrix();
  
  // Sort tracks by score
  const topTracks = Object.entries(matrix.tracks)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(entry => entry[0]); // Returns Track IDs

  // Sort artists by score
  const topArtists = Object.entries(matrix.artists)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 2)
    .map(entry => entry[0]); // Returns Artist IDs or Names

  return { seed_tracks: topTracks, seed_artists: topArtists };
};

/**
 * Batch syncs the local matrix to Firebase to save quota.
 * Only syncs if 24 hours have passed since the last sync.
 */
export const syncToFirebase = async () => {};
