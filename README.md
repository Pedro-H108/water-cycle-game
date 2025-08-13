Jogue online clicando no link [AQUI](https://pedro-h108.github.io/water-cycle-game/)
---
# Jogo Educativo — Ciclo da Água (JS Puro)

Este projeto implementa o teste prático proposto: um ODA simples onde o aluno associa **descrições** às **etapas do ciclo da água**. O jogo é **dinâmico**, lendo os dados a partir de `jogo.json`, e segue boas práticas de organização, acessibilidade e código limpo.

## 🔧 Tecnologias

- HTML5 + CSS3 + **JavaScript puro**
- Sem dependências externas
- Sons gerados via **Web Audio API** (sem arquivos de áudio)

## 🧩 Como jogar

- **Arraste** cada descrição e **solte** no nome correto **ou**
- **Selecione** a descrição com **Enter/Espaço** e depois **Enter/Espaço** sobre o alvo correspondente
- Cada acerto vale **+1 ponto**
- Ao final, a tela de resultados mostra **pontuação** e **tempo**

## ♿ Acessibilidade

- Alternativa ao drag-and-drop via clique/teclado
- Foco visível, elementos interativos com `role` e `aria-*`
- Modo **alto contraste** (`Alto contraste` no topo)

## 🧪 Estrutura do conteúdo (automação via JSON)

O jogo é montado **dinamicamente** com base no arquivo `jogo.json`:

```json
{
  "titulo": "Capítulo 3 - O Ciclo da Água",
  "etapas": [
    { "nome": "Evaporação", "descricao": "..." },
    { "nome": "Condensação", "descricao": "..." },
    { "nome": "Precipitação", "descricao": "..." },
    { "nome": "Infiltração", "descricao": "..." }
  ]
}
```

- Você pode **trocar o tema** e **quantidade de etapas** apenas alterando esse arquivo.
- O código **não** contém textos fixos de conteúdo.

## 📁 Estrutura de pastas

```
raiz/
├─ index.html
├─ style.css
├─ script.js
└─ jogo.json
```

## ▶️ Executar localmente

Abra `index.html` no navegador. Para evitar cache do JSON, o `fetch` usa `cache: 'no-cache'`.

> Dica: se o navegador bloquear `fetch` para arquivos locais (alguns bloqueiam `file://`), sirva a pasta com um servidor simples, por exemplo:
>
> **Python 3**: `python -m http.server 8080` e acesse `http://localhost:8080`

## 🧱 Boas práticas adotadas

- Código isolado em IIFE para não poluir o escopo global
- Funções **pequenas** e **coesas**
- Nomes **expressivos**
- Sem dependências externas
- Separação de responsabilidades (montagem, estado, validação, timer)
- Feedback auditivo e textual (aria-live) para acessibilidade
- CSS responsivo, com alto contraste opcional

## 🚀 Extensões sugeridas (fáceis de replicar)

- Temporizador com contagem regressiva (atual é progressivo)
- Níveis de dificuldade (mais etapas, embaralhamento de textos e títulos)
- Persistência de resultados no `localStorage`
- Testes unitários de funções puras (ex.: `shuffle`)

## 🏗️ Escalabilidade — Reflexão (para dezenas de capítulos)

1. **Modelo de dados estável**: padronizar o JSON com um schema (ex.: `titulo`, `etapas[]`, `nome`, `descricao`). Validar na carga (ex.: `Ajv` em projetos maiores).
2. **Motor de renderização genérico**: manter o jogo independente do tema, renderizando **targets** e **cards** a partir de quaisquer dados fornecidos.
3. **Separação de skins/temas**: estilos, ícones e textos de interface separados em um **theme** (CSS/JSON) para reuso.
4. **Múltiplos jogos**: carregar diferentes JSONs via query string (`?conteudo=agua.json`) ou roteamento simples.
5. **Build/Deploy automatizados**: linha de montagem que recebe um lote de JSONs, valida, injeta em um template e publica versões.
6. **Telemetria**: coletar (com consentimento) métricas de uso e acertos para calibrar a dificuldade.
7. **Acessibilidade como regra**: garantir que novos conteúdos mantenham navegação por teclado e contrastes adequados.
