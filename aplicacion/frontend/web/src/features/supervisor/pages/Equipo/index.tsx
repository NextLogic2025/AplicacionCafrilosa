import { UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { useState, useEffect } from 'react'
import { obtenerEquipo, type Usuario } from '../../services/usuariosApi'
import { EquipoList } from './EquipoList'
import { CrearUsuarioModal } from './CrearUsuarioModal'

export default function EquipoPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    cargarEquipo()
  }, [])

  const cargarEquipo = async () => {
    try {
      setIsLoading(true)
      const data = await obtenerEquipo()
      setUsuarios(data)
    } catch (error) {
      console.error('Error al cargar equipo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSuccessCreate = () => {
    cargarEquipo()
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Equipo"
        subtitle="Administra todos los miembros del equipo: supervisores, vendedores, bodegueros y transportistas"
        chips={['Todos los roles', 'Gestión centralizada', 'Creación de usuarios']}
      />

      <SectionHeader
        title="Equipo"
        subtitle="Supervisores, vendedores, bodegueros y transportistas"
      />

      <div className="flex justify-end">
        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      <EquipoList usuarios={usuarios} isLoading={isLoading} />

      <CrearUsuarioModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessCreate}
      />
    </div>
  )
}
