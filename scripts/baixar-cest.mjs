// Monta dados/cest.txt a partir do Convenio ICMS 142/2018 (Anexos II a XXVI).
// Nao ha API oficial estavel do CEST. A fonte pratica e um CSV consolidado
// publicado no GitHub (colunas: anexo;item;cest;ncm;descricao). Ajuste FONTE_URL
// se a fonte sair do ar — o formato de saida do KronTech nao muda.
//
// Formato de saida: codigo|ncm|descricao|segmento
//   codigo   NN.NNN.NN
//   ncm      8 digitos (pode repetir codigo p/ NCMs diferentes)
//   segmento nome do segmento (do numero do CEST, nao do texto do anexo)
//
// Uso:  node scripts/baixar-cest.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados', 'cest.txt')
const FONTE_URL = 'https://raw.githubusercontent.com/wevertonmbrtx/ncm-cest/main/cest_ncm.csv'

const SEGMENTOS = {
  '01': 'Autopecas', '02': 'Bebidas alcoolicas, exceto cerveja e chope',
  '03': 'Cervejas, chopes, refrigerantes, aguas e outras bebidas', '04': 'Cigarros e derivados do fumo',
  '05': 'Cimentos', '06': 'Combustiveis e lubrificantes', '07': 'Energia eletrica', '08': 'Ferramentas',
  '09': 'Lampadas, reatores e starter', '10': 'Materiais de construcao e congeneres',
  '11': 'Materiais de limpeza', '12': 'Materiais eletricos',
  '13': 'Medicamentos de uso humano e outros produtos farmaceuticos',
  '14': 'Papeis, plasticos, produtos ceramicos e vidros',
  '15': 'Pneumaticos, cameras de ar e protetores de borracha', '16': 'Produtos alimenticios',
  '17': 'Produtos de papelaria', '18': 'Produtos de perfumaria, higiene pessoal e cosmeticos',
  '19': 'Produtos eletronicos, eletroeletronicos e eletrodomesticos',
  '20': 'Racoes para animais domesticos',
  '21': 'Sorvetes e preparados para fabricacao de sorvetes em maquinas',
  '22': 'Tintas e vernizes', '23': 'Veiculos automotores', '24': 'Veiculos de duas e tres rodas motorizados',
  '25': 'Venda de mercadorias pelo sistema porta a porta', '26': 'Produtos das industrias alimenticias (outros)',
  '28': 'Produtos texteis (venda porta a porta)',
}

// remove acento e reduz a ASCII (o KronTech aplica unaccent na busca)
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const limpa = (s) => semAcento(s).replace(/\s+/g, ' ').replace(/[|;]/g, '/').trim()

// parser de CSV simples com ; e aspas opcionais
function linhaCsv(l) {
  const out = []
  let cur = ''
  let dentro = false
  for (let i = 0; i < l.length; i++) {
    const c = l[i]
    if (c === '"') { dentro = !dentro; continue }
    if (c === ';' && !dentro) { out.push(cur); cur = ''; continue }
    cur += c
  }
  out.push(cur)
  return out
}

const run = async () => {
  console.log('Baixando CEST de', FONTE_URL)
  const resp = await fetch(FONTE_URL, { headers: { Accept: 'text/csv' } })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const texto = (await resp.text()).replace(/^﻿/, '')
  const linhas = texto.split(/\r?\n/).filter(Boolean)
  const header = linhaCsv(linhas[0]).map((h) => h.trim().toLowerCase())
  const iCest = header.indexOf('cest')
  const iNcm = header.indexOf('ncm')
  const iDesc = header.indexOf('descricao')
  if (iCest < 0 || iDesc < 0) throw new Error('cabecalho inesperado: ' + header.join(','))

  const saida = []
  for (const l of linhas.slice(1)) {
    const cols = linhaCsv(l)
    const cestBruto = String(cols[iCest] || '').replace(/\D/g, '')
    if (cestBruto.length !== 7) continue
    const codigo = `${cestBruto.slice(0, 2)}.${cestBruto.slice(2, 5)}.${cestBruto.slice(5, 7)}`
    const ncm = String(cols[iNcm] || '').replace(/\D/g, '').slice(0, 8)
    const descricao = limpa(cols[iDesc])
    const segmento = SEGMENTOS[cestBruto.slice(0, 2)] || ''
    if (!descricao) continue
    saida.push(`${codigo}|${ncm}|${descricao}|${segmento}`)
  }

  // dedup por codigo+ncm, ordena
  const map = new Map()
  for (const s of saida) {
    const [c, n] = s.split('|')
    map.set(`${c}|${n}`, s)
  }
  const final = [...map.values()].sort()

  writeFileSync(OUT, final.join('\n') + '\n')
  console.log(`cest.txt: ${final.length} linhas`)
}

run().catch((e) => {
  console.error('FALHA:', e.message)
  console.error('Sem a base consolidada, manter o cest.txt anterior (segmentos raiz).')
  process.exit(1)
})
