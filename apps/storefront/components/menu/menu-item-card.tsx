"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import type { Item } from "@repo/types";

interface MenuItemCardProps extends Pick<
  Item,
  "id" | "name" | "price" | "isVeg" | "image"
> {
  onAdd: (itemId: string) => void;
}

export const MenuItemCard = ({
  id,
  name,
  price,
  isVeg,
  image,
  onAdd,
}: MenuItemCardProps) => {
  const priceInRupees = Math.round(price / 100);

  return (
    <Card className="overflow-hidden py-0 gap-0 h-full hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="w-full h-40 bg-gray-100 relative shrink-0">
        <img
          src={image || "/default.png"}
          alt={name}
          className="w-full h-full object-cover"
        />
        <Badge
          variant="outline"
          className="absolute top-3 left-3 h-5 w-5 p-0 flex items-center justify-center bg-white shadow-sm border-0 rounded-sm"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isVeg ? "bg-green-600" : "bg-red-600"
            }`}
          />
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 h-10 text-gray-800">
          {name}
        </h3>

        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="text-base font-bold text-gray-900">
            ₹{priceInRupees}
          </span>
          <Button
            size="sm"
            onClick={() => onAdd(id)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold px-4 active:scale-95 transition-all"
          >
            ADD
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
