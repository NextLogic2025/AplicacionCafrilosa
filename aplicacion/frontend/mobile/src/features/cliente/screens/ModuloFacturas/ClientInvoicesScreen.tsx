import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { InvoiceListTemplate } from '../../../../components/invoices/InvoiceListTemplate'

export function ClientInvoicesScreen() {
    const navigation = useNavigation()

    return (
        <InvoiceListTemplate
            role="client"
            title="Mis Facturas"
            onInvoicePress={(invoice) => {
                // @ts-ignore
                navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })
            }}
        />
    )
}
