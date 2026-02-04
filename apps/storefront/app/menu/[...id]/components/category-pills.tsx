"use client";

interface Category {
  id: string;
  name: string;
  orderIndex: number;
}

interface CategoryPillsProps {
  categories: Category[];
  currentCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Horizontal scrollable category pills for desktop
 */
export const CategoryPills = ({
  categories,
  currentCategoryId,
  onSelectCategory,
}: CategoryPillsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isSelected = category.id === currentCategoryId;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              isSelected 
                ? "bg-green-600 text-white shadow-sm" 
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
};
