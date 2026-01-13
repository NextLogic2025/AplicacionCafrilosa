import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZonaSelector } from '../../components/ZonaSelector';
import { obtenerClientes } from '../../services/clientesApi';
// Importar API para sucursales
import { obtenerSucursales } from '../../services/sucursalesApi';

export default function SupervisorRouteCreatePage() {
  const [step] = useState(1); // Solo paso 1 activo
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [sucursalesPorCliente, setSucursalesPorCliente] = useState<Record<string, any[]>>({});
  const [clientesExpand, setClientesExpand] = useState<Record<string, boolean>>({});
  const [seleccionados, setSeleccionados] = useState<Record<string, string[]>>({}); // { clienteId: [sucursalId, ...] }
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cargar todos los clientes una sola vez y filtrar por zona en frontend
  useEffect(() => {
    setLoadingClientes(true);
    setErrorClientes(null);
    obtenerClientes()
      .then(setClientes)
      .catch(err => setErrorClientes(err.message))
      .finally(() => setLoadingClientes(false));
  }, []);

  // Log de todos los clientes y zona seleccionada para depuración visual
  // ...existing code...

  // Filtrar clientes que tengan sucursales o dirección principal en la zona seleccionada
  const clientesZona = useMemo(() => {
    if (!zonaSeleccionada) return [];
    return clientes.filter((c: any) => {
      // Considerar dirección principal
      const principalEnZona = String(c.zona_comercial_id) === String(zonaSeleccionada);
      const sucursales = sucursalesPorCliente[c.id] || [];
      const sucursalEnZona = sucursales.some((suc: any) => String(suc.zona_id) === String(zonaSeleccionada));
      return principalEnZona || sucursalEnZona;
    });
  }, [clientes, zonaSeleccionada, sucursalesPorCliente]);

  // Cargar sucursales de todos los clientes (para poder filtrar por sucursales en la zona)
  useEffect(() => {
    const cargarSucursales = async () => {
      const nuevos: Record<string, any[]> = {};
      await Promise.all(
        clientes.map(async (cliente: any) => {
          try {
            const sucursales = await obtenerSucursales(cliente.id);
            nuevos[cliente.id] = sucursales;
          } catch {
            nuevos[cliente.id] = [];
          }
        })
      );
      setSucursalesPorCliente(nuevos);
    };
    if (clientes.length > 0) cargarSucursales();
    else setSucursalesPorCliente({});
  }, [clientes]);

  // Filtrado de clientes por búsqueda y zona
  const clientesFiltrados = useMemo(() => {
    return clientesZona.filter((c: any) =>
      (c.nombre?.toLowerCase() || c.razon_social?.toLowerCase() || '').includes(busqueda.toLowerCase())
    );
  }, [busqueda, clientesZona]);

  // El usuario debe seleccionar manualmente, no hay selección automática

  // Contador de destinos seleccionados
  const totalDestinos = useMemo(() => {
    return Object.values(seleccionados).reduce((acc, arr) => acc + (arr.length || 1), 0);
  }, [seleccionados]);

  // Manejo de selección
  // Selección de cliente: solo marca/desmarca todas las sucursales visibles si el usuario lo hace explícitamente
  const toggleCliente = (clienteId: string, sucursalesEnZona: any[]) => {
    setSeleccionados(prev => {
      const actual = prev[clienteId] || [];
      const todasSeleccionadas = sucursalesEnZona.every(suc => actual.includes(suc.id));
      return {
        ...prev,
        [clienteId]: todasSeleccionadas ? [] : sucursalesEnZona.map(suc => suc.id),
      };
    });
  };
  // Selección de sucursal: solo afecta a la sucursal, no al cliente
  const toggleSucursal = (clienteId: string, sucursalId: string) => {
    setSeleccionados(prev => {
      const actual = prev[clienteId] || [];
      const existe = actual.includes(sucursalId);
      const nuevo = existe ? actual.filter(id => id !== sucursalId) : [...actual, sucursalId];
      return {
        ...prev,
        [clienteId]: nuevo,
      };
    });
  };

  // Continuar
  const handleContinuar = () => {
    if (!zonaSeleccionada || totalDestinos === 0) return;    
    // Construir destinations: cada sucursal seleccionada es un destino
    const destinations: { id: string; clienteId: string }[] = [];
    Object.entries(seleccionados).forEach(([clienteId, sucursalIds]) => {
      sucursalIds.forEach((sucursalId) => {
        destinations.push({ id: sucursalId, clienteId });
      });
    });
    // Solo enviar los IDs de sucursales o dirección principal seleccionados, nunca el ID del cliente
    navigate('/supervisor/rutas/crear/paso2', {
      state: {
        zone: zonaSeleccionada,
        destinations,
        existingRoutes: [], // Aquí deberías pasar las rutas existentes reales
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-brand-red' : 'text-neutral-400'}`}>
          <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-brand-red bg-white font-bold">1</span>
          <span>Paso 1</span>
        </div>
        <div className="w-8 h-0.5 bg-neutral-300" />
        <div className="flex items-center gap-2 text-neutral-400">
          <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-neutral-300 bg-white font-bold">2</span>
          <span>Paso 2</span>
        </div>
      </div>

      {/* Selector de zona */}
      <div>
        <ZonaSelector value={zonaSeleccionada} onChange={setZonaSeleccionada} />
      </div>

      {/* Lista de clientes */}
      <div className="border rounded-lg divide-y">
        {loadingClientes && (
          <div className="p-4 text-neutral-500 text-center">Cargando clientes...</div>
        )}
        {errorClientes && (
          <div className="p-4 text-red-500 text-center">{errorClientes}</div>
        )}
        {!loadingClientes && !errorClientes && clientesFiltrados.length === 0 && (
          <div className="p-4 text-neutral-500 text-center">No hay clientes para mostrar</div>
        )}
        {clientesFiltrados.map((cliente: any) => {
          const nombreCliente = cliente.nombre || cliente.razon_social || cliente.nombre_comercial || cliente.identificacion;
          let sucursales = sucursalesPorCliente[cliente.id] || [];
          // Insertar la dirección principal como "sucursal principal" al inicio
          const principalId = `principal-${cliente.id}`;
          const principalSucursal = cliente.direccion_texto
            ? [{
                id: principalId,
                nombre_sucursal: 'Dirección principal',
                direccion_entrega: cliente.direccion_texto,
                zona_id: cliente.zona_comercial_id,
                principal: true
              }]
            : [];
          sucursales = [...principalSucursal, ...sucursales];

          // Sucursales en la zona seleccionada
          const sucursalesEnZona = sucursales.filter((suc: any) => String(suc.zona_id) === String(zonaSeleccionada));
          const sucursalesFueraZona = sucursales.filter((suc: any) => String(suc.zona_id) !== String(zonaSeleccionada));
          const tieneEnZona = sucursalesEnZona.length > 0;
          const tieneFueraZona = sucursalesFueraZona.length > 0;
          // Si solo tiene fuera de la zona, el cliente queda completamente bloqueado (no seleccionable ni expandible)
          const clienteSoloFueraZona = !tieneEnZona && tieneFueraZona;

          return (
            <div key={cliente.id} className="p-3 flex flex-col gap-2 bg-white">
              <div className="flex items-center gap-2">
                <button
                  className={`flex items-center justify-center w-5 h-5 border rounded-full mr-2 ${clienteSoloFueraZona ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!clienteSoloFueraZona) {
                      // Solo marca/desmarca todas las sucursales visibles
                      const sucursales = sucursalesPorCliente[cliente.id] || [];
                      // Insertar la dirección principal como "sucursal principal" al inicio
                      const principalId = `principal-${cliente.id}`;
                      const principalSucursal = cliente.direccion_texto
                        ? [{
                            id: principalId,
                            nombre_sucursal: 'Dirección principal',
                            direccion_entrega: cliente.direccion_texto,
                            zona_id: cliente.zona_comercial_id,
                            principal: true
                          }]
                        : [];
                      const todas = [...principalSucursal, ...sucursales].filter((suc: any) => String(suc.zona_id) === String(zonaSeleccionada));
                      toggleCliente(cliente.id, todas);
                    }
                  }}
                  aria-label="Seleccionar cliente"
                  disabled={clienteSoloFueraZona}
                >
                  {(() => {
                    const sucursales = sucursalesPorCliente[cliente.id] || [];
                    const principalId = `principal-${cliente.id}`;
                    const principalSucursal = cliente.direccion_texto
                      ? [{
                          id: principalId,
                          nombre_sucursal: 'Dirección principal',
                          direccion_entrega: cliente.direccion_texto,
                          zona_id: cliente.zona_comercial_id,
                          principal: true
                        }]
                      : [];
                    const todas = [...principalSucursal, ...sucursales].filter((suc: any) => String(suc.zona_id) === String(zonaSeleccionada));
                    const actual = seleccionados[cliente.id] || [];
                    const todasSeleccionadas = todas.length > 0 && todas.every(suc => actual.includes(suc.id));
                    return todasSeleccionadas ? (
                      <CheckCircle className="text-brand-red w-5 h-5" />
                    ) : (
                      <Circle className="text-neutral-300 w-5 h-5" />
                    );
                  })()}
                </button>
                <span className={`font-medium flex-1 ${clienteSoloFueraZona ? 'opacity-50' : ''}`}>{nombreCliente}</span>
                {sucursalesEnZona.length > 0 && !clienteSoloFueraZona && (
                  <button
                    className="ml-2 text-neutral-400 hover:text-brand-red"
                    onClick={() => setClientesExpand(prev => ({ ...prev, [cliente.id]: !prev[cliente.id] }))}
                    aria-label="Expandir sucursales"
                  >
                    {clientesExpand[cliente.id] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                )}
              </div>
              {/* Sucursales solo de la zona seleccionada */}
              {sucursalesEnZona.length > 0 && clientesExpand[cliente.id] && !clienteSoloFueraZona && (
                <div className="pl-8 flex flex-col gap-1">
                  {sucursalesEnZona.map((suc: any) => (
                    <label key={suc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seleccionados[cliente.id]?.includes(suc.id) || false}
                        onChange={() => toggleSucursal(cliente.id, suc.id)}
                      />
                      <span>
                        {suc.nombre_sucursal || suc.nombre}
                        {suc.principal && suc.direccion_entrega ? (
                          <span className="ml-2 text-xs text-blue-500">({suc.direccion_entrega})</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contador y botón continuar */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-neutral-700">{totalDestinos} destino(s) seleccionado(s)</span>
        <button
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-150 ${zonaSeleccionada && totalDestinos > 0 ? 'bg-brand-red hover:bg-brand-red-dark' : 'bg-neutral-300 cursor-not-allowed'}`}
          disabled={!zonaSeleccionada || totalDestinos === 0}
          onClick={handleContinuar}
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
