# Modelo de corridas (negócio)

Define como a empresa atende pedidos dos clientes.

| Valor | Significado |
|-------|-------------|
| `INSTANTANEAS` | Frota atende “agora”; aparece no marketplace instantâneo |
| `AGENDAMENTO` | Principal para **agendadas** dos clientes vinculados; **instantâneas** desses clientes vão a outra fornecedora elegível |
| `AMBOS` | Aceita instantâneo e agendamento |

## Status inicial da corrida

Depende do modelo da **empresa responsável** + presença de `scheduled_date` → [../05-corridas/status.md](../05-corridas/status.md)

## Resolução (cliente com prefs `COMPANY`)

```
Agendada     → empresa principal do cliente
Instantânea + principal INSTANTANEAS/AMBOS → principal
Instantânea + principal AGENDAMENTO       → marketplace (≠ principal, modelo instantâneo)
```

Sem GPS: marketplace ordena por nº de motoristas ATIVOS / nome.

## Relaciona

- Settings UI → [settings.md](settings.md)
- Resolução completa → [../05-corridas/resolucao-fornecedor.md](../05-corridas/resolucao-fornecedor.md)
- Fornecedor cliente → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
