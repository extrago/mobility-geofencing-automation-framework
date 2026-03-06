/**
 * Type shim for @turf/turf.
 *
 * @turf/turf v6 bundles its own TypeScript declarations. This file is only
 * needed when `node_modules` has not been installed yet (e.g. fresh clone).
 * Once you run `npm install` this shim becomes inert — TypeScript will prefer
 * the real declarations shipped inside the package.
 *
 * DO NOT delete this file before running `npm install`.
 */
declare module '@turf/turf';
