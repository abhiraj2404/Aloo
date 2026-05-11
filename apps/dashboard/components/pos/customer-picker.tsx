"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, UserPlus, UserRound, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { CustomerService, type CustomerSummary } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

export type AttachedCustomer = { id: string; phone: string; name: string | null };

export function CustomerPicker({
    attached,
    onAttach,
    onDetach,
    disabled,
}: {
    attached: AttachedCustomer | null;
    onAttach: (input: { customerPhone: string; customerName?: string }) => Promise<void> | void;
    onDetach: () => Promise<void> | void;
    disabled?: boolean;
}) {
    const { error } = useToast();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CustomerSummary[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, [open]);

    // Debounced search as the user types
    const searchTimer = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        const q = query.trim();
        if (q.length < 2) { setResults([]); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const data = await CustomerService.search(q, 10);
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 250);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [query]);

    const handlePick = useCallback(async (c: CustomerSummary) => {
        try {
            await onAttach({ customerPhone: c.phone, customerName: c.name ?? undefined });
            setOpen(false);
            setQuery("");
            setNewName("");
        } catch {}
    }, [onAttach]);

    const handleCreate = async () => {
        const phone = query.trim();
        // Loose check — server enforces E.164 strictly
        if (!/^\+?\d{8,15}$/.test(phone)) {
            error("Enter a valid phone number (+91...)");
            return;
        }
        const phoneE164 = phone.startsWith("+") ? phone : `+${phone}`;
        setCreating(true);
        try {
            await onAttach({
                customerPhone: phoneE164,
                customerName: newName.trim() || undefined,
            });
            setOpen(false);
            setQuery("");
            setNewName("");
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to attach customer");
        } finally {
            setCreating(false);
        }
    };

    const looksLikePhone = /^\+?\d{4,}$/.test(query.trim());
    const noMatch = results.length === 0 && query.trim().length >= 2 && !searching;

    if (attached) {
        return (
            <div className="flex items-center gap-1.5 px-2 h-8 border rounded-md bg-green-50 border-green-200 max-w-[200px]">
                <UserRound className="h-3.5 w-3.5 text-green-700 shrink-0" />
                <div className="text-xs truncate min-w-0">
                    <span className="font-medium text-green-900">{attached.name ?? "Customer"}</span>
                    <span className="text-green-700/70 ml-1">{attached.phone}</span>
                </div>
                <button
                    type="button"
                    onClick={() => onDetach()}
                    disabled={disabled}
                    aria-label="Detach customer"
                    className="ml-auto p-0.5 rounded hover:bg-green-100 text-green-700 shrink-0"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setOpen((o) => !o)}
                disabled={disabled}
            >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Add customer
            </Button>

            {open && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Phone or name"
                                className="pl-7 h-8 text-xs"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {searching && (
                            <div className="px-3 py-3 flex items-center justify-center text-xs text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                Searching...
                            </div>
                        )}
                        {!searching && results.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => handlePick(c)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {c.name ?? "Customer"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 font-mono">{c.phone}</p>
                                </div>
                                {c.visits > 0 && (
                                    <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                                        {c.visits} visit{c.visits === 1 ? "" : "s"}
                                    </span>
                                )}
                            </button>
                        ))}
                        {noMatch && (
                            <div className="px-3 py-3 text-xs text-gray-500">
                                No matches.{looksLikePhone ? " Create new?" : ""}
                            </div>
                        )}
                        {!searching && query.trim().length < 2 && (
                            <div className="px-3 py-3 text-xs text-gray-400">
                                Type at least 2 chars to search.
                            </div>
                        )}
                    </div>

                    {looksLikePhone && (
                        <div className="px-3 py-2 border-t bg-gray-50 space-y-1.5">
                            <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wide">Create new</p>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Name (optional)"
                                className="h-8 text-xs"
                            />
                            <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-red-500 hover:bg-red-600"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                {creating
                                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    : <UserPlus className="h-3 w-3 mr-1" />
                                }
                                Attach {query.trim()}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
