import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OptimizableLocation, OptimizationConfig } from '../utils/routeOptimizer'; // Importamos tipos actualizados

// Usamos colores hardcoded del JSON para asegurar consistencia
const BRAND = {
    primary: '#F0412D',
    primaryDark: '#C52C1B',
    cream: '#FFF5D9',
    gray: '#F3F4F6'
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (
        selectedItems: OptimizableLocation[],
        config: OptimizationConfig,
        constraints: Map<string, string>
    ) => void;
    availableItems: OptimizableLocation[]; // Lista completa de la zona
}

export function ClientMultiSelector({ visible, onClose, onConfirm, availableItems }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Configuración Global
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState<OptimizationConfig>({
        workStart: '08:00',
        workEnd: '17:00',
        lunchStart: '13:00',
        lunchDuration: 60,
        visitDuration: 20
    });

    // Restricciones: Hora Fija
    // Map<ItemID, HH:MM>
    const [constraints, setConstraints] = useState<Map<string, string>>(new Map());

    // Estado para el DateTimePicker
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<{ type: 'config' | 'item', key: string } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    // Filtrado
    const filteredItems = useMemo(() => {
        if (!searchQuery) return availableItems;
        const lowerQuery = searchQuery.toLowerCase();
        return availableItems.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.id.includes(lowerQuery)
        );
    }, [availableItems, searchQuery]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
            // Si deseleccionamos, también quitamos la restricción de hora si existe
            if (constraints.has(id)) {
                const newConstraints = new Map(constraints);
                newConstraints.delete(id);
                setConstraints(newConstraints);
            }
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
            setSelectedIds(new Set()); // Deseleccionar
        } else {
            const newSet = new Set(selectedIds);
            filteredItems.forEach(item => newSet.add(item.id));
            setSelectedIds(newSet);
        }
    };



    // Manejo de Fechas/Horas
    const openTimePicker = (type: 'config' | 'item', key: string, currentTimeStr?: string) => {
        setPickerTarget({ type, key });
        const d = new Date();
        const [hh, mm] = (currentTimeStr || '08:00').split(':').map(Number);
        d.setHours(hh, mm, 0, 0);
        setTempDate(d);
        setDatePickerVisible(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setDatePickerVisible(false);
        if (event.type === 'dismissed' || !selectedDate || !pickerTarget) return;

        const hh = selectedDate.getHours().toString().padStart(2, '0');
        const mm = selectedDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        if (pickerTarget.type === 'config') {
            setConfig(prev => ({ ...prev, [pickerTarget.key]: timeStr }));
        } else {
            // Es un item constraint
            const newConstraints = new Map(constraints);
            newConstraints.set(pickerTarget.key, timeStr);
            setConstraints(newConstraints);

            // Si se pone hora, forzar selección del item
            if (!selectedIds.has(pickerTarget.key)) {
                const newSet = new Set(selectedIds);
                newSet.add(pickerTarget.key);
                setSelectedIds(newSet);
            }
        }
    };

    // SafeInput Component to prevent aggressive validation while typing
    const SafeNumberInput = ({ value, onChange, className }: { value: number, onChange: (val: number) => void, className?: string }) => {
        const [localText, setLocalText] = useState(value.toString());

        // Sync local text if external value changes (and we're not editing? actually simpler just to sync on blur if needed, 
        // but here we just want initial load. We can use a key or useEffect if needed, but let's keep it simple)
        // Better: useEffect to sync if value changes from outside (e.g. reset)
        React.useEffect(() => {
            setLocalText(value.toString());
        }, [value]);

        return (
            <TextInput
                className={className}
                keyboardType="numeric"
                value={localText}
                onChangeText={setLocalText}
                onBlur={() => {
                    const num = parseInt(localText) || 0;
                    const final = num > 0 ? num : value; // revert if invalid/0
                    setLocalText(final.toString());
                    onChange(final);
                }}
            />
        );
    };

    const [priorityOverrides, setPriorityOverrides] = useState<Map<string, 'ALTA' | 'MEDIA' | 'BAJA'>>(new Map());

    const togglePriority = (id: string, currentPriority?: string) => {
        const nextPriority: Record<string, 'ALTA' | 'MEDIA' | 'BAJA'> = {
            'ALTA': 'MEDIA',
            'MEDIA': 'BAJA',
            'BAJA': 'ALTA'
        };
        // Default to 'MEDIA' if undefined, or cycle if defined
        const current = (priorityOverrides.get(id) || currentPriority || 'MEDIA') as 'ALTA' | 'MEDIA' | 'BAJA';

        const next = nextPriority[current] || 'MEDIA'; // Fallback to MEDIA if unknown

        const newMap = new Map(priorityOverrides);
        newMap.set(id, next);
        setPriorityOverrides(newMap);
    };

    const getPriorityColor = (p?: string) => {
        if (p === 'ALTA') return '#EF4444'; // red-500
        if (p === 'BAJA') return '#10B981'; // green-500
        return '#F59E0B'; // amber-500 (MEDIA)
    };

    // Renderizado
    const renderConfigPanel = () => {
        if (!showConfig) return (
            <TouchableOpacity onPress={() => setShowConfig(true)} className="flex-row justify-center items-center py-2 bg-gray-50 border-b border-gray-200">
                <Ionicons name="options" size={16} color="#4B5563" />
                <Text className="text-gray-600 font-bold ml-2 text-xs">Configurar Horarios ({config.workStart} - {config.workEnd})</Text>
            </TouchableOpacity>
        );

        return (
            <View className="bg-gray-50 p-4 border-b border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-900 font-bold">Configuración de Jornada</Text>
                    <TouchableOpacity onPress={() => setShowConfig(false)}>
                        <Ionicons name="chevron-up" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Jornada */}
                <View className="flex-row mb-3 space-x-2">
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Inicio</Text>
                        <TouchableOpacity onPress={() => openTimePicker('config', 'workStart', config.workStart)} className="bg-white border border-gray-300 rounded p-2 items-center">
                            <Text className="font-bold text-gray-800">{config.workStart}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Fin</Text>
                        <TouchableOpacity onPress={() => openTimePicker('config', 'workEnd', config.workEnd)} className="bg-white border border-gray-300 rounded p-2 items-center">
                            <Text className="font-bold text-gray-800">{config.workEnd}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Visita (min)</Text>
                        <SafeNumberInput
                            className="bg-white border border-gray-300 rounded p-2 text-center text-gray-800 font-bold"
                            value={config.visitDuration}
                            onChange={val => setConfig(prev => ({ ...prev, visitDuration: val }))}
                        />
                    </View>
                </View>

                {/* Almuerzo */}
                <View className="flex-row space-x-2">
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Inicio Almuerzo</Text>
                        <TouchableOpacity onPress={() => openTimePicker('config', 'lunchStart', config.lunchStart)} className="bg-white border border-gray-300 rounded p-2 items-center">
                            <Text className="font-bold text-gray-800">{config.lunchStart}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Duración (min)</Text>
                        <SafeNumberInput
                            className="bg-white border border-gray-300 rounded p-2 text-center text-gray-800 font-bold"
                            value={config.lunchDuration}
                            onChange={val => setConfig(prev => ({ ...prev, lunchDuration: val }))}
                        />
                    </View>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }: { item: OptimizableLocation }) => {
        const isSelected = selectedIds.has(item.id);
        const fixedTime = constraints.get(item.id);
        const finalPriority = priorityOverrides.get(item.id) || item.priority || 'MEDIA';

        return (
            <View className={`flex-row items-center border-b border-gray-100 ${isSelected ? 'bg-red-50/50' : 'bg-white'}`}>
                {/* Selection Box */}
                <TouchableOpacity
                    onPress={() => toggleSelection(item.id)}
                    className="flex-1 flex-row items-center p-4 pr-2"
                >
                    <View className={`w-6 h-6 rounded border items-center justify-center mr-3 ${isSelected ? 'bg-[#F0412D] border-[#F0412D]' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>

                    <View className="mr-3">
                        <View className={`p-2 rounded-full ${item.type === 'MATRIZ' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <Ionicons
                                name={item.type === 'MATRIZ' ? 'business' : 'storefront'}
                                size={18}
                                color={item.type === 'MATRIZ' ? '#2563EB' : '#EA580C'}
                            />
                        </View>
                    </View>

                    <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center mt-1">
                            {/* Tags: Type + Priority Badge */}
                            <View className="bg-gray-100 px-2 py-0.5 rounded mr-2">
                                <Text className="text-[10px] text-gray-500">{item.type}</Text>
                            </View>
                            <View className={`px-2 py-0.5 rounded  border ${finalPriority === 'ALTA' ? 'bg-red-50 border-red-200' :
                                finalPriority === 'BAJA' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                <Text className={`text-[10px] font-bold ${finalPriority === 'ALTA' ? 'text-red-700' :
                                    finalPriority === 'BAJA' ? 'text-green-700' : 'text-amber-700'
                                    }`}>
                                    {finalPriority}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Actions: Priority + Time */}
                <View className="flex-row items-center pr-3 border-l border-gray-100 pl-2 space-x-2">

                    {/* Priority Toggle */}
                    <TouchableOpacity
                        onPress={() => togglePriority(item.id, item.priority)}
                        className="p-2 rounded-full bg-gray-50"
                    >
                        <Ionicons name="flag" size={20} color={getPriorityColor(finalPriority)} />
                    </TouchableOpacity>

                    {/* Time Picker */}
                    <View className="items-center justify-center">
                        <TouchableOpacity
                            onPress={() => openTimePicker('item', item.id, fixedTime)}
                            className={`p-2 rounded-lg ${fixedTime ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100'}`}
                        >
                            <Ionicons name={fixedTime ? "time" : "time-outline"} size={20} color={fixedTime ? "#1D4ED8" : "#9CA3AF"} />
                        </TouchableOpacity>
                        {fixedTime && (
                            <View className="absolute -top-2 -right-1 bg-blue-600 rounded-full px-1.5 py-0.5 border border-white">
                                <Text className="text-[8px] font-bold text-white">{fixedTime}</Text>
                            </View>
                        )}
                    </View>

                    {fixedTime && (
                        <TouchableOpacity onPress={() => {
                            const newC = new Map(constraints);
                            newC.delete(item.id);
                            setConstraints(newC);
                        }}>
                            <Ionicons name="close-circle" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const handleConfirm = () => {
        // Return selected items but with UPDATED priority
        const selectedObjects = availableItems
            .filter(item => selectedIds.has(item.id))
            .map(item => ({
                ...item,
                priority: priorityOverrides.get(item.id) || item.priority
            }));

        onConfirm(selectedObjects, config, constraints);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-white">
                {/* Header */}
                <View className="px-4 py-3 border-b border-gray-200 flex-row justify-between items-center bg-white">
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900">Importación Inteligente</Text>
                    <View className="w-8" />
                </View>

                {/* Config Panel */}
                {renderConfigPanel()}

                {/* Search & Actions */}
                <View className="p-4 bg-white shadow-sm z-10">
                    <View className="flex-row bg-gray-100 rounded-xl px-3 py-2 items-center mb-3">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            placeholder="Buscar cliente o sucursal..."
                            className="flex-1 ml-2 text-base text-gray-800"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500 font-medium">
                            {filteredItems.length} encontrados
                        </Text>
                        <TouchableOpacity onPress={handleSelectAll}>
                            <Text className="text-[#F0412D] font-bold">
                                {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List */}
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    className="flex-1 bg-gray-50"
                    initialNumToRender={15}
                />

                {/* Footer */}
                <View className="p-4 border-t border-gray-200 bg-white">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-600">
                            Seleccionados: <Text className="font-bold text-gray-900">{selectedIds.size}</Text>
                        </Text>
                        {constraints.size > 0 && (
                            <Text className="text-blue-600 text-xs">
                                ({constraints.size} horarios fijos)
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        className={`rounded-xl py-4 items-center ${selectedIds.size > 0 ? 'bg-[#F0412D]' : 'bg-gray-300'}`}
                        disabled={selectedIds.size === 0}
                    >
                        <Text className="text-white font-bold text-lg">
                            Optimizar e Importar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* DateTime Picker Modal/Popup */}
                {datePickerVisible && (
                    <DateTimePicker
                        value={tempDate}
                        mode="time"
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}
