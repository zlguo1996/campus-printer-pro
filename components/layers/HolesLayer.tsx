import React from 'react';

type HolesLayerProps = {
  show: boolean;
  isBackSide: boolean;
};

const HolesLayer: React.FC<HolesLayerProps> = ({ show, isBackSide }) => {
  if (!show) return null;

  return (
    <div
      className={`paper-holes absolute top-0 h-full flex flex-col items-center py-[8mm] pointer-events-none no-print ${
        isBackSide ? 'right-0 pr-[5mm]' : 'left-0 pl-[5mm]'
      }`}
    >
      {Array.from({ length: 26 }).map((_, i) => (
        <div key={i} className="w-[5mm] h-[5mm] rounded-full bg-slate-50 border border-slate-200 mb-[4.5mm] last:mb-0" />
      ))}
    </div>
  );
};

export default HolesLayer;
