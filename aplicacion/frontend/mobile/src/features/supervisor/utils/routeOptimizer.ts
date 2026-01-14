// src/features/supervisor/utils/routeOptimizer.ts

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface OptimizableLocation {
    id: string;
    name: string;
    type: 'MATRIZ' | 'SUCURSAL';
    location: GeoPoint;
    priority?: 'ALTA' | 'MEDIA' | 'BAJA';
    address?: string;
    zoneName?: string;
    originalObj?: any;

    // Output fields
    suggested_time?: string;
    distance_from_prev?: string;
    is_fixed?: boolean;
    is_unscheduled?: boolean;
}

export interface OptimizationConfig {
    workStart: string;    // '08:00'
    workEnd: string;      // '17:00'
    lunchStart: string;   // '13:00'
    lunchDuration: number; // 60 minutes
    visitDuration: number; // 30 minutes
}

/**
 * Calcula la distancia en Kilómetros entre dos coordenadas (Fórmula Haversine)
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radio de la tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

/**
 * Parsea una hora 'HH:MM' a minutos desde medianoche
 */
function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a 'HH:MM'
 */
function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Función Principal: Ordena y Asigna Horarios con Restricciones (Constraint-Based)
 */
export function optimizeRouteOrder(
    items: OptimizableLocation[],
    config: OptimizationConfig,
    constraints: Map<string, string>, // ID -> 'HH:MM'
    startLocation: GeoPoint = { latitude: -3.99313, longitude: -79.20422 } // Loja Centro
): OptimizableLocation[] {

    // 1. Setup Timeline
    const workStartMins = timeToMinutes(config.workStart);
    const workEndMins = timeToMinutes(config.workEnd);
    const lunchStartMins = timeToMinutes(config.lunchStart);
    const lunchEndMins = lunchStartMins + config.lunchDuration;

    // Estructura de evento en timeline
    type TimelineEvent = {
        type: 'VISIT' | 'LUNCH' | 'START' | 'END';
        start: number;
        end: number;
        item?: OptimizableLocation;
        location?: GeoPoint;
        fixed?: boolean;
    };

    const timeline: TimelineEvent[] = [];

    // Agregar inicio y fin de jornada como "anclas" virtuales si se desea, 
    // pero mejor manejamos gaps entre eventos.
    // Simplemente usamos workStartMins como el "tiempo actual" inicial.

    // 2. Insertar Bloqueos Duros (Hard Constraints)

    // A. Almuerzo
    timeline.push({
        type: 'LUNCH',
        start: lunchStartMins,
        end: lunchEndMins,
        fixed: true
    });

    // B. Clientes Fijos
    const flexibleItems: OptimizableLocation[] = [];

    items.forEach(item => {
        const fixedTime = constraints.get(item.id);
        if (fixedTime) {
            const startMins = timeToMinutes(fixedTime);
            const endMins = startMins + config.visitDuration;

            // Validar si cae dentro de jornada y no choca con almuerzo (básico)
            if (startMins >= workStartMins && endMins <= workEndMins) {
                // Check overlapping con almuerzo
                if (!(endMins <= lunchStartMins || startMins >= lunchEndMins)) {
                    console.warn(`Cliente ${item.name} choca con almuerzo. Se insertará igual pero marcará conflicto.`);
                }

                timeline.push({
                    type: 'VISIT',
                    start: startMins,
                    end: endMins,
                    item: { ...item, is_fixed: true, suggested_time: fixedTime, distance_from_prev: '0' }, // Distancia se calcula luego real
                    location: item.location,
                    fixed: true
                });
            } else {
                // Fuera de horario, lo tratamos como flexible o unscheduled?
                // Decisión: Mover a flexible si no cabe en horario fijo es arriesgado. 
                // Mejor marcar como unscheduled o flexible. Vamos a flexible for now.
                console.warn(`Cliente ${item.name} hora fija fuera de jornada.`);
                flexibleItems.push(item);
            }
        } else {
            flexibleItems.push(item);
        }
    });

    // Ordenar timeline por hora inicio
    timeline.sort((a, b) => a.start - b.start);

    // 3. Identificar Huecos (Gaps) y Rellenar (Fill)

    // Lista final ordenada
    const finalRoute: OptimizableLocation[] = [];

    // Puntero de tiempo actual
    let currentTime = workStartMins;
    let currentLocation = startLocation;

    // Recorrer timeline para llenar huecos ANTES de cada evento fijo
    for (const event of timeline) {
        // ¿Hay hueco entre currentTime y event.start?
        let timeRemaining = event.start - currentTime;

        while (timeRemaining > 0 && flexibleItems.length > 0) {
            // Buscar el mejor candidato que quepa en timeRemaining
            // Candidates: aquellos cuyo (travel + visit) <= timeRemaining
            // De los candidatos, elegir el más cercano (Nearest Neighbor) con Priority logic

            let bestCandidateIndex = -1;
            let minScore = Infinity; // Score combina distancia y prioridad (menor es mejor)

            for (let i = 0; i < flexibleItems.length; i++) {
                const candidate = flexibleItems[i];

                const dist = getDistanceFromLatLonInKm(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    candidate.location.latitude,
                    candidate.location.longitude
                );

                const travelTimeMins = Math.ceil(dist * 3) + 5; // 3 min/km + 5 min fijos
                const totalRequired = travelTimeMins + config.visitDuration;

                if (totalRequired <= timeRemaining) {
                    // Es candidato viable temporalmente

                    // Calcular Score
                    // Prioridad: ALTA=0, MEDIA=1000, BAJA=2000 (km equivalentes penalty)
                    // Así priorizamos ALTA sobre distancia corta, pero permitimos excepciones extremas
                    let priorityPenalty = 0;
                    if (candidate.priority === 'MEDIA') priorityPenalty = 5; // leve penalización
                    if (candidate.priority === 'BAJA') priorityPenalty = 10;
                    // Ajuste: si la prioridad es estricta, aumentar penalties.

                    // Simplificado: Prioridad como filtro primero? 
                    // El prompt pide "Nearest Neighbor + Prioridad".
                    // Usemos la distancia fisica pura, pero filtremos por grupos de prioridad si queremos ser estrictos.
                    // O mejor: Score = dist + priorityPenalty.

                    const score = dist + priorityPenalty;

                    if (score < minScore) {
                        minScore = score;
                        bestCandidateIndex = i;
                    }
                }
            }

            if (bestCandidateIndex !== -1) {
                // Agendar candidato
                const candidate = flexibleItems[bestCandidateIndex];

                let dist = 0;
                let travelTimeMins = 0;

                // FIX: Si es el PRIMER item de toda la ruta (finalRoute vacío) y estamos en el tiempo de inicio (workStart),
                // asumimos que el usuario YA está ahí o empieza ahí su ruta.
                const isFirstVisit = finalRoute.length === 0;

                if (isFirstVisit) {
                    // Primer cliente: No sumamos tiempo de viaje. 
                    // Asumimos que arrancamos la jornada en este cliente a la hora marcada.
                    dist = 0;
                    travelTimeMins = 0;
                } else {
                    // Clientes subsecuentes: Calcular viaje normal
                    dist = getDistanceFromLatLonInKm(
                        currentLocation.latitude, currentLocation.longitude,
                        candidate.location.latitude, candidate.location.longitude
                    );
                    travelTimeMins = Math.ceil(dist * 3) + 5;
                }

                // Actualizar tiempos
                const arrivalTime = currentTime + travelTimeMins;
                const departureTime = arrivalTime + config.visitDuration;

                finalRoute.push({
                    ...candidate,
                    // Si es el primero, arrivalTime será igual a currentTime (workStart)
                    suggested_time: minutesToTime(arrivalTime),
                    distance_from_prev: dist.toFixed(2),
                    is_fixed: false
                });

                // Avanzar punteros
                currentTime = departureTime;
                currentLocation = candidate.location;
                timeRemaining = event.start - currentTime;

                // Remover de flexibles
                flexibleItems.splice(bestCandidateIndex, 1);
            } else {
                // No cabe nadie más en este hueco
                break;
            }
        }

        // Al terminar el hueco, "procesamos" el evento fijo (si es visita)
        if (event.type === 'VISIT' && event.item) {
            // Calcular distancia desde el punto anterior (donde hayamos quedado tras llenar el hueco)
            const dist = getDistanceFromLatLonInKm(
                currentLocation.latitude, currentLocation.longitude,
                event.item.location.latitude, event.item.location.longitude
            );

            finalRoute.push({
                ...event.item,
                distance_from_prev: dist.toFixed(2)
            });

            currentLocation = event.item.location;
        }

        // El nuevo currentTime pasa a ser el final de este evento fijo
        currentTime = Math.max(currentTime, event.end);
        // Nota: Si llegamos muy temprano al evento fijo, currentTime salta al final del evento fijo.
        // El "tiempo muerto" de espera es implícito.
    }

    // 4. Llenar hueco final (después del último evento fijo hasta workEnd)
    let timeRemaining = workEndMins - currentTime;

    while (timeRemaining > 0 && flexibleItems.length > 0) {
        let bestCandidateIndex = -1;
        let minDistance = Infinity;

        // En el último tramo, simplemente nearest neighbor puro (o con prioridad)
        for (let i = 0; i < flexibleItems.length; i++) {
            const candidate = flexibleItems[i];
            const dist = getDistanceFromLatLonInKm(
                currentLocation.latitude, currentLocation.longitude,
                candidate.location.latitude, candidate.location.longitude
            );

            const travelTimeMins = Math.ceil(dist * 3) + 5;
            const totalRequired = travelTimeMins + config.visitDuration;

            if (totalRequired <= timeRemaining) {
                // Prioridad simple: Preferir ALTA si distancias son similares?
                // Usemos logica de grupos como antes o penalties
                let priorityPenalty = 0;
                if (candidate.priority === 'MEDIA') priorityPenalty = 5;
                if (candidate.priority === 'BAJA') priorityPenalty = 10;

                const score = dist + priorityPenalty;

                if (score < minDistance) {
                    minDistance = score;
                    bestCandidateIndex = i;
                }
            }
        }

        if (bestCandidateIndex !== -1) {
            const candidate = flexibleItems[bestCandidateIndex];
            const dist = getDistanceFromLatLonInKm(
                currentLocation.latitude, currentLocation.longitude,
                candidate.location.latitude, candidate.location.longitude
            );
            const travelTimeMins = Math.ceil(dist * 3) + 5;

            const arrivalTime = currentTime + travelTimeMins;
            const departureTime = arrivalTime + config.visitDuration;

            finalRoute.push({
                ...candidate,
                suggested_time: minutesToTime(arrivalTime),
                distance_from_prev: dist.toFixed(2),
                is_fixed: false
            });

            currentTime = departureTime;
            currentLocation = candidate.location;
            timeRemaining = workEndMins - currentTime;
            flexibleItems.splice(bestCandidateIndex, 1);
        } else {
            break;
        }
    }

    // 5. Manejo de Sobrantes (Unscheduled)
    // Se agregan al final marcados como 'is_unscheduled'
    if (flexibleItems.length > 0) {
        flexibleItems.forEach(item => {
            const dist = getDistanceFromLatLonInKm(
                currentLocation.latitude, currentLocation.longitude,
                item.location.latitude, item.location.longitude
            );
            finalRoute.push({
                ...item,
                suggested_time: 'NO AGENDADO',
                distance_from_prev: dist.toFixed(2),
                is_unscheduled: true
            });
        });
    }

    // 6. Ordenamiento Final (Sort by Time)
    // Se asegura que la lista retornada esté ordenada cronológicamente
    finalRoute.sort((a, b) => {
        if (a.is_unscheduled && !b.is_unscheduled) return 1;
        if (!a.is_unscheduled && b.is_unscheduled) return -1;
        if (a.is_unscheduled && b.is_unscheduled) return 0;

        const timeA = timeToMinutes(a.suggested_time || '23:59');
        const timeB = timeToMinutes(b.suggested_time || '23:59');
        return timeA - timeB;
    });

    return finalRoute;
}
