import React from 'react';

const BrandMark = ({ size = 40 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tropi" x1="10" y1="10" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-primary)" />
          <stop offset="1" stopColor="#ff80b5" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="white" opacity="0.95" />
      <rect x="6" y="6" width="52" height="52" rx="16" stroke="rgba(255,255,255,0.6)" />
      <path
        d="M20 22C20 19.7909 21.7909 18 24 18H40C42.2091 18 44 19.7909 44 22V26H36V46H28V26H20V22Z"
        fill="url(#tropi)"
      />
      <circle cx="46" cy="20" r="6" fill="var(--brand-secondary)" opacity="0.85" />
    </svg>
  );
};

export default BrandMark;

