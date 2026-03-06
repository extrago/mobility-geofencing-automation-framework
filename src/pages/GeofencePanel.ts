import { Page, Locator } from '@playwright/test';

export type GeofenceType = 'RESTRICTED' | 'SPEED_LIMIT' | 'TOLL' | 'CUSTOM';

export interface GeofenceFormData {
    name: string;
    type: GeofenceType;
    speedLimit?: number;
    alertOnEntry?: boolean;
    alertOnExit?: boolean;
}

/**
 * GeofencePanel encapsulates the sidebar panel used to create,
 * edit, and inspect geofence zones.
 */
export class GeofencePanel {
    private readonly panel: Locator;
    private readonly nameInput: Locator;
    private readonly typeSelect: Locator;
    private readonly speedLimitInput: Locator;
    private readonly alertEntryToggle: Locator;
    private readonly alertExitToggle: Locator;
    private readonly saveButton: Locator;
    private readonly cancelButton: Locator;
    private readonly deleteButton: Locator;
    private readonly successBanner: Locator;

    constructor(private readonly page: Page) {
        this.panel = page.locator('[data-testid="geofence-panel"]');
        this.nameInput = page.locator('[data-testid="geofence-name-input"]');
        this.typeSelect = page.locator('[data-testid="geofence-type-select"]');
        this.speedLimitInput = page.locator('[data-testid="speed-limit-input"]');
        this.alertEntryToggle = page.locator('[data-testid="alert-entry-toggle"]');
        this.alertExitToggle = page.locator('[data-testid="alert-exit-toggle"]');
        this.saveButton = page.locator('[data-testid="geofence-save-btn"]');
        this.cancelButton = page.locator('[data-testid="geofence-cancel-btn"]');
        this.deleteButton = page.locator('[data-testid="geofence-delete-btn"]');
        this.successBanner = page.locator('[data-testid="success-banner"]');
    }

    async waitForOpen(): Promise<void> {
        await this.panel.waitFor({ state: 'visible' });
    }

    async fillForm(data: GeofenceFormData): Promise<void> {
        await this.nameInput.fill(data.name);
        await this.typeSelect.selectOption(data.type);

        if (data.speedLimit !== undefined) {
            await this.speedLimitInput.fill(String(data.speedLimit));
        }
        if (data.alertOnEntry !== undefined) {
            const isChecked = await this.alertEntryToggle.isChecked();
            if (isChecked !== data.alertOnEntry) await this.alertEntryToggle.click();
        }
        if (data.alertOnExit !== undefined) {
            const isChecked = await this.alertExitToggle.isChecked();
            if (isChecked !== data.alertOnExit) await this.alertExitToggle.click();
        }
    }

    async save(): Promise<void> {
        await this.saveButton.click();
        await this.successBanner.waitFor({ state: 'visible' });
    }

    async cancel(): Promise<void> {
        await this.cancelButton.click();
    }

    async delete(): Promise<void> {
        await this.deleteButton.click();
        // Confirm deletion dialog
        await this.page.locator('[data-testid="confirm-delete-btn"]').click();
    }

    async getGeofenceName(): Promise<string> {
        return this.nameInput.inputValue();
    }

    async isPanelVisible(): Promise<boolean> {
        return this.panel.isVisible();
    }
}
