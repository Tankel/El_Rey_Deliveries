import { jsonStorage } from '@/core/storage/jsonStorage';
import { CreatePedidoDTO, Pedido, PedidoStatus } from '@/types/entities';
import { PedidosRepository } from './PedidosRepository';

const STORAGE_KEY = 'pedidos';

export class PedidosLocalRepository implements PedidosRepository {
  async getAll(): Promise<Pedido[]> {
    return jsonStorage.read<Pedido[]>(STORAGE_KEY, []);
  }

  async getById(id: string): Promise<Pedido | null> {
    const pedidos = await this.getAll();
    return pedidos.find((pedido) => pedido.id === id) ?? null;
  }

  async create(data: CreatePedidoDTO): Promise<Pedido> {
    const pedidos = await this.getAll();
    const pedido: Pedido = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      clienteNombre: data.clienteNombre,
      total: data.total,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    await jsonStorage.write(STORAGE_KEY, [pedido, ...pedidos]);
    return pedido;
  }

  async updateStatus(id: string, status: PedidoStatus): Promise<void> {
    const pedidos = await this.getAll();
    const updated = pedidos.map((pedido) =>
      pedido.id === id ? { ...pedido, status } : pedido,
    );

    await jsonStorage.write(STORAGE_KEY, updated);
  }
}
