export function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
export function isLocalStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
}
