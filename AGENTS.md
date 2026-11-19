# Diretrizes para agentes — Custo Veículo

Antes de implementar, leia [docs/plano-projeto.md](docs/plano-projeto.md) e [docs/workflow-desenvolvimento.md](docs/workflow-desenvolvimento.md). O plano e a especificação financeira prevalecem sobre soluções ad hoc na interface.

## Regras obrigatórias
1. Desenvolvimento por **issue → branch → commits → Pull Request → CI → revisão → merge**. Nunca fazer push diretamente na `main`.
2. Branches: `feat/<issue>-nome`, `fix/<issue>-nome`, `docs/<issue>-nome` ou `chore/<issue>-nome`.
3. Commits com Conventional Commits e referência à issue; cada PR deve trazer código, testes e documentação afetados.
4. O motor financeiro é independente do DOM e deve expor fluxos de caixa mês a mês. A UI não recalcula regras econômicas.
5. Separar custo nominal, custo econômico equivalente, saldo de dívida, patrimônio residual e liquidez. Nunca duplicar depreciação, juros ou oportunidade nas decomposições.
6. Premissas de mercado são **estimativas editáveis e datadas**, não propostas confirmadas. Contratos prevalecem sobre exemplos comerciais.
7. Resultados de regressão precisam ser reproduzíveis: cada mudança de regra requer testes independentes e ajuste da especificação.
8. Não integrar PR sem conferir `npm test`, execução de `regression` no commit corrente e revisão do diff; job ausente, pendente ou falho não equivale a sucesso.
9. Marcar issue como concluída apenas após entrega integral confirmada. Usar `Closes #N` só se todos os critérios forem atendidos; em outros casos usar `Refs #N`.
10. Não adicionar dados pessoais, tokens, contratos identificáveis ou documentos privados ao repositório público.
11. Proteção da `main` é configuração do GitHub, independente destes arquivos. Não afirmar que foi habilitada sem verificação do servidor.

O usuário autorizou mudanças técnicas reversíveis e autônomas. Alterações econômicas de alto impacto devem ser bem documentadas e testadas; não alterar histórico ou ignorar verificações para acelerar merges.
