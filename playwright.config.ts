import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = !!process.env['CI'];

export default defineConfig({
    testDir: './tests',
    timeout: Number(process.env['DEFAULT_TIMEOUT']) || 60_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 4 : '100%',
    reporter: [
        ['list'],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['html', { open: 'never' }]
    ],
    webServer: {
        // server.js starts BOTH port 4000 (API/UI) and port 9090 (simulator)
        command: 'node src/server.js',
        url: 'http://localhost:4000/health',
        timeout: 30_000,
        reuseExistingServer: !isCI,
        stdout: 'pipe',
        stderr: 'pipe',
    },
    use: {
        // Base for page.goto() — UI pages live at the server root
        baseURL: process.env['BASE_URL'] || 'http://localhost:4000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 7'] },
        },
    ],
    outputDir: 'test-results/',
});