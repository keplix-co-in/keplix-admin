import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../../services/apiConfig.js";
import { authFetch } from "../../../services/authApi.js";
import Badge from "../../ui/Badge.jsx";
import Button from "../../ui/Button.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState.jsx";
import Spinner from "../../ui/Spinner.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { formatINR } from "../../../utils/format.js";
import RefundModal from "./RefundModal.jsx";

/**
 * Refunds list (2026-11-03). Every refund of any kind, plus paid bookings
 * that were cancelled but never refunded ("Needs refund"). Before this the
 * admin only had a total and a Payment ID form, so a cancelled paid booking
 * with no refund left no trace anywhere. Data: GET /admin/finance/refunds.
 */
const REFUND_FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_refund", label: "Needs refund" },
  { key: "processing", label: "Processing" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

const GROUP_STYLE = {
  needs_refund: { label: "NEEDS REFUND", color: "#ff9944", bg: "rgba(255,153,68,0.1)" },
  processing: { label: "PROCESSING", color: "#4da3ff", bg: "rgba(77,163,255,0.1)" },
  refunded: { label: "REFUNDED", color: "#4CAF50", bg: "rgba(76,175,80,0.1)" },
  failed: { label: "FAILED", color: "#ff3d3d", bg: "rgba(255,61,61,0.1)" },
};

// Only these can be refunded from the list; the others are done or under way.
const CAN_REFUND = new Set(["needs_refund", "failed"]);

export default function RefundsList({ reloadKey = 0, onRefunded }) {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refunding, setRefunding] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_URL}/admin/finance/refunds?status=${filter}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setItems([]);
      setError(err?.message || "Could not load refunds.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  return (
    <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5">
      <div className="p-6 pb-3">
        <div className="font-syne text-base font-bold mb-1">↩️ Refunds</div>
        <div className="text-xs text-brand-gray-700 mb-3">
          Every refund, plus paid bookings that were cancelled and still need one.
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Refund filter">
          {REFUND_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "primary" : "ghost"}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-6"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} className="m-5" />
      ) : items.length === 0 ? (
        <EmptyState icon="✅" message="No refunds here" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/5">
              {["Booking", "Customer", "Vendor", "Amount", "Status", "Note", ""].map((h) => (
                <TableHead key={h} className="text-[10px] uppercase tracking-wider text-brand-gray-600">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => {
              const style = GROUP_STYLE[it.group] || GROUP_STYLE.processing;
              return (
                <TableRow key={it.refundId ? `r${it.refundId}` : `p${it.paymentId}`} className="border-white/5">
                  <TableCell className="text-xs text-brand-gray-800">
                    #BK{it.bookingId ?? "?"} · {it.service || "Service"}
                    <div className="text-[10px] text-brand-gray-600 font-mono">Payment {it.paymentId}</div>
                  </TableCell>
                  <TableCell className="text-xs text-brand-gray-800">{it.customer?.email || "-"}</TableCell>
                  <TableCell className="text-xs text-brand-gray-800">{it.vendor?.name || "-"}</TableCell>
                  <TableCell className="font-syne text-sm font-bold text-white">{formatINR(it.amount)}</TableCell>
                  <TableCell>
                    <Badge size="sm" label={style.label} color={style.color} bg={style.bg} border={`${style.color}30`} />
                    {it.fromDashboard && <div className="text-[10px] text-brand-gray-600 mt-1">Made in Razorpay</div>}
                  </TableCell>
                  <TableCell className="text-[11px] text-brand-gray-700 max-w-[220px]">
                    {it.lastError || it.reason || ""}
                    {it.vendorPayoutStatus === "paid" && (
                      <div className="text-[#ff9944]">Vendor already paid: recover manually.</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* A failed try that a later refund replaced needs no button:
                        pressing it could pay the customer twice. */}
                    {it.superseded ? (
                      <span className="text-[10px] text-brand-gray-600">Replaced by a later refund</span>
                    ) : CAN_REFUND.has(it.group) && (
                      <Button size="sm" variant="secondary" onClick={() => setRefunding(it)}>
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {refunding && (
        <RefundModal
          initialPaymentId={refunding.paymentId}
          lockPaymentId
          context={`Booking #BK${refunding.bookingId ?? "?"} · ${refunding.customer?.email || ""}`}
          onClose={() => setRefunding(null)}
          onRefundSuccess={() => {
            load();
            onRefunded?.();
          }}
        />
      )}
    </div>
  );
}
