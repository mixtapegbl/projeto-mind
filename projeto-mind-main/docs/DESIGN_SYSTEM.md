# Design System — Bradesco Mind

## Direção visual

Central de operações séria e técnica, inspirada em interfaces de observabilidade. Hierarquia de informação e legibilidade prevalecem sobre efeitos decorativos; as antigas partículas foram removidas. Identidade acadêmica independente, sem reproduzir componentes oficiais do Banco Bradesco.

## Paleta

| Papel | Cor |
|---|---|
| Fundo principal | `#10151D` |
| Painel | `#19212C` |
| Linha / separador | `#2A3642` |
| Texto primário | `#EDF1F4` |
| Texto secundário | `#8F9DA9` |
| Vermelho de atenção/ação | `#EA3652` |
| Estado de atenção | `#EFB661` |
| Estado saudável | `#49C6A6` |

## Tipografia

- **DM Sans:** títulos, rótulos legíveis e textos de interface; fallback sistêmico.
- **IBM Plex Mono:** dados, horários, IDs, sinais técnicos e rótulos operacionais; fallback monoespaçado.

## Componentes

1. **Barra lateral:** navegação do centro de operações, incidentes e metodologia.
2. **Estado consolidado:** saúde, risco, fontes e quantidade de incidentes.
3. **Painel de cenários:** seleção de três falhas didáticas e reinício controlado.
4. **Indicadores:** valor, componente de origem, status e histórico em minigráfico.
5. **Motor de decisão:** diagnóstico, sinais, recomendação, salvaguarda e aprovação.
6. **Linha do tempo:** eventos ordenados com data e horário.
7. **Histórico:** lista de incidentes, status, detalhamento e exportação.
8. **Política de detecção:** regras públicas, limiares e explicação de limites do protótipo.

## Responsividade e acessibilidade

- Desktop: barra lateral fixa, cinco indicadores em linha quando há espaço, duas colunas de decisão e timeline.
- Tablet: barra lateral reduzida e indicadores em três colunas.
- Mobile: menu recolhido, indicadores em uma ou duas colunas, tabelas com rolagem interna.
- Foco visível para teclado; botões e campos sem dependência de hover; `aria-live` apenas para atualizações importantes.
- Suporte à preferência de movimento reduzido.
