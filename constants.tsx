
import { PaperConfig } from './types';

// Standard Campus B5: 182mm (W) x 257mm (H)
// Adjusted based on user physical measurements for 8mm/26-line rule
export const B5_CONFIG: PaperConfig = {
  width: 182,
  height: 257,
  lineSpacing: 8,
  topMargin: 33,    // Measured distance to 1st line
  leftMargin: 16,   // Measured distance to text start
  rightMargin: 4,   // Measured distance from text end to edge
  bottomMargin: 15  // Measured distance from last line to edge
};

export const LINE_SPACING_OPTIONS = {
  '8mm': 8, // 26 lines
  '7mm': 7, // 31 lines
  '6mm': 6  // 36 lines
};

export const FONTS = [
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'system-ui'
];
