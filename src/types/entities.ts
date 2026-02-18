export type PedidoStatus = 'draft' | 'confirmed' | 'delivered' | 'cancelled';

export interface Pedido {
  id: string;
  clienteNombre: string;
  total: number;
  status: PedidoStatus;
  createdAt: string;
}

export interface CreatePedidoDTO {
  clienteNombre: string;
  total: number;
}
