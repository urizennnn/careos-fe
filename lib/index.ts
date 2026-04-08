/**
 * CareOS API Entry Point
 * Toggle NEXT_PUBLIC_USE_MOCK=true in .env.local to use mock data.
 * Real and mock APIs are identical in shape.
 */

import * as realApi from "@/lib/api";
import * as mockApi from "@/lib/mock-api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const api = USE_MOCK ? mockApi : realApi;

export const authApi = api.authApi;
export const patientsApi = api.patientsApi;
export const paperBridgeApi = api.paperBridgeApi;
export const firstLineApi = api.firstLineApi;
export const scriptGuardApi = api.scriptGuardApi;
export const mamaWatchApi = api.mamaWatchApi;
