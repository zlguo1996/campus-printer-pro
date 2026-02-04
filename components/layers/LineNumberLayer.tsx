import React from 'react';

type LineNumberLayerProps = {
  lineCount: number;
  lineHeightPx: number;
  isBackSide: boolean;
  show: boolean;
};

const LineNumberLayer: React.FC<LineNumberLayerProps> = ({ lineCount, lineHeightPx, isBackSide, show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none no-print">
      {Array.from({ length: lineCount }).map((_, index) => {
        const lineNumber = index + 1;
        if (lineNumber % 5 !== 0) return null;
        return (
          <div
            key={lineNumber}
            className={`absolute text-[8px] leading-none text-slate-300 select-none ${
              isBackSide ? 'left-0' : 'right-0'
            }`}
            style={{
              top: `${lineNumber * lineHeightPx}px`,
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            {lineNumber}
          </div>
        );
      })}
    </div>
  );
};

export default LineNumberLayer;
