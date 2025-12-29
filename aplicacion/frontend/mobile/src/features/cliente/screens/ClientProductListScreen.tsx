import { BRAND_COLORS } from '@cafrilosa/shared-types'
import * as React from 'react'
import { FlatList, View, ActivityIndicator, Text } from 'react-native'


import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { Header } from '../../../components/ui/Header'
import { ProductCard } from '../../../components/ui/ProductCard'
import { SearchBar } from '../../../components/ui/SearchBar'
import { Snackbar } from '../../../components/ui/Snackbar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useCart } from '../../../hooks/useCart'
import { useProducts } from '../../../hooks/useProducts'

// --- Categorías estáticas (esto está bien aquí, o podría venir de DB tmb) ---
const CATEGORIES = [
    { id: 'all', name: 'Todo' },
    { id: 'embutidos', name: 'Embutidos' },
    { id: 'carnes', name: 'Carnes Frescas' },
    { id: 'quesos', name: 'Lácteos' },
    { id: 'congelados', name: 'Congelados' },
]

export function ClientProductListScreen() {
    const [search, setSearch] = React.useState('')
    const [selectedCategory, setSelectedCategory] = React.useState<string | number>('all')
    const [showSnackbar, setShowSnackbar] = React.useState(false)
    const [snackbarMsg, setSnackbarMsg] = React.useState('')

    // Hook personalizado
    const { products, loading, refresh } = useProducts()
    const { addItem, totalItems } = useCart()

    // Filtrado en cliente (podría moverse al backend si fuera necesario)
    const filteredProducts = React.useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.code.toLowerCase().includes(search.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [products, search, selectedCategory])

    const handleAddToCart = (product: typeof products[0]) => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            code: product.code,
            image: product.image,
        })
        setSnackbarMsg(`✓ Agregado: ${product.name}`)
        setShowSnackbar(true)
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                userName="Usuario"
                variant="standard"
                title="Productos"
            />

            <View className="flex-1">
                {/* Controles Superiores (Buscador y Filtros) */}
                <View className="bg-white pb-4 rounded-b-[24px] shadow-sm shadow-black/5 z-10">
                    <View className="px-5 mt-2 mb-4">
                        <SearchBar
                            // Skipping edit until I check ProductCard. But user said "ClientProductListScreen (Hide stock)" in task.
                            // I will blindly edit ClientProductListScreen just in case, but it's likely using ProductCard.
                            // The file is likely `src/features/cliente/components/ProductCard.tsx`.
                            // I will start by finding it..."
                            value={search}
                            onChangeText={setSearch}
                            onClear={() => setSearch('')}
                        />
                    </View>
                    <CategoryFilter
                        categories={CATEGORIES}
                        selectedId={selectedCategory}
                        onSelect={setSelectedCategory}
                    />
                </View>

                {/* Contenido Principal */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                        <Text className="text-neutral-400 text-sm mt-3">Cargando catálogo...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <ProductCard
                                product={item}
                                onPress={() => console.log('Ver detalle', item.id)}
                                onAdd={() => handleAddToCart(item)}
                            />
                        )}
                        ListEmptyComponent={
                            <EmptyState
                                icon="search-outline"
                                title={search ? "No se encontraron resultados" : "Catálogo vacío"}
                                description={search ? "Prueba con otros términos de búsqueda." : "No hay productos disponibles en este momento."}
                                actionLabel={search ? "Limpiar búsqueda" : "Actualizar"}
                                onAction={search ? () => setSearch('') : refresh}
                                style={{ marginTop: 40 }}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={refresh}
                    />
                )}
            </View>

            {/* Feedback */}
            <Snackbar
                visible={showSnackbar}
                message={snackbarMsg}
                onDismiss={() => setShowSnackbar(false)}
                type="success"
            />
        </View>
    )
}
