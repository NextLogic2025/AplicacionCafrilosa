import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { InvoiceListTemplate } from '../../../../components/invoices/InvoiceListTemplate'

export function WarehouseInvoicesScreen() {
    const navigation = useNavigation()

    return (
        <InvoiceListTemplate
            role="warehouse"
            title="Facturas (Picking)"
            onInvoicePress={(invoice) => {
                // @ts-ignore
                navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })
            }}
        />
    )
}
