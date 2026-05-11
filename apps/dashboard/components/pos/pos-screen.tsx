"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Minus, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
    MenuService,
    OrderService,
    PosService,
    type PosPreviewResult,
} from "@repo/api-sdk";
import type { Category, Item, ItemVariant, Addon } from "@repo/types";
import { useToast } from "@/lib/use-toast";
import { PosCustomizer, type DraftLineInput } from "./pos-customizer";
import { CustomerPicker } from "./customer-picker";

type CategoryWithItems = Category & { items: Item[] };

type DraftLine = {
    lineId: string;            // local identity: itemId__variantId__sortedAddonIds
    item: Item;
    variant: ItemVariant | null;
    addons: Addon[];
    unitPrice: number;
    quantity: number;
};

type ExistingOrder = {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderItems: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        variantName: string | null;
        addons: { name: string; price: number }[] | null;
        status: "PENDING" | "READY" | "SERVED" | "HOLD" | "VOID";
    }[];
};

const itemStatusDot: Record<string, string> = {
    PENDING: "bg-gray-400",
    READY: "bg-amber-500",
    SERVED: "bg-green-500",
    HOLD: "bg-blue-500",
    VOID: "bg-red-500",
};

type PosState = {
    table: { id: string; tableNumber: number };
    shop: {
        cgstRate: number;
        sgstRate: number;
        serviceChargeRate: number;
        gstNumber: string | null;
    };
    session: {
        id: string;
        pax: number | null;
        customer: { id: string; phone: string; name: string | null } | null;
        orders: ExistingOrder[];
        bill: { id: string; billNumber: string; status: string } | null;
    } | null;
};

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const formatRupees = (paise: number) => `₹${Math.round(paise / 100)}`;

const buildLineId = (itemId: string, variantId: string | null, addonIds: string[]) =>
    `${itemId}__${variantId ?? ""}__${[...addonIds].sort().join(",")}`;

export function PosScreen({ shopId, tableId }: { shopId: string; tableId: string }) {
    const router = useRouter();
    const { success, error } = useToast();

    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [posState, setPosState] = useState<PosState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

    const [draft, setDraft] = useState<DraftLine[]>([]);
    const [preview, setPreview] = useState<PosPreviewResult | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [customizerItem, setCustomizerItem] = useState<Item | null>(null);
    const [paxInput, setPaxInput] = useState("");
    const [paxDirty, setPaxDirty] = useState(false);

    // Initial load: menu + POS state
    const loadAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [menu, pos] = await Promise.all([
                MenuService.getMenuByShopId(shopId),
                PosService.getTablePos(tableId),
            ]);

            const cats: CategoryWithItems[] = (menu?.categories ?? [])
                .map((c: any) => ({
                    ...c,
                    items: (c.items ?? []).filter((i: Item) => i.isAvailable !== false),
                }))
                .filter((c: CategoryWithItems) => c.items.length > 0);

            setCategories(cats);
            const firstCatId = cats[0]?.id;
            if (firstCatId) setActiveCategoryId((curr) => curr ?? firstCatId);
            setPosState(pos);
            setPaxInput(pos?.session?.pax ? String(pos.session.pax) : "");
            setPaxDirty(false);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to load POS");
        } finally {
            setIsLoading(false);
        }
    }, [shopId, tableId, error]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Build item lookup for fast access
    const allItemsById = useMemo(() => {
        const m = new Map<string, Item>();
        categories.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
        return m;
    }, [categories]);

    // Filtered category items (search overrides category filter)
    const visibleSection = useMemo<{ category: CategoryWithItems; items: Item[] }[] | null>(() => {
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            return categories
                .map((c) => ({ category: c, items: c.items.filter((i) => i.name.toLowerCase().includes(q)) }))
                .filter((x) => x.items.length > 0);
        }
        const active = categories.find((c) => c.id === activeCategoryId);
        return active ? [{ category: active, items: active.items }] : null;
    }, [categories, activeCategoryId, searchQuery]);

    // Draft mutations
    const addDraftLine = useCallback((input: DraftLineInput) => {
        setDraft((prev) => {
            const variantId = input.variant?.id ?? null;
            const addonIds = input.addons.map((a) => a.id);
            const lineId = buildLineId(input.item.id, variantId, addonIds);
            const idx = prev.findIndex((l) => l.lineId === lineId);
            if (idx >= 0) {
                const existing = prev[idx]!;
                const next = [...prev];
                next[idx] = { ...existing, quantity: existing.quantity + input.quantity };
                return next;
            }
            const base = input.variant ? input.variant.price : input.item.price;
            const addonsTotal = input.addons.reduce((s, a) => s + a.price, 0);
            return [
                ...prev,
                {
                    lineId,
                    item: input.item,
                    variant: input.variant,
                    addons: input.addons,
                    unitPrice: base + addonsTotal,
                    quantity: input.quantity,
                },
            ];
        });
    }, []);

    const setDraftQty = (lineId: string, qty: number) => {
        setDraft((prev) => {
            if (qty <= 0) return prev.filter((l) => l.lineId !== lineId);
            return prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l));
        });
    };

    const removeDraftLine = (lineId: string) => {
        setDraft((prev) => prev.filter((l) => l.lineId !== lineId));
    };

    const handleItemClick = (item: Item) => {
        const hasVariants = (item.variants?.length ?? 0) > 0;
        const hasAddons = (item.addonGroups?.length ?? 0) > 0;
        if (hasVariants || hasAddons) {
            setCustomizerItem(item);
            return;
        }
        addDraftLine({ item, variant: null, addons: [], quantity: 1 });
    };

    // Quick +/- for simple lines already in draft (only works for variant-less, addon-less lines)
    const draftSimpleQty = (itemId: string) => {
        const simple = draft.find((l) => l.item.id === itemId && !l.variant && l.addons.length === 0);
        return simple?.quantity ?? 0;
    };

    // Live preview = existing orders subtotal + draft subtotal, run through compute on server
    const previewItems = useMemo(() => {
        const existing = (posState?.session?.orders ?? []).flatMap((o) =>
            o.orderItems.map((oi) => ({
                itemId: undefined as unknown as string, // server can't easily snapshot — see below
                quantity: oi.quantity,
                unitPrice: oi.price,
            })),
        );
        return { existing, draft };
    }, [posState, draft]);

    // The server preview needs item IDs to reprice. Past orders are already snapshotted
    // so we just sum their totalAmount client-side and pass an empty "extra subtotal" effect.
    // For draft we send the real items list; we also compute existing subtotal here and
    // pre-add it to the preview's subtotal post-call. Simpler: include all draft as the
    // preview body, then add existing subtotals locally as a non-tax-recomputed adjust.
    //
    // PetPooja shows charges on the combined view. We'll request preview for the combined
    // subtotal-equivalent: but the server compute needs an items[] list. Workaround: send
    // draft items only and pass the existing-subtotal as an implicit constant by adding
    // a phantom adjustment. Cleaner: extend the preview endpoint later. For MVP, show
    // preview for "new items only" + a "session running total" line for existing orders.
    const existingSubtotal = useMemo(
        () => (posState?.session?.orders ?? []).reduce((s, o) => s + o.totalAmount, 0),
        [posState],
    );

    // Debounced preview call when draft changes
    const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        if (draft.length === 0) { setPreview(null); return; }
        setIsPreviewing(true);
        previewTimerRef.current = setTimeout(async () => {
            try {
                const result = await PosService.preview({
                    items: draft.map((l) => ({
                        itemId: l.item.id,
                        variantId: l.variant?.id ?? null,
                        addonIds: l.addons.map((a) => a.id),
                        quantity: l.quantity,
                    })),
                });
                setPreview(result);
            } catch {
                setPreview(null);
            } finally {
                setIsPreviewing(false);
            }
        }, 300);
        return () => {
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        };
    }, [draft]);

    // Save order = creates a new Order in this table session. If printKot=true, opens
    // the KOT print page in a new tab after save so it goes straight to the kitchen.
    const handleSaveOrder = async (printKot: boolean) => {
        if (draft.length === 0) return;
        setIsSaving(true);
        try {
            const order = await OrderService.createOrder({
                shopId,
                tableNumber: posState!.table.tableNumber,
                orderType: "DINE_IN",
                items: draft.map((l) => ({
                    itemId: l.item.id,
                    variantId: l.variant?.id ?? undefined,
                    addonIds: l.addons.map((a) => a.id),
                    quantity: l.quantity,
                })),
            });
            success(printKot ? "Order saved · printing KOT" : "Order saved");
            setDraft([]);
            if (printKot && order?.kot?.id) {
                window.open(`/dashboard/${shopId}/kot/${order.kot.id}/print`, "_blank");
            }
            await loadAll();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to save order");
        } finally {
            setIsSaving(false);
        }
    };

    // PAX save — only when session exists
    const handlePaxBlur = async () => {
        if (!paxDirty || !posState?.session) return;
        const value = paxInput.trim() === "" ? null : Number(paxInput);
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            error("PAX must be a non-negative integer");
            return;
        }
        try {
            await PosService.updateSession(posState.session.id, { pax: value });
            setPaxDirty(false);
            setPosState((prev) => prev && prev.session ? { ...prev, session: { ...prev.session, pax: value } } : prev);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to update PAX");
        }
    };

    // Customer attach/detach — only when session exists. New customers are created
    // server-side via the same patch (upsert by phone), so the picker stays one round-trip.
    const handleAttachCustomer = async (input: { customerPhone: string; customerName?: string }) => {
        if (!posState?.session) {
            error("Open the table with an order first, then attach a customer");
            return;
        }
        try {
            const session = await PosService.updateSession(posState.session.id, input);
            setPosState((prev) => prev && prev.session
                ? { ...prev, session: { ...prev.session, customer: session?.customer ?? null } }
                : prev);
            success("Customer attached");
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to attach customer");
            throw err;
        }
    };

    const handleDetachCustomer = async () => {
        if (!posState?.session) return;
        try {
            await PosService.updateSession(posState.session.id, { customerId: null });
            setPosState((prev) => prev && prev.session
                ? { ...prev, session: { ...prev.session, customer: null } }
                : prev);
            success("Customer detached");
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to detach");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh] text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading POS...
            </div>
        );
    }

    if (!posState) return null;

    const draftSubtotal = draft.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const totalSubtotal = existingSubtotal + draftSubtotal;
    const tableNumber = posState.table.tableNumber;
    const hasBill = !!posState.session?.bill;

    return (
        <div className="flex flex-col h-[calc(100vh-90px)] -m-4">
            {/* Top bar */}
            <div className="px-4 py-2 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/dashboard/${shopId}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-base font-bold">Table {tableNumber}</h1>
                        <p className="text-[11px] text-gray-500">
                            {posState.session
                                ? `${posState.session.orders.length} order${posState.session.orders.length === 1 ? "" : "s"} · running`
                                : "Open table"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {posState.session && (
                        <>
                            <div className="flex items-center gap-1.5 px-2 h-8 border rounded-md bg-white">
                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    value={paxInput}
                                    onChange={(e) => { setPaxInput(e.target.value); setPaxDirty(true); }}
                                    onBlur={handlePaxBlur}
                                    placeholder="PAX"
                                    className="h-6 w-12 text-xs border-0 px-0 focus-visible:ring-0"
                                />
                            </div>
                            <CustomerPicker
                                attached={posState.session.customer}
                                onAttach={handleAttachCustomer}
                                onDetach={handleDetachCustomer}
                                disabled={hasBill}
                            />
                        </>
                    )}
                    {hasBill && (
                        <Link
                            href={`/dashboard/${shopId}?bill=${posState.session?.bill?.id}`}
                            className="text-xs font-semibold text-amber-600 hover:underline"
                        >
                            Bill {posState.session?.bill?.billNumber} ({posState.session?.bill?.status})
                        </Link>
                    )}
                </div>
            </div>

            {/* Split layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: menu */}
                <div className="flex-1 flex flex-col border-r bg-gray-50">
                    <div className="px-4 py-3 border-b bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>

                    {!searchQuery && (
                        <div className="px-4 py-2 border-b bg-white flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {categories.map((c) => {
                                const active = activeCategoryId === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveCategoryId(c.id)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                                            active ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {c.name}
                                        <span className="ml-1.5 opacity-70">({c.items.length})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-4">
                            {!visibleSection || visibleSection.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">
                                    {searchQuery ? "No items match your search" : "No items available"}
                                </div>
                            ) : (
                                visibleSection.map(({ category, items }) => (
                                    <div key={category.id}>
                                        {searchQuery && (
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                                                {category.name}
                                            </h3>
                                        )}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {items.map((item) => {
                                                const qty = draftSimpleQty(item.id);
                                                const hasVariants = (item.variants?.length ?? 0) > 0;
                                                const minPrice = hasVariants
                                                    ? Math.min(...item.variants!.map((v) => v.price))
                                                    : item.price;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => handleItemClick(item)}
                                                        className="bg-white border rounded-lg p-3 text-left hover:border-red-300 hover:shadow-sm transition-all relative"
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={`h-2.5 w-2.5 rounded-sm border ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                                                <span className={`block h-full w-full rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} style={{ transform: "scale(0.55)" }} />
                                                            </span>
                                                            {hasVariants && (
                                                                <span className="text-[9px] uppercase font-semibold text-gray-400 ml-auto">
                                                                    variations
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-10">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {hasVariants ? `from ${formatRupees(minPrice)}` : formatRupees(minPrice)}
                                                        </p>
                                                        {qty > 0 && (
                                                            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                                                                {qty}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT: running order */}
                <div className="w-96 flex flex-col bg-white">
                    <div className="px-4 py-3 border-b">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Running Order</p>
                        {posState.session?.customer ? (
                            <p className="text-sm text-gray-900 mt-1">
                                {posState.session.customer.name ?? "Customer"} ·{" "}
                                <span className="font-mono text-xs text-gray-500">{posState.session.customer.phone}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">No customer attached</p>
                        )}
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="px-4 py-3 space-y-3">
                            {/* Existing orders (saved) */}
                            {posState.session?.orders.length ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Saved orders</p>
                                    {posState.session.orders.map((o) => (
                                        <div key={o.id} className="border rounded-lg p-2.5">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-semibold text-gray-500">
                                                    {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {o.status}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {formatPaise(o.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {o.orderItems.map((oi) => (
                                                    <div key={oi.id} className={`text-xs text-gray-600 flex items-center gap-1.5 ${oi.status === "SERVED" || oi.status === "VOID" ? "opacity-60" : ""}`}>
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${itemStatusDot[oi.status] ?? itemStatusDot.PENDING}`}
                                                            title={oi.status}
                                                        />
                                                        <span className={oi.status === "VOID" ? "line-through" : ""}>
                                                            {oi.name}
                                                            {oi.variantName && <span className="text-gray-400"> · {oi.variantName}</span>}
                                                            <span className="text-gray-400"> × {oi.quantity}</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {/* Draft (new items being added) */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                                    {posState.session ? "Add to order" : "New order"}
                                </p>
                                {draft.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-4 text-center">
                                        Tap menu items to add
                                    </p>
                                ) : (
                                    draft.map((l) => (
                                        <div key={l.lineId} className="flex items-start gap-2 py-1">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 leading-tight">
                                                    {l.item.name}
                                                    {l.variant && <span className="text-gray-500"> · {l.variant.name}</span>}
                                                </p>
                                                {l.addons.length > 0 && (
                                                    <p className="text-[11px] text-gray-500 leading-tight">
                                                        + {l.addons.map((a) => a.name).join(", ")}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-gray-400 mt-0.5">{formatRupees(l.unitPrice)} ea.</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setDraftQty(l.lineId, l.quantity - 1)}>
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-xs font-semibold w-5 text-center">{l.quantity}</span>
                                                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setDraftQty(l.lineId, l.quantity + 1)}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => removeDraftLine(l.lineId)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Charges summary */}
                    <div className="border-t bg-gray-50 px-4 py-3 text-xs space-y-1">
                        {existingSubtotal > 0 && (
                            <div className="flex justify-between text-gray-500">
                                <span>Saved subtotal</span>
                                <span>{formatPaise(existingSubtotal)}</span>
                            </div>
                        )}
                        {draft.length > 0 && preview && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">New subtotal</span>
                                    <span className="text-gray-900">{formatPaise(preview.subtotal)}</span>
                                </div>
                                {preview.cgstAmount > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>CGST + SGST (on new)</span>
                                        <span>{formatPaise(preview.cgstAmount + preview.sgstAmount)}</span>
                                    </div>
                                )}
                                {preview.serviceChargeAmount > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Service (on new)</span>
                                        <span>{formatPaise(preview.serviceChargeAmount)}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex justify-between font-bold text-sm pt-1.5 mt-1 border-t border-gray-200">
                            <span>Running total</span>
                            <span>{formatPaise(totalSubtotal)}</span>
                        </div>
                        {isPreviewing && <p className="text-[10px] text-gray-400">Updating...</p>}
                    </div>

                    {/* Action footer */}
                    <div className="border-t px-4 py-3 bg-white space-y-2">
                        <Button
                            className="w-full h-10 bg-red-500 hover:bg-red-600 text-white font-semibold"
                            disabled={draft.length === 0 || isSaving || hasBill}
                            onClick={() => handleSaveOrder(true)}
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                            ) : hasBill ? (
                                "Bill already generated"
                            ) : (
                                <>Save & Print KOT • {formatRupees(draftSubtotal)}</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-9 text-xs"
                            disabled={draft.length === 0 || isSaving || hasBill}
                            onClick={() => handleSaveOrder(false)}
                        >
                            Save without printing
                        </Button>
                    </div>
                </div>
            </div>

            <PosCustomizer
                item={customizerItem}
                open={!!customizerItem}
                onOpenChange={(open) => !open && setCustomizerItem(null)}
                onAdd={addDraftLine}
            />
        </div>
    );
}
