import { useEffect, useRef } from 'react';

interface ScrollScrubVideoProps {
  src: string;
}

export default function ScrollScrubVideo({ src }: ScrollScrubVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!video || !section || !video.duration) return;
        const rect = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = scrolled / total;
        video.currentTime = progress * video.duration;
      });
    };

    video.addEventListener('loadedmetadata', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      video.removeEventListener('loadedmetadata', handleScroll);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div ref={sectionRef} style={{ height: '250vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '16px',
          }}
        />
        {/* Gradient scrim */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(15, 19, 28, 0.95) 0%, rgba(15, 19, 28, 0.6) 40%, transparent 100%)',
          }}
        />
        {/* Logo overlay */}
        <div style={{ position: 'absolute', bottom: 40, left: 48 }}>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 700,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Revive
          </h1>
          <p
            className="font-mono label"
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.7)',
              margin: '4px 0 0',
              textTransform: 'uppercase',
            }}
          >
            Revenue Recovery Engine
          </p>
          <div
            className="font-mono label"
            style={{
              fontSize: 11,
              letterSpacing: '0.04em',
              color: 'var(--teal)',
              marginTop: 12,
              textTransform: 'uppercase',
            }}
          >
            Razorpay AI Buildathon 2026 &middot; Track 03
          </div>
        </div>
        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>SCROLL TO EXPLORE</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
