import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useCall } from '@/lib/providers/call-provider';

export function IncomingCallOverlay() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const insets = useSafeAreaInsets();

  const handleAccept = useCallback(async () => {
    if (!incomingCall) return;
    await acceptCall(incomingCall.callId);
    router.push('/call');
  }, [incomingCall, acceptCall]);

  const handleDecline = useCallback(async () => {
    if (!incomingCall) return;
    await declineCall(incomingCall.callId);
  }, [incomingCall, declineCall]);

  if (!incomingCall) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <GlassView
          {...liquidGlass.surface}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          {/* Caller Avatar */}
          {incomingCall.callerImage ? (
            <Image
              source={{ uri: incomingCall.callerImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name="person"
                size={48}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          )}

          {/* Caller Name */}
          <Text style={styles.callerName}>{incomingCall.callerName}</Text>
          <Text style={styles.callType}>
            Incoming {incomingCall.isVideo ? 'video' : 'voice'} call
          </Text>

          {/* Action Buttons */}
          <View
            style={[styles.actions, { paddingBottom: insets.bottom + 40 }]}
          >
            {/* Decline */}
            <TouchableOpacity
              style={styles.actionWrapper}
              onPress={handleDecline}
            >
              <View style={styles.actionButton}>
                <GlassView
                  {...liquidGlass.danger}
                  borderRadius={36}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="close" size={32} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Decline</Text>
            </TouchableOpacity>

            {/* Accept */}
            <TouchableOpacity
              style={styles.actionWrapper}
              onPress={handleAccept}
            >
              <View style={styles.actionButton}>
                <GlassView
                  {...liquidGlass.success}
                  borderRadius={36}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons
                  name={incomingCall.isVideo ? 'videocam' : 'call'}
                  size={32}
                  color="#fff"
                />
              </View>
              <Text style={styles.actionLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  callType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
  },
  actionWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
});
