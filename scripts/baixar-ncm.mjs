// Baixa a tabela NCM/SH completa (~15 mil itens) do Portal Unico Siscomex
// (Receita Federal) e grava dados/ncm.txt no formato codigo|descricao|aliquota_ipi.
//
// A aliquota de IPI (TIPI) NAO vem nesse endpoint; fica em branco e o motor
// fiscal usa a regra do produto. Para popular o IPI, cruzar depois com a TIPI
// (Decreto 11.158/2022) — TODO separado.
//
// Uso:  node scripts/baixar-ncm.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados', 'ncm.txt')
const URL = 'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json'

const limpa = (s) => String(s || '')
  .replace(/\s+/g, ' ')
  .replace(/\|/g, '/')
  .trim()

const run = async () => {
  console.log('Baixando NCM de', URL)
  const resp = await fetch(URL, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()

  // formato do portal: { Nomenclaturas: [ { Codigo: "0101.21.00", Descricao: "..." }, ... ] }
  const itens = json.Nomenclaturas || json.nomenclaturas || []
  if (!itens.length) throw new Error('resposta sem itens (formato mudou?)')

  const linhas = itens
    .map((it) => {
      const codigo = String(it.Codigo || it.codigo || '').replace(/\D/g, '')
      const descricao = limpa(it.Descricao || it.descricao)
      if (!codigo || !descricao) return null
      // guarda so posicoes de 2, 4, 6 e 8 digitos (o portal traz varios niveis)
      if (![2, 4, 6, 8].includes(codigo.length)) return null
      return `${codigo}|${descricao}|`
    })
    .filter(Boolean)

  // dedup por codigo, ordena
  const map = new Map()
  for (const l of linhas) map.set(l.split('|')[0], l)
  const final = [...map.values()].sort((a, b) => a.split('|')[0].localeCompare(b.split('|')[0]))

  writeFileSync(OUT, final.join('\n') + '\n')
  console.log(`ncm.txt: ${final.length} linhas`)
}

run().catch((e) => {
  console.error('FALHA:', e.message)
  console.error('A fonte oficial pode ter mudado o layout ou estar fora do ar.')
  console.error('Nesse caso, manter o ncm.txt anterior e abrir issue.')
  process.exit(1)
})
