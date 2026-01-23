import React from 'react'
import { useRoute } from '@react-navigation/native'
import { InvoiceDetailTemplate } from '../../../../components/invoices/InvoiceDetailTemplate'

export function SupervisorInvoiceDetailScreen() {
    const route = useRoute()
    // @ts-ignore
    const { invoiceId } = route.params || {}

    return (
        <InvoiceDetailTemplate
            role="supervisor"
            invoiceId={invoiceId}
        />
    )
}
