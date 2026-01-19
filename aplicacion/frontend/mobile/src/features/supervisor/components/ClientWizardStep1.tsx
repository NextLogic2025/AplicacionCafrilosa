
import React from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native'
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericModal } from '../../../components/ui/GenericModal'
import { GenericList } from '../../../components/ui/GenericList'
import { Zone, ZoneHelpers } from '../../../services/api/ZoneService'
import { PriceList } from '../../../services/api/PriceService'

interface Props {
    userData: any
    setUserData: (data: any) => void
    clientData: any
    setClientData: (data: any) => void
    zones: Zone[]
    priceLists: PriceList[]
    isEditing: boolean
    onNext: () => void
    showNav?: boolean
}

export function ClientWizardStep1({
    userData, setUserData,
    clientData, setClientData,
    zones, priceLists,
    isEditing, onNext,
    showNav = true
}: Props) {
    const [showZoneModal, setShowZoneModal] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)

    const selectedZone = zones.find(z => z.id === clientData.zona_comercial_id)
    const zonePolygon = selectedZone ? ZoneHelpers.parsePolygon(selectedZone.poligono_geografico) : []

    let initialRegion = {
        latitude: -3.99313,
        longitude: -79.20422,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
    }

    if (zonePolygon.length > 0) {
        initialRegion = {
            latitude: zonePolygon[0].latitude,
            longitude: zonePolygon[0].longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
        }
    }

    return (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {!isEditing && (
                <View className="bg-white p-5 rounded-2xl shadow-sm mb-4 border border-neutral-100">
                    <View className="flex-row items-center mb-4 border-b border-neutral-100 pb-2">
                        <Ionicons name="key-outline" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-neutral-900 font-bold text-lg ml-2">Datos de Acceso</Text>
                    </View>

                    <Text className="text-neutral-500 font-medium mb-1">Nombre del Contacto</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={userData.nombre}
                        onChangeText={t => setUserData({ ...userData, nombre: t })}
                        placeholder="Ej. Juan Pérez"
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Email (Usuario)</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={userData.email}
                        onChangeText={t => setUserData({ ...userData, email: t })}
                        placeholder="correo@ejemplo.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Contraseña</Text>
                    <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3 mb-1">
                        <TextInput
                            className="flex-1 py-3 text-neutral-900"
                            value={userData.password}
                            onChangeText={t => setUserData({ ...userData, password: t })}
                            placeholder="********"
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4 border border-neutral-100">
                <View className="flex-row items-center mb-4 border-b border-neutral-100 pb-2">
                    <Ionicons name="business-outline" size={20} color={BRAND_COLORS.red} />
                    <Text className="text-neutral-900 font-bold text-lg ml-2">Información Comercial</Text>
                </View>

                <Text className="text-neutral-500 font-medium mb-1">Nombre Comercial</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                    value={clientData.nombre_comercial}
                    onChangeText={t => setClientData({ ...clientData, nombre_comercial: t })}
                    placeholder="Ej. Tienda Doña María"
                />

                <Text className="text-neutral-500 font-medium mb-1">Razón Social</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                    value={clientData.razon_social}
                    onChangeText={t => setClientData({ ...clientData, razon_social: t })}
                    placeholder="Ej. Empresa S.A."
                />

                <Text className="text-neutral-500 font-medium mb-1">Identificación (RUC/Cédula)</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                    value={clientData.identificacion}
                    onChangeText={t => setClientData({ ...clientData, identificacion: t })}
                    placeholder="Ej. 1777777777001"
                    keyboardType="numeric"
                />

                <Text className="text-neutral-500 font-medium mb-1">Tipo de Cliente (Lista de Precios)</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                    {priceLists.map((list) => (
                        <TouchableOpacity
                            key={list.id}
                            onPress={() => setClientData({ ...clientData, lista_precios_id: list.id })}
                            className={`px-4 py-2 rounded-full border ${clientData.lista_precios_id === list.id
                                ? 'bg-red-600 border-red-600'
                                : 'bg-neutral-50 border-neutral-200'
                                }`}
                            style={clientData.lista_precios_id === list.id ? { backgroundColor: BRAND_COLORS.red, borderColor: BRAND_COLORS.red } : {}}
                        >
                            <Text className={`font-semibold ${clientData.lista_precios_id === list.id ? 'text-white' : 'text-neutral-600'
                                }`}>
                                {list.nombre}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-neutral-500 font-medium mb-1">Zona Comercial</Text>
                <TouchableOpacity
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 flex-row justify-between items-center"
                    onPress={() => setShowZoneModal(true)}
                >
                    <View>
                        <Text className={clientData.zona_comercial_id ? "text-neutral-900 font-medium" : "text-neutral-400"}>
                            {selectedZone ? selectedZone.nombre : 'Seleccionar Zona'}
                        </Text>
                        {selectedZone && (
                            <Text className="text-xs text-neutral-400 mt-0.5">
                                {selectedZone.codigo} • {selectedZone.ciudad}
                            </Text>
                        )}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <View className="h-40 rounded-xl overflow-hidden mb-4 border border-neutral-200 relative">
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        region={initialRegion}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        liteMode
                    >
                        {zonePolygon.length > 0 && (
                            <Polygon
                                coordinates={zonePolygon}
                                strokeColor={BRAND_COLORS.red}
                                fillColor="rgba(239, 68, 68, 0.25)"
                                strokeWidth={2}
                            />
                        )}
                    </MapView>
                    {!selectedZone && (
                        <View className="absolute inset-0 bg-neutral-100/80 items-center justify-center">
                            <Text className="text-neutral-400 text-xs">Selecciona una zona para visualizar</Text>
                        </View>
                    )}
                </View>

                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-neutral-700 font-medium">Tiene Crédito</Text>
                    <Switch
                        value={clientData.tiene_credito}
                        onValueChange={v => setClientData({ ...clientData, tiene_credito: v })}
                        trackColor={{ false: "#d1d5db", true: "#ef4444" }}
                    />
                </View>

                {clientData.tiene_credito && (
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1">Cupo ($)</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                value={clientData.limite_credito}
                                onChangeText={t => setClientData({ ...clientData, limite_credito: t })}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1">Días Plazo</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                value={clientData.dias_plazo}
                                onChangeText={t => setClientData({ ...clientData, dias_plazo: t })}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                )}
            </View>

            {showNav && (
                <TouchableOpacity
                    className="bg-red-600 mx-5 py-4 rounded-xl items-center shadow-lg mb-10"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={onNext}
                >
                    <Text className="text-white font-bold text-lg">Siguiente: Ubicación</Text>
                </TouchableOpacity>
            )}

            <GenericModal
                visible={showZoneModal}
                title="Seleccionar Zona"
                onClose={() => setShowZoneModal(false)}
            >
                <View className="h-96">
                    <GenericList
                        items={zones.filter(z => z.activo)}
                        renderItem={(item: Zone) => (
                            <TouchableOpacity
                                className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${clientData.zona_comercial_id === item.id ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                onPress={() => {
                                    setClientData({ ...clientData, zona_comercial_id: item.id })
                                    setShowZoneModal(false)
                                }}
                            >
                                <View className="flex-1">
                                    <Text className="font-bold text-neutral-800">{item.nombre}</Text>
                                    <Text className="text-xs text-neutral-500">{item.ciudad}</Text>
                                </View>
                                {clientData.zona_comercial_id === item.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={BRAND_COLORS.red} />
                                )}
                            </TouchableOpacity>
                        )}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{
                            icon: 'map-outline',
                            title: 'Sin Zonas',
                            message: 'No existen zonas comerciales activas.'
                        }}
                    />
                </View>
            </GenericModal>
        </ScrollView>
    )
}
