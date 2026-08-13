import React, { useState, useRef } from 'react';

const ColorExtractorCard = ({ imageSrc, title, description }) => {
  const [dominantColor, setDominantColor] = useState('rgba(147, 51, 234, 0.2)');
  const [glowColor, setGlowColor] = useState('rgba(147, 51, 234, 0.4)');
  const imgRef = useRef(null);

  const handleImageLoad = () => {
    try {
      const img = imgRef.current;
      if (!img) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || 100;
      canvas.height = img.naturalHeight || 100;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count > 0) {
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.25)`);
        setGlowColor(`rgba(${r}, ${g}, ${b}, 0.5)`);
      }
    } catch (e) {
      console.warn('Color extraction fallback triggered:', e);
    }
  };

  return (
    <div
      className="relative group w-full max-w-sm rounded-2xl p-6 border border-neutral-800 bg-neutral-900/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{
        backgroundColor: dominantColor,
        boxShadow: `0 12px 30px -10px ${glowColor}`,
      }}
    >
      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-5 bg-neutral-950">
        <img
          ref={imgRef}
          src={imageSrc}
          alt={title}
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-300 leading-relaxed font-light">{description}</p>
    </div>
  );
};

export default ColorExtractorCard;
