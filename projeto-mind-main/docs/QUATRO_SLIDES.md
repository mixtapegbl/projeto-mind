# SIE — Roteiro exatamente de 4 slides

> Estrutura de conteúdo para montar a apresentação. Adapte ao enunciado oficial e inclua as referências utilizadas pela equipe. Não são resultados de implantação real.

## Slide 1 — Problema e validação

**Título:** Incidentes não são apenas números altos.

**Ponto central:** sistemas com serviços interdependentes podem apresentar múltiplos sinais de degradação. A demora na interpretação e a falta de registro das decisões prejudicam a resposta.

**Demonstração:** antes/depois da injeção de cenário; taxa de erros, latência e pool. **Não** apresentar as métricas simuladas como validação de mercado.

**Como validar com usuários:** entrevistar operadores/estudantes de infraestrutura e aplicar teste de usabilidade com roteiro de incidentes.

## Slide 2 — Persona

**Persona hipotética para validação:** analista de operações de TI, responsável por monitorar serviços e explicar incidentes para outras equipes.

**Dores:** excesso de alertas isolados, falta de contexto, tempo gasto reunindo evidências.

**Necessidades:** ver correlação, entender limites, aprovar ação segura e comprovar o resultado.

**Atenção:** validar esta hipótese com usuários antes de apresentar como persona pesquisada.

## Slide 3 — Solução e tecnologia

**Bradesco Mind:** painel estático com motor de regras transparente, cenários de falha reproduzíveis, aprovação humana, verificação pós-resposta e histórico exportável.

**Tecnologia:** HTML, CSS e JavaScript ES Modules; armazenamento local e testes nativos Node.js. **Limite:** não acessa sistemas reais e não usa ML.

**Fluxo:** Coletar → Detectar → Correlacionar → Recomendar → Aprovar → Verificar → Registrar.

## Slide 4 — Valor e próximos passos

**Valor demonstrado no MVP:** rastreabilidade, explicabilidade das decisões, experiência interativa e segurança na demonstração acadêmica.

**Próxima evolução:** conexão autorizada a fontes reais, autenticação e perfis, trilha de auditoria em backend e teste controlado com operadores.

**Métrica futura proposta:** comparar tempo de triagem e completude do registro em testes com pessoas, sem declarar que houve redução real de MTTR.
