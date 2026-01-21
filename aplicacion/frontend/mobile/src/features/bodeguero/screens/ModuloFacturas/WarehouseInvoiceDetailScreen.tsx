import React from 'react'
import { useRoute } from '@react-navigation/native'
import { InvoiceDetailTemplate } from '../../../../components/invoices/InvoiceDetailTemplate'

export function WarehouseInvoiceDetailScreen() {
    const route = useRoute()
    // @ts-ignore
    const { invoiceId } = route.params || {}

    return (
        <InvoiceDetailTemplate
            role="warehouse"
            invoiceId={invoiceId}
        />
    )
}
