import React from "react";

type Credito = {
  limite?: number;
  saldo?: number;
  disponible?: number;
  plazo?: number | string;
};

type Cliente = {
  id?: string;
  nombre?: string;
  cedula?: string;
  direccion?: string;
  zona?: string;
  lista_precios?: string;
  creado_en?: string;
  lat?: number;
  lng?: number;
  credito?: Credito;
};

type Props = {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
};

export default function ClienteModal({ cliente, open, onClose }: Props) {
  if (!open || !cliente) return null;

  const q = cliente.lat && cliente.lng
    ? `${cliente.lat},${cliente.lng}`
    : encodeURIComponent(`${cliente.direccion || cliente.nombre || ""}`);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${q}`;

  // Read Google Maps API key from Vite env (VITE_GOOGLE_MAPS_API_KEY)
  const googleMapsKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const hasMapsKey = !!googleMapsKey && !googleMapsKey.includes('REPLACE') && !googleMapsKey.includes('INVALID')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-3xl h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <header className="flex items-center justify-between bg-red-600 text-white px-6 py-4">
          <div className="text-lg font-bold">{cliente.nombre || "Cliente"}</div>
          <button onClick={onClose} className="opacity-90 hover:opacity-100">✕</button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{cliente.nombre}</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {cliente.cedula && <li><strong>Cédula:</strong> {cliente.cedula}</li>}
                {cliente.direccion && <li><strong>Dirección:</strong> {cliente.direccion}</li>}
                {cliente.zona && <li><strong>Zona:</strong> {cliente.zona}</li>}
                {cliente.lista_precios && <li><strong>Lista de precios:</strong> {cliente.lista_precios}</li>}
                {cliente.creado_en && <li><strong>Creado:</strong> {cliente.creado_en}</li>}
              </ul>
            </div>

            <div className="w-64">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-xs text-gray-500 uppercase">Crédito</div>
                <div className="mt-3">
                  <div className="text-sm text-gray-600">Límite</div>
                  <div className="text-lg font-semibold">{formatCurrency(cliente.credito?.limite)}</div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500">Saldo</div>
                    <div className="font-semibold">{formatCurrency(cliente.credito?.saldo)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Plazo</div>
                    <div className="font-semibold">{cliente.credito?.plazo ?? "-"}</div>
                  </div>
                </div>

                <div className="mt-3 text-green-600 font-semibold">
                  Disponible {formatCurrency(cliente.credito?.disponible)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-2">Mapa general</div>
            <div className="border rounded-md overflow-hidden h-64">
              {hasMapsKey ? (
                <iframe
                  title="mapa-cliente"
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${q}`}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full p-4 text-sm text-neutral-700">
                  <div className="mb-2 font-semibold">Mapa no disponible</div>
                  <div className="text-xs text-neutral-600">No se ha configurado una clave válida de Google Maps en las variables de entorno.</div>
                  <div className="mt-3 text-xs text-neutral-600">Puedes añadir `VITE_GOOGLE_MAPS_API_KEY` al archivo <code>.env</code> o a la configuración de despliegue.</div>
                </div>
              )}
            </div>

            <div className="mt-3 text-right">
              <a className="text-sm text-red-600" href={mapsHref} target="_blank" rel="noreferrer">Ver ruta en Google Maps</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(n?: number) {
  if (n == null) return "$0.00";
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
  } catch (e) {
    return `$${n}`;
  }
}
