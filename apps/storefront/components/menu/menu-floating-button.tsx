"use client";

interface MenuFloatingButtonProps {
  onClick: () => void;
  className?: string;
}

export const MenuFloatingButton = ({ onClick, className = "" }: MenuFloatingButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 w-20 h-20 rounded-full bg-black text-white shadow-2xl hover:bg-gray-900 z-50 flex flex-col items-center justify-center gap-1 ${className}`}
      aria-label="Open menu categories"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span className="text-xs font-semibold">MENU</span>
    </button>
  );
};
