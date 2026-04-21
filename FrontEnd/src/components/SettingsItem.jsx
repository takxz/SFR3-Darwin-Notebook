import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { styles } from '../../app/(tabs)/profile.styles';

export default function SettingsItem({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#97572B', textColor: '#FFFFFF' };
      case 'danger':
        return { backgroundColor: '#B01E28', textColor: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF', textColor: '#97572B' };
    }
  };

  const { backgroundColor, textColor } = getVariantStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsItem, { backgroundColor }]}
    >
      <View style={styles.settingsItemContent}>
        <Icon size={20} color={textColor} />
        <Text style={[styles.settingsItemLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
      <ChevronRight size={18} color={textColor} style={{ opacity: 0.4 }} />
    </Pressable>
  );
}
