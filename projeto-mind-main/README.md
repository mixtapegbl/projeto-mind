# Bradesco Mind — Challenge Bradesco (FIAP)

## Explicação simples
O site mostra como uma equipe de tecnologia pode perceber que um serviço bancário está com problemas e decidir o que fazer. É um **simulador**, não um sistema real do Bradesco.

**O aluno consegue demonstrar cinco passos:**
1. Ver números do PIX e do banco de dados.
2. Simular um problema e disparar um alerta quando os números passam do limite.
3. Entender por que o alerta surgiu e ler uma solução sugerida.
4. Aprovar ou rejeitar a solução. Se aprovar, ver a recuperação fictícia.
5. Consultar o histórico para explicar o que aconteceu.

## Tecnologias
- **HTML:** organiza o conteúdo.
- **CSS:** cria o visual e adapta o site ao celular.
- **JavaScript:** compara números, muda o estado do painel e registra decisões.
- **localStorage:** guarda o histórico no mesmo navegador, sem banco de dados externo.

Não há API bancária, servidor próprio ou ação real em serviços bancários. Os limites e valores dos cenários são fictícios e escolhidos para o trabalho.

## Apresentação
Abra o painel, escolha “Vários problemas juntos”, clique em “Simular problema”, explique os indicadores em vermelho, aprove a solução e mostre o histórico. O arquivo `docs/EXPLICACAO_SIMPLES.md` contém um roteiro de fala e uma explicação das regras.

## Como executar
Com o VS Code, abra a pasta e use a extensão **Live Server**. Ou, no terminal, rode `python3 -m http.server 8080` e abra `http://localhost:8080`. Não abra diretamente pelo protocolo `file://` porque o site usa módulos JavaScript.

## Testes
`npm test` (Node.js 20 ou superior). Não precisa de `npm install`.

## Publicação
É um site estático. No Netlify, use a raiz do repositório como pasta de publicação, sem comando de build.

## Aviso
Este é um projeto acadêmico independente da FIAP. Não é um produto oficial do Bradesco nem está conectado aos seus sistemas.
