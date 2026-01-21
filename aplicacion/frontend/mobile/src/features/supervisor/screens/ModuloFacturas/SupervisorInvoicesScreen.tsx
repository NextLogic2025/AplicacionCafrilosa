import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { InvoiceListTemplate } from '../../../../components/invoices/InvoiceListTemplate'

export function SupervisorInvoicesScreen() {
    const navigation = useNavigation()

    return (
        <InvoiceListTemplate
            role="supervisor"
            title="Gestión de Facturas"
            onInvoicePress={(invoice) => {
                // @ts-ignore
                navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })
            }}
        />
    )
}
