import React from 'react'

export function MobileContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-container overflow-x-hidden min-h-screen">
      {children}
    </div>
  )
}
