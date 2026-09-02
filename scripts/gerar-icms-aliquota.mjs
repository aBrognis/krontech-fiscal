// Gera dados/icms_aliquota.txt — matriz de aliquotas de ICMS:
//   - interna por UF (uf_origem = '**')
//   - interestadual (Resolucao Senado 22/1989): 7% do Sul/Sudeste (exceto ES)
//     para N/NE/CO + ES; 12% nos demais casos. (4% p/ importados e no CST/CSOSN,
//     tratado no motor fiscal, nao aqui.)
//
// As aliquotas internas mudam com frequencia (cada estado legisla a sua). Os
// valores abaixo sao a base 2024/2025 — revisar a cada mudanca de LC estadual.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados', 'icms_aliquota.txt')

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

// aliquota interna padrao (revisar periodicamente)
const INTERNA = {
  AC: 19, AL: 19, AP: 18, AM: 20, BA: 20.5, CE: 20, DF: 20, ES: 17, GO: 19, MA: 22,
  MT: 17, MS: 17, MG: 18, PA: 19, PB: 20, PR: 19.5, PE: 20.5, PI: 21, RJ: 20, RN: 18,
  RS: 17, RO: 19.5, RR: 20, SC: 17, SP: 18, SE: 19, TO: 20,
}

const SUL_SUDESTE = new Set(['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'])
const N_NE_CO_ES = new Set(['AC','AL','AP','AM','BA','CE','MA','PB','PE','PI','RN','SE','TO','DF','GO','MT','MS','RO','RR','PA','ES'])

const linhas = []
for (const uf of UFS) linhas.push(`**|${uf}|${INTERNA[uf]}|interna|2024-01-01`)
for (const o of UFS) {
  for (const d of UFS) {
    if (o === d) continue
    const aliq = SUL_SUDESTE.has(o) && N_NE_CO_ES.has(d) ? 7 : 12
    linhas.push(`${o}|${d}|${aliq}|interestadual|2019-01-01`)
  }
}

writeFileSync(OUT, linhas.join('\n') + '\n')
console.log(`icms_aliquota.txt: ${linhas.length} linhas`)
