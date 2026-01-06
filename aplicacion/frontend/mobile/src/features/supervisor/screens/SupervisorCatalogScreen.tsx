import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { ExpandableFab } from '../../../components/ui/ExpandableFab'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { CatalogService, Product, Category } from '../../../services/api/CatalogService'

export function SupervisorCatalogScreen() {
    const navigation = useNavigation()
    const isFocused = useIsFocused()

    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>('all')

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [productsData, categoriesData] = await Promise.all([
                CatalogService.getProducts(),
                CatalogService.getCategories()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'No se pudo cargar el catálogo.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isFocused) {
            fetchData()
        }
    }, [isFocused])

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.codigo_sku.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = selectedCategoryId === 'all' || p.categoria_id === selectedCategoryId

        return matchesSearch && matchesCategory
    })

    // Prepare categories for filter (add 'All' option)
    const filterCategories = [
        { id: 'all', name: 'Todas' },
        ...categories.map(c => ({ id: c.id, name: c.nombre }))
    ]

    const renderProductItem = (item: Product) => (
        // ... (renderProductItem implementation remains same) ...
        <TouchableOpacity
            className="flex-row bg-white p-4 mb-3 rounded-2xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('SupervisorProductForm', { product: item })}
        >
            {/* Image Placeholder */}
            <View className="w-16 h-16 bg-neutral-100 rounded-xl items-center justify-center mr-4">
                {item.imagen_url ? (
                    // TODO: Use Image component if url exists
                    <Ionicons name="image" size={24} color="#2563EB" />
                ) : (
                    <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                )}
            </View>

            {/* Info */}
            <View className="flex-1 justify-center">
                <View className="flex-row justify-between items-start">
                    <Text className="font-bold text-neutral-900 text-base flex-1 mr-2">{item.nombre}</Text>
                    <View className={`px-2 py-0.5 rounded-md ${item.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>

                <Text className="text-neutral-500 text-xs mb-1">SKU: {item.codigo_sku}</Text>
                {/* Nota: El precio podría venir de una lista base, asumimos gestión aparte o campo en backend */}
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                title="Catálogo General"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="bg-white shadow-sm z-10 pb-2">
                <View className="px-5 py-4 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar producto..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => (navigation as any).navigate('SupervisorProductForm')}
                    >
                        <Ionicons name="add" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Categories Filter */}
                <CategoryFilter
                    categories={filterCategories}
                    selectedId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                />
            </View>

            <GenericList
                items={filteredProducts}
                isLoading={loading}
                onRefresh={fetchData}
                renderItem={renderProductItem}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin Productos',
                    message: 'No se encontraron productos con ese criterio.'
                }}
            />
            {/* Main Management FAB */}
            <ExpandableFab
                actions={[
                    {
                        icon: 'grid-outline',
                        label: 'Categorías',
                        color: '#2563EB', // Blue
                        onPress: () => navigation.navigate('SupervisorCategories' as never),
                    },

                    {
                        icon: 'pricetags-outline',
                        label: 'Listas de Precios',
                        color: '#D97706', // Amber
                        onPress: () => navigation.navigate('SupervisorPriceLists' as never),
                    }
                ]}
            />
        </View>
    )
}
