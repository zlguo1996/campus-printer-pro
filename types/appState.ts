export interface ImageElement {
  id: string;
  url: string;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
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
}
