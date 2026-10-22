import { Text, View } from 'react-native';
import { s } from './styles';

export function Empty({ text }: { text: string }) { return <View style={s.empty}><Text style={s.sectionTitle}>ยังไม่มีรายการ</Text><Text style={s.muted}>{text}</Text></View>; }
