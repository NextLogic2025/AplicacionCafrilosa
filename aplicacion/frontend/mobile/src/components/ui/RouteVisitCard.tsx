import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/**
 * RouteVisitCard - Tarjeta para mostrar una visita planificada en el rutero del vendedor
 *
 * Muestra información de la visita programada:
 * - Nombre del cliente
 * - Nombre del dueño/contacto
 * - Dirección
 * - Hora estimada de arribo
 * - Día de la semana
 * - Prioridad de visita
 * - Frecuencia (SEMANAL, QUINCENAL, MENSUAL)
 */

interface RouteVisitCardProps {
    clientName: string
    ownerName?: string | null // Nombre del dueño/contacto
    address?: string
    time?: string
    dayOfWeek: number // 1=Lunes, 7=Domingo
    priority: 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL'
    frequency: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
    order?: number
    onPress: () => void
    isToday?: boolean
}

export function RouteVisitCard({
    clientName,
    ownerName,
    address,
    time,
    dayOfWeek,
    priority,
    frequency,
    order,
    onPress,
    isToday = false
}: RouteVisitCardProps) {

    // Mapeo de días de la semana
    const getDayName = (day: number): string => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        return days[day] || 'Día desconocido'
    }

    // Colores según prioridad
    const getPriorityColor = () => {
        switch (priority) {
            case 'ALTA':
                return { bg: '#FEE2E2', text: '#DC2626', icon: '#EF4444' }
            case 'MEDIA':
                return { bg: '#FEF3C7', text: '#D97706', icon: '#F59E0B' }
            case 'BAJA':
                return { bg: '#DBEAFE', text: '#1D4ED8', icon: '#3B82F6' }
            default:
                return { bg: '#F3F4F6', text: '#6B7280', icon: '#9CA3AF' }
        }
    }

    const priorityColors = getPriorityColor()

    return (
        <TouchableOpacity
            style={[styles.card, isToday && styles.cardToday]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header con orden y prioridad - Mejorado */}
            <View style={styles.header}>
                <View style={styles.orderBadge}>
                    <Ionicons name="list" size={12} color="#6B7280" />
                    <Text style={styles.orderText}>#{order || 0}</Text>
                </View>

                <View style={styles.headerRight}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                        <Ionicons name="flag" size={10} color={priorityColors.icon} />
                        <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                            {priority}
                        </Text>
                    </View>

                    {/* Badge HOY - Ahora no se superpone */}
                    {isToday && (
                        <View style={styles.todayBadgeTop}>
                            <Text style={styles.todayTextTop}>HOY</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Información del cliente - Mejorada */}
            <View style={styles.clientInfo}>
                <View style={styles.clientHeader}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="business" size={18} color="#DC2626" />
                    </View>
                    <View style={styles.clientDetails}>
                        <Text style={styles.clientName} numberOfLines={1}>
                            {clientName}
                        </Text>
                        {/* Nombre del dueño debajo del nombre del cliente */}
                        {ownerName && (
                            <View style={styles.ownerRow}>
                                <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                                <Text style={styles.ownerText} numberOfLines={1}>
                                    {ownerName}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Día de la semana */}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.infoText}>{getDayName(dayOfWeek)}</Text>
                </View>

                {/* Hora estimada */}
                {time && (
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>
                            {time.substring(0, 5)} hrs
                        </Text>
                    </View>
                )}

                {/* Frecuencia */}
                <View style={styles.infoRow}>
                    <Ionicons name="repeat-outline" size={14} color="#6B7280" />
                    <Text style={styles.infoText}>
                        {frequency}
                    </Text>
                </View>
            </View>

            {/* Footer con acción */}
            <View style={styles.footer}>
                <Text style={styles.actionText}>Ver detalles del cliente</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'visible' // Cambiado a visible para que el badge HOY no se corte
    },
    cardToday: {
        borderColor: '#DC2626',
        borderWidth: 2,
        backgroundColor: '#FFFBEB'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8
    },
    orderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 50
    },
    orderText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700'
    },
    todayBadgeTop: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3
    },
    todayTextTop: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5
    },
    clientInfo: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    clientHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 4
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    clientDetails: {
        flex: 1
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    ownerText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9CA3AF',
        flex: 1
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    infoText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        flex: 1
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB'
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626'
    }
})
