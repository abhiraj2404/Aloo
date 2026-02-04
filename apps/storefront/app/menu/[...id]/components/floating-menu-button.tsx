"use client";

interface FloatingMenuButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Fixed bottom-right button to open category menu (mobile only)
 * Overlaid on page content
 */
export const FloatingMenuButton = ({ onClick, className = "" }: FloatingMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-black text-white shadow-2xl flex items-center justify-center z-50 hover:bg-gray-900 transition-colors ${className}`}
      aria-label="Open menu categories"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </button>
  );
};
