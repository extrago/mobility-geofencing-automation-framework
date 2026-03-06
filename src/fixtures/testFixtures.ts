import { test as base } from '@playwright/test';
import { MapPage } from '../pages/MapPage';
import { GeofencePanel } from '../pages/GeofencePanel';
import { GeofenceApiClient } from '../api/geofenceApiClient';
import { DbClient } from '../db/dbClient';
import { logger } from '../utils/logger';

// ── Fixture Types ──────────────────────────────────────────────────────────────

export interface GeofencingFixtures {
    mapPage: MapPage;
    geofencePanel: GeofencePanel;
    apiClient: GeofenceApiClient;
    dbClient: DbClient;
}

// ── Extended Test Object ───────────────────────────────────────────────────────

/**
 * A `test` object extended with geofencing-specific fixtures.
 * Import this instead of `@playwright/test` in your spec files.
 *
 * @example
 * import { test, expect } from '../fixtures/testFixtures';
 */
export const test = base.extend<GeofencingFixtures>({
    mapPage: async ({ page }, use) => {
        const mapPage = new MapPage(page);
        await use(mapPage);
    },

    geofencePanel: async ({ page }, use) => {
        const panel = new GeofencePanel(page);
        await use(panel);
    },

    apiClient: async ({ }, use) => {
        const client = new GeofenceApiClient();
        await use(client);
    },

    dbClient: async ({ }, use) => {
        const client = DbClient.getInstance();
        await use(client);
        // Pool is shared/singleton — do not close here
    },
});

export { expect } from '@playwright/test';
