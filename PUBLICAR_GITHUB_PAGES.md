# Publicação no GitHub Pages

## Estrutura obrigatória

Os seguintes ficheiros devem ficar diretamente na origem publicada:

```text
/
├── index.html
├── styles.css
├── app.js
├── .nojekyll
└── procedimentos/
    ├── index.js
    ├── 01_registo_ocorrencias.csv
    ├── 02_pagamento_fornecedores.csv
    ├── 03_preparacao_assembleia.csv
    └── MODELO_PROCEDIMENTO.csv
```

Não coloque apenas o `index.html` na raiz deixando o CSS dentro de outra pasta.

## Configuração recomendada

Em **Settings → Pages**:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

Caso tenha escolhido `/docs`, todos os ficheiros acima devem estar dentro da
pasta `docs`.

## Testar o CSS

Abra no navegador:

```text
https://UTILIZADOR.github.io/REPOSITORIO/styles.css
```

Se aparecer uma página 404, o ficheiro não está na origem publicada ou o nome
não corresponde exatamente.

O nome deve ser:

```text
styles.css
```

A capitalização é importante no alojamento:

```text
styles.css    correto
Styles.css    diferente
style.css     diferente
```

## Atualização

Depois de corrigir os ficheiros:

1. Faça commit e push.
2. Aguarde o GitHub Pages concluir a publicação.
3. Abra o site numa janela privada ou faça uma atualização forçada:
   - Windows: `Ctrl + F5`
   - macOS: `Cmd + Shift + R`
