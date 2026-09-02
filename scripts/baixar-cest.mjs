// Monta dados/cest.txt a partir do Convenio ICMS 142/2018 (Anexos I a XXVI).
// Nao ha API oficial estavel do CEST; a fonte pratica e a base publicada pelo
// projeto "cest" (dados abertos consolidados). Ajuste FONTE_URL se necessario.
//
// Formato de saida: codigo|ncm|descricao|segmento
//   codigo   NN.NNN.NN
//   ncm      8 digitos (pode repetir codigo p/ NCMs diferentes)
//   segmento nome do anexo (Autopecas, Bebidas, ...)
//
// Uso:  node scripts/baixar-cest.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados', 'cest.txt')

// Base consolidada em JSON (lista de { cest, ncm, descricao, segmento }).
// Trocar para a fonte que voce preferir manter.
const FONTE_URL = 'https://raw.githubusercontent.com/vinigracindo/cest/master/data/cest.json'

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

const limpa = (s) => String(s || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim()

const run = async () => {
  console.log('Baixando CEST de', FONTE_URL)
  const resp = await fetch(FONTE_URL, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const arr = await resp.json()
  if (!Array.isArray(arr) || !arr.length) throw new Error('resposta vazia ou formato inesperado')

  const linhas = arr
    .map((it) => {
      const cestBruto = String(it.cest || it.CEST || '').replace(/\D/g, '')
      if (cestBruto.length !== 7) return null
      const codigo = `${cestBruto.slice(0, 2)}.${cestBruto.slice(2, 5)}.${cestBruto.slice(5, 7)}`
      const ncm = String(it.ncm || it.NCM || '').replace(/\D/g, '').slice(0, 8)
      const descricao = limpa(it.descricao || it.descricao_oficial || it.description)
      const segmento = SEGMENTOS[cestBruto.slice(0, 2)] || ''
      if (!descricao) return null
      return `${codigo}|${ncm}|${descricao}|${segmento}`
    })
    .filter(Boolean)

  // dedup por codigo+ncm
  const map = new Map()
  for (const l of linhas) {
    const [c, n] = l.split('|')
    map.set(`${c}|${n}`, l)
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
