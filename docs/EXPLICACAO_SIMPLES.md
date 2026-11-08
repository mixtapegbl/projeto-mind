# Como explicar o Bradesco Mind ao professor

**O que o site faz?** O Bradesco Mind é uma demonstração de monitoramento de sistemas bancários. Ele percebe números fora do normal, avisa o que aconteceu e sugere o que fazer.

**Problema que queremos resolver:** em um banco, um serviço como o PIX pode ficar lento ou falhar. A equipe de tecnologia precisa perceber isso e agir rapidamente.

**Tecnologias que usamos:** HTML (estrutura), CSS (visual), JavaScript (regras e botões) e armazenamento local do navegador (histórico). Não usamos backend nem acesso real aos sistemas do Bradesco.

## Os cinco indicadores
- **Tempo do PIX:** quanto maior o valor em milissegundos, mais lento está o serviço.
- **Erros do PIX:** porcentagem de pedidos que falharam.
- **Conexões do banco:** quantas das 100 conexões estão ocupadas.
- **CPU:** porcentagem de uso do processador.
- **Memória:** quantos GB dos 8 GB estão em uso.

## Como o programa decide
Imagine uma comparação simples: `if (cpu >= 90)`, marcamos a CPU como crítica. O código faz essa comparação para cinco indicadores. Se **dois indicadores estão críticos**, ou **um está crítico e dois estão em atenção**, o site registra um problema crítico. Esses limites são fictícios, criados apenas para simular o desafio.

## Demonstração em 1 minuto
1. 'Aqui vemos se o PIX e o banco de dados estão funcionando bem.'
2. 'Vou simular um problema. Percebam que os números pioraram.'
3. 'O JavaScript compara cada número com um limite e mostra um alerta.'
4. 'O site sugere uma solução, mas uma pessoa precisa aprovar.'
5. 'Depois da aprovação, simulamos a melhora e registramos tudo no histórico.'

## O que é real e o que é simulado
- **É real no código:** clicar, comparar números, gerar alerta, pedir decisão, registrar e exportar histórico.
- **É simulado:** os números, a falha, a solução e a melhora dos sistemas.
- **Não existe:** integração com o banco ou execução de comandos em servidores reais.
