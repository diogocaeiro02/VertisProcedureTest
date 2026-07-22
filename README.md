# Manual de Procedimentos Vertis — versão estática

Este projeto utiliza apenas HTML, CSS, JavaScript e ficheiros CSV.

Não existe:
- upload de ficheiros na interface;
- base de dados;
- PHP;
- Python;
- framework;
- área de administração.

## Publicação

Pode ser publicado diretamente no GitHub Pages, Vercel ou noutro serviço de
alojamento estático.

## Adicionar um procedimento

1. Duplique `procedimentos/MODELO_PROCEDIMENTO.csv`.
2. Preencha o novo ficheiro.
3. Guarde-o dentro da pasta `procedimentos/`.
4. Abra `procedimentos/index.js`.
5. Acrescente o nome do novo CSV à lista:

```javascript
window.VERTIS_PROCEDURE_FILES = [
  "01_registo_ocorrencias.csv",
  "02_novo_procedimento.csv"
];
```

6. Faça commit e push.

O site passa a apresentar o novo procedimento automaticamente.

## Colunas obrigatórias

- `titulo`
- `categoria`
- `passo_numero`
- `passo_descricao`

## Colunas opcionais

- `id`
- `ordem`
- `responsavel`
- `objetivo`
- `passo_titulo`
- `prazo`
- `documentos`
- `observacoes`
- `ativo`
- `versao`
- `ultima_revisao`

Cada CSV representa um procedimento. Cada linha representa um passo.

## Pré-visualização local

O navegador pode bloquear a leitura dos CSV quando `index.html` é aberto
diretamente através de `file://`.

Para pré-visualizar localmente, utilize uma extensão como Live Server no VS Code
ou outro servidor HTTP estático. No GitHub Pages e no Vercel funciona
normalmente.


## Erro “Failed to fetch”

Esse erro aparece quando `index.html` é aberto diretamente através de
`file://`. O navegador não permite que uma página local leia automaticamente
outros ficheiros locais por `fetch()`.

Isto não acontece quando o projeto está publicado no GitHub Pages ou no Vercel.

### Pré-visualizar no Windows

Execute:

```text
previsualizar_windows.bat
```

Depois abra:

```text
http://127.0.0.1:8000
```

### Pré-visualizar no VS Code

1. Instale a extensão **Live Server**.
2. Clique com o botão direito em `index.html`.
3. Escolha **Open with Live Server**.


## Adicionar imagens aos passos

Guarde as imagens em:

```text
assets/imagens/procedimentos/
```

O CSV aceita estas colunas opcionais:

- `passo_imagem`
- `passo_imagem_alt`
- `passo_imagem_legenda`

Exemplo:

```csv
passo_imagem;passo_imagem_alt;passo_imagem_legenda
assets/imagens/procedimentos/registo-ocorrencias/01-receber-ocorrencia.webp;Exemplo de formulário de ocorrência;Dados necessários para o registo inicial.
```

Use caminhos relativos, nomes em minúsculas e, de preferência, imagens
`.webp`, `.png` ou `.jpg`.
