import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { createContext, PropsWithChildren, useContext, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastPayload = {
  message: string;
  type?: ToastType;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-90)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -90,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const showToast = (payload: ToastPayload) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMessage(payload.message);
    setType(payload.type ?? 'info');
    setVisible(true);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
      timeoutRef.current = null;
    }, 2200);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Animated.View style={[styles.toast, toneStyles[type], { transform: [{ translateY }] }]}>
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

const toneStyles: Record<ToastType, ViewStyle> = {
  success: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  error: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  info: {
    backgroundColor: '#1f2937',
    borderColor: '#6b7280',
  },
};
