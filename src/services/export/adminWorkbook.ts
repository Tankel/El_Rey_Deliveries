import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { AdminUser } from '@/models/AdminUser';
import { Product } from '@/models/Product';
import { Order } from '@/types/domain';

type KpiItem = {
  indicador: string;
  valor: string | number;
};

type ExportPayload = {
  orders: Order[];
  users: AdminUser[];
  products: Product[];
  kpis: KpiItem[];
};

type ExportResult = {
  ok: boolean;
  message: string;
  fileUri?: string;
};

export async function exportAdminWorkbook(payload: ExportPayload): Promise<ExportResult> {
  try {
    const workbook = XLSX.utils.book_new();

    const ordersRows = payload.orders.map((item) => ({
      id: item.id,
      cliente: item.clientName,
      estado: item.status,
      metodo_pago: item.paymentMethod ?? 'N/A',
      estatus_pago: item.paymentStatus ?? 'N/A',
      total: item.total,
      direccion: item.address,
      repartidor: item.assignedDriverName ?? '',
      actualizado: item.updatedAt,
    }));
    const usersRows = payload.users.map((item) => ({
      id: item.id,
      username: item.username,
      nombre: item.fullName,
      rol: item.role,
      activo: item.isActive ? 'si' : 'no',
      correo: item.email,
      telefono: item.phone,
    }));
    const productsRows = payload.products.map((item) => ({
      id: item.id,
      nombre: item.name,
      marca: item.brand,
      categoria: item.category,
      precio: item.price,
      stock: item.stock ?? 0,
      descuento: item.discountPercent,
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ordersRows), 'Pedidos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(usersRows), 'Usuarios');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productsRows), 'Productos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.kpis), 'KPIs');

    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = `${FileSystem.cacheDirectory ?? ''}reporte-admin-${Date.now()}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar reporte admin',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
      return { ok: true, message: 'Archivo XLSX exportado correctamente.', fileUri };
    }

    return {
      ok: true,
      message: 'XLSX generado. El dispositivo no permite compartir, revisa la ruta local.',
      fileUri,
    };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo exportar el XLSX: ${String(error)}`,
    };
  }
}
