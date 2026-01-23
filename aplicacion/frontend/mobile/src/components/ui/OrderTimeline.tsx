import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, OrderStatus } from '../../services/api/OrderService'

interface OrderTimelineProps {
    currentStatus: OrderStatus
    createdAt: string
    compact?: boolean
}

interface TimelineStep {
    status: OrderStatus
    label: string
    icon: keyof typeof Ionicons.glyphMap
    color: string
    isCompleted: boolean
    isCurrent: boolean
    isPending: boolean
}

const STATUS_FLOW: OrderStatus[] = [
    'PENDIENTE',
    'APROBADO',
    'EN_PREPARACION',
    'PREPARADO',
    'FACTURADO',
    'EN_RUTA',
    'ENTREGADO'
]

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
    PENDIENTE: 'time-outline',
    APROBADO: 'checkmark-circle-outline',
    EN_PREPARACION: 'cube-outline',
    PREPARADO: 'checkbox-outline',
    FACTURADO: 'document-text-outline',
    EN_RUTA: 'car-outline',
    ENTREGADO: 'checkmark-done-circle-outline',
    ANULADO: 'close-circle-outline',
    RECHAZADO: 'close-circle-outline'
}

export function OrderTimeline({ currentStatus, createdAt, compact = false }: OrderTimelineProps) {
    const isTerminalStatus = currentStatus === 'ANULADO' || currentStatus === 'RECHAZADO'

    const getStatusSteps = (): TimelineStep[] => {
        const currentIndex = STATUS_FLOW.indexOf(currentStatus)

        return STATUS_FLOW.map((status, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = status === currentStatus
            const isPending = index > currentIndex && !isTerminalStatus

            return {
                status,
                label: ORDER_STATUS_LABELS[status],
                icon: STATUS_ICONS[status],
                color: ORDER_STATUS_COLORS[status],
                isCompleted,
                isCurrent,
                isPending
            }
        })
    }

    const steps = getStatusSteps()

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return ''
            return date.toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return ''
        }
    }

    if (isTerminalStatus) {
        const terminalColor = ORDER_STATUS_COLORS[currentStatus]
        return (
            <View className="items-center py-4">
                <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${terminalColor}15` }}
                >
                    <Ionicons name="close-circle" size={40} color={terminalColor} />
                </View>
                <Text className="text-lg font-bold" style={{ color: terminalColor }}>
                    {ORDER_STATUS_LABELS[currentStatus]}
                </Text>
                <Text className="text-neutral-500 text-sm mt-1">
                    {formatDate(createdAt)}
                </Text>
            </View>
        )
    }

    return (
        <View className="py-2">
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1

                return (
                    <View key={step.status} className="flex-row">
                        {/* Columna izquierda: Icono y linea */}
                        <View className="items-center mr-4" style={{ width: 40 }}>
                            {/* Icono del paso */}
                            {step.isCompleted ? (
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{ backgroundColor: step.color }}
                                >
                                    <Ionicons name="checkmark" size={22} color="white" />
                                </View>
                            ) : step.isCurrent ? (
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center border-[3px]"
                                    style={{ borderColor: step.color, backgroundColor: `${step.color}15` }}
                                >
                                    <Ionicons name={step.icon} size={20} color={step.color} />
                                </View>
                            ) : (
                                <View className="w-10 h-10 rounded-full items-center justify-center border-2 border-neutral-200 bg-neutral-50">
                                    <Ionicons name={step.icon} size={18} color="#D1D5DB" />
                                </View>
                            )}

                            {/* Linea conectora */}
                            {!isLast && (
                                <View
                                    className="w-[3px] flex-1 my-1 rounded-full"
                                    style={{
                                        backgroundColor: step.isCompleted ? step.color : '#E5E7EB',
                                        minHeight: compact ? 20 : 28
                                    }}
                                />
                            )}
                        </View>

                        {/* Columna derecha: Texto */}
                        <View className="flex-1 pb-4" style={{ minHeight: compact ? 48 : 60 }}>
                            <Text
                                className={`font-bold text-[15px] ${
                                    step.isCompleted || step.isCurrent
                                        ? 'text-neutral-900'
                                        : 'text-neutral-400'
                                }`}
                            >
                                {step.label}
                            </Text>
                            {!compact && (
                                <Text className={`text-xs mt-0.5 ${
                                    step.isCompleted || step.isCurrent
                                        ? 'text-neutral-500'
                                        : 'text-neutral-300'
                                }`}>
                                    {step.isCurrent && createdAt ? formatDate(createdAt) :
                                     step.isCompleted ? 'Completado' :
                                     'Pendiente'}
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}
