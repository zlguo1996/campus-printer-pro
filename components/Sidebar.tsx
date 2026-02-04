import React from 'react';
import { AppState } from '../types';
import { FONTS, LINE_SPACING_OPTIONS } from '../constants';

type SidebarProps = {
  state: AppState;
  isAiProcessing: boolean;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onSpacingChange: (key: AppState['spacingKey']) => void;
  onAddImageClick: () => void;
  onToggleBackSide: (isBackSide: boolean) => void;
  onToggleLines: (value: boolean) => void;
  onToggleHoles: (value: boolean) => void;
  onAiPolish: () => void;
  onPrint: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  state,
  isAiProcessing,
  onFontFamilyChange,
  onFontSizeChange,
  onSpacingChange,
  onAddImageClick,
  onToggleBackSide,
  onToggleLines,
  onToggleHoles,
  onAiPolish,
  onPrint,
}) => {
  return (
    <aside className="no-print w-full md:w-80 bg-white border-r border-slate-200 shadow-2xl z-20 flex flex-col p-6 space-y-6 overflow-y-auto">
      <header className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">C</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Campus Printer</h1>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">B5 Word-Style Editor</p>
      </header>

      <section className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Typography</label>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Font</span>
              <select
                className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:ring-blue-500 bg-slate-50 p-2.5 border text-sm transition-all"
                value={state.fontFamily}
                onChange={e => onFontFamilyChange(e.target.value)}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Size (pt)</span>
              <input
                type="number"
                className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:ring-blue-500 bg-slate-50 p-2.5 border text-sm transition-all"
                value={state.fontSize}
                onChange={e => onFontSizeChange(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Line Pitch</label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(LINE_SPACING_OPTIONS) as Array<keyof typeof LINE_SPACING_OPTIONS>).map((key) => (
              <button
                key={key}
                className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all flex justify-between items-center ${state.spacingKey === key ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                onClick={() => onSpacingChange(key)}
              >
                <span>{key} Rule</span>
                <span className="text-[10px] opacity-70">
                  {key === '8mm' ? '26 Lines' : key === '7mm' ? '31 Lines' : '36 Lines'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Insert</label>
        <button
          onClick={onAddImageClick}
          className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold border border-blue-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Insert Image
        </button>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Preview Settings</label>
        <div className="space-y-3 px-1">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-600 block">Side</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${!state.isBackSide ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                onClick={() => onToggleBackSide(false)}
              >
                Front
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${state.isBackSide ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                onClick={() => onToggleBackSide(true)}
              >
                Back
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Guide Lines</span>
            <input
              type="checkbox"
              checked={state.showLines}
              onChange={e => onToggleLines(e.target.checked)}
              className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">26 Hole Guides</span>
            <input
              type="checkbox"
              checked={state.showHoles}
              onChange={e => onToggleHoles(e.target.checked)}
              className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </label>
        </div>
      </section>

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button
          onClick={onAiPolish}
          disabled={isAiProcessing}
          className="w-full bg-purple-600 text-white hover:bg-purple-700 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg disabled:opacity-50"
        >
          <svg className={`w-5 h-5 ${isAiProcessing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI Polish Flow
        </button>
        <button
          onClick={onPrint}
          className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-4 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print Note
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
