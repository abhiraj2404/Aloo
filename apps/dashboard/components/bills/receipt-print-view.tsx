"use client";

import type { ReceiptDTO } from "@repo/api-sdk";

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function ReceiptPrintView({ receipt }: { receipt: ReceiptDTO }) {
    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #receipt-print, #receipt-print * { visibility: visible; }
                    #receipt-print { position: absolute; left: 0; top: 0; width: 80mm; }
                    @page { margin: 4mm; size: 80mm auto; }
                }
                #receipt-print {
                    font-family: 'Courier New', monospace;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 8px;
                    font-size: 12px;
                    color: #000;
                    background: #fff;
                }
                #receipt-print .divider {
                    border-top: 1px dashed #555;
                    margin: 6px 0;
                }
                #receipt-print .center { text-align: center; }
                #receipt-print .right { text-align: right; }
                #receipt-print .bold { font-weight: bold; }
                #receipt-print .row { display: flex; justify-content: space-between; }
                #receipt-print .small { font-size: 10px; color: #666; }
            `}</style>
            <div id="receipt-print">
                {/* Shop Header */}
                <div className="center">
                    <div className="bold" style={{ fontSize: 16 }}>{receipt.shopName}</div>
                    <div className="small">{receipt.shopAddress}</div>
                    {receipt.gstNumber && <div className="small">GSTIN: {receipt.gstNumber}</div>}
                </div>

                <div className="divider" />

                {/* Bill Info */}
                <div className="row">
                    <span>Bill #:</span>
                    <span className="bold">{receipt.billNumber}</span>
                </div>
                <div className="row">
                    <span>Date:</span>
                    <span>{new Date(receipt.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                    })}</span>
                </div>
                {receipt.tableName && (
                    <div className="row">
                        <span>Table:</span>
                        <span>{receipt.tableName}</span>
                    </div>
                )}

                <div className="divider" />

                {/* Items */}
                <div>
                    <div className="row bold" style={{ marginBottom: 4 }}>
                        <span>Item</span>
                        <span>Amount</span>
                    </div>
                    {receipt.items.map((item, i) => (
                        <div key={i}>
                            <div className="row">
                                <span>{item.name}</span>
                                <span>{formatPaise(item.total)}</span>
                            </div>
                            <div className="small" style={{ paddingLeft: 8 }}>
                                {item.quantity} × {formatPaise(item.price)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="divider" />

                {/* Charges */}
                <div className="row">
                    <span>Subtotal</span>
                    <span>{formatPaise(receipt.subtotal)}</span>
                </div>
                {receipt.discountAmount > 0 && (
                    <div className="row">
                        <span>Discount{receipt.discountType === "PERCENT" ? ` (${(receipt.discountValue / 100).toFixed(2)}%)` : ""}</span>
                        <span>-{formatPaise(receipt.discountAmount)}</span>
                    </div>
                )}
                {receipt.cgstAmount > 0 && (
                    <div className="row">
                        <span>CGST</span>
                        <span>{formatPaise(receipt.cgstAmount)}</span>
                    </div>
                )}
                {receipt.sgstAmount > 0 && (
                    <div className="row">
                        <span>SGST</span>
                        <span>{formatPaise(receipt.sgstAmount)}</span>
                    </div>
                )}
                {receipt.serviceChargeAmount > 0 && (
                    <div className="row">
                        <span>Service Charge</span>
                        <span>{formatPaise(receipt.serviceChargeAmount)}</span>
                    </div>
                )}
                {receipt.roundOff !== 0 && (
                    <div className="row">
                        <span>Round Off</span>
                        <span>{receipt.roundOff > 0 ? "+" : ""}{formatPaise(receipt.roundOff)}</span>
                    </div>
                )}

                <div className="divider" />

                <div className="row bold" style={{ fontSize: 14 }}>
                    <span>TOTAL</span>
                    <span>{formatPaise(receipt.totalAmount)}</span>
                </div>

                {receipt.payments.length > 0 && (
                    <>
                        <div className="divider" />
                        <div className="bold" style={{ marginBottom: 2 }}>Payments:</div>
                        {receipt.payments.map((p, i) => (
                            <div key={i} className="row">
                                <span>{p.mode}</span>
                                <span>{formatPaise(p.amount)}</span>
                            </div>
                        ))}
                        {receipt.balance > 0 && (
                            <div className="row bold">
                                <span>Balance Due</span>
                                <span>{formatPaise(receipt.balance)}</span>
                            </div>
                        )}
                    </>
                )}

                <div className="divider" />

                <div className="center small" style={{ marginTop: 8 }}>
                    Thank you for dining with us!
                </div>
            </div>
        </>
    );
}
