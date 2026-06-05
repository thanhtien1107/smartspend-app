# AI Module

Handles communication with external AI services (like OpenAI) to provide personalized chat and suggestions based on financial data.

## Architecture
- **aiRoutes.js**: Express routing for AI endpoints.
- **aiController.js**: Handlers for AI interactions. Injects data from `financialUtils.js` into prompts.

## Important Interfaces
- Controllers depend on `OPENAI_API_KEY` from environment.
- Falls back to rule-based responses if API key is not configured.
