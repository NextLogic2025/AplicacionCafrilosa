import React, { useState, useEffect } from 'react'
import { View, Alert, TouchableOpacity, Text } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { ClientService, Client } from '../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { ZoneService, Zone } from '../../../services/api/ZoneService'
import { AssignmentService } from '../../../services/api/AssignmentService'
import { SucursalService, Sucursal } from '../../../services/api/SucursalService'

import { WizardProgress } from '../components/WizardProgress'
import { ClientWizardStep1 } from '../components/ClientWizardStep1'
import { ClientWizardStep2 } from '../components/ClientWizardStep2'
import { ClientWizardStep3 } from '../components/ClientWizardStep3'

export function SupervisorClientFormScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const isEditing = !!route.params?.client
    const client: Client | undefined = route.params?.client

    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Dependencies
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [zones, setZones] = useState<Zone[]>([])
    const [vendors, setVendors] = useState<UserProfile[]>([])

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType, title: string, message: string, onConfirm?: () => void
    }>({ type: 'info', title: '', message: '' })

    // --- FORM DATA ---
    const [userData, setUserData] = useState({
        nombre: '', email: '', password: '', rolId: 4
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
            lista_precios_id: client.lista_precios_id,
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
        if (!isEditing && (!userData.email.trim() || !userData.password.trim())) {
            showFeedback('warning', 'Faltan Datos', 'Debes crear un usuario (Email y Contraseña).')
            return false
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
                    rolId: 4
                })
                if (!userResponse.success || !userResponse.userId) throw new Error(userResponse.message || 'Error al crear usuario')
                userId = userResponse.userId
            }

            // B. Create/Update Client
            const payload: any = {
                ...clientData,
                usuario_principal_id: userId,
                limite_credito: parseFloat(clientData.limite_credito) || 0,
                dias_plazo: parseInt(clientData.dias_plazo) || 0,
                lista_precios_id: Number(clientData.lista_precios_id),
                zona_comercial_id: Number(clientData.zona_comercial_id)
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
                        // Update existing (simplified for now, usually we check if dirty)
                        // For now, we only focus on creating new ones from wizard or skip
                        // If we implement full sync, we'd use SucursalService.updateSucursal
                    } else {
                        // Create new
                        await SucursalService.createSucursal(clientId, {
                            nombre_sucursal: branch.nombre_sucursal,
                            direccion_entrega: branch.direccion_entrega,
                            contacto_nombre: branch.contacto_nombre,
                            contacto_telefono: branch.contacto_telefono,
                            ubicacion_gps: branch.ubicacion_gps
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

        Alert.alert(
            `¿${actionVerb} Cliente?`,
            `¿Estás seguro de que deseas ${actionVerb.toLowerCase()} este cliente?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: isCurrentlyBlocked ? 'default' : 'destructive',
                    onPress: async () => {
                        setLoading(true)
                        try {
                            if (isCurrentlyBlocked) {
                                await ClientService.unblockClient(client.id)
                                showFeedback('success', 'Cliente Activado', 'El cliente ha sido activado correctamente.', () => navigation.goBack())
                            } else {
                                await ClientService.deleteClient(client.id)
                                showFeedback('success', 'Cliente Suspendido', 'El cliente ha sido suspendido correctamente.', () => navigation.goBack())
                            }
                        } catch (error) {
                            console.error(error)
                            showFeedback('error', 'Error', 'No se pudo actualizar el estado del cliente.')
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            {/* Suspend/Activate Button for Edit Mode */}
            {isEditing && (
                <View className="px-5 py-2 flex-row justify-end">
                    <TouchableOpacity
                        onPress={handleToggleBlock}
                        className={`flex-row items-center px-3 py-1.5 rounded-lg border ${client?.bloqueado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                    >
                        <Ionicons
                            name={client?.bloqueado ? "checkmark-circle-outline" : "trash-outline"}
                            size={16}
                            color={client?.bloqueado ? "#16A34A" : "#EF4444"}
                        />
                        <Text className={`ml-1.5 text-xs font-bold ${client?.bloqueado ? 'text-green-700' : 'text-red-700'}`}>
                            {client?.bloqueado ? 'ACTIVAR CLIENTE' : 'SUSPENDER CLIENTE'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View className="mt-2 flex-1">
                <WizardProgress currentStep={currentStep} />

                {/* Wrapper to fix addViewAt crash */}
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

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
            />
        </View>
    )
}
