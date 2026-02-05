import React, { useRef } from 'react';
import { B5_CONFIG } from '../constants';
import { ForbiddenArea, ImageElement, FloatingBlock } from '../types';
import FloatingBlockItem from './FloatingBlock';
import { useFloatingBlockControls } from '../hooks/useFloatingBlockControls';
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
  onUpdateImage: (id: string, patch: Partial<FloatingBlock>) => void;
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
  const { draggingId, resizingId, handleDragStart, handleResizeStart } = useFloatingBlockControls({
    mmToPx,
    minSizeMm: 10,
    containerRef,
  });

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
              <FloatingBlockItem
                key={area.id}
                block={area}
                className="floating-block--forbidden"
                isActive={draggingId === area.id || resizingId === area.id}
                onDragStart={(e, block) => handleDragStart(e, block, onUpdateForbiddenArea)}
                onResizeStart={(e, block) => handleResizeStart(e, block, onUpdateForbiddenArea)}
                onRemove={() => onRemoveForbiddenArea(area.id)}
              />
            ))}
            {images.map(img => (
              <FloatingBlockItem
                key={img.id}
                block={img}
                className="floating-block--image"
                isActive={draggingId === img.id || resizingId === img.id}
                onDragStart={(e, block) => handleDragStart(e, block, onUpdateImage)}
                onResizeStart={(e, block) => handleResizeStart(e, block, onUpdateImage)}
                onRemove={() => onRemoveImage(img.id)}
              >
                <img
                  src={img.url}
                  alt="User upload"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </FloatingBlockItem>
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
                zIndex: 1,
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
