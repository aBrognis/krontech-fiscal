// Sanidade dos arquivos de dados: numero de campos por linha, codigos no
// formato esperado, sem linhas vazias no meio. Roda no CI e trava o merge se
// algo estiver fora do formato que o KronTech espera importar.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DADOS = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados')

const REGRAS = {
  'cfop.txt':              { campos: 4, valida: (c) => /^\d{4}$/.test(c[0]) },
  'ncm.txt':               { campos: 3, valida: (c) => /^\d{2,8}$/.test(c[0]) },
  'cest.txt':              { campos: 4, valida: (c) => /^\d{2}\.\d{3}\.\d{2}$/.test(c[0]) },
  'cst_icms.txt':          { campos: 3, valida: (c) => /^\d{2,3}$/.test(c[0]) && ['normal', 'simples'].includes(c[1]) },
  'cclass_trib.txt':       { campos: 4, valida: (c) => /^\d{6}$/.test(c[0]) },
  'icms_aliquota.txt':     { campos: 5, valida: (c) => /^(\*\*|[A-Z]{2})$/.test(c[0]) && /^[A-Z]{2}$/.test(c[1]) && Number(c[2]) >= 0 },
  'tributo_transicao.txt': { campos: 8, valida: (c) => /^20\d{2}$/.test(c[0]) },
}

let erros = 0
for (const [arquivo, regra] of Object.entries(REGRAS)) {
  let linhas
  try {
    linhas = readFileSync(join(DADOS, arquivo), 'utf-8').split('\n')
  } catch {
    console.error(`FALTA: ${arquivo}`)
    erros++
    continue
  }
  let n = 0
  linhas.forEach((linha, i) => {
    if (linha === '' && i === linhas.length - 1) return // newline final ok
    if (linha.trim() === '') { console.error(`${arquivo}:${i + 1} linha vazia`); erros++; return }
    const campos = linha.split('|')
    if (campos.length !== regra.campos) {
      console.error(`${arquivo}:${i + 1} esperava ${regra.campos} campos, achou ${campos.length}`)
      erros++
      return
    }
    if (!regra.valida(campos)) {
      console.error(`${arquivo}:${i + 1} formato invalido: ${linha.slice(0, 60)}`)
      erros++
      return
    }
    n++
  })
  console.log(`${erros ? 'x' : 'ok'} ${arquivo}: ${n} linhas`)
}

if (erros) {
  console.error(`\n${erros} erro(s). Corrija antes de publicar.`)
  process.exit(1)
}
console.log('\nTodos os arquivos validos.')
