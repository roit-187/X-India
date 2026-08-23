'use client';

import React, { useState } from 'react';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isDirectVideoUrl } from '@/lib/youtube';

/**
 * Responsive Video Player Component for Next.js / Web.
 * 
 * Supports:
 * - YouTube URLs (watch, share, shorts, embeds, IDs) with responsive 16:9 ratio.
 * - Direct MP4 / Cloudinary legacy fallback URLs.
 * - Loading placeholder with thumbnail preview.
 */
export default function YouTubePlayer({
  videoUrl,
  title = 'Video player',
  className = '',
  style = {},
  aspectRatio = '16 / 9',
  autoPlay = false,
  showThumbnailFirst = false,
}) {
  const [isPlaying, setIsPlaying] = useState(!showThumbnailFirst);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!videoUrl) return null;

  const youtubeId = extractYouTubeId(videoUrl);
  const isDirect = isDirectVideoUrl(videoUrl);

  // If it's a YouTube video
  if (youtubeId) {
    const embedUrl = getYouTubeEmbedUrl(youtubeId, { autoplay: isPlaying && showThumbnailFirst });
    const thumbnailUrl = getYouTubeThumbnailUrl(youtubeId, 'hqdefault');

    if (showThumbnailFirst && !isPlaying) {
      return (
        <div
          className={`yt-player-container ${className}`}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#0F172A',
            cursor: 'pointer',
            ...style,
          }}
          onClick={() => setIsPlaying(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsPlaying(true);
            }
          }}
          aria-label={`Play video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`yt-player-container ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          ...style,
        }}
      >
        {!isLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1E293B',
              color: '#94A3B8',
              fontSize: '13px',
              zIndex: 1,
            }}
          >
            Loading player...
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback for legacy direct MP4 / video URLs
  return (
    <div
      className={`yt-player-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        ...style,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={videoUrl}
        controls
        preload="metadata"
        autoPlay={autoPlay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
