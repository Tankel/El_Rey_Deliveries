import { CreatePedidoDTO, Pedido, PedidoStatus } from '@/types/entities';

export interface PedidosRepository {
  getAll(): Promise<Pedido[]>;
  getById(id: string): Promise<Pedido | null>;
  create(data: CreatePedidoDTO): Promise<Pedido>;
  updateStatus(id: string, status: PedidoStatus): Promise<void>;
}
