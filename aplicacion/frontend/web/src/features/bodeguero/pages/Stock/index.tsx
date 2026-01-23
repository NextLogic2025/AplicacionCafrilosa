
import { Alert } from 'components/ui/Alert'
import { useStockPage } from './hooks/useStockPage'
import { StockHeader } from './components/StockHeader'
import { StockFilters } from './components/StockFilters'
import { StockTable } from './components/StockTable'
import { CreateStockModal } from './components/CreateStockModal'
import { AdjustStockModal } from './components/AdjustStockModal'

export default function StockPage() {
    const {
        stock,
        loading,
        error,
        isCreateModalOpen,
        isAdjustModalOpen,
        selectedStock,
        products,
        selectedProduct,
        role,
        setIsCreateModalOpen,
        setSelectedProduct,
        handleOpenAdjust,
        handleCloseAdjust,
        handleCreateSuccess,
        handleAdjustSuccess
    } = useStockPage()

    return (
        <div className="space-y-6">
            <StockHeader
                role={role}
                onOpenCreate={() => setIsCreateModalOpen(true)}
            />

            <div className="flex justify-between items-center">
                <StockFilters
                    products={products}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                />
            </div>

            {error && <Alert type="error" title="Error" message={error} />}

            <StockTable
                stock={stock}
                loading={loading}
                role={role}
                onEdit={handleOpenAdjust}
            />

            <CreateStockModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {selectedStock && (
                <AdjustStockModal
                    isOpen={isAdjustModalOpen}
                    onClose={handleCloseAdjust}
                    onSuccess={handleAdjustSuccess}
                    stockItem={selectedStock}
                />
            )}
        </div>
    )
}

