
import React, { useRef, useMemo, useState } from 'react';
import { B5_CONFIG, LINE_SPACING_OPTIONS } from './constants';
import { AppState, ImageElement } from './types';
import { polishText } from './services/geminiService';
import Sidebar from './components/Sidebar';
import PaperCanvas from './components/PaperCanvas';
import useEditorText from './hooks/useEditorText';
import useLocalStorageState from './hooks/useLocalStorageState';

const App: React.FC = () => {
  const lineSpacing = LINE_SPACING_OPTIONS['8mm'];
  const STORAGE_KEY = 'campus-b5-printer-pro:v1';
  
  // Calculate line count based on margins
  const initialLineCount = useMemo(() => {
    const availableHeight = B5_CONFIG.height - B5_CONFIG.topMargin - B5_CONFIG.bottomMargin;
    return Math.floor(availableHeight / lineSpacing);
  }, [lineSpacing]);

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

  const [state, setState] = useLocalStorageState<AppState>(
    STORAGE_KEY,
    () => defaultState,
    {
      deserialize: (raw) => {
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
      },
    }
  );

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const {
    editorRef,
    handleCompositionStart,
    handleCompositionEnd,
    handleTextChange,
  } = useEditorText({
    lineCount,
    text: state.text,
    setState,
  });

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
      <Sidebar
        state={state}
        isAiProcessing={isAiProcessing}
        onFontFamilyChange={(value) => setState(prev => ({ ...prev, fontFamily: value }))}
        onFontSizeChange={(value) => setState(prev => ({ ...prev, fontSize: value }))}
        onSpacingChange={(key) => setState(prev => ({ ...prev, spacingKey: key }))}
        onAddImageClick={() => fileInputRef.current?.click()}
        onToggleBackSide={(isBackSide) => setState(prev => ({ ...prev, isBackSide }))}
        onToggleLines={(value) => setState(prev => ({ ...prev, showLines: value }))}
        onToggleHoles={(value) => setState(prev => ({ ...prev, showHoles: value }))}
        onAiPolish={handleAiPolish}
        onPrint={handlePrint}
      />
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAddImage} />

      <PaperCanvas
        images={state.images}
        showLines={state.showLines}
        showHoles={state.showHoles}
        isBackSide={state.isBackSide}
        effectiveLeftMargin={effectiveLeftMargin}
        effectiveRightMargin={effectiveRightMargin}
        lineCount={lineCount}
        currentLineSpacing={currentLineSpacing}
        lineHeightPx={lineHeightPx}
        fontSizePx={fontSizePx}
        fontFamily={state.fontFamily}
        mmToPx={mmToPx}
        editorRef={editorRef}
        onTextChange={handleTextChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onRemoveImage={removeImage}
        onUpdateImage={updateImagePos}
      />
    </div>
  );
};

export default App;
