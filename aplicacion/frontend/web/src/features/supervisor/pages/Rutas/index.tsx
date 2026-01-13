import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Map, Plus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { ZonaSelector } from '../../components/ZonaSelector';
import { ZonaMapaGoogle } from '../../components/ZonaMapaGoogle';

export default function RutasPage() {
  // Estado para zona seleccionada y día seleccionado
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const diasSemana = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
  ];
  const [diaSeleccionado, setDiaSeleccionado] = useState(diasSemana[0]);

  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHero
        title="Rutas"
        subtitle="Planifica y visualiza las rutas de visita por zona y día de la semana"
        chips={[
          'Planificación de rutas',
          'Gestión de zonas',
          'Clientes y sucursales',
        ]}
      />
      <SectionHeader
        title="Gestión de Rutas"
        subtitle="Organiza y administra las rutas de tus equipos de ventas o supervisión"
      />
      {/* Barra de selección de zona y días */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-neutral-200 rounded-xl bg-gradient-to-r from-white via-neutral-50 to-white p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap w-full">
          <ZonaSelector value={zonaSeleccionada} onChange={setZonaSeleccionada} />
          <div className="flex gap-1 sm:gap-2 flex-wrap bg-neutral-100 rounded-lg px-2 py-1 border border-neutral-200">
            {diasSemana.map(dia => (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaSeleccionado(dia)}
                className={
                  `px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 outline-none focus:ring-2 ` +
                  (diaSeleccionado === dia
                    ? 'bg-brand-red text-white border-brand-red shadow-md scale-105'
                    : 'bg-white text-neutral-700 border-transparent hover:bg-neutral-200 hover:text-brand-red')
                }
                style={{ minWidth: 80 }}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-red-dark transition-all duration-150"
            onClick={() => navigate('/supervisor/rutas/crear')}
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-red-dark transition-all duration-150"
            // Aquí puedes poner la lógica para el mapa general
          >
            <Plus className="h-4 w-4" />
            Mapa General
          </button>
        </div>
      </div>
      {/* Mapa Google debajo de la barra */}
      <div className="w-full my-4">
        <ZonaMapaGoogle lat={-3.99313} lng={-79.20422} zoom={13} />
      </div>
      <EmptyContent
        icon={Map}
        title="Sin rutas planificadas"
        subtitle="Aquí podrás crear, visualizar y gestionar rutas por zona y día. Selecciona clientes y zonas para comenzar."
      />
    </div>
  )
}
