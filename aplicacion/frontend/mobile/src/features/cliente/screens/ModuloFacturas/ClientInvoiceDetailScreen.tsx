import React from 'react'
import { useRoute } from '@react-navigation/native'
import { InvoiceDetailTemplate } from '../../../../components/invoices/InvoiceDetailTemplate'

export function ClientInvoiceDetailScreen() {
    const route = useRoute()
    // @ts-ignore
    const { invoiceId } = route.params || {}

    return (
        <InvoiceDetailTemplate
            role="client"
            invoiceId={invoiceId}
        />
    )
}
