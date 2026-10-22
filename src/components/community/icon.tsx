import { Image, type ColorValue } from 'react-native';
import { colors, size } from '@/constants/design-tokens';
const sources = {
  checkboxCheck: require('@/assets/icons/community/checkbox-check.png'),
  community: require('@/assets/icons/community/community.png'),
  announcement: require('@/assets/icons/community/announcement.png'),
  bookmark: require('@/assets/icons/community/bookmark.png'),
  bell: require('@/assets/icons/community/bell.png'),
  profile: require('@/assets/icons/community/profile.png'),
  search: require('@/assets/icons/community/search.png'),
  filter: require('@/assets/icons/community/filter.png'),
  plus: require('@/assets/icons/community/plus.png'),
  heart: require('@/assets/icons/community/heart.png'),
  comment: require('@/assets/icons/community/comment.png'),
  shield: require('@/assets/icons/community/shield.png'),
  verified: require('@/assets/icons/community/verified.png'),
  more: require('@/assets/icons/community/more.png'),
  pin: require('@/assets/icons/community/pin.png'),
  arrow: require('@/assets/icons/community/arrow.png'),
  edit: require('@/assets/icons/community/edit.png'),
  flag: require('@/assets/icons/community/flag.png'),
  check: require('@/assets/icons/community/check.png'),
  school: require('@/assets/icons/community/school.png'),
};
export type IconName = keyof typeof sources;
/** Local downloaded PNG assets, not SVG paths or an icon font. */
export function Icon({ name, color = colors.purple, large = false }: { name: IconName; color?: ColorValue; large?: boolean }) {
  return <Image accessible={false} source={sources[name]} resizeMode="contain" style={{ width: large ? size.tabIcon : size.icon, height: large ? size.tabIcon : size.icon, tintColor: color }} />;
}
