# GEDREG — Gestão de Documentos Regulatórios Obrigatórios
## MSB Produtos Médicos

### Contexto do projeto

Sistema de gestão de validade e alertas automáticos de documentos regulatórios obrigatórios para empresa fabricante de produtos médicos das linhas de endourologia, endovascular, cardiologia e cirurgia cardíaca/torácica (cateteres, bainhas introdutoras, fio-guia e correlatos — Classe I, II, III e IV).

Normas regulatórias aplicáveis:
- RDC 665/2022 (SBPF — Boas Práticas de Fabricação)
- ISO 13485 (Sistema de Gestão da Qualidade)
- RDC 751/2022 (Registro de Produtos Médicos)
- RDC 848/2024 (Autorização de Funcionamento / CLF)
- CONAMA 237/1997 (Licença Ambiental)

---

### Stack atual

- React 18 + Vite
- CSS inline / Tailwind (sem compilador — apenas classes utilitárias pré-definidas)
- Armazenamento: `localStorage` (chave `msb-gedreg-v1`)
- Sem backend — aplicação 100% client-side

---

### Estrutura de arquivos

```
gedreg/
├── CLAUDE.md
├── README.md
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx       ← entry point React
    ├── App.jsx        ← componente principal GEDREG (toda a lógica aqui)
    └── index.css      ← reset + variáveis base
```

---

### Lógica de status de documentos

Os status são calculados com base no **prazo de solicitação de renovação** (não apenas na validade):

| Status | Condição |
|---|---|
| `VENCIDO` | dataValidade < hoje |
| `ATRASADO` (SOLICIT. VENCIDA) | prazo de solicitação < hoje, mas documento ainda válido |
| `CRÍTICO` | 0–30 dias até o prazo de solicitação |
| `ATENÇÃO` | 31–60 dias até o prazo |
| `ALERTA` | 61–120 dias até o prazo |
| `REGULAR` | > 120 dias até o prazo |
| `AUTOMÁTICO` | renovacaoAutomatica = true |
| `INDETERMINADO` | sem dataValidade (ex: AFE) |

---

### Prazos por base legal

| Documento | Antecedência | Base Legal |
|---|---|---|
| CBPF (Classe III e IV) | 120 dias | RDC 665/2022 / ISO 13485 |
| Alvará Sanitário | 120 dias | VISA Municipal / Recomendação ANVISA |
| Licença Ambiental (LU) | 120 dias | CONAMA 237/1997, Art. 18, § único |
| Corpo de Bombeiros | 120 dias | Decreto Estadual CBMBA |
| Certidão de Regularidade Técnica | 120 dias | Conselho de Classe |
| CLF (Cert. Licença Funcionamento) | 60 dias | RDC 848/2024 / ANVISA |
| Alvará de Funcionamento | 30 dias | Legislação Municipal |
| Certidão da Polícia Civil | 30 dias | FISPROCEM / Polícia Civil da Bahia |

---

### Dados iniciais (seed)

Os 11 documentos em `DOCS0` (dentro de `App.jsx`) foram importados da planilha Excel original da empresa. Ao expandir para backend, essa constante deve ser migrada para seed de banco de dados.

---

### Próximos passos sugeridos para evolução

1. **Backend + banco de dados**: Node.js (Express ou Fastify) + PostgreSQL ou SQLite. Migrar `localStorage` para API REST.
2. **Autenticação**: Login por empresa / usuário. Multi-tenant se necessário.
3. **Notificações**: Envio automático de e-mail (ex: nodemailer + cron) quando status muda para CRÍTICO ou ATRASADO.
4. **Exportação**: Geração de relatório PDF (ex: jsPDF ou Puppeteer) e exportação para Excel (xlsx).
5. **Histórico de renovações**: Tabela de auditoria com timestamped de cada alteração de documento.
6. **Multi-empresa**: Suporte a múltiplas unidades/CNPJs com permissionamento por perfil.
7. **Integração ANVISA**: Consulta automática de status de AFE/CLF/CBPF via web scraping ou API pública.
8. **Gestão de registros de produtos**: Módulo complementar para acompanhamento de validade de registros (RDC 751/2022).

---

### Convenções de código

- Componente principal exportado como `export default function App()` em `src/App.jsx`
- Nenhuma prop obrigatória no componente raiz
- Funções de cálculo (`calcStatus`, `calcPrazoDate`, `fmt`, `dv`, `dp`) são puras e testáveis
- IDs de documentos gerados com `uid()` — substituir por UUID v4 ao migrar para backend
