"use client"

import type React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function Select(props: SelectProps) {
  const { className = "appearance-none w-full bg-emerald-900/30 border border-emerald-400/30 text-emerald-100 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-emerald-400/40", ...rest } = props
  return (
    <div className="relative w-full">
      <select className={className} {...rest} />
      <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 12a1 1 0 0 1-.707-.293l-4-4a1 1 0 1 1 1.414-1.414L10 9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4A1 1 0 0 1 10 12z" clipRule="evenodd" />
      </svg>
    </div>
  )
}

export default Select


