import { useWindowDimensions } from 'react-native';
import { size } from '@/constants/design-tokens';

/** Follow the available window, including rotation and tablet split-screen. */
export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const isTabletLayout = width >= size.tabletBreakpoint;
  return {
    isTabletLayout,
    // Keep enough room for Thai text in each pane, including larger text settings.
    isWideAuthLayout: width >= size.tabletBreakpoint && width > height && fontScale <= 1.3,
    contentWidth: isTabletLayout ? size.tabletContentWidth : size.contentWidth,
    navigationInset: Math.max(0, (width - size.tabletContentWidth) / 2),
  };
}
