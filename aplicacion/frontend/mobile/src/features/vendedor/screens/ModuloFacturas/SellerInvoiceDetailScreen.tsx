import React from 'react'
import { useRoute } from '@react-navigation/native'
import { InvoiceDetailTemplate } from '../../../../components/invoices/InvoiceDetailTemplate'

export function SellerInvoiceDetailScreen() {
    const route = useRoute<any>()
    const { invoiceId } = route.params || {}

    return (
        <InvoiceDetailTemplate
            invoiceId={invoiceId}
            role="supervisor" // Vendedor ve info completa como supervisor
        />
    )
}
