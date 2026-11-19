# Comparabilidade entre comprar e assinar — Issue #23

## Objetivo

O simulador estima **o custo financeiro das estratégias selecionadas**. Não demonstra que veículos e contratos oferecem o mesmo serviço. A comparação financeira é exploratória quando a equivalência não foi confirmada.

## Metadados adicionados (opcionais em JSON versão 1)

- `vehicle.category` e `subscription.category`: `compact`, `sedan`, `suv`, `other` ou `unknown`.
- `vehicle.condition` e `subscription.condition`: `new`, `used` ou `unknown`.
- `subscription.contractMonths`: meses declarados de contrato. Campo informativo; **não altera o fluxo** de pagamentos do motor.
- `subscription.equivalenceConfirmed`: declaração manual do usuário, `false` por padrão, após comparar equipamentos, categoria, cobertura, idade, quilometragem, contrato e serviço efetivamente disponível.

Configurações JSON antigas sem esses campos permanecem válidas; atributos ausentes **não** são interpretados como verificados. O horizonte `horizonMonths` continua sendo o número de meses de disponibilidade **modelada** para compra e assinatura, pois o motor atual cobra assinatura todos os meses do horizonte. O prazo declarado do contrato é apresentado separadamente, para evitar concluir que uma assinatura curta permite uso prolongado sem reajuste, renovação ou multa.

## Estados da comparação

| Estado | O que significa |
| --- | --- |
| `not-applicable` | Somente compra ou somente assinatura selecionada; não existe comparação cruzada |
| `mismatch` | Informações declaradas indicam diferenças relevantes de categoria, novo/seminovo ou duração da assinatura |
| `unverified` | Não foi informado/confirmado que as alternativas são suficientemente equivalentes |
| `confirmed` | Usuário confirmou a equivalência e os metadados declarados não contradizem a afirmação |

Quando `mismatch` ou `unverified`, a interface exibe **menor custo simulado**, jamais “melhor veículo” nem recomendação absoluta. O resultado continua utilizável para explorar preços, mas um valor de assinatura mensal artificialmente baixo para um veículo menor não deveria ser interpretado como economia equivalente.

## Convenções e limites

- Nomes de veículos diferentes são alerta de verificação; não impedem confirmação pelo usuário quando dois modelos realmente são comparáveis.
- Dados de `subscription.contractMonths` diferentes do horizonte geram alerta. **O motor não recalcula nem antecipa o contrato**: mantém cobrança mensal durante todo o horizonte, portanto sua cotação pode ser inviável na realidade.
- Quilometragem, serviços incluídos, qualidade, localização de uso e regras de sinistro **não são verificados** automaticamente; confirmação manual não substitui leitura da proposta.
- Diferenças de período efetivamente locado versus comprado exigem implementar a Issue #27, que adicionará disponibilidade intermitente explícita. Até lá, a disponibilidade modelada é de N meses em todos os cenários.
- A ausência de metadados nunca constitui evidência de equivalência. Cada nova simulação deve começar sem confirmação.
- O status pertence ao diagnóstico da comparação; **não interfere em nenhuma fórmula de custo**.
