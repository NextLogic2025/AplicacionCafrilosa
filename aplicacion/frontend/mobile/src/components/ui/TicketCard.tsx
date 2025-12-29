import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Ticket } from '../../services/api/SupportService'

interface TicketCardProps {
    ticket: Ticket
    onPress?: () => void
}

const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
        case 'open': return 'bg-yellow-100 text-yellow-800'
        case 'in_progress': return 'bg-blue-100 text-blue-800'
        case 'closed': return 'bg-green-100 text-green-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const getStatusLabel = (status: Ticket['status']) => {
    switch (status) {
        case 'open': return 'Abierto'
        case 'in_progress': return 'En Proceso'
        case 'closed': return 'Cerrado'
        default: return status
    }
}

export function TicketCard({ ticket, onPress }: TicketCardProps) {
    const statusStyle = getStatusColor(ticket.status)

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-neutral-100"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="text-neutral-900 font-bold text-base" numberOfLines={1}>
                        {ticket.subject}
                    </Text>
                    <Text className="text-neutral-400 text-xs mt-0.5">
                        {new Date(ticket.date).toLocaleDateString()}
                    </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${statusStyle.split(' ')[0]}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wide ${statusStyle.split(' ')[1]}`}>
                        {getStatusLabel(ticket.status)}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
                <Text className="text-neutral-500 text-sm flex-1 mr-4" numberOfLines={1}>
                    {ticket.description}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </View>
        </Pressable>
    )
}
