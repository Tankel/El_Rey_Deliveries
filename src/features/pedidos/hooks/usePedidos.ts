import { useCallback, useMemo, useState } from 'react';
import { CreatePedidoDTO, Pedido } from '@/types/entities';
import { PedidosLocalRepository } from '../repository/PedidosLocalRepository';

export function usePedidos() {
  const repository = useMemo(() => new PedidosLocalRepository(), []);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPedidos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await repository.getAll();
      setPedidos(result);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const createPedido = useCallback(
    async (data: CreatePedidoDTO) => {
      await repository.create(data);
      await loadPedidos();
    },
    [loadPedidos, repository],
  );

  return {
    pedidos,
    isLoading,
    loadPedidos,
    createPedido,
  };
}
