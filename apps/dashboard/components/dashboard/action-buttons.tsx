"use client";

import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Plus } from "lucide-react";

export function ActionButtons() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-red-500 border-red-500">
          <Plus className="h-4 w-4 mr-1" />
          Table Reservation
        </Button>
        <Button variant="outline" size="sm" className="text-red-500 border-red-500">
          <Plus className="h-4 w-4 mr-1" />
          Contactless
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="move-kot" />
          <Label htmlFor="move-kot" className="text-sm">Move KOT/Items</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Floor Plan</span>
          <Select defaultValue="default">
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Layout</SelectItem>
              <SelectItem value="weekend">Weekend Layout</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
