import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { ClientService, Client } from '../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { Ionicons } from '@expo/vector-icons'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericModal } from '../../../components/ui/GenericModal'
import { GenericList } from '../../../components/ui/GenericList'

export function SupervisorClientFormScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const isEditing = !!route.params?.client
    const client: Client | undefined = route.params?.client

    const [loading, setLoading] = useState(false)
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [vendors, setVendors] = useState<UserProfile[]>([])
    const [showVendorModal, setShowVendorModal] = useState(false)

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
        showCancel?: boolean
    }>({ type: 'info', title: '', message: '' })

    // User Data State (Only for creation)
    const [userData, setUserData] = useState({
        nombre: '',
        email: '',
        password: '',
        rolId: 4 // Cliente role ID usually
    })

    // Client Data State
    const [clientData, setClientData] = useState({
        identificacion: '',
        tipo_identificacion: 'RUC',
        razon_social: '',
        nombre_comercial: '',
        lista_precios_id: 1, // Default to General
        vendedor_asignado_id: null as string | null,
        direccion_texto: '',
        tiene_credito: false,
        limite_credito: '0',
        dias_plazo: '0'
    })

    useEffect(() => {
        loadPriceLists()
        if (isEditing && client) {
            setClientData({
                identificacion: client.identificacion,
                tipo_identificacion: client.tipo_identificacion,
                razon_social: client.razon_social,
                nombre_comercial: client.nombre_comercial || '',
                lista_precios_id: client.lista_precios_id,
                vendedor_asignado_id: client.vendedor_asignado_id || null,
                direccion_texto: client.direccion_texto || '',
                tiene_credito: client.tiene_credito,
                limite_credito: client.limite_credito.toString(),
                dias_plazo: client.dias_plazo.toString()
            })
        }
    }, [])

    const loadPriceLists = async () => {
        try {
            const [lists, vendorUsers] = await Promise.all([
                PriceService.getLists(),
                UserService.getVendors()
            ])
            setPriceLists(lists.filter(l => l.activa))
            setVendors(vendorUsers)
        } catch (error) {
            console.error(error)
        }
    }

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackConfig({ type, title, message, onConfirm })
        setFeedbackVisible(true)
    }

    const handleSave = async () => {
        // Validation
        if (!clientData.razon_social.trim() || !clientData.identificacion.trim()) {
            showFeedback('warning', 'Validación', 'Razón Social e Identificación son obligatorios.')
            return
        }

        if (!isEditing && (!userData.email.trim() || !userData.password.trim())) {
            showFeedback('warning', 'Validación', 'Email y contraseña son obligatorios para crear el usuario.')
            return
        }

        setLoading(true)
        try {
            let userId = client?.usuario_principal_id

            // 1. Create User if needed
            if (!isEditing) {
                const userResponse = await UserService.createUser({
                    email: userData.email,
                    password: userData.password,
                    nombre: userData.nombre || clientData.razon_social,
                    rolId: 4 // Assuming 4 is 'cliente' role
                })

                if (!userResponse.success || !userResponse.userId) {
                    throw new Error(userResponse.message || 'Error al crear usuario')
                }
                userId = userResponse.userId
            }

            // 2. Create/Update Client
            const payload: any = {
                ...clientData,
                usuario_principal_id: userId,
                limite_credito: parseFloat(clientData.limite_credito) || 0,
                dias_plazo: parseInt(clientData.dias_plazo) || 0
            }

            // Ensure lista_precios_id is a number
            payload.lista_precios_id = Number(payload.lista_precios_id)

            if (isEditing && client) {
                await ClientService.updateClient(client.id, payload)
                showFeedback('success', 'Cliente Actualizado', 'Los datos se guardaron correctamente.', () => navigation.goBack())
            } else {
                await ClientService.createClient(payload)
                showFeedback('success', 'Cliente Creado', 'El cliente y su usuario han sido registrados.', () => navigation.goBack())
            }

        } catch (error: any) {
            console.error(error)
            showFeedback('error', 'Error', error.message || 'No se pudo guardar el cliente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-4">

                {/* Section 1: User Credentials (Only New) */}
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
                            onChangeText={t => setUserData(prev => ({ ...prev, nombre: t }))}
                            placeholder="Ej. Juan Pérez"
                        />

                        <Text className="text-neutral-500 font-medium mb-1">Email (Usuario)</Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                            value={userData.email}
                            onChangeText={t => setUserData(prev => ({ ...prev, email: t }))}
                            placeholder="correo@ejemplo.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text className="text-neutral-500 font-medium mb-1">Contraseña</Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-1 text-neutral-900"
                            value={userData.password}
                            onChangeText={t => setUserData(prev => ({ ...prev, password: t }))}
                            placeholder="********"
                            secureTextEntry
                        />
                    </View>
                )}

                {/* Section 2: Client Info */}
                <View className="bg-white p-5 rounded-2xl shadow-sm mb-4 border border-neutral-100">
                    <View className="flex-row items-center mb-4 border-b border-neutral-100 pb-2">
                        <Ionicons name="business-outline" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-neutral-900 font-bold text-lg ml-2">Información Comercial</Text>
                    </View>

                    <Text className="text-neutral-500 font-medium mb-1">Razón Social</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={clientData.razon_social}
                        onChangeText={t => setClientData(prev => ({ ...prev, razon_social: t }))}
                        placeholder="Ej. Empresa S.A."
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Nombre Comercial</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={clientData.nombre_comercial}
                        onChangeText={t => setClientData(prev => ({ ...prev, nombre_comercial: t }))}
                        placeholder="Ej. Tienda El Chavo"
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Identificación (RUC/Cédula)</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={clientData.identificacion}
                        onChangeText={t => setClientData(prev => ({ ...prev, identificacion: t }))}
                        placeholder="Ej. 1777777777001"
                        keyboardType="numeric"
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Dirección Matriz</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={clientData.direccion_texto}
                        onChangeText={t => setClientData(prev => ({ ...prev, direccion_texto: t }))}
                        placeholder="Ej. Av. Principal 123"
                        multiline
                    />
                </View>

                {/* Section 3: Commercial Config */}
                <View className="bg-white p-5 rounded-2xl shadow-sm mb-4 border border-neutral-100">
                    <View className="flex-row items-center mb-4 border-b border-neutral-100 pb-2">
                        <Ionicons name="settings-outline" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-neutral-900 font-bold text-lg ml-2">Configuración</Text>
                    </View>

                    <Text className="text-neutral-500 font-medium mb-1">Vendedor Asignado</Text>
                    <TouchableOpacity
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-4 flex-row justify-between items-center"
                        onPress={() => setShowVendorModal(true)}
                    >
                        <Text className={clientData.vendedor_asignado_id ? "text-neutral-900" : "text-neutral-400"}>
                            {clientData.vendedor_asignado_id
                                ? vendors.find(v => v.id === clientData.vendedor_asignado_id)?.name || 'Vendedor no encontrado'
                                : 'Seleccionar Vendedor'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <Text className="text-neutral-500 font-medium mb-2">Lista de Precios Asignada</Text>
                    <View className="mb-4">
                        <CategoryFilter
                            categories={priceLists.map(l => ({ id: l.id, name: l.nombre }))}
                            selectedId={clientData.lista_precios_id}
                            onSelect={(id) => setClientData(prev => ({ ...prev, lista_precios_id: Number(id) }))}
                        />
                    </View>

                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-neutral-700 font-medium">Tiene Crédito</Text>
                        <Switch
                            value={clientData.tiene_credito}
                            onValueChange={v => setClientData(prev => ({ ...prev, tiene_credito: v }))}
                            trackColor={{ false: "#d1d5db", true: "#ef4444" }}
                        />
                    </View>

                    {clientData.tiene_credito && (
                        <View className="flex-row gap-4 mb-2">
                            <View className="flex-1">
                                <Text className="text-neutral-500 font-medium mb-1">Cupo ($)</Text>
                                <TextInput
                                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                    value={clientData.limite_credito}
                                    onChangeText={t => setClientData(prev => ({ ...prev, limite_credito: t }))}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-500 font-medium mb-1">Días Plazo</Text>
                                <TextInput
                                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                    value={clientData.dias_plazo}
                                    onChangeText={t => setClientData(prev => ({ ...prev, dias_plazo: t }))}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-lg mb-10 ${loading ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
            />

            {/* Vendor Selection Modal */}
            <GenericModal
                visible={showVendorModal}
                title="Seleccionar Vendedor"
                onClose={() => setShowVendorModal(false)}
            >
                <View className="h-64">
                    <GenericList
                        items={vendors}
                        renderItem={(item: UserProfile) => {
                            const isSelected = clientData.vendedor_asignado_id === item.id
                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                    onPress={() => {
                                        setClientData(prev => ({ ...prev, vendedor_asignado_id: item.id }))
                                        setShowVendorModal(false)
                                    }}
                                >
                                    <View className="flex-row items-center flex-1">
                                        {/* Avatar / Placeholder */}
                                        <View className={`w-10 h-10 rounded-full mr-3 items-center justify-center ${isSelected ? 'bg-red-100' : 'bg-neutral-100'}`}>
                                            <Text className={`font-bold text-lg ${isSelected ? 'text-red-600' : 'text-neutral-500'}`}>
                                                {item.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>

                                        <View className="flex-1">
                                            <Text className={`font-semibold text-base ${isSelected ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                                {item.name}
                                            </Text>
                                            <Text className="text-neutral-500 text-xs">{item.email}</Text>
                                        </View>
                                    </View>

                                    {isSelected ? (
                                        <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        </View>
                                    ) : (
                                        <View className="w-6 h-6 rounded-full border border-neutral-300" />
                                    )}
                                </TouchableOpacity>
                            )
                        }}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{
                            icon: 'people-outline',
                            title: 'Sin Vendedores',
                            message: 'No se encontraron usuarios con rol Vendedor.'
                        }}
                    />
                </View>
            </GenericModal>
        </View>
    )
}
