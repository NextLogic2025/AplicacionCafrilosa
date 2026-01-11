import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PriceService, type PriceList } from '../../services/api/PriceService'

interface PriceListPickerProps {
    selectedListId: number
    onSelectList: (listId: number) => void
    style?: any
}

/**
 * PriceListPicker - Selector de Lista de Precios
 *
 * Componente dropdown para seleccionar lista de precios y filtrar productos
 * Obtiene listas de precios dinámicamente desde el backend
 *
 * Integración Backend:
 * - GET /api/precios/listas - Obtiene todas las listas activas
 * - Filtra solo listas activas (activa = true)
 * - Incluye automáticamente nuevas listas creadas por supervisor
 *
 * Características:
 * - Diseño moderno con íconos
 * - Modal con animaciones suaves
 * - Solo listas activas
 * - Feedback visual para lista seleccionada
 * - Selección por defecto: "General" (lista_id: 1)
 * - Responsive a cambios dinámicos de listas
 */
export function PriceListPicker({ selectedListId, onSelectList, style }: PriceListPickerProps) {
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)

    // Color corporativo único para todas las listas
    const COLOR_PRIMARY = '#DC2626'

    useEffect(() => {
        loadPriceLists()
    }, [])

    const loadPriceLists = async () => {
        try {
            setLoading(true)
            const lists = await PriceService.getLists()
            const activeLists = lists.filter(list => list.activa)
            setPriceLists(activeLists)
        } catch (error) {
            console.error('Error loading price lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectList = (listId: number) => {
        onSelectList(listId)
        setModalVisible(false)
    }

    const selectedList = priceLists.find(list => list.id === selectedListId)

    if (loading) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="small" color={COLOR_PRIMARY} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        )
    }

    return (
        <>
            <TouchableOpacity
                style={[styles.pickerButton, style]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.buttonContent}>
                    <View style={[styles.iconCircle, { backgroundColor: `${COLOR_PRIMARY}15` }]}>
                        <Ionicons name="pricetag" size={16} color={COLOR_PRIMARY} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.labelText}>Lista</Text>
                        <Text style={styles.selectedText} numberOfLines={1}>
                            {selectedList ? selectedList.nombre : 'Seleccionar'}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Seleccionar Lista</Text>
                                <Text style={styles.modalSubtitle}>
                                    Filtra productos por lista de precios
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={priceLists}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            renderItem={({ item }) => {
                                const isSelected = item.id === selectedListId

                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.listItem,
                                            isSelected && {
                                                backgroundColor: `${COLOR_PRIMARY}08`,
                                                borderColor: COLOR_PRIMARY
                                            }
                                        ]}
                                        onPress={() => handleSelectList(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.listItemLeft}>
                                            <View style={[
                                                styles.listIconCircle,
                                                { backgroundColor: `${COLOR_PRIMARY}15` }
                                            ]}>
                                                <Ionicons
                                                    name="pricetag"
                                                    size={20}
                                                    color={COLOR_PRIMARY}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.listItemText,
                                                    isSelected && { color: COLOR_PRIMARY }
                                                ]}>
                                                    {item.nombre}
                                                </Text>
                                                <Text style={styles.listItemSubtext}>
                                                    {item.moneda}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <View style={[
                                                styles.selectedBadge,
                                                { backgroundColor: COLOR_PRIMARY }
                                            ]}>
                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>
                                        No hay listas disponibles
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8
    },
    loadingText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textContainer: {
        flex: 1
    },
    labelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 1
    },
    selectedText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    closeButton: {
        padding: 4
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 14
    },
    listIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    listItemText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 3
    },
    listItemSubtext: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    selectedBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48
    },
    emptyText: {
        fontSize: 15,
        color: '#9CA3AF',
        marginTop: 12,
        fontWeight: '500',
        textAlign: 'center'
    }
})
