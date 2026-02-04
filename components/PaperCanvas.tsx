import React, { useEffect, useRef, useState } from 'react';
import { B5_CONFIG } from '../constants';
import { ForbiddenArea, ImageElement } from '../types';
import DraggableImage from './DraggableImage';
import HolesLayer from './layers/HolesLayer';
import LineNumberLayer from './layers/LineNumberLayer';
import RedMarginLine from './layers/RedMarginLine';
import RuleLinesLayer from './layers/RuleLinesLayer';

type PaperCanvasProps = {
  images: ImageElement[];
  forbiddenAreas: ForbiddenArea[];
  showLines: boolean;
  showHoles: boolean;
  isBackSide: boolean;
  effectiveLeftMargin: number;
  effectiveRightMargin: number;
  lineCount: number;
  currentLineSpacing: number;
  lineHeightPx: number;
  fontSizePx: number;
  fontFamily: string;
  mmToPx: number;
  editorRef: React.RefObject<HTMLDivElement>;
  onTextChange: (e: React.FormEvent<HTMLDivElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImage: (id: string, x: number, y: number) => void;
  onUpdateForbiddenArea: (id: string, patch: Partial<ForbiddenArea>) => void;
  onRemoveForbiddenArea: (id: string) => void;
};

const PaperCanvas: React.FC<PaperCanvasProps> = ({
  images,
  forbiddenAreas,
  showLines,
  showHoles,
  isBackSide,
  effectiveLeftMargin,
  effectiveRightMargin,
  lineCount,
  currentLineSpacing,
  lineHeightPx,
  fontSizePx,
  fontFamily,
  mmToPx,
  editorRef,
  onTextChange,
  onCompositionStart,
  onCompositionEnd,
  onRemoveImage,
  onUpdateImage,
  onUpdateForbiddenArea,
  onRemoveForbiddenArea,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const dragState = useRef({ startY: 0, startTop: 0, lastX: 0 });
  const resizeState = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const MIN_FORBIDDEN_SIZE_MM = 10;

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      dragState.current.lastX = e.clientX;
      const dyMm = (e.clientY - dragState.current.startY) / mmToPx;
      const nextTop = Math.max(0, dragState.current.startTop + dyMm);
      onUpdateForbiddenArea(draggingId, { top: nextTop });
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const side = (dragState.current.lastX - rect.left) < rect.width / 2 ? 'left' : 'right';
        onUpdateForbiddenArea(draggingId, { side });
      }
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, mmToPx, onUpdateForbiddenArea]);

  useEffect(() => {
    if (!resizingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dxMm = (e.clientX - resizeState.current.startX) / mmToPx;
      const dyMm = (e.clientY - resizeState.current.startY) / mmToPx;
      const nextWidth = Math.max(MIN_FORBIDDEN_SIZE_MM, resizeState.current.startWidth + dxMm);
      const nextHeight = Math.max(MIN_FORBIDDEN_SIZE_MM, resizeState.current.startHeight + dyMm);
      onUpdateForbiddenArea(resizingId, { width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setResizingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingId, mmToPx, onUpdateForbiddenArea]);

  const handleForbiddenMouseDown = (e: React.MouseEvent, area: ForbiddenArea) => {
    e.preventDefault();
    dragState.current = {
      startY: e.clientY,
      startTop: area.top,
      lastX: e.clientX,
    };
    setDraggingId(area.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, area: ForbiddenArea) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: area.width,
      startHeight: area.height,
    };
    setResizingId(area.id);
  };

  return (
    <main className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center items-start">
      <div
        className="paper-container relative bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] origin-top"
        style={{
          width: `${B5_CONFIG.width}mm`,
          height: `${B5_CONFIG.height}mm`,
          minHeight: `${B5_CONFIG.height}mm`,
          position: 'relative',
        }}
      >
        <HolesLayer show={showHoles} isBackSide={isBackSide} />

        {images.map(img => (
          <DraggableImage
            key={img.id}
            img={img}
            onRemove={() => onRemoveImage(img.id)}
            onUpdate={onUpdateImage}
            mmToPx={mmToPx}
          />
        ))}

        <div
          className="absolute overflow-hidden"
          style={{
            left: `${effectiveLeftMargin}mm`,
            top: `${B5_CONFIG.topMargin}mm`,
            right: `${effectiveRightMargin}mm`,
            height: `${lineCount * currentLineSpacing}mm`,
          }}
        >
          {showLines && <RuleLinesLayer lineHeightPx={lineHeightPx} />}
          <LineNumberLayer
            lineCount={lineCount}
            lineHeightPx={lineHeightPx}
            isBackSide={isBackSide}
            show={showLines}
          />
          <RedMarginLine show={showLines} isBackSide={isBackSide} />

          <div ref={containerRef} className="relative w-full h-full">
            {forbiddenAreas.map(area => (
              <div
                key={area.id}
                className={`forbidden-area no-print cursor-move ${area.side === 'left' ? 'float-left' : 'float-right'}`}
                style={{
                  width: `${area.width}mm`,
                  height: `${area.height}mm`,
                  marginTop: `${area.top}mm`,
                }}
                contentEditable={false}
                onMouseDown={(e) => handleForbiddenMouseDown(e, area)}
              >
                <button
                  className="forbidden-remove-button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveForbiddenArea(area.id);
                  }}
                  contentEditable={false}
                  type="button"
                >
                  ×
                </button>
                <div
                  className="forbidden-resize-handle"
                  onMouseDown={(e) => handleResizeMouseDown(e, area)}
                />
              </div>
            ))}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={onTextChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              className="editor-content relative w-full h-full outline-none cursor-text whitespace-pre-wrap break-words"
              style={{
                lineHeight: `${lineHeightPx}px`,
                fontSize: `${fontSizePx}px`,
                fontFamily,
                color: '#334155',
                padding: 0,
                margin: 0,
              }}
            />
          </div>
        </div>

        {showLines && (
          <div
            className="absolute bottom-0 w-full no-print opacity-10 border-t-2 border-dashed border-slate-400"
            style={{ height: `${B5_CONFIG.bottomMargin}mm` }}
          />
        )}
      </div>
    </main>
  );
};

export default PaperCanvas;
