export const endpoints = {
  catalog: {
    health: '/api/health',
    categories: '/api/categories',
    categoriesDeleted: '/api/categories/deleted',
    categoryById: (id: number | string) => `/api/categories/${id}`,
    categoryRestore: (id: number | string) => `/api/categories/${id}/restore`,

    zonas: '/api/zonas',
    zonaById: (id: number | string) => `/api/zonas/${id}`,
    zonaAprobar: (id: number | string) => `/api/zonas/${id}/aprobar`,

    products: '/api/products',
    productsDeleted: '/api/products/deleted',
    productsByCategory: (categoryId: number | string) => `/api/products/categoria/${categoryId}`,
    productById: (id: string) => `/api/products/${id}`,
    productRestore: (id: string) => `/api/products/${id}/restore`,

    clientes: '/api/clientes',
    clientesMis: '/api/clientes/mis',
    clientesBloqueados: '/api/clientes/bloqueados',
    clienteById: (id: string) => `/api/clientes/${id}`,
    clienteDesbloquear: (id: string) => `/api/clientes/${id}/desbloquear`,

    sucursales: '/api/sucursales',
    sucursalesDesactivadas: '/api/sucursales/desactivadas',
    sucursalById: (id: string) => `/api/sucursales/${id}`,
    sucursalActivar: (id: string) => `/api/sucursales/${id}/activar`,
    sucursalesByClienteId: (clienteId: string) => `/api/clientes/${clienteId}/sucursales`,
    sucursalesDesactivadasByClienteId: (clienteId: string) => `/api/clientes/${clienteId}/sucursales/desactivadas`,

    precios: '/api/precios',
    preciosProducto: (productId: string) => `/api/precios/producto/${productId}`,
    preciosClienteProductos: '/api/precios/cliente/productos',
    preciosListas: '/api/precios/listas',
    preciosListaById: (id: number | string) => `/api/precios/listas/${id}`,
    preciosListaProductos: (id: number | string) => `/api/precios/lista/${id}/productos`,
    preciosListaProducto: (listaId: number | string, productoId: string) =>
      `/api/precios/lista/${listaId}/producto/${productoId}`,

    promociones: '/api/promociones',
    promocionById: (id: number | string) => `/api/promociones/${id}`,
    promocionProductos: (id: number | string) => `/api/promociones/${id}/productos`,
    promocionProductoById: (id: number | string, productoId: string) => `/api/promociones/${id}/productos/${productoId}`,
    promocionMejorProducto: (productId: string) => `/api/promociones/mejor/producto/${productId}`,
    promocionClientes: (id: number | string) => `/api/promociones/${id}/clientes`,
    promocionClienteById: (id: number | string, clienteId: string) => `/api/promociones/${id}/clientes/${clienteId}`,

    rutero: '/api/rutero',
    ruteroById: (id: number | string) => `/api/rutero/${id}`,
    ruteroByClienteId: (clientId: string) => `/api/rutero/cliente/${clientId}`,
    ruteroMio: '/api/rutero/mio',

    asignacion: '/api/asignacion',
    asignacionById: (id: number | string) => `/api/asignacion/${id}`,
  },
  orders: {
    health: '/health',

    orders: '/orders',
    orderById: (id: string) => `/orders/${id}`,
    orderDetail: (id: string) => `/orders/${id}/detail`,
    orderTracking: (id: string) => `/orders/${id}/tracking`,
    ordersByClientId: (clienteId: string) => `/orders/client/${clienteId}`,
    ordersUserHistory: '/orders/user/history',
    orderFromCartMe: '/orders/from-cart/me',
    orderFromCartClient: (clienteId: string) => `/orders/from-cart/client/${clienteId}`,
    orderCancel: (id: string) => `/orders/${id}/cancel`,
    orderStatus: (id: string) => `/orders/${id}/status`,
    orderEstadosChangeState: (orderId: string) => `/orders/estados/${orderId}/state`,

    cartMe: '/orders/cart/me',
    cartMeItem: (productId: string) => `/orders/cart/me/item/${productId}`,
    cartClient: (clienteId: string) => `/orders/cart/client/${clienteId}`,
    cartClientItem: (clienteId: string, productId: string) => `/orders/cart/client/${clienteId}/item/${productId}`,
  },
} as const
