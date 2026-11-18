# Especificação de requisitos — Bradesco Mind

## 1. Contexto e problema

Sistemas críticos precisam correlacionar métricas de serviços e dependências para evitar respostas baseadas em um único indicador. Em ambientes reais, intervenções precipitadas podem ampliar impactos e perder rastreabilidade. Para demonstrar esse problema com segurança, o Bradesco Mind simula a observação de dois componentes (API PIX e banco de dados), identifica desvios, recomenda uma resposta e exige decisão humana, mantendo evidências.

## 2. Escopo do MVP

**Incluído:** cenários com telemetria sintética; cinco indicadores; motor de regras; recomendação; aprovação/rejeição; recuperação simulada; validação; histórico e exportação; interface adaptável.

**Fora do escopo:** autenticação bancária, acesso a dados de clientes, integração com sistemas do Bradesco, mutações em sistemas reais, alta disponibilidade e armazenamento multiusuário.

**Perfil:** operador de monitoramento ou analista de confiabilidade que precisa decidir a partir de sinais e manter evidências.

## 3. Requisitos funcionais

| ID | Requisito | Justificativa | Critério de aceite |
|---|---|---|---|
| RF01 | Exibir indicadores de API, banco e infraestrutura | Visibilidade de fontes distintas | Cinco valores atualizados ao executar cenário |
| RF02 | Executar cenários reproduzíveis | Permite avaliação pela banca | Três cenários disponíveis e determinísticos |
| RF03 | Avaliar limites de atenção e criticidade | Evita alerta arbitrário | A classificação respeita exatamente os limiares publicados |
| RF04 | Identificar falhas correlacionadas | Consolida sinais relevantes | Incidente conjunto inclui evidências da API e do banco |
| RF05 | Recomendar ação por tipo de incidente | Apoia a decisão | Texto é adequado ao cenário e explicita salvaguarda |
| RF06 | Permitir aprovar ou rejeitar | Evita intervenção sem controle | Nenhuma recuperação é executada antes de aprovação |
| RF07 | Validar resultado após a simulação | Evita falso sucesso | Estado resolvido exige nova telemetria saudável |
| RF08 | Registrar trilha de auditoria | Proporciona rastreabilidade | Histórico mostra ocorrência, sinais, decisão, horário e status |
| RF09 | Exportar evidências | Permite comprovar as etapas | JSON e CSV baixados localmente |
| RF10 | Recuperar histórico da sessão anterior | Facilita revisão | Reabrir a página preserva incidentes concluídos |

## 4. Requisitos não funcionais

| ID | Requisito | Justificativa | Evidência verificável |
|---|---|---|---|
| RNF01 | Aplicação estática e sem credenciais | Reduz superfície de risco e custo | Abre em servidor estático |
| RNF02 | Compatível com desktop e celular | Acesso durante apresentação | Layout de 390 px a telas largas sem scroll horizontal externo |
| RNF03 | Navegável por teclado | Acessibilidade | Links, botões, seletor e histórico acessíveis via Tab |
| RNF04 | Sem intervenção em sistemas reais | Segurança | Somente mudanças no estado do navegador |
| RNF05 | Resultado reproduzível | Facilita avaliação e testes | Cenário final produz sempre os mesmos sinais |
| RNF06 | Transparência do funcionamento | Evita marketing enganoso | Política e limites publicados no painel |

## 5. Regras de negócio (MVP)

- **RN01:** cada métrica possui um limiar inclusivo de atenção e um de criticidade (`JS/engine.mjs`).
- **RN02:** uma ocorrência crítica surge quando duas métricas são críticas **ou** uma é crítica e pelo menos duas estão em atenção.
- **RN03:** se uma métrica não for numérica, o motor responde `unknown` e não declara o sistema saudável.
- **RN04:** o índice de risco é um indicador didático, calculado por `3 + 23 × (críticas) + 9 × (atenção) + 12` quando API e banco estão simultaneamente degradados, limitado a 100. Não é probabilidade calibrada.
- **RN05:** a recomendação utiliza os sinais mais críticos. Uma hipótese de correlação não confirma causa raiz.
- **RN06:** nenhum botão inicia intervenção sem aprovação expressa do operador.
- **RN07:** rejeitar uma proposta não normaliza o cenário; a decisão fica em histórico.
- **RN08:** somente a verificação de retorno à condição saudável autoriza marcar o incidente como `resolved`.
- **RN09:** a normalização manual registra um encerramento manual, **não** uma recuperação automática.
- **RN10:** recarregar a página enquanto há incidente aberto registra `interrupted` e preserva o histórico.

## 6. Backlog priorizado

| Prioridade | História de usuário | Aceite verificável |
|---|---|---|
| P0 | Como operador, quero monitorar API PIX e banco para observar disponibilidade | Valores e componentes visíveis e coerentes |
| P0 | Como operador, quero simular falha para testar detecção sem afetar clientes | Injeção altera apenas valores locais |
| P0 | Como operador, quero ver por que um incidente foi detectado para justificar minha decisão | Mostra os sinais, valores e limites excedidos |
| P0 | Como operador, quero aprovar uma recomendação para controlar a intervenção | Aprovação precede recuperação simulada |
| P0 | Como auditor, quero identificar rejeições e encerramentos manuais para evitar atribuir sucesso incorreto | Histórico distingue todos os estados |
| P1 | Como operador, quero reavaliar indicadores após resposta para verificar normalização | Resolve somente depois de nova avaliação saudável |
| P1 | Como auditor, quero exportar os eventos para apresentá-los à equipe | JSON detalhado e CSV de resumo disponíveis |
| P1 | Como avaliador, quero entender as regras aplicadas para reproduzir a demonstração | Limites e explicações acessíveis na interface |
| P2 | Como operador, quero utilizar o painel no celular para apresentação em qualquer dispositivo | Layout responsivo e menu móvel |

**Critério de priorização:** P0 = ciclo obrigatório ponta a ponta; P1 = evidência e confiabilidade; P2 = conveniência da interface.

## 7. Riscos e limites

- A conexão entre API PIX e banco é uma relação **simulada**, sem observabilidade verdadeira nem diagnóstico causal.
- O registro está em `localStorage`. Um usuário pode apagá-lo; não serve como trilha de auditoria inviolável de produção.
- A detecção de múltiplos sinais é uma heurística determinística. Não há modelo de ML treinado nem previsão probabilística.
- O tempo de resposta é da simulação local, e não um MTTR comparável a operações bancárias reais.
- Não existem dados pessoais ou de clientes no ambiente.

## 8. Rastreabilidade de implementação

- Regras, métricas e cenários: `JS/engine.mjs`.
- Botões, ciclo do incidente, eventos, persistência e exportação: `JS/app.mjs`.
- Interface, estados e tabela de limites: `index.html` e `CSS/style.css`.
- Testes automatizados: `tests/engine.test.mjs`.
