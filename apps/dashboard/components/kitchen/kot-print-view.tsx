"use client";

import type { KotDTO } from "@repo/api-sdk";

export function KotPrintView({ kot }: { kot: KotDTO }) {
    const tableNum = kot.order?.tableSession?.table?.tableNumber;
    const time = new Date(kot.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #kot-print, #kot-print * { visibility: visible; }
                    #kot-print { position: absolute; left: 0; top: 0; width: 80mm; }
                    @page { margin: 4mm; size: 80mm auto; }
                }
                #kot-print {
                    font-family: 'Courier New', monospace;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 8px;
                    font-size: 13px;
                    color: #000;
                    background: #fff;
                }
                #kot-print .divider {
                    border-top: 1px dashed #555;
                    margin: 6px 0;
                }
                #kot-print .center { text-align: center; }
                #kot-print .bold { font-weight: bold; }
                #kot-print .row { display: flex; justify-content: space-between; align-items: baseline; }
                #kot-print .small { font-size: 11px; color: #444; }
                #kot-print .supp {
                    background: #000; color: #fff; padding: 2px 6px;
                    display: inline-block; font-size: 11px; letter-spacing: 1px;
                }
                #kot-print .qty-col { width: 28px; display: inline-block; font-weight: bold; }
            `}</style>
            <div id="kot-print">
                <div className="center bold" style={{ fontSize: 18 }}>
                    KOT #{kot.kotNumber}
                </div>
                {kot.isSupplementary && (
                    <div className="center" style={{ marginTop: 4 }}>
                        <span className="supp">SUPPLEMENTARY</span>
                    </div>
                )}

                <div className="divider" />

                <div className="row">
                    <span className="bold">{tableNum ? `Table ${tableNum}` : (kot.order?.orderType ?? "Order")}</span>
                    <span>{time}</span>
                </div>
                {kot.shop?.name && <div className="small">{kot.shop.name}</div>}

                <div className="divider" />

                <div>
                    {kot.items.map((item, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                            <div>
                                <span className="qty-col">{item.quantity}×</span>
                                <span className="bold">{item.name}</span>
                                {item.variantName && (
                                    <span> ({item.variantName})</span>
                                )}
                            </div>
                            {item.addons.length > 0 && (
                                <div className="small" style={{ paddingLeft: 28 }}>
                                    + {item.addons.map((a) => a.name).join(", ")}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="divider" />

                <div className="small center">
                    {kot.printCount > 0 ? `Reprint #${kot.printCount + 1}` : "1st print"} · Total {kot.items.reduce((s, i) => s + i.quantity, 0)} qty
                </div>
            </div>
        </>
    );
}
