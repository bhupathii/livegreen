import React, { useState, useRef, MouseEvent } from "react";

interface ProductZoomProps {
  src: string;
  alt: string;
}

export function ProductZoom({ src, alt }: ProductZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setPosition({ x, y });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[2rem] bg-white cursor-crosshair group"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center transition-opacity duration-300"
        style={{ opacity: showZoom ? 0 : 1 }}
        loading="eager" // Main image should load eagerly
      />
      
      {showZoom && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: "250%", // Zoom level
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
      
      {/* Hint overlay that disappears on hover */}
      <div className={`absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 pointer-events-none transition-opacity duration-300 ${showZoom ? 'opacity-0' : 'opacity-100'}`}>
        Hover to zoom
      </div>
    </div>
  );
}
