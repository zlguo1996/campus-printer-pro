import React from 'react';

type RedMarginLineProps = {
  show: boolean;
  isBackSide: boolean;
};

const RedMarginLine: React.FC<RedMarginLineProps> = ({ show, isBackSide }) => {
  if (!show) return null;

  return (
    <div
      className={`absolute top-0 h-full w-[1px] bg-red-100 no-print ${
        isBackSide ? 'right-0' : 'left-0'
      }`}
      style={{ marginLeft: '0mm', marginRight: '0mm' }}
    />
  );
};

export default RedMarginLine;
