// Recalcula o manifesto.json: para cada arquivo em dados/, atualiza `linhas` e
// o hash SHA-256, e sobe a `versao` para a data de hoje SE o conteudo mudou.
//
// Roda no CI (workflow) apos os scripts de download, e localmente antes de
// commitar. Nunca muda a versao de um arquivo cujo hash nao mexeu.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFESTO = join(ROOT, 'manifesto.json')

const hoje = new Date().toISOString().slice(0, 10)
const m = JSON.parse(readFileSync(MANIFESTO, 'utf-8'))
m.gerado_em = hoje

let mudou = 0
for (const [nome, info] of Object.entries(m.tabelas)) {
  const caminho = join(ROOT, 'dados', info.arquivo)
  if (!existsSync(caminho)) {
    console.warn(`  ! ${info.arquivo} ausente — mantendo metadados`)
    continue
  }
  const conteudo = readFileSync(caminho, 'utf-8')
  const linhas = conteudo.split('\n').filter(Boolean).length
  const hash = createHash('sha256').update(conteudo).digest('hex')

  if (info.hash !== hash) {
    // preserva sufixo "-preliminar" etc.
    const sufixo = (info.versao.match(/-(.+)$/) || [])[1]
    info.versao = sufixo ? `${hoje.replace(/-/g, '.')}-${sufixo}` : hoje.replace(/-/g, '.')
    mudou++
    console.log(`  ~ ${nome}: ${linhas} linhas, versao -> ${info.versao}`)
  } else {
    console.log(`  = ${nome}: sem mudanca (${linhas} linhas)`)
  }
  info.linhas = linhas
  info.hash = hash
}

writeFileSync(MANIFESTO, JSON.stringify(m, null, 2) + '\n')
console.log(mudou ? `manifesto.json atualizado (${mudou} tabela(s) mudaram)` : 'manifesto.json: nada mudou')
