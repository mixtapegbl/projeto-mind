# Demonstração de 3 a 4 minutos — Bradesco Mind

## Preparação

- Abrir o site em navegador atualizado; usar preferencialmente desktop e conexão estável.
- Confirmar que a tarja **AMBIENTE SIMULADO** está visível.
- Se houver histórico anterior e nenhum cenário ativo, usar **Limpar histórico** para começar do zero.
- Explicar que as métricas e ações são dados fictícios e que o motor usa regras determinísticas.

## Apresentação

**0:00–0:30 — Problema e solução.** "Em um sistema com uma API e um banco de dados, uma lentidão isolada não explica toda a falha. Nosso protótipo combina sinais para dar ao operador uma recomendação justificada e auditável."

**0:30–1:00 — Monitoramento.** Mostrar latência, erros, conexões, CPU e memória. Ir à seção *Como o MIND decide* e explicar os limiares. Duas fontes principais: API e banco.

**1:00–1:40 — Detecção.** Selecionar **03 — Falha correlacionada**. Clicar **Executar cenário**. Apontar a evolução dos valores, o risco e os sinais excedidos.

**1:40–2:20 — Decisão.** Mostrar recomendação e salvaguarda. Clicar **Rejeitar ação** e explicar que o sistema permanece degradado. Na trilha, mostrar a rejeição registrada.

**2:20–3:00 — Resposta e validação.** Clicar **Reconsiderar e aprovar**. Mostrar que a alteração é simulada e que o estado só se torna *Resolvido* depois da reavaliação.

**3:00–3:30 — Auditoria.** Abrir **Histórico de incidentes → Evidências**, conferir identificação, sinais, decisões e tempo do laboratório. Exportar JSON.

**3:30–4:00 — Limitações.** "Nossa solução não acessa o banco; ela é uma prova de conceito da lógica, da interação e do ciclo de incidentes. Em produção precisaríamos de integrações autorizadas, autenticação, persistência confiável e testes de segurança."

## Testes manuais antes de entregar

- [ ] A página abre na raiz do Netlify com estilos e scripts carregados.
- [ ] O ambiente inicial aparece saudável e os indicadores mostram valores.
- [ ] Cada um dos três cenários termina com incidente crítico.
- [ ] O botão aprovar **não** está disponível antes do incidente.
- [ ] Rejeitar ação mantém a degradação no painel e registra a decisão.
- [ ] Reconsiderar e aprovar conclui a recuperação simulada com evidência.
- [ ] Normalizar manualmente **não** apresenta a ação como recuperação automática.
- [ ] Histórico lista as ocorrências e abre detalhes com valores e horários.
- [ ] JSON e CSV são baixados e contêm dados dos incidentes.
- [ ] Recarregar a página preserva os incidentes resolvidos.
- [ ] Layout mobile tem menu funcional e não possui rolagem horizontal da página.
- [ ] `npm test` encerra sem falhas.

## Critério de pronto

O avaliador consegue provocar uma anomalia, entender por que ela é crítica, decidir se deve agir, verificar o resultado e consultar o registro — **sem acesso a sistemas reais**.
