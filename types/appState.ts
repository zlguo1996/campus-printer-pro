export interface FloatingBlock {
  id: string;
  side: 'left' | 'right';
  top: number; // in mm relative to writing area top
  width: number; // in mm
  height: number; // in mm
}

export interface ImageElement extends FloatingBlock {
  url: string;
}

export interface AppState {
  text: string;
  fontSize: number;
  fontFamily: string;
  spacingKey: '8mm' | '7mm' | '6mm';
  images: ImageElement[];
  showLines: boolean;
  showHoles: boolean;
  isBackSide: boolean;
  forbiddenAreas: ForbiddenArea[];
}

export type ForbiddenArea = FloatingBlock;
