export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono?: string | null;
  zona_id?: number | null;
  activo?: boolean;
}

export interface CreateSucursalDto {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  zona_id?: number | null;
}
