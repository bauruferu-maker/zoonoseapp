# ZoonoseApp — Produto: Funcionalidades e Roadmap

---

## Visão do Produto

Transformar o controle de zoonoses municipal de um processo reativo e analógico em um sistema de inteligência epidemiológica em tempo real — começando pela substituição do cartão físico.

---

## Usuários do Sistema

| Perfil | Quem é | O que usa |
|--------|--------|-----------|
| Agente de campo | Agente de endemias/zoonoses | App mobile |
| Coordenador | Chefe de setor/distrito | Painel web |
| Gestor | Secretário de Saúde | Dashboard executivo |
| Morador (futuro) | Cidadão | App cidadão (fase 3) |

---

## MVP — O que precisa existir no Dia 1

### App Mobile (agente de campo)

**Visita ao imóvel:**
- [ ] Login com CPF + senha
- [ ] Escanear QR code do imóvel → carrega histórico do endereço
- [ ] Formulário de visita:
  - Tipo de visita (rotina / retorno / denúncia)
  - Situação do imóvel (normal / foco encontrado / fechado / recusou visita)
  - Tipo de foco (caixa d'água, pneu, calha, lona, outros)
  - Ação tomada (eliminado / tratado / pendente)
  - Foto do foco (obrigatória quando encontrado)
  - Observações livres
- [ ] Modo offline — funciona sem internet, sincroniza ao retornar
- [ ] Visualizar histórico das últimas 3 visitas ao imóvel

**Rota do dia:**
- [ ] Lista de imóveis a visitar (definida pelo coordenador)
- [ ] Mapa com endereços do dia
- [ ] Marcar imóvel como visitado / ausente / recusou

### Painel Web (coordenador/gestor)

**Mapa operacional:**
- [ ] Mapa com status de cada imóvel (visitado hoje / pendente / foco encontrado)
- [ ] Filtro por agente, bairro, data
- [ ] Visualização de focos ativos em tempo real

**Gestão de imóveis:**
- [ ] Cadastro de imóveis por endereço
- [ ] Histórico completo de visitas por imóvel
- [ ] Imóveis com foco recorrente (flag automático)

**Gestão de agentes:**
- [ ] Cadastro de agentes
- [ ] Definição de rotas/setores por agente
- [ ] Produtividade diária por agente (imóveis visitados)

**Relatórios básicos:**
- [ ] Total de visitas por período
- [ ] Total de focos por tipo
- [ ] Imóveis pendentes de visita
- [ ] Exportação CSV

---

## Fase 2 — Inteligência (meses 4–9)

- [ ] **Mapa de calor** — concentração de focos por bairro/quadra
- [ ] **Alertas automáticos** — cluster de 3+ focos em raio de 200m dispara notificação para coordenador
- [ ] **Priorização automática de rotas** — imóveis com histórico de foco sobem na fila
- [ ] **Ciclos de visita** — controle de quantos dias sem visita por imóvel
- [ ] **Dashboard executivo** — indicadores para secretário: cobertura %, focos ativos, tendência
- [ ] **Score de risco por bairro** — índice de risco calculado por densidade de focos + cobertura de visitas

---

## Fase 3 — Integração e Expansão (meses 10–18)

- [ ] **Exportação SINAN** — notificação de casos ao Ministério da Saúde em formato padrão
- [ ] **App do cidadão** — morador escaneia o QR da própria casa, vê histórico de visitas e solicita visita
- [ ] **Integração com casos confirmados** — cruzar dados de focos com casos notificados (SINAN)
- [ ] **Multi-endemia** — adaptar para leptospirose, raiva animal, leishmaniose
- [ ] **API aberta** — integração com sistemas estaduais de vigilância

---

## Diferenciais Técnicos Críticos

### 1. Offline-first obrigatório
Agentes trabalham em áreas sem sinal. O app deve funcionar 100% offline e sincronizar de forma inteligente quando houver conexão. Usar SQLite local + sync queue.

### 2. QR code resiliente
O QR code no imóvel precisa funcionar mesmo se o app estiver offline. O ID do imóvel deve estar embutido no QR, não depender de lookup online.

### 3. Dados geoespaciais
PostgreSQL + PostGIS para queries geoespaciais (raio de focos, densidade por área, mapa de calor). Fundamental para a fase de inteligência.

### 4. Performance no campo
App leve, que funcione em celulares Android básicos (modelo ~R$ 600). Agentes não usam iPhone.

---

## Stack Técnica Recomendada

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| App mobile | React Native + Expo | Android + iOS, uma base de código, fácil de contratar |
| Sync offline | WatermelonDB ou MMKV + queue | Sync robusto e testado |
| Backend | Node.js (Fastify) ou Python (FastAPI) | Rápido, fácil de contratar no Brasil |
| Banco de dados | PostgreSQL + PostGIS | Geoespacial nativo, open source |
| Mapas | Mapbox GL | Mapas offline, customizáveis |
| Infra | AWS (ECS + RDS) ou Render.com | Escalável, certificações de segurança |
| Auth | JWT + refresh tokens | Simples e seguro |
| Storage fotos | AWS S3 | Barato, confiável |

---

## Requisitos Não-Funcionais (críticos para vender para prefeitura)

| Requisito | Especificação |
|-----------|--------------|
| Disponibilidade | 99,5% uptime (SLA contratual) |
| Segurança | LGPD compliant — dados de saúde são sensíveis |
| Backup | Backup diário automático, retenção 5 anos |
| Suporte | Atendimento em horário comercial, SLA 4h resposta |
| Treinamento | Incluso no contrato (presencial no início) |
| Auditoria | Log de todas as ações (quem fez o quê, quando) |

---

## Roadmap Visual

```
MÊS 1–2    MÊS 3–4    MÊS 5–6    MÊS 7–9    MÊS 10–12   ANO 2+
   │           │           │           │            │          │
[Design]   [Dev MVP]  [Piloto]   [Intelig.]  [Integr.]  [Expansão]
[UX/UI]    [App+Web]  [5k imóv]  [Mapa calor][SINAN]    [+municípios]
[Cadastro] [Offline]  [Ajustes]  [Alertas]   [App cidadão][Multi-endemia]
[Imóveis]  [QR code]  [Contrato] [Dashboard] [API aberta]
```

---

## Prototipagem Rápida (próximos 30 dias)

Para validar com a Secretaria de Saúde **sem código**, usar:

1. **Figma** — protótipo navegável do app e do painel web
2. **Google Forms + Sheets** — simular o formulário de visita
3. **Google Maps** — demonstrar o conceito de mapa de focos
4. **Apresentação com mockups** — mostrar ao secretário como ficaria

Isso permite validar o interesse antes de investir em desenvolvimento.
