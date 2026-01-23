import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { InvoiceListTemplate } from '../../../../components/invoices/InvoiceListTemplate'

export function SellerInvoicesScreen() {
    const navigation = useNavigation<any>()

    return (
        <InvoiceListTemplate
            role="vendedor"
            title="Mis Facturas"
            onInvoicePress={(invoice) => {
                navigation.navigate('SellerInvoiceDetail', { invoiceId: invoice.id })
            }}
        />
    )
}
