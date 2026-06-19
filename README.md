# GEDREG
### Gestão de Documentos Regulatórios Obrigatórios
**MSB Produtos Médicos**

Sistema de acompanhamento de validade e alertas automáticos de documentos regulatórios obrigatórios para empresa fabricante de produtos médicos. Desenvolvido conforme requisitos da RDC 665/2022, ISO 13485, RDC 751/2022, RDC 848/2024 e demais legislações vigentes.

---

## Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo desenvolvimento
npm run dev
# Abre automaticamente em http://localhost:5173

# 3. Build para produção
npm run build

# 4. Visualizar build de produção
npm run preview
```

**Requisitos:** Node.js >= 18

---

## Funcionalidades

- Painel de alertas com documentos que exigem ação imediata
- Status calculado automaticamente com base no prazo de solicitação (não apenas na validade)
- Filtros por status com contadores
- Modal de detalhe com linha do tempo visual
- Cadastro e edição de documentos com prazo auto-calculado em tempo real
- Dados persistidos via `localStorage`

## Status de documentos

| Status | Condição |
|---|---|
| VENCIDO | Documento fora do prazo de validade |
| SOLICIT. VENCIDA | Prazo para protocolar renovação já venceu (documento ainda válido) |
| CRÍTICO | 0–30 dias até o prazo de solicitação de renovação |
| ATENÇÃO | 31–60 dias até o prazo |
| ALERTA | 61–120 dias até o prazo |
| REGULAR | Mais de 120 dias até o prazo |
| AUTOM. | Renovação automática |
| INDEF. | Sem data de vencimento (ex: AFE) |

---

## Base legal dos prazos de alerta

| Documento | Antecedência | Base Legal |
|---|---|---|
| CBPF (Classe III e IV) | 120 dias | RDC 665/2022 / ISO 13485 |
| Alvará Sanitário | 120 dias | VISA Municipal / Recomendação ANVISA |
| Licença Ambiental (LU) | 120 dias | CONAMA 237/1997, Art. 18, § único |
| CLF | 60 dias | RDC 848/2024 / ANVISA |
| Certidão Polícia Civil | 30 dias | FISPROCEM / Polícia Civil da Bahia |

---

## Próximas evoluções (ver CLAUDE.md)

- Backend com Node.js + PostgreSQL
- Autenticação de usuários
- Notificações automáticas por e-mail
- Exportação para PDF e Excel
- Histórico de renovações (trilha de auditoria)
- Integração com sistemas ANVISA
