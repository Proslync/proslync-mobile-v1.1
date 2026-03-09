import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

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
  const iconColor = destructive ? '#ff3b30' : '#0095f6';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <BlurView intensity={80} tint="dark" style={styles.content}>
            <View style={styles.header}>
              {icon && (
                <View style={[styles.iconCircle, { backgroundColor: destructive ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 149, 246, 0.15)' }]}>
                  <Ionicons name={icon} size={28} color={iconColor} />
                </View>
              )}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            <View style={styles.actions}>
              {alertOnly ? (
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnPrimary]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>OK</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      destructive ? styles.confirmBtnDestructive : styles.confirmBtnPrimary,
                      isLoading && { opacity: 0.5 },
                    ]}
                    onPress={onConfirm}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                        {confirmLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 40,
    width: '100%',
  },
  content: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  confirmBtnPrimary: {
    backgroundColor: 'rgba(0, 149, 246, 0.2)',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
  confirmTextDestructive: {
    color: '#ff3b30',
  },
});
