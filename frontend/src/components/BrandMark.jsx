import React, { useId } from 'react'

const BrandMark = ({ size = 40, variant = 'tropiscan' }) => {
  const uid = useId().replace(/:/g, '')
  const tropiId = `tropi-${uid}`
  const dragonSkinId = `dragon-skin-${uid}`
  const dragonFleshId = `dragon-flesh-${uid}`
  const dragonLeafId = `dragon-leaf-${uid}`

  if (variant === 'dragonfruit') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={dragonSkinId} x1="16" y1="16" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f43f8f" />
            <stop offset="1" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id={dragonFleshId} x1="19" y1="22" x2="46" y2="43" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe4f1" />
            <stop offset="1" stopColor="#ffcce2" />
          </linearGradient>
          <linearGradient id={dragonLeafId} x1="21" y1="12" x2="43" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="white" opacity="0.95" />
        <circle cx="32" cy="32" r="29" stroke="rgba(15,23,42,0.08)" />
        <path
          d="M21 18C23.4 17 26.4 17.5 28.6 19.2C26.1 20.3 22.8 20.1 21 18Z"
          fill={`url(#${dragonLeafId})`}
        />
        <path
          d="M27 14C30.2 14.2 33.3 16.1 34.8 18.9C31.7 19.1 28.7 17.4 27 14Z"
          fill={`url(#${dragonLeafId})`}
        />
        <path
          d="M35 14.8C38.1 15.5 40.7 17.8 41.7 20.8C38.7 20.8 35.9 19 35 14.8Z"
          fill={`url(#${dragonLeafId})`}
        />
        <ellipse cx="32" cy="35" rx="17.5" ry="14.5" fill={`url(#${dragonSkinId})`} />
        <ellipse cx="32" cy="35" rx="11.2" ry="9.2" fill={`url(#${dragonFleshId})`} />
        <circle cx="27.5" cy="31.2" r="1.1" fill="#111827" opacity="0.75" />
        <circle cx="33.2" cy="30.1" r="1.1" fill="#111827" opacity="0.75" />
        <circle cx="37.3" cy="33.8" r="1.1" fill="#111827" opacity="0.75" />
        <circle cx="30.1" cy="37.1" r="1.1" fill="#111827" opacity="0.75" />
        <circle cx="35" cy="38.5" r="1.1" fill="#111827" opacity="0.75" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={tropiId} x1="10" y1="10" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-primary)" />
          <stop offset="1" stopColor="#ff80b5" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="white" opacity="0.95" />
      <rect x="6" y="6" width="52" height="52" rx="16" stroke="rgba(255,255,255,0.6)" />
      <path
        d="M20 22C20 19.7909 21.7909 18 24 18H40C42.2091 18 44 19.7909 44 22V26H36V46H28V26H20V22Z"
        fill={`url(#${tropiId})`}
      />
      <circle cx="46" cy="20" r="6" fill="var(--brand-secondary)" opacity="0.85" />
    </svg>
  )
}

export default BrandMark

