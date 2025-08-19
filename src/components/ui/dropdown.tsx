"use client"

import BaseDropdown from "@/components/Dropdown"

export interface UIDropdownOption {
  value: string
  label: string
}

interface UIDropdownProps {
  options: UIDropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function UIDropdown({ options, value, onChange, placeholder, disabled, className }: UIDropdownProps) {
  return (
    <BaseDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      variant="emerald"
    />
  )
}


