import { UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { useState, useEffect } from 'react'
import { obtenerEquipo, updateUsuario, type Usuario } from '../../services/usuariosApi'
import { EquipoList } from './EquipoList'
import { CrearUsuarioModal } from './CrearUsuarioModal'

export default function EquipoPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
    setEditingUsuario(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUsuario(null)
  }

  const handleSuccessCreate = () => {
    cargarEquipo()
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setIsModalOpen(true)
  }

  const handleDeactivate = async (usuario: Usuario) => {
    if (!confirm(`¿Deseas desactivar a ${usuario.nombre}?`)) return
    try {
      await updateUsuario(usuario.id, { activo: false })
      setGlobalMessage({ type: 'success', message: 'Usuario desactivado exitosamente' })
      cargarEquipo()
    } catch (error: any) {
      setGlobalMessage({ type: 'error', message: error.message || 'Error al desactivar usuario' })
    }
  }

  const handleActivate = async (usuario: Usuario) => {
    if (!confirm(`¿Deseas activar a ${usuario.nombre}?`)) return
    try {
      await updateUsuario(usuario.id, { activo: true })
      setGlobalMessage({ type: 'success', message: 'Usuario activado exitosamente' })
      cargarEquipo()
    } catch (error: any) {
      setGlobalMessage({ type: 'error', message: error.message || 'Error al activar usuario' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Equipo"
        subtitle="Administra todos los miembros del equipo: supervisores, vendedores, bodegueros y transportistas"
        chips={['Todos los roles', 'Gestión centralizada', 'Creación de usuarios']}
      />

      {globalMessage && (
        <Alert
          type={globalMessage.type}
          message={globalMessage.message}
          onClose={() => setGlobalMessage(null)}
        />
      )}

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

      <EquipoList 
        usuarios={usuarios} 
        isLoading={isLoading}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
      />

      <CrearUsuarioModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessCreate}
        initialData={editingUsuario}
        mode={editingUsuario ? 'edit' : 'create'}
      />
    </div>
  )
}
