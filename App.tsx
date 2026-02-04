
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { B5_CONFIG, LINE_SPACING_OPTIONS, FONTS } from './constants';
import { AppState, ImageElement } from './types';
import { polishText } from './services/geminiService';

const App: React.FC = () => {
  const lineSpacing = LINE_SPACING_OPTIONS['8mm'];
  const STORAGE_KEY = 'campus-b5-printer-pro:v1';
  
  // Calculate line count based on margins
  const initialLineCount = useMemo(() => {
    const availableHeight = B5_CONFIG.height - B5_CONFIG.topMargin - B5_CONFIG.bottomMargin;
    return Math.floor(availableHeight / lineSpacing);
  }, [lineSpacing]);

  const [state, setState] = useState<AppState>(() => {
    const defaultState: AppState = {
      text: '\n'.repeat(initialLineCount - 1),
      fontSize: 14,
      fontFamily: 'serif',
      spacingKey: '8mm',
      images: [],
      showLines: true,
      showHoles: true,
      isBackSide: false,
    };

    if (typeof window === 'undefined') {
      return defaultState;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      const spacingKey =
        parsed?.spacingKey === '8mm' || parsed?.spacingKey === '7mm' || parsed?.spacingKey === '6mm'
          ? parsed.spacingKey
          : defaultState.spacingKey;
      return {
        ...defaultState,
        ...parsed,
        text: typeof parsed?.text === 'string' ? parsed.text : defaultState.text,
        fontSize: typeof parsed?.fontSize === 'number' ? parsed.fontSize : defaultState.fontSize,
        fontFamily: typeof parsed?.fontFamily === 'string' ? parsed.fontFamily : defaultState.fontFamily,
        spacingKey,
        images: Array.isArray(parsed?.images) ? parsed.images : defaultState.images,
        showLines: typeof parsed?.showLines === 'boolean' ? parsed.showLines : defaultState.showLines,
        showHoles: typeof parsed?.showHoles === 'boolean' ? parsed.showHoles : defaultState.showHoles,
        isBackSide: typeof parsed?.isBackSide === 'boolean' ? parsed.isBackSide : defaultState.isBackSide,
      };
    } catch {
      return defaultState;
    }
  });

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const isComposing = useRef(false); // Ref to track IME state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const currentLineSpacing = LINE_SPACING_OPTIONS[state.spacingKey];
  const mmToPx = 3.78; 
  const effectiveLeftMargin = state.isBackSide ? B5_CONFIG.rightMargin : B5_CONFIG.leftMargin;
  const effectiveRightMargin = state.isBackSide ? B5_CONFIG.leftMargin : B5_CONFIG.rightMargin;
  const lineHeightPx = currentLineSpacing * mmToPx;
  const fontSizePx = state.fontSize * (96 / 72);

  const lineCount = useMemo(() => {
    const availableHeight = B5_CONFIG.height - B5_CONFIG.topMargin - B5_CONFIG.bottomMargin;
    return Math.floor(availableHeight / currentLineSpacing);
  }, [currentLineSpacing]);

  // Sync initial text and adjustments when rules change
  useEffect(() => {
    if (editorRef.current) {
      // Only set initial text if both editor and state are empty
      if (editorRef.current.innerText.trim() === '' && state.text.trim() === '') {
        const initialText = '\n'.repeat(lineCount - 1);
        editorRef.current.innerText = initialText;
        setState(prev => ({ ...prev, text: initialText }));
      }
    }
  }, [lineCount]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText.trim() === '' && state.text.trim() !== '') {
      editorRef.current.innerText = state.text;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to persist to localStorage:', err);
    }
  }, [state]);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>) => {
    isComposing.current = false;
    // After composition ends, we manually trigger the state update
    const newText = (e.target as HTMLDivElement).innerText;
    setState(prev => ({ ...prev, text: newText }));
  };

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    // We only update the React state if the user is NOT in the middle of an IME composition
    if (!isComposing.current) {
      const newText = e.currentTarget.innerText;
      setState(prev => ({ ...prev, text: newText }));
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg: ImageElement = {
          id: Date.now().toString(),
          url: event.target?.result as string,
          x: 30,
          y: 40,
          width: 50,
          height: 50,
        };
        setState(prev => ({ ...prev, images: [...prev.images, newImg] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAiPolish = async () => {
    if (!state.text.trim()) return;
    setIsAiProcessing(true);
    try {
      const polished = await polishText(state.text);
      if (editorRef.current) {
        editorRef.current.innerText = polished;
      }
      setState(prev => ({ ...prev, text: polished }));
    } catch (err) {
      console.error("Failed to polish text:", err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const removeImage = (id: string) => {
    setState(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const updateImagePos = (id: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, x, y } : img)
    }));
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden text-slate-800 font-sans">
      {/* Sidebar Controls */}
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
                  onChange={e => setState(prev => ({ ...prev, fontFamily: e.target.value }))}
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
                  onChange={e => setState(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
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
                  onClick={() => setState(prev => ({ ...prev, spacingKey: key }))}
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
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold border border-blue-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Insert Image
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAddImage} />
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
                  onClick={() => setState(prev => ({ ...prev, isBackSide: false }))}
                >
                  Front
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${state.isBackSide ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                  onClick={() => setState(prev => ({ ...prev, isBackSide: true }))}
                >
                  Back
                </button>
              </div>
            </div>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Guide Lines</span>
              <input type="checkbox" checked={state.showLines} onChange={e => setState(prev => ({ ...prev, showLines: e.target.checked }))} className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">26 Hole Guides</span>
              <input type="checkbox" checked={state.showHoles} onChange={e => setState(prev => ({ ...prev, showHoles: e.target.checked }))} className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300" />
            </label>
          </div>
        </section>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button 
            onClick={handleAiPolish}
            disabled={isAiProcessing}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${isAiProcessing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI Polish Flow
          </button>
          <button 
            onClick={handlePrint}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-4 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Note
          </button>
        </div>
      </aside>

      {/* Editor Surface */}
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
          {/* Hole punch visualization */}
          {state.showHoles && (
            <div
              className={`paper-holes absolute top-0 h-full flex flex-col items-center py-[8mm] pointer-events-none no-print ${
                state.isBackSide ? 'right-0 pr-[5mm]' : 'left-0 pl-[5mm]'
              }`}
            >
              {Array.from({ length: 26 }).map((_, i) => (
                <div key={i} className="w-[5mm] h-[5mm] rounded-full bg-slate-50 border border-slate-200 mb-[4.5mm] last:mb-0" />
              ))}
            </div>
          )}

          {/* Draggable Images */}
          {state.images.map(img => (
            <DraggableImage key={img.id} img={img} onRemove={() => removeImage(img.id)} onUpdate={updateImagePos} mmToPx={mmToPx} />
          ))}

          {/* Unified Flowing Editor Area */}
          <div 
            className="absolute overflow-hidden"
            style={{
              left: `${effectiveLeftMargin}mm`,
              top: `${B5_CONFIG.topMargin}mm`,
              right: `${effectiveRightMargin}mm`,
              height: `${lineCount * currentLineSpacing}mm`,
            }}
          >
            {/* Background Rules - Precise alignment with text */}
            {state.showLines && (
              <div 
                className="absolute inset-0 pointer-events-none no-print"
                style={{
                  borderTop: '1px solid #dbeafe',
                  borderBottom: '1px solid #dbeafe',
                  backgroundImage: `linear-gradient(to bottom, #dbeafe 1px, transparent 1px)`,
                  backgroundSize: `100% ${lineHeightPx}px`,
                  backgroundPosition: `0 -1px`,
                }}
              />
            )}
            {state.showLines && (
              <div className="absolute inset-0 pointer-events-none no-print">
                {Array.from({ length: lineCount }).map((_, index) => {
                  const lineNumber = index + 1;
                  if (lineNumber % 5 !== 0) return null;
                  return (
                    <div
                      key={lineNumber}
                      className={`absolute text-[8px] leading-none text-slate-300 select-none ${
                        state.isBackSide ? 'left-0' : 'right-0'
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
            )}

            {/* Vertical Marker Line (Red margin line often found in Campus notebooks) */}
            {state.showLines && (
              <div
                className={`absolute top-0 h-full w-[1px] bg-red-100 no-print ${
                  state.isBackSide ? 'right-0' : 'left-0'
                }`}
                style={{ marginLeft: '0mm', marginRight: '0mm' }}
              />
            )}

            <div 
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTextChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="editor-content relative w-full h-full outline-none cursor-text whitespace-pre-wrap break-words"
              style={{
                lineHeight: `${lineHeightPx}px`,
                fontSize: `${fontSizePx}px`,
                fontFamily: state.fontFamily,
                color: '#334155',
                padding: 0,
                margin: 0,
              }}
            />
          </div>

          {/* Bottom Limit visualization */}
          {state.showLines && (
             <div 
              className="absolute bottom-0 w-full no-print opacity-10 border-t-2 border-dashed border-slate-400"
              style={{ height: `${B5_CONFIG.bottomMargin}mm` }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

interface DraggableImageProps {
  img: ImageElement;
  onRemove: () => void;
  onUpdate: (id: string, x: number, y: number) => void;
  mmToPx: number;
}

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
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="no-print absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600">×</button>
    </div>
  );
};

export default App;
