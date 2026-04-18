# ZoonoseApp — Modelo Financeiro

**Versão:** 3.0 — Março 2026
**Base:** Estimativas com dados nacionais do SUS e IBGE

---

## 1. Mercado Endereçável

### Uberlândia (mercado âncora)
- População: ~750.000 habitantes
- Domicílios: ~290.000 imóveis
- Orçamento saúde municipal: ~R$ 1,2 bilhão/ano
- Custo estimado da dengue/ano: R$ 15–20 milhões (só atendimentos diretos)

### Brasil (mercado total)
- 5.570 municípios
- Municípios com +50k habitantes (público-alvo prioritário): ~350 municípios
- Municípios com +100k habitantes: ~120 municípios
- Total de domicílios nos 350 municípios prioritários: ~35 milhões

---

## 2. Estrutura de Custos — QR Code por Imóvel

### Premissas de custo de material
| Tipo | Custo unitário (escala) | Durabilidade |
|------|------------------------|--------------|
| Adesivo vinil UV/chuva | R$ 0,80 – R$ 1,20 | 5–7 anos |
| Placa PVC 5×5cm | R$ 1,50 – R$ 2,00 | 8–10 anos |
| Placa alumínio composto | R$ 4,00 – R$ 6,00 | 15+ anos |

**Recomendação:** Placa PVC a R$ 2,00/unidade — equilíbrio custo/durabilidade

### Custo de implantação por município
| Município | Imóveis estimados | Custo placas (R$ 2,00) | Instalação |
|-----------|------------------|------------------------|------------|
| Uberlândia | 290.000 | R$ 580.000 | R$ 0 (agentes) |
| Cidade média (200k hab.) | 75.000 | R$ 150.000 | R$ 0 |
| Cidade pequena (15k hab.) | 5.500 | R$ 11.000 | R$ 0 |

**Nota:** Instalação tem custo zero — agentes de endemias já fazem visitas rotineiras. A placa é fixada na primeira visita após contratação.

---

## 3. Modelo Comercial — Implantação + Mensalidade

### Lógica do modelo

```
IMPLANTAÇÃO (cobrada uma vez)
  Cobre: placas QR + cadastro inicial dos imóveis
         configuração do ambiente + treinamento presencial

MENSALIDADE (recorrente — receita previsível)
  Cobre: licença do app + painel web
         infraestrutura em nuvem + suporte
         atualizações e novas funcionalidades
```

### Tabela de preços por faixa de habitantes

| Faixa | Habitantes | Implantação | Mensalidade | Total ano 1 | Renovação/ano |
|-------|-----------|-------------|-------------|-------------|---------------|
| F1 | até 15k | R$ 8.000 | R$ 2.000/mês | R$ 32.000 | R$ 24.000 |
| F2 | 15–30k | R$ 15.000 | R$ 3.500/mês | R$ 57.000 | R$ 42.000 |
| F3 | 30–60k | R$ 25.000 | R$ 6.000/mês | R$ 97.000 | R$ 72.000 |
| F4 | 60–100k | R$ 38.000 | R$ 9.000/mês | R$ 146.000 | R$ 108.000 |
| F5 | 100–200k | R$ 60.000 | R$ 15.000/mês | R$ 240.000 | R$ 180.000 |
| F6 | 200–350k | R$ 90.000 | R$ 23.000/mês | R$ 366.000 | R$ 276.000 |
| F7 | 350–500k | R$ 120.000 | R$ 30.000/mês | R$ 480.000 | R$ 360.000 |
| F8 | 500–750k | R$ 160.000 | R$ 36.250/mês | R$ 595.000 | R$ 435.000 |
| F9 | 750k–1M | R$ 200.000 | R$ 45.000/mês | R$ 740.000 | R$ 540.000 |

**Teto inicial:** 1.000.000 habitantes — municípios maiores negociados caso a caso

---

## 4. Planos — Lite e Pro

| | **Lite** | **Pro** |
|--|---------|--------|
| App mobile (agente) | ✓ | ✓ |
| Painel web (gestor) | ✓ | ✓ |
| QR code por imóvel | ✓ | ✓ |
| Modo offline | ✓ | ✓ |
| Histórico por imóvel | ✓ | ✓ |
| Foto do foco + evidência | — | ✓ |
| IA classificação de foco | — | ✓ |
| Relatório automático por IA | — | ✓ |
| Mapa de calor preditivo | — | ✓ |
| Dispositivo | BYOD (agente) | Prefeitura fornece |
| **Preço** | **Tabela base** | **+30% sobre base** |

---

## 5. Estrutura de Custos — Empresa

### 5.1 Desenvolvimento do MVP (fase 0 — antes do primeiro cliente pagar)

#### Opção A — Equipe PJ freelancer (bootstrap)
| Papel | Perfil | Duração | Custo total |
|-------|--------|---------|-------------|
| Dev mobile React Native | Pleno PJ (~R$ 8k/mês part-time) | 5 meses | R$ 40.000 |
| Dev backend Node.js/Python | Pleno PJ (~R$ 8k/mês part-time) | 5 meses | R$ 40.000 |
| Designer UX/UI | Freelancer por projeto | — | R$ 8.000 |
| **Total MVP (bootstrap)** | | | **R$ 88.000** |

#### Opção B — Devs full-time (acelerar entrega em 3 meses)
| Papel | Perfil | Duração | Custo total |
|-------|--------|---------|-------------|
| Dev mobile React Native | Pleno PJ (~R$ 12k/mês) | 3 meses | R$ 36.000 |
| Dev backend Node.js/Python | Pleno PJ (~R$ 12k/mês) | 3 meses | R$ 36.000 |
| Designer UX/UI | Freelancer por projeto | — | R$ 10.000 |
| **Total MVP (acelerado)** | | | **R$ 82.000** |

> **Referência de mercado 2026:** Dev React Native pleno PJ = R$ 8–14k/mês. Dev backend pleno PJ = R$ 7–13k/mês. Designer UX projeto app = R$ 6–12k.

---

### 5.2 Custo das Placas QR Code (implantação nos municípios)

| Volume | Tipo | Custo unitário | Custo total |
|--------|------|---------------|-------------|
| 500 un. | Adesivo vinil UV | R$ 1,50 | R$ 750 |
| 5.000 un. | Placa PVC 5×5cm | R$ 1,20 | R$ 6.000 |
| 10.000 un. | Placa PVC 5×5cm | R$ 0,90 | R$ 9.000 |
| 50.000 un. | Placa PVC 5×5cm | R$ 0,65 | R$ 32.500 |
| 290.000 un. | Placa PVC 5×5cm (Uberlândia) | R$ 0,55 | R$ 159.500 |

**Estratégia de custo:** As placas são fornecidas pela prefeitura como material de implantação — o custo está embutido na taxa de implantação cobrada. A prefeitura licita separado ou inclui no contrato.

**Alternativa licitável:** A prefeitura pode licitar as placas separadamente via dispensa de licitação (até R$ 57.900 — 2026), tornando o processo mais simples.

---

### 5.3 Infraestrutura Cloud (AWS) — Custo mensal

#### Fase piloto (1–3 municípios, ~200 usuários)
| Serviço | Especificação | USD/mês | BRL/mês (R$5,80) |
|---------|--------------|---------|-----------------|
| EC2 t3.small (API) | 2 vCPU, 2GB RAM | ~$15 | ~R$ 87 |
| RDS PostgreSQL t3.micro | 1 vCPU, 1GB | ~$18 | ~R$ 104 |
| S3 + CloudFront (fotos, assets) | ~50GB + 100GB transfer | ~$8 | ~R$ 46 |
| Elastic Load Balancer | Básico | ~$18 | ~R$ 104 |
| Certificado SSL (ACM) | Gratuito | $0 | R$ 0 |
| **Total fase piloto** | | **~$59/mês** | **~R$ 342/mês** |

#### Fase crescimento (5–20 municípios, ~2.000 usuários)
| Serviço | Especificação | USD/mês | BRL/mês |
|---------|--------------|---------|---------|
| EC2 t3.medium (2 instâncias) | 2 vCPU, 4GB RAM × 2 | ~$60 | ~R$ 348 |
| RDS PostgreSQL t3.medium | 2 vCPU, 4GB | ~$70 | ~R$ 406 |
| S3 + CloudFront | ~500GB + 1TB transfer | ~$55 | ~R$ 319 |
| Load Balancer + extras | — | ~$30 | ~R$ 174 |
| **Total fase crescimento** | | **~$215/mês** | **~R$ 1.247/mês** |

#### Fase escala (50+ municípios, ~10.000 usuários)
| Serviço | USD/mês | BRL/mês |
|---------|---------|---------|
| EC2 auto-scaling + RDS Multi-AZ | ~$500 | ~R$ 2.900 |
| S3 + CDN + extras | ~$200 | ~R$ 1.160 |
| **Total fase escala** | **~$700/mês** | **~R$ 4.060/mês** |

---

### 5.4 APIs de IA (apenas plano Pro)

| Serviço | Uso | Custo |
|---------|-----|-------|
| Google Vision API (classificação de imagem) | Primeiras 1.000 imagens/mês | **Gratuito** |
| Google Vision API | 1.001–5.000.000 imagens | $1,50 por 1.000 imagens (~R$ 8,70) |
| Estimativa: 500 agentes × 5 fotos/dia × 22 dias | ~55.000 imagens/mês | ~R$ 479/mês |
| Firebase Cloud Messaging (push) | Ilimitado | **Gratuito** |
| OpenAI API (relatórios automáticos) | ~500 relatórios/mês (GPT-4o-mini) | ~$5 (~R$ 29/mês) |

> **Conclusão:** Custo de IA para o plano Pro é ~R$ 500–600/mês para 1 município grande. Já está coberto pelo adicional de 30% do plano Pro.

---

### 5.5 Equipe Operacional (pós-lançamento)

| Papel | Regime | Custo/mês |
|-------|--------|-----------|
| Dev full-stack manutenção (part-time) | PJ 20h/semana | R$ 6.000 |
| Analista de suporte técnico | PJ | R$ 4.000 |
| Contador (startup de software, Simples Nacional) | Escritório contábil | R$ 800 |
| Consultoria jurídica contratos gov. (retainer) | Advogado especialista licitações | R$ 1.500 |
| Marketing/comercial (você mesmo na fase 0) | — | R$ 0 |
| **Total equipe operacional** | | **R$ 12.300/mês** |

---

### 5.6 Custos Únicos (abertura e habilitação)

| Item | Custo estimado |
|------|---------------|
| Abertura de empresa (MEI → ME ou SLU) | R$ 500–1.500 |
| Certificado digital e-CNPJ (3 anos) | R$ 300–500 |
| Cadastro SICAF + habilitação licitações | R$ 0 (gratuito) |
| Registro de marca INPI (classes 9 e 42) | R$ 890 × 2 = R$ 1.780 |
| **Total custos de abertura** | **~R$ 4.000** |

---

### 5.7 Custo Operacional Total por Estágio

```
FASE PILOTO (mês 1–12, 1–2 municípios):
  Dev manutenção (part-time):     R$  6.000
  Suporte técnico:                R$  4.000
  Infraestrutura cloud:           R$    342
  APIs de IA (se Pro):            R$    500
  Contador + jurídico:            R$  2.300
  ─────────────────────────────────────────
  TOTAL CUSTO MENSAL:             R$ 13.142

FASE CRESCIMENTO (mês 13–36, 5–15 municípios):
  Dev manutenção (full-time):     R$ 12.000
  Suporte técnico (2 pessoas):    R$  8.000
  Infraestrutura cloud:           R$  1.247
  APIs de IA:                     R$  2.000
  Contador + jurídico:            R$  2.300
  Comercial/vendas (1 pessoa):    R$  6.000
  ─────────────────────────────────────────
  TOTAL CUSTO MENSAL:             R$ 31.547

FASE ESCALA (36+ meses, 50+ municípios):
  Equipe técnica (3 devs):        R$ 36.000
  Suporte (3 pessoas):            R$ 12.000
  Infraestrutura cloud:           R$  4.060
  APIs de IA:                     R$  8.000
  Contador + jurídico:            R$  4.000
  Comercial (2 pessoas):          R$ 12.000
  ─────────────────────────────────────────
  TOTAL CUSTO MENSAL:             R$ 76.060
```

---

### 5.8 Margens Revisadas por Estágio

```
FASE PILOTO — 2 municípios (F1 + F8):
  Receita mensal:    R$ 38.250  (R$2k + R$36.250)
  Custo operação:    R$ 13.142
  Margem bruta:      R$ 25.108  (66%)

FASE CRESCIMENTO — 10 municípios (mix F2–F6):
  Receita mensal:    R$ 120.000
  Custo operação:    R$ 31.547
  Margem bruta:      R$ 88.453  (74%)

FASE ESCALA — 50 municípios:
  Receita mensal:    R$ 520.000
  Custo operação:    R$ 76.060
  Margem bruta:      R$ 443.940  (85%)
```

> **Nota:** As margens melhoram com escala porque infra e jurídico são custos fixos diluídos. SaaS B2G tem margens melhores que B2C porque churn é baixíssimo (prefeitura não troca sistema a cada ano).

---

## 6. Projeção de Crescimento

### Cenário conservador

| Ano | Novos municípios | Carteira total | Receita mensal | Receita anual |
|-----|-----------------|----------------|----------------|---------------|
| 1 | 2 (piloto F1 + Uberlândia F8) | 2 | R$ 38.250 | R$ 459.000 |
| 2 | +5 (mix F2–F4) | 7 | R$ 73.750 | R$ 885.000 |
| 3 | +8 (mix F3–F6) | 15 | R$ 165.000 | R$ 1.980.000 |
| 4 | +15 (mix F2–F7) | 30 | R$ 310.000 | R$ 3.720.000 |
| 5 | +20 (mix F2–F8) | 50 | R$ 520.000 | R$ 6.240.000 |

### Cenário otimista (Ata de Registro de Preços)
Se Uberlândia licitar via ARP, outros municípios aderem sem novo processo. Potencial de 30–80 municípios em 3 anos.

---

## 7. ROI para a Prefeitura — Uberlândia

### Custo estimado da dengue (base: dados SUS 2024)

| Tipo de atendimento | Custo unitário | Volume estimado | Total anual |
|--------------------|---------------|-----------------|-------------|
| Consulta ambulatorial | R$ 180 | 60.000 | R$ 10.800.000 |
| Internação dengue clássica | R$ 2.500 | 2.500 | R$ 6.250.000 |
| Internação UTI dengue grave | R$ 8.000 | 200 | R$ 1.600.000 |
| **Custo direto SUS** | | | **R$ 18.650.000** |
| Custo indireto (absenteísmo, produtividade) | | | **~R$ 55.950.000** |
| **Custo total estimado** | | | **~R$ 74.600.000** |

### Economia com ZoonoseApp (redução conservadora)

```
REDUÇÃO ESPERADA COM RESPOSTA EM < 24H (vs. 15 dias hoje):

Internações evitadas (20% redução):
  500 internações × R$ 2.500 = .............. R$ 1.250.000

UTI evitadas (20% redução):
  40 casos × R$ 8.000 = ..................... R$   320.000

Consultas evitadas (15% redução):
  9.000 × R$ 180 = .......................... R$ 1.620.000

Ganho operacional (agentes 25% mais produtivos):
  Equivalente a 8 agentes extras sem contratar.. R$   480.000
────────────────────────────────────────────────────────────
ECONOMIA TOTAL ESTIMADA:                        R$ 3.670.000/ano
CUSTO DO SISTEMA (implantação amortizada + mensalidade): R$ 635.000/ano
────────────────────────────────────────────────────────────
ROI:                                            5,8x
PAYBACK:                                        < 2 meses
```

**Para cada R$ 1,00 investido no ZoonoseApp, Uberlândia economiza R$ 5,80.**

---

## 8. Fontes e Premissas

- IBGE Censo 2022 — domicílios e população por município
- DataSUS SIH/SUS — custo médio de internações hospitalares
- Ministério da Saúde — boletins epidemiológicos dengue 2024 (6,6M casos, 5.900 óbitos)
- OPS/OMS — estudos de ROI de controle vetorial digital: redução de 20–35% com digitalização
- Lei 14.133/2021 — dispensa de licitação, pregão eletrônico, Ata de Registro de Preços
- Ciclo biológico Aedes aegypti: 7–10 dias do ovo ao adulto (fonte: Fiocruz)

*Todos os valores são estimativas baseadas em dados nacionais. Validar com dados reais da Secretaria de Saúde de Uberlândia antes de apresentar ao cliente.*
