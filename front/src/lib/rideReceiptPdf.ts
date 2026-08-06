import { jsPDF } from 'jspdf';
import type { FinancialMode, Ride } from '../types';
import { formatBRL, formatDate } from './utils';

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  atribuida: 'Atribuída',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export function downloadRideReceiptPdf(ride: Ride, financialMode: FinancialMode): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = margin;

  const line = (text: string, opts?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.size ?? 11);
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(30, 30, 30);
    doc.text(text, margin, y);
    y += (opts?.size ?? 11) + 8;
  };

  line('Kinito — Recibo de corrida', { bold: true, size: 16 });
  y += 4;
  line(`Código: ${ride.code}`, { bold: true, size: 12 });
  line(`Data: ${formatDate(ride.requestedAt)}`);
  line(`Status: ${STATUS_LABEL[ride.status] ?? ride.status}`);
  y += 8;
  line('Trajeto', { bold: true, size: 12 });
  line(`Origem: ${ride.origin.address}`);
  line(`Destino: ${ride.destination.address}`);
  if (ride.origin.city || ride.destination.city) {
    line(`Cidade: ${ride.origin.city || ride.destination.city}`);
  }
  y += 8;
  line('Valores', { bold: true, size: 12 });
  line(`Valor: ${formatBRL(ride.grossValue)}`, { bold: true, size: 13 });
  if (ride.companyName) line(`Empresa: ${ride.companyName}`);
  if (ride.driverName) line(`Motorista: ${ride.driverName}`);

  if (financialMode === 'manual') {
    y += 12;
    doc.setDrawColor(180, 120, 40);
    doc.setFillColor(255, 248, 230);
    doc.roundedRect(margin, y - 4, 500, 36, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(140, 90, 20);
    doc.text('Pague ao motorista ao final da corrida', margin + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Pagamento processado fora da plataforma (modo manual).', margin + 10, y + 28);
    y += 48;
  }

  y += 16;
  line('Documento gerado pelo painel Kinito.', { size: 9, color: [120, 120, 120] });

  doc.save(`kinito-recibo-${ride.code}.pdf`);
}
