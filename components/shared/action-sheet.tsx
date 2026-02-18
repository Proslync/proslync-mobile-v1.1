import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/glass/glass-surface';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]}>
          <GlassSurface fill="medium" border="subtle" cornerRadius="xl" style={styles.sheet}>
            {title && <Text style={styles.title}>{title}</Text>}
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  index < options.length - 1 && styles.optionBorder,
                ]}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.optionDestructive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </GlassSurface>

          <GlassSurface fill="medium" border="subtle" cornerRadius="xl" style={styles.cancelSheet}>
            <TouchableOpacity style={styles.option} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </GlassSurface>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  sheet: {
    overflow: 'hidden',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionText: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  optionDestructive: {
    color: '#FF3B30',
  },
  cancelSheet: {
    overflow: 'hidden',
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
