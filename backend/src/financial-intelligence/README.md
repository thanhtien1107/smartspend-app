# SmartSpend Financial Health Intelligence Engine

## Architecture

The module follows Clean Architecture:

- `domain`: framework-independent FHI contracts and weights.
- `application`: orchestration service and provider ports.
- `infrastructure`: metrics, 120-rule catalog, scoring, templates, forecasts, personality detection, and legacy JSON adapter.
- `presentation`: Express REST adapter.

The application service depends on interfaces, not concrete models. A future ML implementation can replace `RuleProvider`, `ScoreProvider`, `MessageProvider`, or `PersonalityProvider` without changing the REST response.

## FHI Dimensions

| Dimension | Weight |
| --- | ---: |
| Financial Discipline | 15 |
| Budget Management | 15 |
| Savings Ability | 15 |
| Spending Efficiency | 15 |
| Risk Management | 10 |
| Goal Achievement | 10 |
| Financial Stability | 10 |
| Behavior Consistency | 10 |

## Rule and Template Inventory

- 120 executable business rules across 10 categories.
- 100 warning templates.
- 100 insight templates.
- 100 recommendation templates.
- 50 forecast templates.
- 30 achievement templates.

Every generated message contains `observation`, `rootCause`, `impact`, and `recommendation`.

## REST API

- `GET /api/financial-health?period=monthly`
- `GET /api/financial-health/catalog`
- `GET /api/financial-health/rules`
- `POST /api/financial-health/simulate`

Supported periods: `weekly`, `monthly`, `quarterly`, `yearly`.

## Build and Test

```bash
npm run build:intelligence
npm run test:intelligence
```

## ML Replacement Path

Implement the ports in `application/ports.ts`, then inject the providers into `FinancialHealthService`. The domain report and REST contract remain unchanged. Recommended future providers:

- anomaly model for behavioral and transaction risk;
- time-series model for forecasts;
- classification model for financial personality;
- calibrated scoring model for dimension scores;
- LLM/NLG provider for localized explanations, constrained to the structured message contract.
