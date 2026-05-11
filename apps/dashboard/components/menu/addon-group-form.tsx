"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AddonGroupService } from "@repo/api-sdk";
import type { AddonGroup } from "@repo/types";
import { useToast } from "@/lib/use-toast";

type AddonRow = { id?: string; name: string; price: string; sortOrder?: number };

interface AddonGroupFormProps {
  group?: AddonGroup; // undefined → create, defined → edit
  onSaved: (group: AddonGroup) => void;
  onCancel: () => void;
}

const blankRow = (): AddonRow => ({ name: "", price: "" });

export function AddonGroupForm({ group, onSaved, onCancel }: AddonGroupFormProps) {
  const isEdit = !!group;
  const [name, setName] = useState(group?.name ?? "");
  const [minSelect, setMinSelect] = useState(String(group?.minSelect ?? 0));
  const [maxSelect, setMaxSelect] = useState(String(group?.maxSelect ?? 1));
  const [rows, setRows] = useState<AddonRow[]>(
    group?.addons && group.addons.length > 0
      ? group.addons.map((a) => ({ id: a.id, name: a.name, price: (a.price / 100).toString() }))
      : [blankRow()],
  );
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  const updateRow = (i: number, patch: Partial<AddonRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, blankRow()]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) {
      error("Name is required");
      return;
    }
    const min = parseInt(minSelect, 10);
    const max = parseInt(maxSelect, 10);
    if (!Number.isInteger(min) || min < 0) {
      error("min must be a non-negative integer");
      return;
    }
    if (!Number.isInteger(max) || max < 1) {
      error("max must be at least 1");
      return;
    }
    if (max < min) {
      error("max must be ≥ min");
      return;
    }
    const cleanRows = rows.filter((r) => r.name.trim() !== "" || r.price !== "");
    if (cleanRows.length === 0) {
      error("Add at least one addon");
      return;
    }
    const parsed = cleanRows.map((r, i) => {
      const priceNum = Number(r.price);
      if (!r.name.trim()) throw new Error(`Addon #${i + 1} is missing a name`);
      if (isNaN(priceNum) || priceNum < 0) throw new Error(`Addon "${r.name}" has invalid price`);
      return {
        id: r.id,
        name: r.name.trim(),
        price: Math.round(priceNum * 100), // rupees → paise
        sortOrder: i,
      };
    });

    setIsSaving(true);
    try {
      let saved: AddonGroup;
      if (isEdit && group) {
        saved = await AddonGroupService.update(group.id, {
          name: name.trim(),
          minSelect: min,
          maxSelect: max,
          addons: parsed,
        });
      } else {
        saved = await AddonGroupService.create({
          name: name.trim(),
          minSelect: min,
          maxSelect: max,
          addons: parsed.map(({ id: _, ...a }) => a),
        });
      }
      success(isEdit ? "Addon group updated" : "Addon group created");
      onSaved(saved);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save addon group";
      error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isRequired = parseInt(minSelect, 10) > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ag-name">Group name</Label>
        <Input
          id="ag-name"
          placeholder="e.g. Choose your sauce"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ag-min">Min selections</Label>
          <Input
            id="ag-min"
            type="number"
            min={0}
            value={minSelect}
            onChange={(e) => setMinSelect(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ag-max">Max selections</Label>
          <Input
            id="ag-max"
            type="number"
            min={1}
            value={maxSelect}
            onChange={(e) => setMaxSelect(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {isRequired
          ? "Required — customer must choose at least " + minSelect
          : "Optional — customer can skip this group"}
        . Up to {maxSelect} selection{Number(maxSelect) === 1 ? "" : "s"}.
      </p>

      <div className="space-y-2">
        <Label>Add-ons</Label>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                placeholder="Name (e.g. Extra cheese)"
                value={r.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                disabled={isSaving}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="₹0"
                value={r.price}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                disabled={isSaving}
                className="w-24"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-gray-400 hover:text-red-600"
                onClick={() => removeRow(i)}
                disabled={isSaving || rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={isSaving}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add another
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Group"}
        </Button>
      </div>
    </div>
  );
}
