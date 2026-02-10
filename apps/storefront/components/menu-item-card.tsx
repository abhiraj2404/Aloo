"use client";

import { ReactNode } from "react";

interface MenuItemCardProps {
  id: string;
  name: string;
  price: number; // Price in paise
  isVeg: boolean;
  image: string | null;
  isAvailable: boolean;
  onAdd: (itemId: string) => void;
  layout?: "horizontal" | "vertical"; // New prop
}

/**
 * Menu item card component showing item details and add button
 * Supports both horizontal (desktop) and vertical (mobile) layouts
 */
export const MenuItemCard = ({
  id,
  name,
  price,
  isVeg,
  image,
  isAvailable,
  onAdd,
  layout = "horizontal",
}: MenuItemCardProps) => {
  // Convert price from paise to rupees
  const priceInRupees = Math.round(price / 100);

  // Vertical layout for mobile (like attached image)
  if (layout === "vertical") {
    return (
      <div
        className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Image on top - Fixed height */}
        <div className="w-full h-40 bg-gray-100 relative shrink-0">
          <img
            src={image || "/default.png"}
            alt={name}
            className="w-full h-full object-cover"
          />
          {/* Veg indicator in top-left */}
          <div className="absolute top-3 left-3 w-5 h-5 bg-white rounded-sm flex items-center justify-center shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 h-10 text-gray-800">
            {name}
          </h3>

          {/* Price + Add Button */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <span className="text-base font-bold text-gray-900">₹{priceInRupees}</span>
            <button
              onClick={() => onAdd(id)}
              disabled={!isAvailable}
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:active:scale-100"
            >
              {isAvailable ? "ADD" : "N/A"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout for desktop (current design)
  return (
    <div
      className="flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Image - Fixed size */}
      <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
        <img
          src={image || "/default.png"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Top section: Veg indicator + Title + Rating */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            {/* Veg indicator + Title */}
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center mt-0.5 shrink-0 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-600" />
              </div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-800">
                {name}
              </h3>
            </div>

            {/* Rating badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-xs font-semibold whitespace-nowrap shrink-0">
              <span>★</span>
              <span>4.2</span>
            </div>
          </div>
        </div>

        {/* Bottom section: Price + Add Button */}
        <div className="flex items-center justify-between gap-3 mt-2">
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">₹{priceInRupees}</span>
          </div>

          {/* Add Button */}
          <button
            onClick={() => onAdd(id)}
            disabled={!isAvailable}
            className="px-6 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:active:scale-100"
          >
            {isAvailable ? "ADD" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
};
