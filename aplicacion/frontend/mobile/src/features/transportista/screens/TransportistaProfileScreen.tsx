import * as React from 'react'
import { View, Text, ScrollView, RefreshControl, Image, Pressable } from 'react-native'
import { Header } from '../../../components/ui/Header'
import { TransportistaService } from '../../../services/api/TransportistaService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { useNavigation } from '@react-navigation/native'

function ProfileSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <View className="mb-6 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <Text className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-wider">{title}</Text>
            {children}
        </View>
    )
}

function ProfileItem({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <View className="flex-row items-center mb-4 last:mb-0">
            <View className="w-10 h-10 rounded-full bg-neutral-50 items-center justify-center mr-4">
                <Ionicons name={icon} size={20} color="#4B5563" />
            </View>
            <View>
                <Text className="text-xs text-neutral-400 font-medium">{label}</Text>
                <Text className="text-base text-neutral-900 font-bold">{value}</Text>
            </View>
        </View>
    )
}

export function TransportistaProfileScreen() {
    const [profile, setProfile] = React.useState<any>(null)
    const [refreshing, setRefreshing] = React.useState(false)

    const loadProfile = async () => {
        const data = await TransportistaService.getProfile()
        setProfile(data)
        setRefreshing(false)
    }

    React.useEffect(() => {
        loadProfile()
    }, [])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                variant="standard"
                title="Mi Perfil"
                style={{ height: 120 }} // Taller header for profile feel
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingTop: 10 }} // Overlap effect
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} colors={[BRAND_COLORS.red]} />}
            >
                {/* Avatar Card - Floating over Header */}
                <View className="items-center -mt-8 mb-6">
                    <View className="bg-white p-1.5 rounded-full shadow-lg">
                        <View className="h-24 w-24 rounded-full bg-neutral-200 items-center justify-center overflow-hidden">
                            {/* Placeholder for now */}
                            <Text className="text-3xl font-bold text-neutral-400">{profile?.name?.charAt(0) || 'T'}</Text>
                        </View>
                    </View>
                    <Text className="text-xl font-bold text-neutral-900 mt-3">{profile?.name || 'Cargando...'}</Text>
                    <Text className="text-brand-red font-bold text-sm bg-red-50 px-3 py-1 rounded-full mt-1">
                        {profile?.role || 'Transportista'}
                    </Text>
                </View>

                {profile && (
                    <>
                        <ProfileSection title="Unidad Asignada">
                            <ProfileItem label="Vehículo" value={profile.vehicle.model} icon="bus-outline" />
                            <ProfileItem label="Placa" value={profile.vehicle.plate} icon="card-outline" />
                            <ProfileItem label="Zona" value={profile.zone} icon="map-outline" />
                        </ProfileSection>

                        <ProfileSection title="Estadísticas">
                            <View className="flex-row justify-between">
                                <View className="items-center flex-1">
                                    <Text className="text-2xl font-bold text-neutral-900">{profile.stats.deliveriesCompleted}</Text>
                                    <Text className="text-xs text-neutral-400 text-center">Entregas</Text>
                                </View>
                                <View className="w-[1px] bg-neutral-100" />
                                <View className="items-center flex-1">
                                    <Text className="text-2xl font-bold text-neutral-900">{profile.stats.yearsActive}</Text>
                                    <Text className="text-xs text-neutral-400 text-center">Años</Text>
                                </View>
                                <View className="w-[1px] bg-neutral-100" />
                                <View className="items-center flex-1">
                                    <Text className="text-2xl font-bold text-neutral-900">★ {profile.stats.rating}</Text>
                                    <Text className="text-xs text-neutral-400 text-center">Cafrilosa</Text>
                                </View>
                            </View>
                        </ProfileSection>

                        <Pressable className="bg-white p-4 rounded-xl border border-neutral-100 flex-row items-center mb-10">
                            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                            <Text className="font-bold text-brand-red ml-3">Cerrar Sesión</Text>
                        </Pressable>
                    </>
                )}
            </ScrollView>
        </View>
    )
}
