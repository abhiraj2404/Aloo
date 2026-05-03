"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Plus, QrCode } from "lucide-react";
import { AddTableDialog } from "./add-table-dialog";
import { RestaurantQrModal } from "./restaurant-qr-modal";

interface ActionButtonsProps {
  shopId: string;
  onMutated: () => void;
}

export function ActionButtons({ shopId, onMutated }: ActionButtonsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button size="sm" onClick={() => setIsAddOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Table
      </Button>
      <Button size="sm" variant="outline" onClick={() => setIsQrOpen(true)}>
        <QrCode className="h-4 w-4 mr-1" />
        Restaurant QR
      </Button>

      <AddTableDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        shopId={shopId}
        onCreated={onMutated}
      />
      <RestaurantQrModal
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
        shopId={shopId}
      />
    </div>
  );
}
