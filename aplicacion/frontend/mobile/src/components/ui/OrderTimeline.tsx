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
    color: string
    isCompleted: boolean
    isCurrent: boolean
    date: string | null
}

const STATUS_FLOW: OrderStatus[] = [
    'PENDIENTE',
    'APROBADO',
    'EN_PREPARACION',
    'FACTURADO',
    'EN_RUTA',
    'ENTREGADO'
]

export function OrderTimeline({ currentStatus, createdAt, compact = false }: OrderTimelineProps) {
    const getStatusHistory = (): TimelineStep[] => {
        const history: TimelineStep[] = []
        const createdDate = createdAt ? new Date(createdAt) : new Date()

        if (isNaN(createdDate.getTime())) {
            createdDate.setTime(Date.now())
        }

        const currentIndex = STATUS_FLOW.indexOf(currentStatus)

        for (let i = 0; i < STATUS_FLOW.length; i++) {
            const status = STATUS_FLOW[i]
            const isCompleted = i <= currentIndex
            const isCurrent = status === currentStatus

            const statusDate = new Date(createdDate.getTime() + (i * 24 * 60 * 60 * 1000))

            history.push({
                status,
                label: ORDER_STATUS_LABELS[status],
                color: ORDER_STATUS_COLORS[status],
                isCompleted,
                isCurrent,
                date: isCompleted ? statusDate.toISOString() : null
            })

            if (status === currentStatus) break
        }

        return history
    }

    const statusHistory = getStatusHistory()

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return ''
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return ''
            return date.toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return ''
        }
    }

    return (
        <View>
            {statusHistory.map((step, index) => (
                <View key={step.status} className="flex-row items-start mb-4 last:mb-0">
                    <View className="mr-4">
                        {step.isCompleted ? (
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center"
                                style={{ backgroundColor: step.color }}
                            >
                                <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                        ) : step.isCurrent ? (
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center border-2"
                                style={{ borderColor: step.color, backgroundColor: `${step.color}20` }}
                            >
                                <View
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: step.color }}
                                />
                            </View>
                        ) : (
                            <View className="w-8 h-8 rounded-full border-2 border-neutral-300 bg-neutral-50" />
                        )}
                    </View>

                    <View className="flex-1">
                        <Text
                            className={`font-bold text-base ${step.isCompleted || step.isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}
                        >
                            {step.label}
                        </Text>
                        {!compact && step.date && (
                            <Text className="text-neutral-500 text-sm mt-1">
                                {formatDate(step.date)}
                            </Text>
                        )}
                    </View>

                    {index < statusHistory.length - 1 && (
                        <View className="absolute left-4 top-8 w-0.5 h-8 bg-neutral-200" />
                    )}
                </View>
            ))}
        </View>
    )
}
