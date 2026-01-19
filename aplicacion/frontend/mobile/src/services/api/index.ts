export { apiRequest } from './client'

export { AssignmentService } from './AssignmentService'
export { CartService } from './CartService'
export { CatalogService } from './CatalogService'
export { ClientService } from './ClientService'
export { InvoiceService } from './InvoiceService'
export { NotificationService } from './NotificationService'
export { OrderService } from './OrderService'
export { PriceService } from './PriceService'
export { ProductService } from './ProductService'
export { PromotionService } from './PromotionService'
export { ReturnsService } from './ReturnsService'
export { RouteService } from './RouteService'
export { SellerService } from './SellerService'
export { SucursalService } from './SucursalService'
export { SupervisorService } from './SupervisorService'
export { SupportService } from './SupportService'
export { TransportistaService } from './TransportistaService'
export { UserService } from './UserService'
export { WarehouseService } from './WarehouseService'
export { UbicacionService } from './UbicacionService'
export { AlmacenService } from './AlmacenService'
export { LoteService } from './LoteService'
export { StockService } from './StockService'
export { PickingService } from './PickingService'
export { ReservationService } from './ReservationService'
export { ZoneService, ZoneHelpers, ZoneEditState } from './ZoneService'

export type { Allocation, AssignVendorPayload } from './AssignmentService'

export type { CartItemDto, AddToCartPayload, CartItem, Cart } from './CartService'

export type {
    Category,
    Product,
    ProductsResponse,
    PriceList as CatalogPriceList,
    Promotion,
    CommercialZone as CatalogZone,
    AuditLog
} from './CatalogService'

export type {
    Client,
    PriceList as ClientPriceList,
    CommercialZone,
    ClientBranch,
    CreateClientPayload
} from './ClientService'

export type { Invoice } from './InvoiceService'

export type { Notification } from './NotificationService'

export type {
    OrderStatus,
    OrderDetail,
    Order,
    CreateOrderPayload,
    OrderFilters
} from './OrderService'
export { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from './OrderService'

export type { PriceList, PriceAssignment } from './PriceService'

export type {
    ProductParams,
    Category as ProductCategory,
    Product as ProductServiceProduct,
    Lot
} from './ProductService'

export type { PromotionCampaign, PromotionProduct, PromotionClient } from './PromotionService'

export type { ReturnRequest } from './ReturnsService'

export type { RoutePlan, ScheduledVisit } from './RouteService'

export type { SellerKPIs, SellerAlert } from './SellerService'

export type { Sucursal, CreateSucursalPayload, UpdateSucursalPayload } from './SucursalService'

export type {
    KPI,
    Alert,
    SupervisorOrder,
    SupervisorDelivery,
    SupervisorTeamMember,
    SupervisorClient,
    SupervisorWarehouseData,
    SupervisorReturn,
    SupervisorReport
} from './SupervisorService'

export type { Ticket } from './SupportService'

export type {
    TransportistaKPIs,
    TransportistaProfile,
    Notification as TransportistaNotification,
    Delivery,
    TransportistaAlert,
    TransportistaOrder,
    Route,
    Return
} from './TransportistaService'

export type { UserProfile, CreateUserPayload } from './UserService'

export type { WarehouseStats, RecentActivity } from './WarehouseService'
export type { Ubicacion, UbicacionPayload } from './UbicacionService'
export type { Almacen, AlmacenPayload } from './AlmacenService'
export type { Lote, LotePayload } from './LoteService'
export type { StockItem, CreateStockPayload, AjusteStockPayload } from './StockService'
export type { Picking, PickingItem, CreatePickingPayload, PickingEstado } from './PickingService'
export type { Reservation, ReservationItem, CreateReservationPayload } from './ReservationService'

export type { Zone, LatLng, CreateZonePayload, UpdateZonePayload } from './ZoneService'
