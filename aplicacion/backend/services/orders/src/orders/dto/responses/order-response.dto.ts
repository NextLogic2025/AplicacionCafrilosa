import { Expose, Type } from 'class-transformer';

export class OrderDetailItemResponseDto {
    @Expose() producto_id: string;
    @Expose() cantidad: number;
    @Expose() precio_unitario: number;
    @Expose() subtotal: number;
}

export class OrderResponseDto {
    @Expose() id: string;
    @Expose() cliente_id: string;

    @Expose()
    get estado(): string {
        return this.estado_relacion?.nombre_visible || this.estado_actual;
    }

    // Mapear a los campos de la entidad `Pedido`
    @Expose()
    get total_pedido(): number {
        return (this as any).total_final;
    }

    @Expose()
    get fecha_creacion(): Date {
        return (this as any).created_at;
    }

    // Transformación de PostGIS a Objeto Simple
    @Expose()
    get ubicacion() {
        if (!(this as any).ubicacion_pedido) return null;
        return (this as any).ubicacion_pedido;
    }

    @Expose()
    @Type(() => OrderDetailItemResponseDto)
    detalles: OrderDetailItemResponseDto[];

    // Campos internos que no se exponen pero se usan en los getters
    estado_actual: string;
    estado_relacion: any;
    geolocalizacion_entrega: any;
}