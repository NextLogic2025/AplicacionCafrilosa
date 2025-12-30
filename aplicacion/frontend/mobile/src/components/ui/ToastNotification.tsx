import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
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
    // Initial position off-screen (top)
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Show Animation
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

        // Hide Timer
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
            style={[
                styles.container,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    opacity: opacity,
                    transform: [{ translateY: translateY }]
                }
            ]}
        >
            <Ionicons name={colors.icon as any} size={24} color={colors.text} style={{ marginRight: 10 }} />
            <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0, // Animated transform will handle positioning
        alignSelf: 'center',
        width: width * 0.9,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 9999,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
