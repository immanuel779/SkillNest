

import { useCallback, useEffect, useRef, useState } from 'react';

export default function PhotoCropper({
  file,
  onCancel,
  onSave,
  outputSize = 512,
  circular = true,
  viewport = 320,
}) {
  const [src, setSrc] = useState(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const pointers = useRef(new Map());
  const pinchRef = useRef(null);

  // load file into object URL, reset state
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // geometry
  const baseScale = natural
    ? Math.max(viewport / natural.w, viewport / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const drawnW = natural ? natural.w * scale : 0;
  const drawnH = natural ? natural.h * scale : 0;

  const clampOffset = useCallback(
    (o, w, h) => {
      const maxX = Math.max(0, (w - viewport) / 2);
      const maxY = Math.max(0, (h - viewport) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [viewport],
  );

  useEffect(() => {
    if (!natural) return;
    setOffset((o) => clampOffset(o, drawnW, drawnH));
  }, [natural, drawnW, drawnH, clampOffset]);

  // wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // escape to cancel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // pointer: drag to pan, pinch to zoom
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
      };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const next = (pinchRef.current.zoom * dist) / pinchRef.current.dist;
      setZoom(Math.min(4, Math.max(1, next)));
      return;
    }

    const d = dragRef.current;
    if (!d) return;
    setOffset(
      clampOffset(
        {
          x: d.ox + (e.clientX - d.startX),
          y: d.oy + (e.clientY - d.startY),
        },
        drawnW,
        drawnH,
      ),
    );
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;

    if (pointers.current.size === 0) {
      dragRef.current = null;
    } else if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      dragRef.current = {
        startX: p.x,
        startY: p.y,
        ox: offset.x,
        oy: offset.y,
      };
    }
  };

  // export
  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !natural) return;

    setSaving(true);
    setError(null);
    try {
      const ratio = outputSize / viewport;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported in this browser.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (circular) {
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      const dx = ((viewport - drawnW) / 2 + offset.x) * ratio;
      const dy = ((viewport - drawnH) / 2 + offset.y) * ratio;
      ctx.drawImage(img, dx, dy, drawnW * ratio, drawnH * ratio);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(
          resolve,
          circular ? 'image/png' : 'image/jpeg',
          0.92,
        ),
      );
      if (!blob) throw new Error('Could not export the image.');

      await onSave(blob);
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const imgLeft = (viewport - drawnW) / 2 + offset.x;
  const imgTop = (viewport - drawnH) / 2 + offset.y;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Adjust your photo"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Adjust your photo
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Drag to reposition · pinch or scroll to zoom
        </p>

        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mx-auto mt-4 touch-none select-none overflow-hidden bg-neutral-800"
          style={{
            width: viewport,
            height: viewport,
            borderRadius: circular ? '50%' : 16,
            cursor: 'grab',
          }}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                setNatural({ w: el.naturalWidth, h: el.naturalHeight });
              }}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{
                width: drawnW || undefined,
                height: drawnH || undefined,
                transform: `translate3d(${imgLeft}px, ${imgTop}px, 0)`,
                opacity: natural ? 1 : 0,
                willChange: 'transform',
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/40" />
          <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/15" />
          <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/15" />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/15" />
          <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/15" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-indigo-600"
          />
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Reset
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !natural}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}