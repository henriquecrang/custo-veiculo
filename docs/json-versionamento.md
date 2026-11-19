# Persistência e compatibilidade JSON

**Esquema atual:** `schemaVersion: 1` (declarado em `model/config.js`).

- Autosave apenas quando a configuração atual é válida; tentativas de inserir texto/número inválido não sobrescrevem o último estado íntegro.
- Recuperação local pelo `localStorage`, sem conta, API ou envio dos dados a servidores.
- Exportação: JSON integral com as premissas, jamais cálculos congelados. O mesmo JSON e a versão do motor reproduzem a simulação.
- Importação: parse + validação **antes** de pedir confirmação para substituir os dados; erro não altera a simulação atual.
- Restaurar default também pede confirmação. Recomenda-se exportar antes de substituir.
- `schemaVersion` desconhecido é rejeitado com aviso; não se tenta migrar campos silenciosamente.
- Nesta primeira versão, não existe versão antiga de schema a migrar. Quando for criada a V2, implementar funções explícitas `migrateV1ToV2`, fixtures e regressão de round-trip.
- `localStorage` pode estar indisponível em privacidade estrita; exportar o JSON permanece alternativa.

**Privacidade:** evitar incluir informações cadastrais, placa, identificadores pessoais ou documentos privados. O repositório e o site são públicos, mas os JSONs locais pertencem ao usuário.
