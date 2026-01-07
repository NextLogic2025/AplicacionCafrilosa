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

    @Expose() total_pedido: number;
    @Expose() fecha_creacion: Date;

    // Transformación de PostGIS a Objeto Simple
    @Expose()
    get ubicacion() {
        if (!this.geolocalizacion_entrega) return null;
        // Lógica para convertir el string/buffer de PostGIS a { lat, lng }
        return this.geolocalizacion_entrega;
    }

    @Expose()
    @Type(() => OrderDetailItemResponseDto)
    detalles: OrderDetailItemResponseDto[];

    // Campos internos que no se exponen pero se usan en los getters
    estado_actual: string;
    estado_relacion: any;
    geolocalizacion_entrega: any;
}