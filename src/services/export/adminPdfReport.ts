import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function exportAdminPdfReport(payload: ExportPayload): Promise<ExportResult> {
  try {
    const rows = payload.orders
      .slice(0, 120)
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.id)}</td>
          <td>${escapeHtml(item.clientName)}</td>
          <td>${escapeHtml(item.status)}</td>
          <td>${escapeHtml(item.paymentMethod ?? 'N/A')}</td>
          <td>${escapeHtml(item.paymentStatus ?? 'N/A')}</td>
          <td>$${item.total.toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const kpiRows = payload.kpis
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.indicador)}</td>
          <td>${escapeHtml(String(item.valor))}</td>
        </tr>`,
      )
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
            h1 { margin: 0 0 4px 0; }
            .sub { color: #6b7280; margin-bottom: 18px; }
            h2 { margin: 18px 0 8px 0; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Reporte Admin</h1>
          <div class="sub">Generado: ${new Date().toLocaleString('es-MX')}</div>

          <h2>KPIs</h2>
          <table>
            <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
            <tbody>${kpiRows}</tbody>
          </table>

          <h2>Resumen catalogo</h2>
          <table>
            <thead><tr><th>Usuarios</th><th>Productos</th><th>Pedidos</th></tr></thead>
            <tbody>
              <tr>
                <td>${payload.users.length}</td>
                <td>${payload.products.length}</td>
                <td>${payload.orders.length}</td>
              </tr>
            </tbody>
          </table>

          <h2>Pedidos (incluye pagos)</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Metodo pago</th>
                <th>Estatus pago</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const result = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar reporte admin (PDF)',
        UTI: 'com.adobe.pdf',
      });
    }

    return { ok: true, message: 'Archivo PDF exportado correctamente.', fileUri: result.uri };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo exportar el PDF: ${String(error)}`,
    };
  }
}
