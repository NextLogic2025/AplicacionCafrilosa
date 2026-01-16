import React, { useEffect, useRef } from 'react';
import { View, Text, Dimensions, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onHide?: () => void;
}

const { width } = Dimensions.get('window');

export const ToastNotification = ({ message, type = 'success', duration = 2000, onHide }: ToastProps) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: Platform.OS === 'ios' ? 50 : 40,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            hideToast();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            onHide?.();
        });
    };

    const getColors = () => {
        switch (type) {
            case 'success': return { bg: '#F0FDF4', border: '#22C55E', icon: 'checkmark-circle', text: '#15803D' };
            case 'error': return { bg: '#FEF2F2', border: '#EF4444', icon: 'alert-circle', text: '#B91C1C' };
            case 'warning': return { bg: '#FFFBEB', border: '#F59E0B', icon: 'warning', text: '#B45309' };
            case 'info':
            default: return { bg: '#EFF6FF', border: '#3B82F6', icon: 'information-circle', text: '#1D4ED8' };
        }
    };

    const colors = getColors();

    return (
        <Animated.View
            className="absolute top-0 self-center flex-row items-center p-4 rounded-xl border shadow-lg z-[9999]"
            style={{
                width: width * 0.9,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                opacity: opacity,
                transform: [{ translateY: translateY }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 8,
            }}
        >
            <Ionicons name={colors.icon as any} size={24} color={colors.text} className="mr-2.5" />
            <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }}>{message}</Text>
        </Animated.View>
    );
};

