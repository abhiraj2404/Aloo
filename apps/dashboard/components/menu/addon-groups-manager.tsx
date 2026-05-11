"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AddonGroupService } from "@repo/api-sdk";
import type { AddonGroup } from "@repo/types";
import { AddonGroupForm } from "./addon-group-form";
import { useToast } from "@/lib/use-toast";

interface AddonGroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

export function AddonGroupsManager({ open, onOpenChange }: AddonGroupsManagerProps) {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<AddonGroup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await AddonGroupService.list();
      setGroups(data);
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to load addon groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setMode("list");
      setEditing(null);
      fetchGroups();
    }
  }, [open]);

  const handleSaved = () => {
    setMode("list");
    setEditing(null);
    fetchGroups();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this addon group? It will be removed from any items currently using it.")) return;
    setDeletingId(id);
    try {
      await AddonGroupService.delete(id);
      success("Addon group deleted");
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "list" ? "Add-on Groups" : mode === "create" ? "New Addon Group" : "Edit Addon Group"}
          </DialogTitle>
        </DialogHeader>

        {mode === "list" ? (
          <>
            <div className="flex justify-between items-center pb-2">
              <p className="text-sm text-gray-500">
                Reusable groups of add-ons (e.g. "Extras", "Choose Sauce") that you can attach to multiple menu items.
              </p>
              <Button size="sm" onClick={() => setMode("create")}>
                <Plus className="h-4 w-4 mr-1" />
                New Group
              </Button>
            </div>
            <ScrollArea className="flex-1 -mr-4 pr-4">
              {loading ? (
                <div className="py-12 flex justify-center text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No addon groups yet. Create one to attach extras to menu items.
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((g) => (
                    <div key={g.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{g.name}</span>
                          <span className="text-xs text-gray-500">
                            {g.minSelect > 0 ? `Required • ` : `Optional • `}
                            min {g.minSelect} / max {g.maxSelect}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {(g.addons ?? []).map((a) => (
                            <span key={a.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {a.name}{a.price > 0 ? ` +${formatPaise(a.price)}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            setEditing(g);
                            setMode("edit");
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(g.id)}
                          disabled={deletingId === g.id}
                        >
                          {deletingId === g.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <AddonGroupForm
              group={mode === "edit" && editing ? editing : undefined}
              onSaved={handleSaved}
              onCancel={() => {
                setMode("list");
                setEditing(null);
              }}
            />
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
