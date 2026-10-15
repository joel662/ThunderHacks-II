import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { ReportMedia } from '@/types';

interface MediaGalleryProps {
  media: ReportMedia[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (media.length === 0) {
    return (
      <div className="bg-card border border-[var(--border)] rounded-xl p-8 flex items-center justify-center text-muted">
        No media attached
      </div>
    );
  }

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + media.length) % media.length : null));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % media.length : null));

  return (
    <>
      <div className={`grid gap-3 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {media.map((m, i) => (
          <div
            key={i}
            onClick={() => openLightbox(i)}
            className="relative aspect-video bg-surface rounded-xl overflow-hidden cursor-pointer group border border-[var(--border)]"
          >
            {m.type === 'video' ? (
              <>
                <video
                  src={m.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                  <Play className="w-12 h-12 text-white" fill="white" />
                </div>
              </>
            ) : (
              <img
                src={m.url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[80vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {media[lightboxIndex].type === 'video' ? (
              <video
                src={media[lightboxIndex].url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded-xl"
              />
            ) : (
              <img
                src={media[lightboxIndex].url}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
            )}
          </div>

          <div className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIndex + 1} / {media.length}
          </div>
        </div>
      )}
    </>
  );
}
