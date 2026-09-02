# krontech-fiscal

Tabelas de referência fiscal do **KronTech** — CFOP, NCM, CEST, CST/CSOSN,
cClassTrib (Reforma Tributária), alíquotas de ICMS e a tabela de transição
CBS/IBS 2026–2033.

O app KronTech já vem com uma cópia empacotada destes arquivos. Este repositório
é a **fonte de atualização**: o botão *"Verificar atualizações"* na tela
**Cadastros → Tabelas Fiscais** compara o `manifesto.json` publicado aqui com o
que está embutido no app e avisa quando há versão mais nova. O botão
*"Importar / Atualizar"* de cada tabela então re-semeia os dados **sem
sobrescrever linhas que o usuário editou** (marcadas com `origem = 'manual'`).

## Estrutura

```
manifesto.json            versão, hash, nº de linhas e fonte de cada tabela
dados/
  cfop.txt                codigo|descricao|tipo|grupo
  ncm.txt                 codigo|descricao|aliquota_ipi
  cest.txt                codigo|ncm|descricao|segmento
  cst_icms.txt            codigo|regime|descricao          (regime: normal|simples)
  cclass_trib.txt         codigo|descricao|tributo|cst_reforma
  icms_aliquota.txt       uf_origem|uf_destino|aliquota|tipo|vigencia_ini   (uf_origem='**' = interna)
  tributo_transicao.txt   ano|cbs|ibs_uf|ibs_mun|icms_fator|iss_fator|pis_cofins_ativo|observacao
scripts/
  baixar-ncm.mjs          baixa a NCM/SH do Portal Único Siscomex (Receita)
  baixar-cest.mjs         monta o CEST do Convênio ICMS 142/2018
  gerar-icms-aliquota.mjs  gera a matriz de alíquotas de ICMS
  atualizar-manifesto.mjs  recalcula hash/linhas/versão de cada arquivo
  validar.mjs             checa formato de todos os arquivos (trava o CI)
.github/workflows/
  atualizar-tabelas.yml   mensal: baixa, valida, recalcula manifesto, abre PR
```

Todos os arquivos são **UTF-8, separados por `|`, uma linha por registro**,
sem cabeçalho, com `\n` no final. Sem acento nas descrições (o KronTech aplica
`unaccent` na busca; manter ASCII evita divergência entre fontes).

## Formato do `manifesto.json`

```jsonc
{
  "gerado_em": "2026-09-02",
  "base_raw": "https://raw.githubusercontent.com/aBrognis/krontech-fiscal/main/dados/",
  "tabelas": {
    "cfop": {
      "versao": "2026.09.02",       // AAAA.MM.DD; sobe só quando o hash muda
      "arquivo": "cfop.txt",
      "url": "https://raw.githubusercontent.com/.../dados/cfop.txt",
      "linhas": 666,
      "hash": "<sha256>",
      "fonte": "Convênio SINIEF s/n de 1970",
      "fonte_url": "https://www.confaz.fazenda.gov.br/..."
    }
    // ...
  }
}
```

O KronTech lê `manifesto.json` da `main` via `raw.githubusercontent.com`. Um
`manifesto.json` opcional **empacotado** no app (`migrations/data/manifesto.json`)
serve de baseline para o "há versão X.Y disponível". Sem esse arquivo local, o
app trata tudo como "empacotada" e considera qualquer versão remota como mais
nova.

## Fluxo de atualização

### Automático (CI)

O workflow `atualizar-tabelas.yml` roda todo dia 1º:

1. `baixar-ncm.mjs` + `baixar-cest.mjs` + `gerar-icms-aliquota.mjs`
2. `validar.mjs` (trava se algum arquivo saiu do formato)
3. `atualizar-manifesto.mjs` (recalcula hash/linhas; sobe `versao` só do que mudou)
4. abre um **Pull Request** — nunca faz push direto na `main`

Revisar o diff e fazer merge. A partir daí os apps veem a nova versão.

### Manual

```bash
npm run atualizar      # baixa tudo, valida e recalcula o manifesto
git add -A && git commit -m "chore: atualiza tabelas <data>" && git push
```

Para editar uma tabela à mão (ex.: corrigir uma alíquota interna de ICMS):
edite o `.txt`, rode `npm run validar && npm run manifesto`, commite.

## Fontes oficiais

| Tabela | Fonte |
|---|---|
| CFOP | Convênio SINIEF s/nº 1970 e Ajustes SINIEF — CONFAZ |
| NCM | Tabela NCM/SH — Portal Único Siscomex / Receita Federal |
| CEST | Convênio ICMS 142/2018, Anexos I a XXVI — CONFAZ |
| CST / CSOSN | Ajuste SINIEF 07/2005 e Anexo do Simples Nacional |
| cClassTrib | NT 2025.002 da NF-e (Reforma Tributária) — **preliminar** |
| Alíquotas ICMS interestaduais | Resolução do Senado 22/1989 |
| Alíquotas ICMS internas | legislação de cada UF — **revisar a cada mudança** |
| Transição CBS/IBS | EC 132/2023 e LC 214/2025 — **valores de referência** |

⚠️ `cclass_trib` e `tributo_transicao` estão marcados como *preliminares* no
manifesto (`versao` com sufixo `-preliminar`). Atualizar quando a
regulamentação da Reforma for finalizada.

## Aviso

Este material é um apoio operacional, não orientação fiscal. Confira sempre a
legislação vigente para o seu caso. As alíquotas internas de ICMS e os números
da Reforma mudam por lei e podem estar desatualizados entre uma publicação e
outra.
