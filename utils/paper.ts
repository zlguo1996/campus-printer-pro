import { PaperConfig } from '../types';

export const getLineCount = (config: PaperConfig, lineSpacing: number) => {
  const availableHeight = config.height - config.topMargin - config.bottomMargin;
  return Math.floor(availableHeight / lineSpacing);
};
