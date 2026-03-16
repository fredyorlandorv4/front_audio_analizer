// src/utils/exportAnalisis.js
// Utilidades de exportación (PDF y CSV) para modales de análisis
import { marked } from 'marked';

// Configuración de marked (v5+ compatible)
marked.use({ breaks: true, gfm: true });

// ── CSV ───────────────────────────────────────────────────────────────────────

function flattenData(data) {
  const rows = [];
  if (!data) return rows;

  if (typeof data === 'string') {
    rows.push(['contenido', data]);
    return rows;
  }

  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        value.forEach((item, i) =>
          rows.push([`${key}[${i + 1}]`, typeof item === 'string' ? item : JSON.stringify(item)])
        );
      } else if (typeof value === 'object') {
        rows.push([key, JSON.stringify(value)]);
      } else {
        rows.push([key, String(value)]);
      }
    });
  }
  return rows;
}

function escapeCSV(val) {
  return `"${String(val ?? '').replace(/"/g, '""')}"`;
}

export function exportAsCSV(resultado, filename, metaRows = []) {
  const dataRows = flattenData(resultado);
  const allRows  = [
    ['campo', 'valor'],
    ...metaRows,
    ...(metaRows.length ? [['---', '---']] : []),
    ...dataRows,
  ];
  const csv  = allRows.map(r => r.map(escapeCSV).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF (impresión del navegador) ─────────────────────────────────────────────

function renderValueHTML(value) {
  if (Array.isArray(value)) {
    return `<ul>${value.map(i => `<li>${typeof i === 'string' ? marked.parseInline(i) : JSON.stringify(i)}</li>`).join('')}</ul>`;
  }
  if (typeof value === 'object' && value !== null) {
    return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
  }
  return marked.parse(String(value));
}

function buildBodyHTML(resultado) {
  if (!resultado) return '<p>Sin datos disponibles.</p>';

  if (typeof resultado === 'string') {
    return `<div class="section"><div class="content">${renderValueHTML(resultado)}</div></div>`;
  }

  const labelMap = {
    title: 'Título', summary: 'Resumen', transcription: 'Transcripción',
    transcript: 'Transcripción', sentiment: 'Sentimiento', sentimiento: 'Sentimiento',
    score: 'Puntaje', punteo: 'Puntaje', punteo_promedio: 'Puntaje Promedio',
    keywords: 'Palabras Clave', palabras_clave: 'Palabras Clave',
    topics: 'Temas', temas: 'Temas', language: 'Idioma', idioma: 'Idioma',
    fortalezas: 'Fortalezas', strengths: 'Fortalezas',
    areas_de_mejora: 'Áreas de Mejora', recomendaciones: 'Recomendaciones',
    observaciones: 'Observaciones', resumen: 'Resumen', resultado: 'Resultado',
  };

  return Object.entries(resultado)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => {
      const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `
        <div class="section">
          <div class="section-title">${label}</div>
          <div class="content">${renderValueHTML(value)}</div>
        </div>`;
    })
    .join('');
}

export function exportAsPDF(title, subtitle, resultado, metaItems = []) {
  const metaHTML = metaItems.length
    ? `<div class="meta">${metaItems.map(([k, v]) => `<span><strong>${k}:</strong> ${v}</span>`).join(' &nbsp;·&nbsp; ')}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${title}${subtitle ? ' — ' + subtitle : ''}</title>
  <style>
    @page { size: A4; margin: 20mm 18mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1f2937; margin: 0; }
    .header { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 18px; }
    .header h1 { font-size: 18pt; font-weight: 700; color: #4c1d95; margin: 0 0 4px; }
    .header .subtitle { font-size: 11pt; color: #6b7280; margin: 0; }
    .meta { font-size: 9pt; color: #6b7280; margin-bottom: 18px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase;
                     letter-spacing: 0.05em; color: #7c3aed; border-bottom: 1px solid #e9d5ff;
                     padding-bottom: 3px; margin-bottom: 6px; }
    .content { font-size: 10.5pt; color: #374151; line-height: 1.6; }
    .content h2 { font-size: 12pt; font-weight: 600; color: #1f2937; margin: 8px 0 4px; }
    .content h3 { font-size: 11pt; font-weight: 600; color: #374151; margin: 6px 0 3px; }
    .content ul { padding-left: 18px; margin: 4px 0; }
    .content li { margin-bottom: 3px; }
    .content pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;
                   padding: 8px; font-size: 8.5pt; white-space: pre-wrap; word-break: break-all; }
    .content strong { font-weight: 600; }
    .footer { position: fixed; bottom: 8mm; right: 18mm; font-size: 8pt; color: #9ca3af; }
    @media print {
      .no-print { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  </div>
  ${metaHTML}
  ${buildBodyHTML(resultado)}
  <div class="footer">Exportado el ${new Date().toLocaleDateString('es-GT', { day:'2-digit', month:'long', year:'numeric' })}</div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    iframe.contentWindow.onafterprint = () => iframe.remove();
    setTimeout(() => { if (iframe.parentNode) iframe.remove(); }, 60_000);
  };
}
