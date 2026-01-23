
interface PaymentConditionSelectorProps {
    condicionPagoManual: 'CONTADO' | 'CREDITO'
    setCondicionPagoManual: (value: 'CONTADO' | 'CREDITO') => void
    superaCredito: boolean
}

export function PaymentConditionSelector({
    condicionPagoManual,
    setCondicionPagoManual,
    superaCredito
}: PaymentConditionSelectorProps) {
    return (
        <div className="rounded-2xl border border-neutral-200 px-3 py-3">
            <p className="text-sm font-semibold text-neutral-900 mb-2">Condición de Pago</p>
            <div className="space-y-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${condicionPagoManual === 'CONTADO' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                        type="radio"
                        name="condicionPago"
                        value="CONTADO"
                        checked={condicionPagoManual === 'CONTADO'}
                        onChange={(e) => setCondicionPagoManual(e.target.value as 'CONTADO' | 'CREDITO')}
                    />
                    <span className="font-medium">Contado</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${condicionPagoManual === 'CREDITO' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'} ${superaCredito ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                        type="radio"
                        name="condicionPago"
                        value="CREDITO"
                        checked={condicionPagoManual === 'CREDITO'}
                        onChange={(e) => setCondicionPagoManual(e.target.value as 'CONTADO' | 'CREDITO')}
                        disabled={superaCredito}
                    />
                    <span className="font-medium">Crédito</span>
                </label>
            </div>
        </div>
    )
}
