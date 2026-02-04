import React from 'react';

type RuleLinesLayerProps = {
  lineHeightPx: number;
};

const RuleLinesLayer: React.FC<RuleLinesLayerProps> = ({ lineHeightPx }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none no-print"
      style={{
        borderTop: '1px solid #dbeafe',
        borderBottom: '1px solid #dbeafe',
        backgroundImage: 'linear-gradient(to bottom, #dbeafe 1px, transparent 1px)',
        backgroundSize: `100% ${lineHeightPx}px`,
        backgroundPosition: '0 -1px',
      }}
    />
  );
};

export default RuleLinesLayer;
