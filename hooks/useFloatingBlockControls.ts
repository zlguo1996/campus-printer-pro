import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FloatingBlock } from '../types';

type UpdateHandler = (id: string, patch: Partial<FloatingBlock>) => void;

type UseFloatingBlockControlsParams = {
  mmToPx: number;
  minSizeMm?: number;
  containerRef: React.RefObject<HTMLElement>;
};

export const useFloatingBlockControls = ({
  mmToPx,
  minSizeMm = 10,
  containerRef,
}: UseFloatingBlockControlsParams) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  const dragState = useRef<{
    id: string;
    startY: number;
    startTop: number;
    lastClientX: number;
    onUpdate: UpdateHandler | null;
  }>({
    id: '',
    startY: 0,
    startTop: 0,
    lastClientX: 0,
    onUpdate: null,
  });

  const resizeState = useRef<{
    id: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    onUpdate: UpdateHandler | null;
  }>({
    id: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    onUpdate: null,
  });

  const handleDragStart = (
    e: React.MouseEvent,
    block: FloatingBlock,
    onUpdate: UpdateHandler
  ) => {
    e.preventDefault();
    dragState.current = {
      id: block.id,
      startY: e.clientY,
      startTop: block.top,
      lastClientX: e.clientX,
      onUpdate,
    };
    setDraggingId(block.id);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    block: FloatingBlock,
    onUpdate: UpdateHandler
  ) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = {
      id: block.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: block.width,
      startHeight: block.height,
      onUpdate,
    };
    setResizingId(block.id);
  };

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dyMm = (e.clientY - dragState.current.startY) / mmToPx;
      const nextTop = Math.max(0, dragState.current.startTop + dyMm);
      dragState.current.onUpdate?.(dragState.current.id, { top: nextTop });
      dragState.current.lastClientX = e.clientX;
    };

    const handleMouseUp = () => {
      if (containerRef.current && dragState.current.onUpdate) {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = dragState.current.lastClientX - rect.left;
        const side = relativeX < rect.width / 2 ? 'left' : 'right';
        dragState.current.onUpdate(dragState.current.id, { side });
      }
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, containerRef, mmToPx]);

  useEffect(() => {
    if (!resizingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dxMm = (e.clientX - resizeState.current.startX) / mmToPx;
      const dyMm = (e.clientY - resizeState.current.startY) / mmToPx;
      const nextWidth = Math.max(minSizeMm, resizeState.current.startWidth + dxMm);
      const nextHeight = Math.max(minSizeMm, resizeState.current.startHeight + dyMm);
      resizeState.current.onUpdate?.(resizeState.current.id, { width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setResizingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingId, mmToPx, minSizeMm]);

  return {
    draggingId,
    resizingId,
    handleDragStart,
    handleResizeStart,
  };
};
