import React, { useEffect, useState, useCallback } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { ClientService, type Client } from '../../../services/api/ClientService'
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
                // Attempt to fetch Commercial Info
                try {
                    // Optimized: In a real app, we'd have /api/clientes/me or similar. 
                    // Here we try to find the client record linked to this user.
                    // If the user is a client, backend might filter `getClients` automatically or simple filter here.
                    const clients = await ClientService.getClients()
                    const myClient = clients.find(c => c.usuario_principal_id === user.id)

                    if (myClient) {
                        setCommercialData({
                            identificacion: myClient.identificacion,
                            tipo_identificacion: myClient.tipo_identificacion,
                            razon_social: myClient.razon_social,
                            nombre_comercial: myClient.nombre_comercial,
                            lista_precios: `Lista #${myClient.lista_precios_id}`, // Ideally would fetch name
                            vendedor_asignado: myClient.vendedor_asignado_id ? 'Asignado' : 'No asignado', // Ideally fetch name
                            zona_comercial: myClient.zona_comercial_id ? `Zona #${myClient.zona_comercial_id}` : 'General',
                            tiene_credito: myClient.tiene_credito,
                            limite_credito: myClient.limite_credito,
                            saldo_actual: myClient.saldo_actual,
                            dias_plazo: myClient.dias_plazo,
                            direccion: myClient.direccion_texto
                        })
                    }
                } catch (clientError) {
                    console.log('Could not load client details', clientError)
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
            <Header title="Mi Perfil" variant="standard" onBackPress={() => navigation.goBack()} />
            <UserProfileTemplate
                user={profile ? {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role,
                    photoUrl: profile.photoUrl
                } : {
                    id: '', name: '', email: '', phone: '', role: 'Cargando...'
                }}
                commercialInfo={commercialData}
                isClient={true} // Enable commercial section
                isLoading={isLoading}
                onLogout={handleLogout}
            />
        </>
    )
}
