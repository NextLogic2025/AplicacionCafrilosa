import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Image, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ClientSelectorModal } from './components/ClientSelectorModal'
import { SelectedClientBanner } from './components/SelectedClientBanner'

// Define locally since the shared definition is gone
type ClientSelection = {
    cliente: Client
    sucursal?: ClientBranch
}
import { CatalogService, type Product } from '../../../../services/api/CatalogService'
import { ClientService, type Client, type ClientBranch } from '../../../../services/api/ClientService'
import { useCart } from '../../../../context/CartContext'

/**
 * SellerProductsScreen - Catálogo de productos para vendedores
 * 
 * Flujo:
 * 1. Vendedor selecciona un cliente (con sucursal opcional)
 * 2. Se cargan productos filtrados por la lista de precios del cliente
 * 3. Vendedor agrega productos al carrito
 * 4. El carrito mantiene el cliente/sucursal seleccionado
 */
export function SellerProductsScreen() {
    const navigation = useNavigation()
    const { addToCart, cart, setClient: setCartClient } = useCart()

    // Estado del cliente seleccionado
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<ClientBranch | null>(null)
    const [showClientModal, setShowClientModal] = useState(false)
    const [priceLists, setPriceLists] = useState<Map<number, string>>(new Map())

    // Estado de productos
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [totalItems, setTotalItems] = useState(0)

    // Cargar listas de precios al iniciar
    useEffect(() => {
        loadPriceLists()
    }, [])

    // Cargar productos cuando cambia el cliente o búsqueda
    useEffect(() => {
        if (selectedClient) {
            setPage(1)
            loadProducts(1, true)
        } else {
            setProducts([])
        }
    }, [selectedClient, search])

    const loadPriceLists = async () => {
        try {
            const lists = await ClientService.getPriceLists()
            const map = new Map<number, string>()
            lists.forEach(list => map.set(list.id, list.nombre))
            setPriceLists(map)
        } catch (error) {
            console.error('Error loading price lists:', error)
        }
    }

    const loadProducts = async (pageNum: number = 1, reset: boolean = false) => {
        if (!selectedClient) return

        setLoading(true)
        try {
            const response = await CatalogService.getProductsPaginated(
                pageNum,
                20,
                search || undefined,
                selectedClient.id // Filtrar por lista de precios del cliente
            )

            if (reset) {
                setProducts(response.items)
            } else {
                setProducts(prev => [...prev, ...response.items])
            }

            setTotalItems(response.metadata.total_items)
            setHasMore(pageNum < response.metadata.total_pages)
            setPage(pageNum)
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLoadMore = () => {
        if (!loading && hasMore && selectedClient) {
            loadProducts(page + 1, false)
        }
    }

    const handleClientSelect = useCallback((selection: ClientSelection) => {
        setSelectedClient(selection.cliente)
        setSelectedBranch(selection.sucursal || null)

        // Sincronizar con el contexto del carrito
        setCartClient(selection.cliente)
    }, [setCartClient])

    const handleClearClient = () => {
        setSelectedClient(null)
        setSelectedBranch(null)
        setProducts([])
        setCartClient(null)
    }

    const handleAddToCart = (product: Product) => {
        if (!selectedClient) {
            Alert.alert('Selecciona un cliente', 'Debes seleccionar un cliente antes de agregar productos')
            setShowClientModal(true)
            return
        }

        // Determinar precio a usar
        const precio = product.precio_oferta ?? product.precio_original ?? 0

        addToCart({
            producto_id: product.id,
            codigo_sku: product.codigo_sku,
            nombre_producto: product.nombre,
            imagen_url: product.imagen_url,
            unidad_medida: product.unidad_medida || 'UND',
            precio_lista: product.precio_original || precio,
            precio_final: precio,
            lista_precios_id: selectedClient.lista_precios_id || 1,
            tiene_promocion: !!product.precio_oferta,
            descuento_porcentaje: product.ahorro && product.precio_original
                ? Math.round((product.ahorro / product.precio_original) * 100)
                : undefined,
            campania_aplicada_id: product.campania_aplicada_id,
            subtotal: precio
        }, 1)

        // Feedback visual
        Alert.alert('✓ Agregado', `${product.nombre} agregado al carrito`)
    }

    const getPriceListName = (listaId: number | null) => {
        if (!listaId) return undefined
        return priceLists.get(listaId)
    }

    // Renderizar item de producto
    const renderProduct = ({ item }: { item: Product }) => {
        const hasPromotion = !!item.precio_oferta
        const precio = item.precio_oferta ?? item.precio_original ?? 0
        const precioOriginal = item.precio_original ?? 0

        return (
            <View className="bg-white rounded-xl mb-3 border border-neutral-100 overflow-hidden">
                <View className="flex-row p-3">
                    {/* Imagen */}
                    {item.imagen_url ? (
                        <Image
                            source={{ uri: item.imagen_url }}
                            className="w-20 h-20 rounded-lg bg-neutral-100"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-20 h-20 rounded-lg bg-neutral-100 items-center justify-center">
                            <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
                        </View>
                    )}

                    {/* Info */}
                    <View className="flex-1 ml-3">
                        <Text className="font-bold text-neutral-900 text-[15px]" numberOfLines={2}>
                            {item.nombre}
                        </Text>
                        <Text className="text-neutral-500 text-xs mt-0.5">
                            SKU: {item.codigo_sku}
                        </Text>

                        {/* Precios */}
                        <View className="flex-row items-center mt-2">
                            {hasPromotion ? (
                                <>
                                    <Text className="text-red-600 font-bold text-lg">
                                        ${precio.toFixed(2)}
                                    </Text>
                                    <Text className="text-neutral-400 text-sm line-through ml-2">
                                        ${precioOriginal.toFixed(2)}
                                    </Text>
                                    <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
                                        <Text className="text-red-600 text-[10px] font-bold">
                                            -{Math.round(((precioOriginal - precio) / precioOriginal) * 100)}%
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text className="text-neutral-900 font-bold text-lg">
                                    ${precio.toFixed(2)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Botón agregar */}
                    <TouchableOpacity
                        className="w-12 h-12 bg-red-50 rounded-full items-center justify-center self-center"
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={28} color={BRAND_COLORS.red} />
                    </TouchableOpacity>
                </View>

                {/* Badge de promoción */}
                {hasPromotion && (
                    <View className="bg-red-50 px-3 py-1.5 flex-row items-center">
                        <Ionicons name="pricetag" size={14} color="#DC2626" />
                        <Text className="text-red-600 text-xs font-medium ml-1.5">
                            Promoción activa - Ahorro: ${item.ahorro?.toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>
        )
    }

    const cartItemCount = cart.items.reduce((sum, item) => sum + item.cantidad, 0)

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Catálogo"
                variant="standard"
                onBackPress={() => navigation.goBack()}
                notificationRoute="SellerNotifications"
                showCart={true}
                cartCount={cartItemCount}
                onCartPress={() => navigation.navigate('SellerCart' as never)}
            />

            {/* Banner de cliente seleccionado */}
            <SelectedClientBanner
                client={selectedClient}
                branch={selectedBranch}
                priceListName={getPriceListName(selectedClient?.lista_precios_id ?? null)}
                onPress={() => setShowClientModal(true)}
                onClear={handleClearClient}
                placeholder="Buscar cliente para comenzar"
            />

            {/* Buscador de productos (solo si hay cliente) */}
            {selectedClient && (
                <View className="px-4 py-3 bg-white border-b border-neutral-100">
                    <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-11">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-3 text-neutral-900"
                            placeholder="Buscar producto..."
                            placeholderTextColor="#9CA3AF"
                            value={search}
                            onChangeText={setSearch}
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {totalItems > 0 && (
                        <Text className="text-neutral-500 text-xs mt-2">
                            {totalItems} productos disponibles para {selectedClient.nombre_comercial || selectedClient.razon_social}
                        </Text>
                    )}
                </View>
            )}

            {/* Lista de productos */}
            {!selectedClient ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text className="text-xl font-bold text-neutral-700 mt-4 text-center">
                        Selecciona un cliente
                    </Text>
                    <Text className="text-neutral-500 text-center mt-2">
                        Los productos se mostrarán con los precios y promociones de la lista del cliente seleccionado
                    </Text>
                    <TouchableOpacity
                        className="mt-6 bg-red-600 px-6 py-3 rounded-xl flex-row items-center"
                        onPress={() => setShowClientModal(true)}
                    >
                        <Ionicons name="person-add" size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Buscar Cliente</Text>
                    </TouchableOpacity>
                </View>
            ) : loading && products.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="mt-4 text-neutral-500">Cargando productos...</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    renderItem={renderProduct}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loading && products.length > 0 ? (
                            <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="cube-outline"
                            title="Sin productos"
                            description={search
                                ? `No se encontraron productos para "${search}"`
                                : 'No hay productos disponibles para este cliente'
                            }
                            actionLabel="Recargar"
                            onAction={() => loadProducts(1, true)}
                        />
                    }
                />
            )}

            {/* Modal selector de cliente */}
            <ClientSelectorModal
                visible={showClientModal}
                onClose={() => setShowClientModal(false)}
                onSelect={handleClientSelect}
                selectedClientId={selectedClient?.id}
                selectedBranchId={selectedBranch?.id}
                title="Seleccionar Cliente"
            />
        </View>
    )
}
