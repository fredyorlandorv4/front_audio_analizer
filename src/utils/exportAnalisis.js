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

function renderValueHTML(value, depth = 0) {
  // Array —————————————————————————————————————————————————
  if (Array.isArray(value)) {
    // Array de primitivos → lista simple
    if (value.every(i => typeof i !== 'object' || i === null)) {
      return `<ul>${value.map(i =>
        `<li>${typeof i === 'string' ? marked.parseInline(normalizeStr(i)) : String(i)}</li>`
      ).join('')}</ul>`;
    }
    // Array de objetos → cada objeto como sub-bloque
    return value.map(item =>
      `<div style="margin-bottom:6px;padding-left:${depth > 0 ? 10 : 0}px;border-left:${depth > 0 ? '2px solid #e9d5ff' : 'none'};padding-left:${depth > 0 ? 8 : 0}px">
        ${renderValueHTML(item, depth + 1)}
      </div>`
    ).join('');
  }

  // Objeto anidado → clave: valor recursivo ————————————————
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, val]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const isComplex = typeof val === 'object' && val !== null;
        return `<div style="margin-bottom:5px">
          <span style="font-weight:700;color:#374151;font-size:9.5pt">${label}:</span>
          ${isComplex
            ? `<div style="margin-top:3px;margin-left:10px">${renderValueHTML(val, depth + 1)}</div>`
            : `<span style="margin-left:4px">${typeof val === 'string' ? marked.parseInline(normalizeStr(val)) : String(val)}</span>`
          }
        </div>`;
      }).join('');
  }

  // String / primitivo → markdown ——————————————————————————
  return marked.parse(normalizeStr(String(value)));
}

// Convierte \n literales (backslash+n) en saltos de línea reales
// para que marked los trate como newlines al parsear markdown
function normalizeStr(s) {
  return typeof s === 'string' ? s.replace(/\\n/g, '\n').replace(/\\t/g, '\t') : s;
}

function buildBodyHTML(resultado) {
  if (!resultado) return '<p>Sin datos disponibles.</p>';

  if (typeof resultado === 'string') {
    return `<div class="section"><div class="content">${renderValueHTML(normalizeStr(resultado))}</div></div>`;
  }

  const labelMap = {
    title: 'Título', summary: 'Resumen', transcription: 'Transcripción',
    transcript: 'Transcripción', sentiment: 'Sentimiento', sentimiento: 'Sentimiento',
    score: 'Puntaje', punteo: 'Puntaje', punteo_promedio: 'Puntaje Promedio',
    quality_score: 'Puntaje de Calidad',
    keywords: 'Palabras Clave', palabras_clave: 'Palabras Clave',
    topics: 'Temas', temas: 'Temas', language: 'Idioma', idioma: 'Idioma',
    main_points: 'Puntos Principales', action_items: 'Acciones a Tomar',
    follow_up: 'Seguimiento', stories: 'Historias', references: 'Referencias',
    arguments: 'Argumentos', related_topics: 'Temas Relacionados',
    fortalezas: 'Fortalezas', strengths: 'Fortalezas',
    areas_de_mejora: 'Áreas de Mejora', areas_for_improvement: 'Áreas de Mejora',
    recomendaciones: 'Recomendaciones', suggested_phrases: 'Frases Sugeridas',
    observations: 'Observaciones', observaciones: 'Observaciones',
    compliance_flags: 'Alertas de Cumplimiento', next_steps: 'Próximos Pasos',
    supervisor_coaching: 'Coaching al Supervisor',
    rationale: 'Justificación', resumen: 'Resumen', resultado: 'Resultado',
  };

  // Filtra valores vacíos y arrays que sólo contienen placeholders sin contenido
  const isEmpty = (v) => {
    if (v === null || v === undefined || v === '') return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (Array.isArray(v) && v.every(i => typeof i === 'string' && i.toLowerCase().includes('nothing found'))) return true;
    return false;
  };

  return Object.entries(resultado)
    .filter(([, v]) => !isEmpty(v))
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
    .content h1 { font-size: 15pt; font-weight: 700; color: #4c1d95; margin: 12px 0 6px; border-bottom: 1px solid #e9d5ff; padding-bottom: 4px; }
    .content h2 { font-size: 13pt; font-weight: 700; color: #6d28d9; margin: 10px 0 5px; }
    .content h3 { font-size: 11.5pt; font-weight: 700; color: #1f2937; margin: 8px 0 4px; }
    .content h4 { font-size: 10.5pt; font-weight: 700; color: #374151; margin: 6px 0 3px; text-transform: uppercase; letter-spacing: 0.03em; }
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
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  // El browser usa document.title de la página PADRE como nombre del PDF
  const pdfTitle = `${title}${subtitle ? ' — ' + subtitle : ''}`;
  const originalTitle = document.title;
  document.title = pdfTitle;

  const cleanup = () => {
    document.title = originalTitle;
    if (iframe.parentNode) iframe.remove();
  };

  // Restaurar título cuando el usuario cierre el diálogo de impresión
  window.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 60_000); // fallback por si afterprint no dispara

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}
