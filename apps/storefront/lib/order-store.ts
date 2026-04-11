const STORAGE_PREFIX = "aloo-orders";

function getKey(shopId: string, tableNumber: number): string {
    return `${STORAGE_PREFIX}-${shopId}-${tableNumber}`;
}

export function getStoredOrderIds(shopId: string, tableNumber: number): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(getKey(shopId, tableNumber));
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function addOrderId(shopId: string, tableNumber: number, orderId: string): void {
    if (typeof window === "undefined") return;
    const existing = getStoredOrderIds(shopId, tableNumber);
    if (existing.includes(orderId)) return;
    existing.push(orderId);
    localStorage.setItem(getKey(shopId, tableNumber), JSON.stringify(existing));
}

export function clearStoredOrders(shopId: string, tableNumber: number): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(getKey(shopId, tableNumber));
}
