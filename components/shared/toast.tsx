import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({
  message,
  type,
  onHide,
}: {
  message: string;
  type: ToastType;
  onHide: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const isDismissing = useSharedValue(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = React.useCallback(() => {
    if (isDismissing.value) return;
    isDismissing.value = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onHide)();
    });
  }, [onHide]);

  React.useEffect(() => {
    // Animate in
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto hide after 3 seconds
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [dismiss]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow upward swipes (negative translationY)
      if (event.translationY < 0) {
        translateY.value = event.translationY;
        // Fade out as user swipes up
        opacity.value = Math.max(0, 1 + event.translationY / 100);
      }
    })
    .onEnd((event) => {
      // If swiped up more than 50px or with velocity, dismiss
      if (event.translationY < -50 || event.velocityY < -500) {
        runOnJS(dismiss)();
      } else {
        // Snap back
        translateY.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const backgroundColor =
    type === 'success'
      ? '#22c55e'
      : type === 'error'
      ? '#ef4444'
      : '#3b82f6';

  const iconName =
    type === 'success'
      ? 'checkmark-circle'
      : type === 'error'
      ? 'alert-circle'
      : 'information-circle';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.toastContainer,
          { top: insets.top + 10, backgroundColor },
          animatedStyle,
        ]}
      >
        <Ionicons name={iconName} size={20} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const showSuccess = React.useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = React.useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({ showToast, showSuccess, showError }),
    [showToast, showSuccess, showError]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onHide={() => hideToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
