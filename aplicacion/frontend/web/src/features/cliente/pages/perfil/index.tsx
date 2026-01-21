
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { PageHero } from 'components/ui/PageHero'
import Steps from 'components/ui/Steps'

import { usePerfilPage } from './hooks/usePerfilPage'
import { ProfileHeader } from './components/ProfileHeader'
import { UserTab } from './components/UserTab'
import { ClientTab } from './components/ClientTab'
import { ProfileStats } from './components/ProfileStats'

export default function PerfilCliente() {
  const {
    profile, loading, error, client, clientLoading, clientError, vendedorMap,
    activeStep, setActiveStep,
    editing, setEditing, form, setForm,
    clientEditing, setClientEditing, clientForm, setClientForm,
    success, setSuccess,
    name, email, phone, role, created,
    handleSaveUser, handleSaveClient, formatGps
  } = usePerfilPage()

  if (loading && !profile) return <LoadingSpinner text="Cargando perfil..." />

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tu información personal y de contacto"
        chips={['Datos personales', 'Preferencias', 'Historial']}
      />

      <Steps
        steps={[
          { id: 'usuario', title: 'Usuario', caption: 'Datos de usuario' },
          { id: 'cliente', title: 'Cliente', caption: 'Datos del cliente' },
        ]}
        active={activeStep}
        onSelect={(i) => setActiveStep(i)}
      />

      <ProfileHeader
        name={name}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        editing={editing}
        setEditing={setEditing}
        loading={loading}
        profile={profile}
        handleSaveUser={handleSaveUser}
        handleCancelUser={() => {
          setEditing(false);
          setForm({
            nombre: profile?.nombre ?? '',
            telefono: profile?.telefono ?? '',
            avatarUrl: profile?.avatarUrl ?? ''
          });
          setSuccess(null)
        }}
        clientEditing={clientEditing}
        setClientEditing={setClientEditing}
        handleSaveClient={handleSaveClient}
        handleCancelClient={() => {
          setClientEditing(false);
          if (client) setClientForm({
            identificacion: client.identificacion ?? '',
            tipo_identificacion: client.tipo_identificacion ?? '',
            razon_social: client.razon_social ?? '',
            nombre_comercial: client.nombre_comercial ?? ''
          });
          setSuccess(null)
        }}
        clientLoading={clientLoading}
        formNombre={form.nombre}
        setFormNombre={(val) => setForm(s => ({ ...s, nombre: val }))}
        error={error}
        success={success}
      />

      {activeStep === 0 && (
        <UserTab
          email={email}
          phone={phone}
          role={role}
          activeStatus={profile?.activo ? 'Activo' : 'Inactivo'}
          name={name}
          emailVerified={profile?.emailVerificado ? 'Sí' : 'No'}
          editing={editing}
          form={form}
          setForm={setForm}
        />
      )}

      {activeStep === 1 && (
        <ClientTab
          clientLoading={clientLoading}
          clientError={clientError}
          client={client}
          vendedorMap={vendedorMap}
          clientEditing={clientEditing}
          clientForm={clientForm}
          setClientForm={setClientForm}
          formatGps={formatGps}
        />
      )}

      <ProfileStats created={created} />
    </div>
  )
}


