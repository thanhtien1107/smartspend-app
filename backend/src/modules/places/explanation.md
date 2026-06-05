# Places Module

Handles geographical location and place search integrations using external services like Google Places API and SerpApi.

## Architecture
- **placesRoutes.js**: Express routing for Places.
- **placesController.js**: Handlers for standard search and expanded search logic.
- **placesService.js**: Core mapping and external API fetch definitions, handles distances and cache integration.

## Important Interfaces
- Services handle pure API calls and returning uniform objects.
- Controllers manage request inputs and deduplication.
