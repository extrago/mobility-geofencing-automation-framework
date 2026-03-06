import { Page, Locator } from '@playwright/test';

/**
 * MapPage encapsulates all interactions with the geofencing map UI.
 * Follows the Page Object Model pattern for a clean, reusable abstraction.
 */
export class MapPage {
    private readonly mapContainer: Locator;
    private readonly zoomInButton: Locator;
    private readonly zoomOutButton: Locator;
    private readonly layerToggle: Locator;

    constructor(private readonly page: Page) {
        this.mapContainer = page.locator('[data-testid="map-container"]');
        this.zoomInButton = page.locator('[data-testid="zoom-in"]');
        this.zoomOutButton = page.locator('[data-testid="zoom-out"]');
        this.layerToggle = page.locator('[data-testid="layer-toggle"]');
    }

    // ── Navigation ──────────────────────────────────────────────────────────────

    async goto(): Promise<void> {
        await this.page.goto('/map');
        await this.mapContainer.waitFor({ state: 'visible' });
    }

    // ── Map Interactions ─────────────────────────────────────────────────────────

    async zoomIn(times = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            await this.zoomInButton.click();
        }
    }

    async zoomOut(times = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            await this.zoomOutButton.click();
        }
    }

    /**
     * Pan the map to a specific GPS coordinate by injecting a map API call.
     * @param lat - WGS84 latitude
     * @param lng - WGS84 longitude
     */
    async panToCoordinate(lat: number, lng: number): Promise<void> {
        await this.page.evaluate(
            ([latitude, longitude]) => {
                // Assumes a global `mapInstance` is exposed by the application
                (window as any).mapInstance?.panTo({ lat: latitude, lng: longitude });
            },
            [lat, lng],
        );
        await this.page.waitForTimeout(500); // allow animation to complete
    }

    /**
     * Click a specific map pixel coordinate (relative to the viewport).
     */
    async clickMapAt(x: number, y: number): Promise<void> {
        await this.mapContainer.click({ position: { x, y } });
    }

    async toggleLayer(layerName: string): Promise<void> {
        await this.layerToggle.click();
        await this.page
            .locator(`[data-testid="layer-option-${layerName}"]`)
            .click();
    }

    // ── Assertions ───────────────────────────────────────────────────────────────

    async isMapVisible(): Promise<boolean> {
        return this.mapContainer.isVisible();
    }

    async getCurrentZoomLevel(): Promise<number> {
        return this.page.evaluate(
            () => (window as any).mapInstance?.getZoom() ?? -1,
        );
    }
}
