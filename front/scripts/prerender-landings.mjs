import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found — run vite build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

const pages = [
  {
    dir: '',
    title: 'Peça sua corrida com segurança | Kinito',
    description:
      'Kinito conecta você a motoristas confiáveis. Solicite corridas, acompanhe o trajeto e viaje com tranquilidade.',
    canonical: '/',
  },
  {
    dir: 'para-empresas',
    title: 'Gestão de frotas e despacho para empresas | Kinito',
    description:
      'Kinito para empresas: despacho de corridas, motoristas, clientes, financeiro e WhatsApp. Teste 14 dias.',
    canonical: '/para-empresas',
  },
];

function injectMeta(source, page) {
  let out = source;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${page.title}</title>`);
  if (/name="description"/.test(out)) {
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${page.description}" />`,
    );
  } else {
    out = out.replace(
      '</head>',
      `  <meta name="description" content="${page.description}" />\n  <link rel="canonical" href="${page.canonical}" />\n</head>`,
    );
  }
  if (!/rel="canonical"/.test(out)) {
    out = out.replace('</head>', `  <link rel="canonical" href="${page.canonical}" />\n</head>`);
  }
  return out;
}

for (const page of pages) {
  const targetDir = page.dir ? path.join(dist, page.dir) : dist;
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, 'index.html');
  fs.writeFileSync(target, injectMeta(html, page), 'utf8');
  console.log('prerendered', page.canonical, '->', path.relative(dist, target));
}
