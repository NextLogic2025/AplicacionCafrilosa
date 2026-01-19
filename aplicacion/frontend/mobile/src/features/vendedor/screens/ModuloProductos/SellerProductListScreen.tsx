import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Modal, Pressable, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ClientSelectorModal } from './components/ClientSelectorModal'
import { SelectedClientBanner } from './components/SelectedClientBanner'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'

type ClientSelection = {
    cliente: Client
    sucursal?: any // Adjusted if ClientBranch not available in this scope or imported
}
import { ClientProductCard } from '../../../../components/ui/ClientProductCard'
import { CatalogService, type Product } from '../../../../services/api/CatalogService'
import { ClientService, type Client } from '../../../../services/api/ClientService'
import { PriceService } from '../../../../services/api/PriceService'
import { useCart } from '../../../../context/CartContext'
import { useToast } from '../../../../context/ToastContext'

export function SellerProductListScreen() {
    const navigation = useNavigation()
    const { addToCart, cart, setClient: setCartClient, currentClient, currentBranch } = useCart()
    const { showToast } = useToast()

    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [showClientModal, setShowClientModal] = useState(false)
    const [priceLists, setPriceLists] = useState<Map<number, string>>(new Map())
    const [selectedPriceListFilter, setSelectedPriceListFilter] = useState<number | null>(null)

    // New state for full catalog mode and accordion
    const [viewingFullCatalog, setViewingFullCatalog] = useState(false)
    const [showPriceListAccordion, setShowPriceListAccordion] = useState(false)

    // Categories State
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Sincronizar cliente del carrito con estado local
    // Esto permite que cuando el vendedor selecciona un cliente desde otra pantalla,
    // el estado local se actualice automáticamente
    useEffect(() => {
        if (currentClient && currentClient.id !== selectedClient?.id) {
            setSelectedClient(currentClient)
            setViewingFullCatalog(false)
        }
    }, [currentClient])

    useEffect(() => {
        loadPriceLists()
        loadCategories()
    }, [])

    useEffect(() => {
        // Load products if client is selected OR if viewing full catalog
        if (selectedClient || viewingFullCatalog) {
            setPage(1)
            loadProducts(1, true)
        } else {
            setProducts([])
        }
    }, [selectedClient, viewingFullCatalog, selectedPriceListFilter, selectedCategory, search])

    const loadPriceLists = async () => {
        try {
            const lists = await PriceService.getLists()
            const map = new Map<number, string>()
            lists.forEach(l => map.set(l.id, l.nombre))
            setPriceLists(map)
        } catch (err) {
            console.error(err)
        }
    }

    const loadCategories = async () => {
        try {
            const cats = await CatalogService.getCategories()
            // Map 'nombre' to 'name' for CategoryFilter component
            const mapped = cats.map(c => ({ id: c.id, name: c.nombre }))
            // Add "All" option if needed, but CategoryFilter usually takes raw list and we handle selection state
            setCategories([{ id: -1, name: 'Todas' }, ...mapped])
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadProducts = async (pageNum = 1, reset = false) => {
        if (loading) return
        setLoading(true)
        try {
            const clienteId = selectedClient ? selectedClient.id : undefined

            let resp;
            // Decide which endpoint to use based on Category Selection
            if (selectedCategory && selectedCategory !== -1) {
                resp = await CatalogService.getProductsByCategory(
                    selectedCategory,
                    pageNum,
                    20,
                    search || undefined,
                    clienteId
                )
            } else {
                resp = await CatalogService.getProductsPaginated(
                    pageNum,
                    20,
                    search || undefined,
                    clienteId
                )
            }

            let items = resp.items

            // Filter by price list if selected (in full catalog mode)
            if (viewingFullCatalog && selectedPriceListFilter) {
                // Note: Frontend filtering here might be limited to the page if backend doesn't support it directly in this endpoint 
                items = items.filter(p => p.precios?.some(pr => pr.lista_id === selectedPriceListFilter))
            }

            if (reset) setProducts(items)
            else setProducts(prev => [...prev, ...items])
            setHasMore(pageNum < resp.metadata.total_pages)
            setPage(pageNum)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const handleClientSelect = (selection: ClientSelection) => {
        setSelectedClient(selection.cliente)
        setCartClient(selection.cliente)
        setViewingFullCatalog(false) // Exit full catalog mode when client is selected
        setShowClientModal(false)
        setSelectedPriceListFilter(null)
        setSelectedCategory(null)
    }

    const handleClearClient = () => {
        setSelectedClient(null)
        setCartClient(null)
        setProducts([])
        setViewingFullCatalog(false)
        setSelectedPriceListFilter(null)
        setSelectedCategory(null)
    }

    const handleViewFullCatalog = () => {
        setViewingFullCatalog(true)
        setSelectedClient(null)
        setCartClient(null)
        setSelectedPriceListFilter(null)
        setSelectedCategory(null)
    }

    const handleBackToSelection = () => {
        setViewingFullCatalog(false)
        setSelectedClient(null)
        setProducts([])
        setSelectedCategory(null)
        setSelectedPriceListFilter(null)
    }

    const handleAddToCart = (product: Product) => {
        if (!selectedClient) {
            Alert.alert(
                'Selecciona un cliente',
                'Para agregar productos al pedido, primero debes seleccionar un cliente.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Seleccionar', onPress: () => setShowClientModal(true) }
                ]
            )
            return
        }
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
            descuento_porcentaje: product.ahorro && product.precio_original ? Math.round((product.ahorro / product.precio_original) * 100) : undefined,
            campania_aplicada_id: product.campania_aplicada_id,
            subtotal: precio
        }, 1)

        showToast(`✓ ${product.nombre} agregado al carrito`, 'success')
    }

    const renderProduct = ({ item }: { item: Product }) => {
        // Clone item to avoid mutating state directly if we were to modify it, 
        // but here we just pass a new object to the card if needed.
        // Logic: If we are viewing full catalog AND a specific price list is selected,
        // we must show the price for THAT list, not the default 'min' price from backend.
        let displayProduct = item

        if (viewingFullCatalog && selectedPriceListFilter && item.precios) {
            const specificPrice = item.precios.find(p => p.lista_id === selectedPriceListFilter)
            if (specificPrice) {
                // Determine if there is a promotion applicable effectively? 
                // The backend calculates best offer based on the base price it picked. 
                // If we change the base price, the 'precio_oferta' calculation from backend might be invalid 
                // if it was percentage based on the 'min' price. 
                // However, re-calculating promos completely is hard without full logic.
                // For now, let's update the 'precio_original'. 
                // If the product has a generic promotion (global), we might want to keep the discount visible?
                // Let's assume for now just showing the correct base list price is the primary fix requested.
                // If a promotion exists, `item.precio_oferta` is set. 
                // Ideally we should recalculate `precio_oferta` if it was a percentage discount off the original.
                // But let's start by ensuring the base price matches the list.

                // Construct a modified product object for display
                displayProduct = {
                    ...item,
                    precio_original: Number(specificPrice.precio),
                }

                // Restore/Recalculate Promotion logic
                // If the product had a promotion, we try to see if it applies to this new price.
                // We look at 'promociones' array to find a suitable promo.
                // Priority: 1. Promo specifically for this list. 2. Global promo.
                if (item.promociones && item.promociones.length > 0) {
                    // Filter promos that are either GLOBAL or for THIS specific list.
                    // Note: The frontend 'item.promociones' structure is simplified (see CatalogService interface).
                    // It doesn't explicitly say 'scope' but usually backend filters them for the context.
                    // If we are in 'Full Catalog' mode (no client context), typically we get GLOBAL promos.
                    // If we switch lists, we should check if there's a promo that fits.

                    // Simple heuristic: Take the best offer from available promos re-calculated against the NEW list price.
                    let bestOffer = null;

                    for (const promo of item.promociones) {
                        let offerPrice = null;
                        const originalPrice = Number(specificPrice.precio);

                        if (promo.tipo_descuento === 'PORCENTAJE' && promo.valor_descuento) {
                            offerPrice = originalPrice * (1 - (promo.valor_descuento / 100));
                        } else if (promo.tipo_descuento === 'MONTO_FIJO' && promo.valor_descuento) {
                            offerPrice = originalPrice - promo.valor_descuento;
                        } else if (promo.precio_oferta) {
                            // Fixed offer price. This might be tricky if it was set for another base price.
                            // But if it's a fixed override, maybe it's valid? 
                            // Let's assume generic promos (percentage) are safer to recalculate.
                            // If it's a fixed price promo, we use it directly if it's lower than list price.
                            offerPrice = promo.precio_oferta;
                        }

                        if (offerPrice !== null && offerPrice < originalPrice) {
                            if (!bestOffer || offerPrice < bestOffer.precio_oferta) {
                                bestOffer = {
                                    precio_oferta: offerPrice,
                                    ahorro: originalPrice - offerPrice,
                                    campania_id: promo.campana_id
                                };
                            }
                        }
                    }

                    if (bestOffer) {
                        displayProduct.precio_oferta = bestOffer.precio_oferta;
                        displayProduct.ahorro = bestOffer.ahorro;
                        displayProduct.campania_aplicada_id = bestOffer.campania_id;
                    } else {
                        displayProduct.precio_oferta = undefined;
                        displayProduct.ahorro = undefined;
                        displayProduct.campania_aplicada_id = undefined;
                    }
                } else {
                    displayProduct.precio_oferta = undefined;
                    displayProduct.ahorro = undefined;
                    displayProduct.campania_aplicada_id = undefined;
                }
            }
        }

        return (
            <View className="w-1/2 px-2 mb-4">
                <ClientProductCard product={displayProduct} onPress={() => { }} onAddToCart={() => handleAddToCart(item)} />
            </View>
        )
    }

    const cartItemCount = cart.items.reduce((s, it) => s + it.cantidad, 0)
    const activePriceListName = selectedPriceListFilter ? priceLists.get(selectedPriceListFilter) : 'Todas las listas'

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Productos"
                variant="standard"
                showCart={true}
                cartCount={cartItemCount}
                onCartPress={() => navigation.navigate('SellerCart' as never)}
            // Add Back button functionality in Header if viewing full catalog or client selected? 
            // Requirement: "como regreso a la vista anterior de los dos botones"
            // Ideally, if viewing full catalog, we can show a back arrow in Header OR a dedicated back button.
            // Using Header onBackPress for simplicity if allowed, but previous header usage might just coincide with stack nav.
            // Let's rely on a explicit UI element for specific "Exit Full Catalog" action or rely on the native back if pushed, but here we are changing state.
            // If viewingFullCatalog is TRUE, we can override Header back behavior or add a button.
            // Let's add a small back button row below header if needed, or rely on clear client.
            // Actually, let's use the Header's back capability if we can control it.
            // But the Header component might trigger navigation.goBack().
            // We'll add a "Back" button row for "Full Catalog" mode explicitly.
            />

            {/* Back Button for Full Catalog Mode */}
            {viewingFullCatalog && (
                <View className="px-4 py-2 bg-white border-b border-neutral-100 flex-row items-center">
                    <TouchableOpacity onPress={handleBackToSelection} className="flex-row items-center p-2">
                        <Ionicons name="arrow-back" size={24} color={BRAND_COLORS.red} />
                        <Text className="ml-2 font-bold text-neutral-700">Volver a selección</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ONLY show banner if client is selected */}
            {selectedClient && (
                <SelectedClientBanner
                    client={selectedClient}
                    branch={null}
                    priceListName={selectedClient ? priceLists.get(selectedClient.lista_precios_id || 0) : undefined}
                    onPress={() => setShowClientModal(true)}
                    onClear={handleClearClient}
                    placeholder=" " // Not used when client is present
                />
            )}

            {/* Search, Filter & Categories - Show if Client Selected OR Full Catalog Mode */}
            {(selectedClient || viewingFullCatalog) && (
                <View>
                    {/* Price List Accordion (Only in Full Catalog Mode) */}
                    {viewingFullCatalog && (
                        <View className="mx-4 mt-3 mb-2">
                            <TouchableOpacity
                                className="flex-row items-center justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200"
                                onPress={() => setShowPriceListAccordion(!showPriceListAccordion)}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="pricetags" size={20} color={BRAND_COLORS.red} />
                                    <Text className="ml-2 font-semibold text-neutral-800">
                                        {activePriceListName}
                                    </Text>
                                </View>
                                <Ionicons name={showPriceListAccordion ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                            </TouchableOpacity>

                            {showPriceListAccordion && (
                                <View className="bg-white mt-1 rounded-xl border border-neutral-100 p-2 shadow-sm">
                                    <TouchableOpacity
                                        className={`p-3 rounded-lg ${!selectedPriceListFilter ? 'bg-red-50' : 'bg-white'}`}
                                        onPress={() => { setSelectedPriceListFilter(null); setShowPriceListAccordion(false) }}
                                    >
                                        <Text className={`${!selectedPriceListFilter ? 'text-red-700 font-bold' : 'text-neutral-700'}`}>Todas las listas</Text>
                                    </TouchableOpacity>
                                    {Array.from(priceLists.entries()).map(([id, nombre]) => (
                                        <TouchableOpacity
                                            key={id}
                                            className={`p-3 rounded-lg ${selectedPriceListFilter === id ? 'bg-red-50' : 'bg-white'}`}
                                            onPress={() => { setSelectedPriceListFilter(id); setShowPriceListAccordion(false) }}
                                        >
                                            <Text className={`${selectedPriceListFilter === id ? 'text-red-700 font-bold' : 'text-neutral-700'}`}>{nombre}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Search Bar */}
                    <View className="px-4 py-3 bg-white border-b border-neutral-500/5">
                        <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-11">
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput className="flex-1 ml-3 text-neutral-900" placeholder="Buscar producto..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Category Filter */}
                    <View className="pb-3 bg-white border-b border-neutral-100">
                        <CategoryFilter
                            categories={categories}
                            selectedId={selectedCategory || -1}
                            onSelect={(id) => setSelectedCategory(Number(id))}
                        />
                    </View>
                </View>
            )}

            {/* Empty State */}
            {!selectedClient && !viewingFullCatalog ? (
                <View className="flex-1 items-center justify-center px-8 pb-20">
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text className="text-xl font-bold text-neutral-700 mt-4 text-center">Selecciona un cliente</Text>
                    <Text className="text-neutral-500 text-center mt-2 mb-8">
                        Los productos se mostrarán con los precios y promociones de la lista del cliente seleccionado
                    </Text>

                    <View className="w-full gap-4">
                        <TouchableOpacity
                            className="bg-red-600 px-6 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                            onPress={() => setShowClientModal(true)}
                        >
                            <Ionicons name="person-add" size={22} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">Seleccionar Cliente</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white border border-neutral-200 px-6 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                            onPress={handleViewFullCatalog}
                        >
                            <Ionicons name="grid-outline" size={22} color={BRAND_COLORS.red} />
                            <Text className="text-neutral-800 font-bold ml-2 text-lg">Ver Catálogo Completo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : loading && products.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="mt-4 text-neutral-500">Cargando productos...</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={i => i.id}
                    numColumns={2}
                    renderItem={renderProduct}
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    onEndReached={() => { if (!loading && hasMore) loadProducts(page + 1, false) }}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={<EmptyState icon="cube-outline" title="Sin productos" description={search ? `No se encontraron productos para "${search}"` : 'No hay productos disponibles'} actionLabel="Recargar" onAction={() => loadProducts(1, true)} />}
                />
            )}

            <ClientSelectorModal
                visible={showClientModal}
                onClose={() => setShowClientModal(false)}
                onSelect={handleClientSelect}
                title="Seleccionar Cliente"
                priceListsMap={priceLists}
            />
        </View>
    )
}
