// Per-shop customer phone cache for auto-fill on return visits.
// Stored in localStorage; key is scoped by shopId so the same browser
// can be a customer at multiple restaurants.

const KEY_PREFIX = "aloo-customer";

type StoredCustomer = {
    phone: string;   // E.164
    name?: string;
};

const key = (shopId: string) => `${KEY_PREFIX}-${shopId}`;

export const getStoredCustomer = (shopId: string): StoredCustomer | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(key(shopId));
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const saveStoredCustomer = (shopId: string, customer: StoredCustomer) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key(shopId), JSON.stringify(customer));
    } catch {
        /* ignore quota errors */
    }
};
