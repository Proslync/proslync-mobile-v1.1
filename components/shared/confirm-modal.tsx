import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** When true, shows only a single "OK" button (no cancel). Used for error/info alerts. */
  alertOnly?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  icon,
  alertOnly = false,
}: ConfirmModalProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleCancel = React.useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleConfirm = React.useCallback(() => {
    bottomSheetRef.current?.close();
    onConfirm?.();
  }, [onConfirm]);

  const iconColor = destructive ? '#ff3b30' : '#fff';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: 'transparent',
        borderRadius: TAB_BAR_RADIUS,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.sheetContent}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={TAB_BAR_RADIUS}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          {icon && (
            <View style={styles.iconCircle}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={28}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name={icon} size={28} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.actions}>
          {alertOnly ? (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.fillMedium}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.confirmText}>OK</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.cancelBtn, isLoading && { opacity: 0.5 }]}
                onPress={handleCancel}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, isLoading && { opacity: 0.5 }]}
                onPress={handleConfirm}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <GlassView
                  {...(destructive ? liquidGlass.danger : liquidGlass.fillMedium)}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
