import { TextInput, View } from 'react-native';
import { Icon } from './icon';
import { palette, s } from './styles';
export function Field({ value, onChangeText, placeholder, multiline = false }: { value: string; onChangeText: (text: string) => void; placeholder: string; multiline?: boolean }) {
  const input = <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={palette.muted} value={value} onChangeText={onChangeText} multiline={multiline} maxLength={multiline ? 2000 : 120} style={multiline ? [s.input, { minHeight: 100, textAlignVertical: 'top' }] : s.searchInput} />;
  return multiline ? input : <View style={s.searchRow}><Icon name="search" />{input}</View>;
}
