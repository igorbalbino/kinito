import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { downloadCSV, formatBRL, formatDate } from './utils';

export type ExportRow = Record<string, string | number>;

export function exportRowsAsCsv(filename: string, rows: ExportRow[]): void {
  downloadCSV(filename, rows);
}

export function exportRowsAsXlsx(filename: string, sheetName: string, rows: ExportRow[]): void {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export async function exportRowsAsPdfHtml(options: {
  title: string;
  subtitle?: string;
  filterNote?: string;
  filename: string;
  columns: { key: string; label: string }[];
  rows: ExportRow[];
}): Promise<void> {
  const { title, subtitle, filterNote, filename, columns, rows } = options;
  if (!rows.length) return;

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;width:800px;padding:24px;background:#fff;color:#18181b;font-family:Segoe UI,system-ui,sans-serif;';
  container.innerHTML = `
    <div style="border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;">Kinito</div>
      <h1 style="margin:4px 0 0;font-size:20px;font-weight:800;">${escapeHtml(title)}</h1>
      ${subtitle ? `<p style="margin:6px 0 0;font-size:12px;color:#71717a;">${escapeHtml(subtitle)}</p>` : ''}
      ${filterNote ? `<p style="margin:8px 0 0;font-size:11px;color:#52525b;">Filtro: ${escapeHtml(filterNote)}</p>` : ''}
      <p style="margin:8px 0 0;font-size:10px;color:#a1a1aa;">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))} · ${rows.length} registro(s)</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr>
          ${columns
            .map(
              (c) =>
                `<th style="text-align:left;padding:8px 6px;border-bottom:1px solid #e4e4e7;color:#71717a;font-weight:600;">${escapeHtml(c.label)}</th>`
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            ${columns
              .map((c) => {
                const raw = row[c.key];
                const val =
                  typeof raw === 'number' && String(c.key).toLowerCase().includes('valor')
                    ? formatBRL(raw)
                    : String(raw ?? '');
                return `<td style="padding:8px 6px;border-bottom:1px solid #f4f4f5;vertical-align:top;">${escapeHtml(val)}</td>`;
              })
              .join('')}
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    await doc.html(container, {
      callback: (pdf) => {
        pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      },
      x: 24,
      y: 24,
      width: 790,
      windowWidth: 800,
      autoPaging: 'text',
    });
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatExportDate(iso: string): string {
  try {
    return formatDate(iso);
  } catch {
    return iso;
  }
}
