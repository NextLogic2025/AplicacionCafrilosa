
import { useState, useEffect } from 'react'
import { useProfile } from '../../../../../hooks/useProfile'

export function usePerfilPage() {
    const { profile, loading, error, refresh, updateProfile, client, clientLoading, clientError, vendedorMap, updateClient } = useProfile()
    const [activeStep, setActiveStep] = useState<number>(0)

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ nombre: '', telefono: '', avatarUrl: '' })
    const [success, setSuccess] = useState<string | null>(null)

    const [clientEditing, setClientEditing] = useState(false)
    const [clientForm, setClientForm] = useState({ identificacion: '', tipo_identificacion: '', razon_social: '', nombre_comercial: '' })

    useEffect(() => {
        refresh()
    }, [refresh])

    // Reset edit modes when switching between steps
    useEffect(() => {
        if (activeStep !== 0) setEditing(false)
        if (activeStep !== 1) setClientEditing(false)
    }, [activeStep])

    useEffect(() => {
        setForm({
            nombre: profile?.nombre ?? (profile as any)?.nombreCompleto ?? client?.nombre_comercial ?? client?.razon_social ?? '',
            telefono: profile?.telefono ?? '',
            avatarUrl: profile?.avatarUrl ?? ''
        })
        if (client) {
            setClientForm({
                identificacion: client.identificacion ?? '',
                tipo_identificacion: client.tipo_identificacion ?? '',
                razon_social: client.razon_social ?? '',
                nombre_comercial: client.nombre_comercial ?? '',
            })
        }
    }, [profile, client])

    function formatGps(gps: any) {
        try {
            if (!gps) return '—'
            if (gps.type && Array.isArray(gps.coordinates)) {
                const [lng, lat] = gps.coordinates
                return `${lat?.toFixed?.(6) ?? lat}, ${lng?.toFixed?.(6) ?? lng}`
            }
            if (Array.isArray(gps.coordinates)) {
                const [a, b] = gps.coordinates
                return `${a}, ${b}`
            }
            if (typeof gps === 'object') return JSON.stringify(gps)
            return String(gps)
        } catch {
            return '—'
        }
    }

    const name = profile?.nombre || (profile as any)?.nombreCompleto || client?.nombre_comercial || client?.razon_social || profile?.email || 'Cliente'
    const email = profile?.email || 'Sin correo'
    const phone = profile?.telefono || 'Sin teléfono'
    const role = profile?.rol?.nombre || 'Sin rol'
    const created = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PE') : '---'

    async function handleSaveUser() {
        try {
            setSuccess(null)
            await updateProfile({ nombre: form.nombre, telefono: form.telefono || null, avatarUrl: form.avatarUrl || null })
            try { await refresh() } catch (e) { /* ignore refresh errors */ }
            setSuccess('Perfil actualizado')
            setEditing(false)
        } catch (e) {
            // error handled by hook's error state
        }
    }

    async function handleSaveClient() {
        try {
            setSuccess(null)
            await updateClient({
                identificacion: clientForm.identificacion || null,
                tipo_identificacion: clientForm.tipo_identificacion || null,
                razon_social: clientForm.razon_social || null,
                nombre_comercial: clientForm.nombre_comercial || null,
            } as any)
            setSuccess('Datos del cliente actualizados')
            setClientEditing(false)
        } catch (e) {
            // error shown by hook's clientError
        }
    }

    return {
        // State
        profile,
        loading,
        error,
        client,
        clientLoading,
        clientError,
        vendedorMap,
        activeStep,
        editing,
        form,
        success,
        clientEditing,
        clientForm,

        // Calculated
        name,
        email,
        phone,
        role,
        created,

        // Actions
        setActiveStep,
        setEditing,
        setForm,
        setSuccess,
        setClientEditing,
        setClientForm,
        handleSaveUser,
        handleSaveClient,
        formatGps,
    }
}
