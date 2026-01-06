import React, { useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { signOut } from '../../../services/auth/authClient'
import { useToast } from '../../../context/ToastContext'
import { UserProfileTemplate } from '../../../components/profile/UserProfileTemplate'

export function TransportistaProfileScreen() {
    const navigation = useNavigation()
    const { showToast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadProfile = async () => {
        try {
            setIsLoading(true)
            const data = await UserService.getProfile()
            setProfile(data)
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
            <Header title="Perfil Transportista" variant="standard" showNotification={false} />
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
                isLoading={isLoading}
                onLogout={handleLogout}
                isClient={false}
            />
        </>
    )
}
