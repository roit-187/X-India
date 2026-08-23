/**
 * Utility functions for parsing, validating, and formatting YouTube URLs.
 */

/**
 * Extracts YouTube Video ID from various YouTube URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Raw 11-character video ID
 *
 * @param {string} url - YouTube URL or ID
 * @returns {string|null} - 11-character YouTube video ID or null if invalid
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If already an 11-character alphanumeric/dash/underscore ID (no dots or slashes)
  if (!trimmed.includes('.') && !trimmed.includes('/') && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, youtu.be, shorts, embed, live, and mobile URLs
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regex);

  return match ? match[1] : null;
}

/**
 * Checks if a given string is a valid YouTube URL or ID.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  return Boolean(extractYouTubeId(url));
}

/**
 * Generates an optimized YouTube embed URL.
 *
 * @param {string} videoIdOrUrl
 * @param {object} options
 * @param {boolean} [options.autoplay=false]
 * @param {boolean} [options.rel=false] - Show related videos from same channel only
 * @param {boolean} [options.modestbranding=true]
 * @returns {string|null}
 */
export function getYouTubeEmbedUrl(videoIdOrUrl, { autoplay = false, rel = false, modestbranding = true } = {}) {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return null;

  const params = new URLSearchParams({
    rel: rel ? '1' : '0',
    modestbranding: modestbranding ? '1' : '0',
    playsinline: '1',
    enablejsapi: '1',
  });

  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Generates the URL for the YouTube video thumbnail.
 *
 * @param {string} videoIdOrUrl
 * @param {'maxresdefault'|'hqdefault'|'mqdefault'|'default'} [quality='hqdefault']
 * @returns {string|null}
 */
export function getYouTubeThumbnailUrl(videoIdOrUrl, quality = 'hqdefault') {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Checks if a given URL is a direct video file (e.g. .mp4, Cloudinary).
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.ogg') ||
    lower.includes('.mov') ||
    lower.includes('res.cloudinary.com')
  );
}
