import { Text, View } from 'react-native';
import { s } from './styles';
import { colors } from '@/constants/design-tokens';

export function Empty({ text }: { text: string }) { return <View style={s.empty}><Text style={[s.sectionTitle, { color: colors.nightText }]}>ยังไม่มีรายการ</Text><Text style={[s.muted, { color: colors.nightMuted }]}>{text}</Text></View>; }
