import React from 'react';
import { FloatingBlock } from '../types';

type FloatingBlockProps = {
  block: FloatingBlock;
  className?: string;
  isActive?: boolean;
  onDragStart: (e: React.MouseEvent, block: FloatingBlock) => void;
  onResizeStart?: (e: React.MouseEvent, block: FloatingBlock) => void;
  onRemove?: () => void;
  children?: React.ReactNode;
};

const FloatingBlockItem: React.FC<FloatingBlockProps> = ({
  block,
  className = '',
  isActive = false,
  onDragStart,
  onResizeStart,
  onRemove,
  children,
}) => {
  const floatClass =
    block.side === 'left' ? 'float-left clear-left' : 'float-right clear-right';

  return (
    <div
      className={`floating-block no-print cursor-move ${floatClass} ${className} ${
        isActive ? 'floating-block--active' : ''
      }`}
      style={{
        marginTop: `${block.top}mm`,
        width: `${block.width}mm`,
        height: `${block.height}mm`,
      }}
      contentEditable={false}
      onMouseDown={(e) => onDragStart(e, block)}
    >
      {onRemove && (
        <button
          type="button"
          className="floating-remove-button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
      <div className="floating-block__content">{children}</div>
      {onResizeStart && (
        <div
          className="floating-resize-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, block);
          }}
        />
      )}
    </div>
  );
};

export default FloatingBlockItem;
