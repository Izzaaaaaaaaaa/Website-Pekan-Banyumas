// scripts/lighthouse.mjs — FE performance runner.
//
// Replaces `lhci autorun`, which aborts on Windows when real-time antivirus
// (e.g. Kaspersky) locks Chrome's temp user-data-dir during cleanup
// (`EPERM ...\Temp\lighthouse.XXX` in chrome-launcher destroyTmp). This runner
// avoids that failure mode by:
//   1. launching Chrome with a FIXED user-data-dir (chrome-launcher then skips
//      the temp-dir rmSync that AV blocks),
//   2. writing the HTML+JSON report from the in-memory result BEFORE killing
//      Chrome, and
//   3. swallowing any cleanup error so the report is always produced (exit 0).
//
// Serves the built dist/ on an ephemeral port (so parallel runs across apps
// never collide) and audits the SPA entry. Run after `npm run build`.
import http from 'node:http'
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, 'lighthouse-report')

const MIME = {
  '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json',
}

function serveDist() {
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(DIST, urlPath)
    if (urlPath === '/' || !existsSync(file)) file = path.join(DIST, 'index.html') // SPA fallback
    try {
      const data = await readFile(file)
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
      res.end(data)
    } catch {
      res.statusCode = 404
      res.end('not found')
    }
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/index.html not found — run `npm run build` first.')
    process.exit(1)
  }

  const server = await serveDist()
  const { port: httpPort } = server.address()
  const url = `http://127.0.0.1:${httpPort}/index.html`

  const userDataDir = path.join(ROOT, '.lhci-chrome')
  try { await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }) } catch {}
  await mkdir(userDataDir, { recursive: true }) // chrome-launcher writes its logs here

  const chrome = await launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    userDataDir,
  })

  let runnerResult
  try {
    runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: ['html', 'json'],
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    })
  } finally {
    try { await chrome.kill() } catch { /* swallow Windows/AV EPERM on temp cleanup */ }
    server.close()
  }

  if (!runnerResult || !runnerResult.report) {
    console.error('Lighthouse produced no result.')
    process.exit(1)
  }

  await mkdir(OUT, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const [html, json] = runnerResult.report
  await writeFile(path.join(OUT, `report-${stamp}.html`), html)
  await writeFile(path.join(OUT, `report-${stamp}.json`), json)

  const cats = runnerResult.lhr.categories
  const pct = (c) => (c && typeof c.score === 'number' ? Math.round(c.score * 100) : 'n/a')
  console.log('\nLighthouse scores (mobile emulation):')
  console.log(`  Performance:    ${pct(cats.performance)}`)
  console.log(`  Accessibility:  ${pct(cats.accessibility)}`)
  console.log(`  Best practices: ${pct(cats['best-practices'])}`)
  console.log(`  SEO:            ${pct(cats.seo)}`)
  console.log(`\nReport: lighthouse-report/report-${stamp}.html`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
