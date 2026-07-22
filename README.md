# Manual de Procedimentos Vertis

Manual interno para consulta de procedimentos operacionais da Vertis — Gestão de Condomínios.

O projeto foi desenvolvido como uma aplicação web estática, leve e fácil de manter. Os procedimentos são guardados em ficheiros CSV e apresentados automaticamente numa interface organizada, pesquisável e adaptada a computador, tablet e telemóvel.

---

## Visão geral

O manual permite:

- consultar procedimentos por categoria;
- pesquisar por título, responsável, objetivo, passo, documento ou observação;
- expandir e recolher procedimentos;
- ordenar os resultados;
- abrir ligações diretas para um procedimento específico;
- apresentar imagens associadas aos passos;
- imprimir o manual com uma formatação adequada;
- publicar diretamente no GitHub Pages ou noutro alojamento estático.

Não utiliza base de dados, servidor aplicacional ou frameworks.

---

## Tecnologias

- HTML
- CSS
- JavaScript
- CSV
- GitHub Pages

---

## Estrutura do projeto

```text
/
├── index.html
├── styles.css
├── app.js
├── .nojekyll
├── README.md
├── PUBLICAR_GITHUB_PAGES.md
│
├── procedimentos/
│   ├── index.js
│   ├── MODELO_PROCEDIMENTO.csv
│   ├── 01_registo_ocorrencias.csv
│   ├── 02_pagamento_fornecedores.csv
│   └── 03_preparacao_assembleia.csv
│
└── assets/
    └── imagens/
        └── procedimentos/
            └── registo-ocorrencias/
                ├── 01-receber-ocorrencia.webp
                ├── 02-classificar-registar.webp
                ├── 03-acompanhar-resolucao.webp
                └── 04-encerrar-ocorrencia.webp
```

---

## Adicionar um procedimento

### 1. Criar o CSV

Duplicar o ficheiro:

```text
procedimentos/MODELO_PROCEDIMENTO.csv
```

Dar um nome claro ao novo ficheiro:

```text
04_validacao_contratos.csv
```

Recomendações:

- usar letras minúsculas;
- evitar espaços;
- evitar acentos;
- usar `_` para separar palavras;
- manter uma numeração inicial para facilitar a organização.

### 2. Preencher o procedimento

Cada ficheiro CSV representa um procedimento.

Cada linha representa um passo desse procedimento.

As colunas obrigatórias são:

```text
titulo
categoria
passo_numero
passo_descricao
```

As restantes colunas permitem acrescentar informação complementar:

```text
id
ordem
responsavel
objetivo
passo_titulo
passo_imagem
passo_imagem_alt
passo_imagem_legenda
prazo
documentos
observacoes
ativo
versao
ultima_revisao
```

### 3. Registar o ficheiro

Abrir:

```text
procedimentos/index.js
```

Adicionar o nome do novo ficheiro à lista:

```javascript
window.VERTIS_PROCEDURE_FILES = [
  "01_registo_ocorrencias.csv",
  "02_pagamento_fornecedores.csv",
  "03_preparacao_assembleia.csv",
  "04_validacao_contratos.csv"
];
```

Após o commit e push, o procedimento passa a estar disponível no manual.

---

## Formato do CSV

Exemplo simplificado:

```csv
id;titulo;categoria;ordem;responsavel;objetivo;passo_numero;passo_titulo;passo_descricao;prazo;documentos;observacoes;ativo;versao;ultima_revisao
PROC-FIN-001;Pagamento a fornecedores;Contabilidade;20;Departamento Financeiro;Garantir a validação das despesas antes do pagamento.;1;Conferir a fatura;Validar fornecedor, valores, IVA e vencimento.;Antes do pagamento;Fatura e orçamento aprovado;Suspender o processo em caso de divergência.;1;1.0;2026-07-21
```

O separador utilizado é o ponto e vírgula:

```text
;
```

O ficheiro deve ser guardado em UTF-8.

---

## Imagens nos procedimentos

As imagens são opcionais e podem ser associadas a cada passo.

### Colunas disponíveis

```text
passo_imagem
passo_imagem_alt
passo_imagem_legenda
```

### Exemplo no CSV

```csv
passo_imagem;passo_imagem_alt;passo_imagem_legenda
assets/imagens/procedimentos/registo-ocorrencias/01-receber-ocorrencia.webp;Formulário de registo de uma ocorrência;Dados necessários para o registo inicial.
```

### Organização recomendada

```text
assets/
└── imagens/
    └── procedimentos/
        └── nome-do-procedimento/
            ├── 01-primeiro-passo.webp
            ├── 02-segundo-passo.webp
            └── 03-terceiro-passo.webp
```

Boas práticas:

- preferir imagens `.webp`;
- usar nomes em minúsculas;
- não usar espaços nos nomes;
- preencher sempre o texto alternativo;
- utilizar caminhos relativos;
- não começar o caminho por `/`;
- confirmar que o nome no CSV corresponde exatamente ao ficheiro.

O GitHub Pages distingue maiúsculas de minúsculas.

```text
imagem.webp
Imagem.webp
```

São considerados ficheiros diferentes.

---

## Ativar ou desativar um procedimento

A coluna `ativo` controla a apresentação do procedimento.

Procedimento ativo:

```text
1
```

Procedimento inativo:

```text
0
```

Um procedimento inativo continua no repositório, mas não é apresentado no manual.

---

## Ordem dos procedimentos

A coluna `ordem` controla a posição dentro da categoria.

Exemplo:

```text
10
20
30
40
```

Utilizar intervalos de dez permite inserir novos procedimentos entre os existentes sem alterar todos os valores.

---

## Publicação no GitHub Pages

No repositório, abrir:

```text
Settings → Pages
```

Configurar:

```text
Source: Deploy from a branch
Branch: main
Folder: /(root)
```

A estrutura principal deve estar diretamente na raiz publicada:

```text
index.html
styles.css
app.js
procedimentos/
assets/
```

Após guardar a configuração, aguardar a conclusão do workflow em:

```text
Actions
```

O endereço será semelhante a:

```text
https://utilizador.github.io/nome-do-repositorio/
```

---

## Pré-visualização local

Abrir diretamente o `index.html` através de `file://` pode impedir a leitura dos CSV devido às regras de segurança do navegador.

A forma recomendada é utilizar um servidor local.

### VS Code

1. Instalar a extensão **Live Server**.
2. Clicar com o botão direito em `index.html`.
3. Selecionar **Open with Live Server**.

### Python

Na pasta do projeto:

```bash
python -m http.server 8000
```

Depois abrir:

```text
http://127.0.0.1:8000
```

---

## Manutenção

Antes de publicar uma alteração:

1. confirmar que o CSV abre corretamente;
2. verificar se as colunas obrigatórias estão preenchidas;
3. confirmar a numeração dos passos;
4. validar os caminhos das imagens;
5. testar a pesquisa e os filtros;
6. confirmar a apresentação em computador e telemóvel;
7. fazer commit com uma descrição clara.

Exemplo:

```bash
git add .
git commit -m "Adiciona procedimento de validação de contratos"
git push
```

---

## Convenções recomendadas

### Ficheiros CSV

```text
01_registo_ocorrencias.csv
02_pagamento_fornecedores.csv
03_preparacao_assembleia.csv
```

### Pastas de imagens

```text
registo-ocorrencias
pagamento-fornecedores
preparacao-assembleia
```

### Identificadores

```text
PROC-OPE-001
PROC-FIN-001
PROC-ADM-001
```

### Versões

```text
1.0
1.1
2.0
```

---

## Resolução de problemas

### O site aparece sem estilos

Confirmar que este endereço abre o ficheiro CSS:

```text
https://utilizador.github.io/repositorio/styles.css
```

Caso devolva erro 404:

- confirmar que `styles.css` está na raiz publicada;
- confirmar que o nome está escrito exatamente da mesma forma;
- confirmar a configuração do GitHub Pages.

### Os procedimentos não aparecem

Verificar:

- se o CSV está dentro de `procedimentos/`;
- se o nome foi adicionado a `procedimentos/index.js`;
- se as colunas obrigatórias existem;
- se `ativo` está definido como `1`;
- se o nome do ficheiro respeita maiúsculas e minúsculas.

### Uma imagem não aparece

Verificar:

- se o ficheiro existe no repositório;
- se o caminho no CSV está correto;
- se a extensão corresponde ao ficheiro real;
- se o caminho não começa por `/`;
- se não existem diferenças entre maiúsculas e minúsculas.

---

## Responsabilidade de manutenção

Este manual é um documento operacional interno.

As alterações devem ser revistas antes da publicação, garantindo que:

- a informação está atualizada;
- os responsáveis estão corretamente identificados;
- os passos são claros e executáveis;
- os documentos associados estão disponíveis;
- a versão e a data de revisão foram atualizadas.
