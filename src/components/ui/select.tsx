"use client"

import type React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function Select(props: SelectProps) {
  const { className = "bg-emerald-900/30 border-emerald-400/30 text-emerald-100 rounded-md px-3 py-2", ...rest } = props
  return <select className={className} {...rest} />
}

export default Select


