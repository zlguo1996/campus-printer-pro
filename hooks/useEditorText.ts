import { useEffect, useRef } from 'react';
import { AppState } from '../types';

type UseEditorTextArgs = {
  lineCount: number;
  text: string;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const useEditorText = ({ lineCount, text, setState }: UseEditorTextArgs) => {
  const isComposing = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerText.trim() === '' && text.trim() === '') {
        const initialText = '\n'.repeat(lineCount - 1);
        editorRef.current.innerText = initialText;
        setState(prev => ({ ...prev, text: initialText }));
      }
    }
  }, [lineCount, text, setState]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText.trim() === '' && text.trim() !== '') {
      editorRef.current.innerText = text;
    }
  }, []);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>) => {
    isComposing.current = false;
    const newText = (e.target as HTMLDivElement).innerText;
    setState(prev => ({ ...prev, text: newText }));
  };

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isComposing.current) {
      const newText = e.currentTarget.innerText;
      setState(prev => ({ ...prev, text: newText }));
    }
  };

  return {
    editorRef,
    handleCompositionStart,
    handleCompositionEnd,
    handleTextChange,
  };
};

export default useEditorText;
