import React, { useState, useEffect } from 'react'
import { View, Alert, TouchableOpacity, Text } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch'
import { UserService, UserProfile } from '../../../../services/api/UserService'
import { validatePassword } from '../../../../utils/passwordValidation'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { ZoneService, Zone } from '../../../../services/api/ZoneService'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { SucursalService, Sucursal } from '../../../../services/api/SucursalService'
import { BRAND_COLORS } from '../../../../shared/types'

import { WizardProgress } from '../../components/WizardProgress'
import { ClientWizardStep1 } from '../../components/ClientWizardStep1'
import { ClientWizardStep2 } from '../../components/ClientWizardStep2'
import { ClientWizardStep3 } from '../../components/ClientWizardStep3'
import { GenericTabs } from '../../../../components/ui/GenericTabs'

export function SupervisorClientFormScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const isEditing = !!route.params?.client
    const client: Client | undefined = route.params?.client

    const [currentStep, setCurrentStep] = useState(1)
    const [activeTab, setActiveTab] = useState<'datos' | 'ubicacion' | 'sucursales'>('datos')
    const [loading, setLoading] = useState(false)

    // Dependencies
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [zones, setZones] = useState<Zone[]>([])
    const [vendors, setVendors] = useState<UserProfile[]>([])

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType,
        title: string,
        message: string,
        onConfirm?: () => void,
        showCancel?: boolean,
        confirmText?: string
    }>({ type: 'info', title: '', message: '' })

    // --- FORM DATA ---
    const [userData, setUserData] = useState({
        nombre: '', email: '', password: '', rolId: 6
    })

    const [clientData, setClientData] = useState({
        identificacion: '',
        tipo_identificacion: 'RUC',
        razon_social: '',
        nombre_comercial: '',
        lista_precios_id: 1,
        zona_comercial_id: null as number | null,
        vendedor_asignado_id: null as string | null,
        direccion_texto: '',
        ubicacion_gps: null as any, // { type: 'Point', coordinates: [lng, lat] }
        tiene_credito: false,
        limite_credito: '0',
        dias_plazo: '0'
    })

    const [branches, setBranches] = useState<any[]>([])

    // --- INITIAL LOAD ---
    useEffect(() => {
        loadDependencies()
        if (isEditing && client) {
            setupEditingData()
        }
    }, [])

    const loadDependencies = async () => {
        try {
            const [lists, allZones, allVendors] = await Promise.all([
                PriceService.getLists(),
                ZoneService.getZones(),
                UserService.getVendors()
            ])
            setPriceLists(lists.filter(l => l.activa))
            setZones(allZones)
            setVendors(allVendors)
        } catch (error) {
            console.error(error)
            showFeedback('error', 'Error', 'No se pudieron cargar datos necesarios.')
        }
    }

    const setupEditingData = async () => {
        if (!client) return
        setClientData({
            identificacion: client.identificacion,
            tipo_identificacion: client.tipo_identificacion,
            razon_social: client.razon_social,
            nombre_comercial: client.nombre_comercial || '',
            lista_precios_id: client.lista_precios_id ?? 1,
            zona_comercial_id: client.zona_comercial_id || null,
            vendedor_asignado_id: client.vendedor_asignado_id || null,
            direccion_texto: client.direccion_texto || '',
            ubicacion_gps: client.ubicacion_gps || null, // Assuming backend sends GeoJSON
            tiene_credito: client.tiene_credito,
            limite_credito: client.limite_credito.toString(),
            dias_plazo: client.dias_plazo.toString()
        })

        // Fetch existing branches
        try {
            const existingBranches = await SucursalService.getSucursalesByClient(client.id)
            setBranches(existingBranches.map(b => ({ ...b, tempId: b.id })))
        } catch (error) {
            console.error("Error fetching branches", error)
        }
    }

    // --- AUTO-ASSIGN VENDOR ---
    useEffect(() => {
        const updateInferredVendor = async () => {
            if (clientData.zona_comercial_id) {
                try {
                    const assignments = await AssignmentService.getAssignmentsByZone(clientData.zona_comercial_id)
                    const mainAssignment = assignments.find(a => a.es_principal)
                    if (mainAssignment && mainAssignment.vendedor_usuario_id) {
                        setClientData(prev => ({ ...prev, vendedor_asignado_id: mainAssignment.vendedor_usuario_id }))
                    } else {
                        setClientData(prev => ({ ...prev, vendedor_asignado_id: null }))
                    }
                } catch (e) {
                    console.error("Error inferring vendor", e)
                }
            }
        }
        if (clientData.zona_comercial_id) updateInferredVendor()
    }, [clientData.zona_comercial_id])


    // --- ACTIONS ---
    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackConfig({ type, title, message, onConfirm })
        setFeedbackVisible(true)
    }

    const validateStep1 = () => {
        if (!clientData.razon_social.trim() || !clientData.identificacion.trim()) {
            showFeedback('warning', 'Faltan Datos', 'Razón Social e Identificación son obligatorios.')
            return false
        }
        if (!clientData.zona_comercial_id) {
            showFeedback('warning', 'Faltan Datos', 'Debes seleccionar una Zona Comercial.')
            return false
        }
        if (!isEditing) {
            if (!userData.email.trim() || !userData.password.trim()) {
                showFeedback('warning', 'Faltan Datos', 'Debes crear un usuario (Email y Contraseña).')
                return false
            }

            // Email Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(userData.email)) {
                showFeedback('warning', 'Email Inválido', 'Por favor ingresa un correo electrónico válido (ej. usuario@dominio.com).')
                return false
            }

            // Password Security Validation
            const passwordValidation = validatePassword(userData.password)
            if (!passwordValidation.isValid) {
                showFeedback(
                    'warning',
                    'Contraseña Insegura',
                    `La contraseña debe cumplir los siguientes requisitos:\n\n${passwordValidation.errors.join('\n')}`
                )
                return false
            }
        }
        return true
    }

    const validateStep2 = () => {
        if (!clientData.ubicacion_gps) {
            Alert.alert("Atención", "No has definido la ubicación GPS en el mapa. ¿Deseas continuar sin mapa?", [
                { text: "No, marcar mapa", style: 'cancel' },
                { text: "Sí, continuar", onPress: () => setCurrentStep(3) }
            ])
            return false
        }
        return true
    }

    const handleFinalSubmit = async () => {
        setLoading(true)
        try {
            let clientId = client?.id
            let userId = client?.usuario_principal_id

            // A. Create User if New
            if (!isEditing) {
                const userResponse = await UserService.createUser({
                    email: userData.email,
                    password: userData.password,
                    nombre: userData.nombre || clientData.razon_social,
                    rolId: 6
                })
                if (!userResponse.success || !userResponse.userId) throw new Error(userResponse.message || 'Error al crear usuario')
                userId = userResponse.userId
            }

            // B. Create/Update Client
            // Solo enviamos los campos que acepta el DTO del backend
            const payload: any = {
                identificacion: clientData.identificacion,
                tipo_identificacion: clientData.tipo_identificacion,
                razon_social: clientData.razon_social,
                nombre_comercial: clientData.nombre_comercial || undefined,
                usuario_principal_id: userId,
                zona_comercial_id: clientData.zona_comercial_id ? Number(clientData.zona_comercial_id) : undefined,
                direccion_texto: clientData.direccion_texto || undefined,
                tiene_credito: clientData.tiene_credito,
                limite_credito: parseFloat(clientData.limite_credito) || 0,
                dias_plazo: parseInt(clientData.dias_plazo) || 0,
                // Campos adicionales que el backend acepta
                lista_precios_id: clientData.lista_precios_id ? Number(clientData.lista_precios_id) : undefined,
                ubicacion_gps: clientData.ubicacion_gps || undefined,
            }

            let savedClient: Client
            if (isEditing && clientId) {
                savedClient = await ClientService.updateClient(clientId, payload)
            } else {
                savedClient = await ClientService.createClient(payload)
                clientId = savedClient.id
            }

            // C. Create/Update Branches
            if (clientId && branches.length > 0) {
                for (const branch of branches) {
                    if (branch.id) {
                        // Update existing branch
                        await SucursalService.updateSucursal(branch.id, {
                            nombre_sucursal: branch.nombre_sucursal,
                            direccion_entrega: branch.direccion_entrega,
                            contacto_nombre: branch.contacto_nombre,
                            contacto_telefono: branch.contacto_telefono,
                            ubicacion_gps: branch.ubicacion_gps,
                            zona_id: branch.zona_id  // ✅ Enviar zona_id al actualizar
                        })
                    } else {
                        // Create new branch
                        await SucursalService.createSucursal(clientId, {
                            nombre_sucursal: branch.nombre_sucursal,
                            direccion_entrega: branch.direccion_entrega,
                            contacto_nombre: branch.contacto_nombre,
                            contacto_telefono: branch.contacto_telefono,
                            ubicacion_gps: branch.ubicacion_gps,
                            zona_id: branch.zona_id  // ✅ Enviar zona_id al crear
                        })
                    }
                }
            }

            showFeedback('success', 'Éxito',
                isEditing ? 'Cliente actualizado correctamente.' : 'Cliente y usuario creados correctamente.',
                () => navigation.goBack()
            )

        } catch (error: any) {
            console.error(error)
            showFeedback('error', 'Error', error.message || 'Ocurrió un error al guardar.')
        } finally {
            setLoading(false)
        }
    }

    // --- BLOCK/UNBLOCK ---
    const handleToggleBlock = async () => {
        if (!client) return

        const isCurrentlyBlocked = client.bloqueado
        const actionVerb = isCurrentlyBlocked ? 'Activar' : 'Suspender'

        setFeedbackConfig({
            type: 'warning',
            title: `¿${actionVerb} Cliente?`,
            message: `¿Estás seguro de que deseas ${actionVerb.toLowerCase()} este cliente?`,
            showCancel: true,
            confirmText: 'Confirmar',
            onConfirm: async () => {
                setFeedbackVisible(false)
                setLoading(true)
                try {
                    if (isCurrentlyBlocked) {
                        await ClientService.unblockClient(client.id)
                        setTimeout(() => {
                            showFeedback('success', 'Cliente Activado', 'El cliente ha sido activado correctamente.', () => navigation.goBack())
                        }, 300)
                    } else {
                        await ClientService.deleteClient(client.id)
                        setTimeout(() => {
                            showFeedback('success', 'Cliente Suspendido', 'El cliente ha sido suspendido correctamente.', () => navigation.goBack())
                        }, 300)
                    }
                } catch (error) {
                    console.error(error)
                    setTimeout(() => {
                        showFeedback('error', 'Error', 'No se pudo actualizar el estado del cliente.')
                    }, 300)
                } finally {
                    setLoading(false)
                }
            }
        })
        setFeedbackVisible(true)
    }

    const handleEditSubmit = () => {
        if (!validateStep1()) {
            setActiveTab('datos')
            return
        }
        if (!clientData.ubicacion_gps) {
            Alert.alert('Ubicación faltante', 'No has definido la ubicación GPS.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Continuar', onPress: () => handleFinalSubmit() }
            ])
            return
        }
        handleFinalSubmit()
    }

    const editTabs = [
        { key: 'datos', label: 'Datos' },
        { key: 'ubicacion', label: 'Ubicación' },
        { key: 'sucursales', label: 'Sucursales' },
    ]

    const renderEditContent = () => (
        <>
            <GenericTabs tabs={editTabs} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as any)} />
            <View className="flex-1">
                {activeTab === 'datos' && (
                    <ClientWizardStep1
                        userData={userData} setUserData={setUserData}
                        clientData={clientData} setClientData={setClientData}
                        zones={zones} priceLists={priceLists}
                        isEditing={isEditing}
                        onNext={() => setActiveTab('ubicacion')}
                        showNav={false}
                    />
                )}
                {activeTab === 'ubicacion' && (
                    <ClientWizardStep2
                        clientData={clientData} setClientData={setClientData}
                        zones={zones}
                        onNext={() => setActiveTab('sucursales')}
                        onBack={() => setActiveTab('datos')}
                        showNav={false}
                    />
                )}
                {activeTab === 'sucursales' && (
                    <ClientWizardStep3
                        branches={branches} setBranches={setBranches}
                        loading={loading}
                        onSubmit={handleEditSubmit}
                        onBack={() => setActiveTab('ubicacion')}
                        zones={zones}
                        clientData={clientData}
                        showNav={false}
                    />
                )}
            </View>
            <View className="px-5 pb-6 pt-4">
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleEditSubmit}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">Guardar Cambios</Text>
                </TouchableOpacity>
            </View>
        </>
    )

    const renderCreateContent = () => (
        <View className="mt-2 flex-1">
            <WizardProgress currentStep={currentStep} />
            <View className="flex-1">
                {currentStep === 1 && (
                    <ClientWizardStep1
                        userData={userData} setUserData={setUserData}
                        clientData={clientData} setClientData={setClientData}
                        zones={zones} priceLists={priceLists}
                        isEditing={isEditing}
                        onNext={() => { if (validateStep1()) setCurrentStep(2) }}
                    />
                )}
                {currentStep === 2 && (
                    <ClientWizardStep2
                        clientData={clientData} setClientData={setClientData}
                        zones={zones}
                        onNext={() => { if (validateStep2()) setCurrentStep(3) }}
                        onBack={() => setCurrentStep(1)}
                    />
                )}
                {currentStep === 3 && (
                    <ClientWizardStep3
                        branches={branches} setBranches={setBranches}
                        loading={loading}
                        onSubmit={handleFinalSubmit}
                        onBack={() => setCurrentStep(2)}
                        zones={zones}
                        clientData={clientData}
                    />
                )}
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            {isEditing && (
                <View className="px-5 mt-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${!client?.bloqueado ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Ionicons name="power" size={20} color={!client?.bloqueado ? '#16A34A' : '#EF4444'} />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-neutral-900">Estado de Cuenta</Text>
                                <Text className="text-xs text-neutral-500">
                                    {client?.bloqueado ? 'Cuenta suspendida' : 'Acceso habilitado'}
                                </Text>
                            </View>
                        </View>
                        <ToggleSwitch
                            checked={!client?.bloqueado}
                            onToggle={() => handleToggleBlock()}
                            colorOn="#22c55e"
                            colorOff="#d1d5db"
                        />
                    </View>
                </View>
            )}

            {isEditing ? renderEditContent() : renderCreateContent()}

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
                confirmText={feedbackConfig.confirmText}
            />
        </View>
    )
}
