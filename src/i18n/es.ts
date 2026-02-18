import { OrderStatus } from '@/types/domain';

export const es = {
  feedback: {
    success: 'Listo',
    notAllowed: 'No permitido',
  },
  common: {
    logout: 'Cerrar sesion',
    loading: 'Cargando...',
  },
  navigation: {
    clientHome: 'Inicio Cliente',
    myOrders: 'Mis Pedidos',
    orderDetail: 'Detalle Pedido',
    adminDashboard: 'Panel Admin',
    adminOrders: 'Gestion Pedidos',
    adminOrderDetail: 'Pedido Admin',
    driverDeliveries: 'Mis Entregas',
    driverDeliveryDetail: 'Detalle Entrega',
    home: 'Inicio',
    orders: 'Pedidos',
    clients: 'Clientes',
    inventory: 'Inventario',
    profile: 'Perfil',
  },
  orders: {
    title: 'Pedidos',
    demoCreate: 'Crear pedido demo',
    count: (total: number) => `${total} pedidos`,
    created: 'Pedido creado correctamente.',
    notFound: 'Pedido no encontrado.',
    driverNotFound: 'Repartidor no encontrado.',
    assignInvalid:
      'Solo puedes asignar repartidor cuando el pedido esta confirmado o en preparacion.',
    assigned: (driverName: string) => `Pedido asignado a ${driverName}.`,
    alreadyInStatus: (status: OrderStatus) => `El pedido ya esta en estado ${status}.`,
    invalidTransition: (current: OrderStatus, next: OrderStatus) =>
      `No se puede pasar de ${current} a ${next}.`,
    updated: (status: OrderStatus) => `Estado actualizado a ${status}.`,
  },
  auth: {
    recoverPassword: 'Recuperar contrasena',
  },
  dashboard: {
    title: 'Panel',
    kpiSummary: 'KPIs del dia y resumen operativo.',
  },
  admin: {
    dashboardTitle: 'Panel Admin',
    manageOrders: 'Gestionar pedidos',
    pending: 'Pendientes',
    inRoute: 'En camino',
    delivered: 'Entregados',
  },
  clients: {
    title: 'Clientes',
    pending: 'Lista y detalle de clientes (pendiente).',
  },
  inventory: {
    title: 'Inventario',
    pending: 'Entradas/salidas y validacion de stock (pendiente).',
  },
  profile: {
    title: 'Perfil',
    user: 'Usuario',
    noSession: 'Sin sesion',
  },
  client: {
    title: 'Cliente',
    greeting: 'Hola',
    goToOrders: 'Ir a mis pedidos',
    noOrders: 'No tienes pedidos aun.',
    detailPrefix: 'Detalle',
  },
  driver: {
    noDelivery: 'Entrega no encontrada.',
    deliveryPrefix: 'Entrega',
    acceptDelivery: 'Aceptar entrega',
    startRoute: 'Iniciar ruta',
    confirmDelivery: 'Confirmar entrega',
    noAssignedOrders: 'No tienes pedidos asignados.',
    loadingUpdate: 'Actualizando...',
  },
  adminOrders: {
    titleClient: 'Cliente',
    titleStatus: 'Estado',
    titleAddress: 'Direccion',
    titleDriver: 'Repartidor',
    noDriver: 'Sin asignar',
    confirmOrder: 'Confirmar pedido',
    markPreparing: 'Marcar en preparacion',
    markOnRoute: 'Marcar en camino',
    markDelivered: 'Marcar entregado',
    assigning: 'Asignando...',
    confirming: 'Confirmando...',
    updating: 'Actualizando...',
  },
};
