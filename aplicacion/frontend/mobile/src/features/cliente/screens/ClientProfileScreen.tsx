import React, { useState, useCallback } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { ClientService } from '../../../services/api/ClientService'
import { signOut } from '../../../services/auth/authClient'
import { useToast } from '../../../context/ToastContext'
import { UserProfileTemplate, type CommercialData } from '../../../components/profile/UserProfileTemplate'

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
                    // Map lista_precios_id to known names
                    const priceListNames: Record<number, string> = {
                        1: 'General',
                        2: 'Mayorista',
                        3: 'Horeca'
                    }
                    const priceListName = priceListNames[myClient.lista_precios_id] || `Lista #${myClient.lista_precios_id}`

                    // Try to load zone name (may fail due to permissions, fallback to ID)
                    let zoneName = myClient.zona_comercial_id ? `Zona #${myClient.zona_comercial_id}` : 'General'
                    if (myClient.zona_comercial_id) {
                        try {
                            const zones = await ClientService.getCommercialZones()
                            const zone = zones.find(z => z.id === myClient.zona_comercial_id)
                            if (zone) {
                                zoneName = zone.nombre
                            }
                        } catch (error) {
                            // Keep ID-based name on permission error
                        }
                    }

                    // Vendor assignment status
                    const vendorName = myClient.vendedor_asignado_id ? 'Asignado' : 'No asignado'

                    setCommercialData({
                        identificacion: myClient.identificacion,
                        tipo_identificacion: myClient.tipo_identificacion,
                        razon_social: myClient.razon_social,
                        nombre_comercial: myClient.nombre_comercial,
                        lista_precios: priceListName,
                        vendedor_asignado: vendorName,
                        zona_comercial: zoneName,
                        tiene_credito: myClient.tiene_credito,
                        limite_credito: myClient.limite_credito,
                        saldo_actual: myClient.saldo_actual,
                        dias_plazo: myClient.dias_plazo,
                        direccion: myClient.direccion_texto
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
