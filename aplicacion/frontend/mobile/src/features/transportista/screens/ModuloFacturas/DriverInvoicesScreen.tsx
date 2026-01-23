import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { InvoiceListTemplate } from '../../../../components/invoices/InvoiceListTemplate'

export function DriverInvoicesScreen() {
    const navigation = useNavigation()

    return (
        <InvoiceListTemplate
            role="driver"
            title="Facturas / Cobros"
            onInvoicePress={(invoice) => {
                // @ts-ignore
                navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })
            }}
        />
    )
}
