export class AlmacenClient {
  private readonly simulated: boolean;
  constructor() {
    // If an actual ALMACEN_URL is provided we could call it; for now we "fingimos".
    this.simulated = !(process.env.ALMACEN_URL && process.env.ALMACEN_URL.length > 0);
  }

  async checkStock(items: Array<{ producto_id: string; cantidad: number }>) {
    if (this.simulated) {
      // Simulate all items available
      return { ok: true, items: items.map(i => ({ ...i, available: true })) };
    }
    // Real implementation would call ALMACEN_URL here
    throw new Error('Almacen real no implementado');
  }

  async reserveStock(reservationId: string, items: Array<{ producto_id: string; cantidad: number }>) {
    if (this.simulated) {
      return { ok: true, reservationId };
    }
    throw new Error('Almacen real no implementado');
  }

  async commitReservation(reservationId: string) {
    if (this.simulated) {
      return { ok: true };
    }
    throw new Error('Almacen real no implementado');
  }

  async releaseReservation(reservationId: string) {
    if (this.simulated) {
      return { ok: true };
    }
    throw new Error('Almacen real no implementado');
  }
}

export default new AlmacenClient();
