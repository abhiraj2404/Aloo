export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <svg width="120" height="35" viewBox="0 0 240 70" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g fill="currentColor">
        <path d="M15 55 L35 15 L55 55 L47 55 L42 43 L28 43 L23 55 Z"/>
        <rect x="70" y="15" width="10" height="40" rx="3"/>
        <rect x="70" y="45" width="28" height="10" rx="3"/>
        <ellipse cx="145" cy="35" rx="20" ry="18"/>
        <ellipse cx="185" cy="35" rx="19" ry="17"/>
      </g>
    </svg>
  );
};
