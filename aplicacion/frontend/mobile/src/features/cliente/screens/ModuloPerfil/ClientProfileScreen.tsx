import React, { useState, useCallback } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../../services/api/UserService'
import { ClientService } from '../../../../services/api/ClientService'
import { signOut } from '../../../../services/auth/authClient'
import { useToast } from '../../../../context/ToastContext'
import { UserProfileTemplate, type CommercialData } from '../../../../components/profile/UserProfileTemplate'

export function ClientProfileScreen() {
    const navigation = useNavigation()
    const { showToast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [commercialData, setCommercialData] = useState<CommercialData | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)

    const loadProfile = async () => {
        try {
            setIsLoading(true)
            const user = await UserService.getProfile()
            setProfile(user)

            if (user) {
                const myClient = await ClientService.getMyClientData()

                if (myClient) {
                    // Mapeo de listas de precios conocidas
                    const priceListNames: Record<number, string> = {
                        1: 'General',
                        2: 'Mayorista',
                        3: 'Horeca'
                    }
                    const listaId = myClient.lista_precios_id ?? 0
                    const priceListName = priceListNames[listaId] || (listaId ? `Lista #${listaId}` : 'Sin lista')

                    // Usar el nombre de la zona que viene del backend (ya enriquecido)
                    const zoneName = myClient.zona_comercial_nombre ||
                                   (myClient.zona_comercial_id ? `Zona #${myClient.zona_comercial_id}` : 'General')

                    // Usar el nombre del vendedor que viene del backend (ya enriquecido)
                    const vendorName = myClient.vendedor_nombre ||
                                     (myClient.vendedor_asignado_id ? 'Asignado' : 'No asignado')

                    setCommercialData({
                        identificacion: myClient.identificacion,
                        tipo_identificacion: myClient.tipo_identificacion,
                        razon_social: myClient.razon_social,
                        nombre_comercial: myClient.nombre_comercial ?? undefined,
                        lista_precios: priceListName,
                        vendedor_asignado: vendorName,
                        zona_comercial: zoneName,
                        tiene_credito: myClient.tiene_credito,
                        limite_credito: Number.parseFloat(myClient.limite_credito || '0'),
                        saldo_actual: Number.parseFloat(myClient.saldo_actual || '0'),
                        dias_plazo: myClient.dias_plazo,
                        direccion: myClient.direccion_texto ?? undefined
                    })
                }
            }

        } catch (error) {
            console.error('Error loading profile', error)
            showToast('Error al cargar perfil', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadProfile() }, []))

    const handleUpdateProfile = async (data: { nombre: string; telefono: string }): Promise<boolean> => {
        if (!profile) return false

        try {
            const success = await UserService.updateProfile(profile.id, data)
            if (success) {
                await loadProfile()
                return true
            }
            return false
        } catch (error) {
            console.error('Error updating profile', error)
            return false
        }
    }

    const handleLogout = async () => {
        try {
            await signOut()
            showToast('Sesión cerrada exitosamente', 'success')
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' as never }],
                })
            }, 300)
        } catch (error) {
            showToast('Error al cerrar sesión', 'error')
        }
    }

    return (
        <>
            <Header title="Mi Perfil" variant="standard" showNotification={false} />
            <UserProfileTemplate
                user={profile ? {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role,
                    photoUrl: profile.photoUrl,
                    lastLogin: profile.lastLogin
                } : {
                    id: '', name: '', email: '', phone: '', role: 'Cargando...'
                }}
                commercialInfo={commercialData}
                isClient={true}
                isLoading={isLoading}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
            />
        </>
    )
}
