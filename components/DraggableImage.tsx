import React, { useEffect, useState } from 'react';
import { ImageElement } from '../types';

type DraggableImageProps = {
  img: ImageElement;
  onRemove: () => void;
  onUpdate: (id: string, x: number, y: number) => void;
  mmToPx: number;
};

const DraggableImage: React.FC<DraggableImageProps> = ({ img, onRemove, onUpdate, mmToPx }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - startPos.x) / mmToPx;
      const dy = (e.clientY - startPos.y) / mmToPx;
      onUpdate(img.id, img.x + dx, img.y + dy);
      setStartPos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, img, onUpdate, mmToPx]);

  return (
    <div
      className={`absolute group cursor-move select-none ${isDragging ? 'ring-2 ring-blue-500 z-50' : 'z-10'}`}
      style={{ left: `${img.x}mm`, top: `${img.y}mm`, width: `${img.width}mm`, height: `${img.height}mm` }}
      onMouseDown={handleMouseDown}
    >
      <img src={img.url} alt="User upload" className="w-full h-full object-contain" />
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="no-print absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
      >
        ×
      </button>
    </div>
  );
};

export default DraggableImage;
