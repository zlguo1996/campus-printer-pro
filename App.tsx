
import React, { useRef, useMemo, useState } from 'react';
import { B5_CONFIG, LINE_SPACING_OPTIONS } from './constants';
import { AppState, ForbiddenArea, ImageElement, FloatingBlock } from './types';
import { polishText } from './services/geminiService';
import Sidebar from './components/Sidebar';
import PaperCanvas from './components/PaperCanvas';
import useEditorText from './hooks/useEditorText';
import useLocalStorageState from './hooks/useLocalStorageState';
import { getLineCount } from './utils/paper';
import { mmToPx, ptToPx, MM_TO_PX } from './utils/units';

const MIN_FLOAT_DIMENSION_MM = 10;

const DEFAULT_FORBIDDEN_BLOCK: Omit<FloatingBlock, 'id'> = {
  side: 'left',
  top: 20,
  width: 35,
  height: 30,
};

const DEFAULT_IMAGE_BLOCK: Omit<FloatingBlock, 'id'> = {
  side: 'left',
  top: 15,
  width: 60,
  height: 60,
};

const clampTop = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  return fallback;
};

const clampDimension = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(MIN_FLOAT_DIMENSION_MM, value);
  }
  return Math.max(MIN_FLOAT_DIMENSION_MM, fallback);
};

const normalizeFloatingBlock = (raw: any, defaults: Omit<FloatingBlock, 'id'>): FloatingBlock | null => {
  if (!raw || typeof raw.id !== 'string') return null;
  const legacySide = typeof raw.x === 'number' ? (raw.x > (defaults.width + 20) ? 'right' : 'left') : defaults.side;
  const side = raw.side === 'right' || raw.side === 'left' ? raw.side : legacySide;
  const top = clampTop(typeof raw.top === 'number' ? raw.top : raw.y, defaults.top);
  const width = clampDimension(raw.width, defaults.width);
  const height = clampDimension(raw.height, defaults.height);

  return {
    id: raw.id,
    side,
    top,
    width,
    height,
  };
};

const normalizeImageElement = (raw: any): ImageElement | null => {
  if (!raw || typeof raw.url !== 'string') return null;
  const base = normalizeFloatingBlock(raw, DEFAULT_IMAGE_BLOCK);
  if (!base) return null;
  return {
    ...base,
    url: raw.url,
  };
};

const updateFloatingCollection = <T extends FloatingBlock>(
  collection: T[],
  id: string,
  patch: Partial<FloatingBlock>
): T[] => {
  return collection.map(item => {
    if (item.id !== id) return item;
    const next = {
      ...item,
      ...patch,
    };
    return {
      ...next,
      side: next.side === 'right' ? 'right' : 'left',
      top: clampTop(next.top, item.top),
      width: clampDimension(next.width, item.width),
      height: clampDimension(next.height, item.height),
    };
  });
};

const App: React.FC = () => {
  const lineSpacing = LINE_SPACING_OPTIONS['8mm'];
  const STORAGE_KEY = 'campus-b5-printer-pro:v1';
  
  // Calculate line count based on margins
  const initialLineCount = useMemo(() => getLineCount(B5_CONFIG, lineSpacing), [lineSpacing]);

  const defaultForbiddenAreas: ForbiddenArea[] = [];

  const defaultState: AppState = {
    text: '\n'.repeat(initialLineCount - 1),
    fontSize: 14,
    fontFamily: 'serif',
    spacingKey: '8mm',
    images: [],
    showLines: true,
    showHoles: true,
    isBackSide: false,
    forbiddenAreas: defaultForbiddenAreas,
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
        const forbiddenAreas = Array.isArray(parsed?.forbiddenAreas)
          ? parsed.forbiddenAreas
              .map((area: unknown) => normalizeFloatingBlock(area, DEFAULT_FORBIDDEN_BLOCK))
              .filter((area): area is ForbiddenArea => Boolean(area))
          : defaultForbiddenAreas;
        const images = Array.isArray(parsed?.images)
          ? parsed.images
              .map((img: unknown) => normalizeImageElement(img))
              .filter((img): img is ImageElement => Boolean(img))
          : defaultState.images;
        return {
          ...defaultState,
          ...parsed,
          text: typeof parsed?.text === 'string' ? parsed.text : defaultState.text,
          fontSize: typeof parsed?.fontSize === 'number' ? parsed.fontSize : defaultState.fontSize,
          fontFamily: typeof parsed?.fontFamily === 'string' ? parsed.fontFamily : defaultState.fontFamily,
          spacingKey,
          images,
          showLines: typeof parsed?.showLines === 'boolean' ? parsed.showLines : defaultState.showLines,
          showHoles: typeof parsed?.showHoles === 'boolean' ? parsed.showHoles : defaultState.showHoles,
          isBackSide: typeof parsed?.isBackSide === 'boolean' ? parsed.isBackSide : defaultState.isBackSide,
          forbiddenAreas,
        };
      },
    }
  );

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLineSpacing = LINE_SPACING_OPTIONS[state.spacingKey];
  const effectiveLeftMargin = state.isBackSide ? B5_CONFIG.rightMargin : B5_CONFIG.leftMargin;
  const effectiveRightMargin = state.isBackSide ? B5_CONFIG.leftMargin : B5_CONFIG.rightMargin;
  const lineHeightPx = mmToPx(currentLineSpacing);
  const fontSizePx = ptToPx(state.fontSize);

  const lineCount = useMemo(() => getLineCount(B5_CONFIG, currentLineSpacing), [currentLineSpacing]);

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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setState(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            id: `image-${Date.now()}`,
            url,
            side: DEFAULT_IMAGE_BLOCK.side,
            top: DEFAULT_IMAGE_BLOCK.top + prev.images.length * 10,
            width: DEFAULT_IMAGE_BLOCK.width,
            height: DEFAULT_IMAGE_BLOCK.height,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
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

  const updateImageBlock = (id: string, patch: Partial<FloatingBlock>) => {
    setState(prev => ({
      ...prev,
      images: updateFloatingCollection(prev.images, id, patch),
    }));
  };

  const updateForbiddenArea = (id: string, patch: Partial<ForbiddenArea>) => {
    setState(prev => ({
      ...prev,
      forbiddenAreas: updateFloatingCollection(prev.forbiddenAreas, id, patch),
    }));
  };

  const addForbiddenArea = () => {
    setState(prev => {
      const newArea: ForbiddenArea = {
        id: `forbidden-${Date.now()}`,
        side: DEFAULT_FORBIDDEN_BLOCK.side,
        top: DEFAULT_FORBIDDEN_BLOCK.top + prev.forbiddenAreas.length * 10,
        width: DEFAULT_FORBIDDEN_BLOCK.width,
        height: DEFAULT_FORBIDDEN_BLOCK.height,
      };
      return {
        ...prev,
        forbiddenAreas: [...prev.forbiddenAreas, newArea],
      };
    });
  };

  const removeForbiddenArea = (id: string) => {
    setState(prev => ({
      ...prev,
      forbiddenAreas: prev.forbiddenAreas.filter(area => area.id !== id),
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
        onAddForbiddenArea={addForbiddenArea}
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
        forbiddenAreas={state.forbiddenAreas}
        effectiveLeftMargin={effectiveLeftMargin}
        effectiveRightMargin={effectiveRightMargin}
        lineCount={lineCount}
        currentLineSpacing={currentLineSpacing}
        lineHeightPx={lineHeightPx}
        fontSizePx={fontSizePx}
        fontFamily={state.fontFamily}
        mmToPx={MM_TO_PX}
        editorRef={editorRef}
        onTextChange={handleTextChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onRemoveImage={removeImage}
        onUpdateImage={updateImageBlock}
        onUpdateForbiddenArea={updateForbiddenArea}
        onRemoveForbiddenArea={removeForbiddenArea}
      />
    </div>
  );
};

export default App;
