import React, { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ClientService, type Client } from '../../../../../services/api/ClientService'
import { BRAND_COLORS } from '../../../../../shared/types'

type ClientSelection = {
    cliente: Client
    sucursal?: any
}

interface Props {
    visible: boolean
    onClose: () => void
    onSelect: (selection: ClientSelection) => void
    title?: string
    priceListsMap?: Map<number, string>
}

export function ClientSelectorModal({ visible, onClose, onSelect, title = 'Seleccionar Cliente', priceListsMap }: Props) {
    const [search, setSearch] = useState('')
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (visible) {
            loadClients()
        }
    }, [visible])

    const loadClients = async () => {
        setLoading(true)
        try {
            const data = await ClientService.getMyClients()
            setClients(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(c =>
        c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
        c.identificacion.includes(search)
    )

    const renderItem = ({ item }: { item: Client }) => {
        const priceListId = item.lista_precios_id || 0
        const priceListName = priceListsMap?.get(priceListId) || `Lista ${priceListId}`

        return (
            <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => onSelect({ cliente: item })}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="business" size={24} color={BRAND_COLORS.red} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.clientName}>{item.razon_social}</Text>
                    {item.usuario_principal_nombre && (
                        <Text style={styles.subText}>Contacto: {item.usuario_principal_nombre}</Text>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.rucText}>RUC: {item.identificacion}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{priceListName}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
        )
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar cliente..."
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={BRAND_COLORS.red} />
                    ) : (
                        <FlatList
                            data={filteredClients}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ padding: 16 }}
                            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                                    <Text style={{ color: '#9CA3AF' }}>No se encontraron clientes</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%',
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF2F2', // Red 50
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    subText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    rucText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    badge: {
        backgroundColor: '#EFF6FF', // Blue 50
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    badgeText: {
        fontSize: 11,
        color: '#2563EB', // Blue 600
        fontWeight: '600',
    }
})
