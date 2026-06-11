"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type MultiSelectOption = {
  value: string
  label: string
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "請選擇",
  emptyText = "沒有可選項目",
  className,
}: {
  options: MultiSelectOption[]
  value: Set<string>
  onChange: (next: Set<string>) => void
  placeholder?: string
  emptyText?: string
  className?: string
}) {
  function toggle(optionValue: string) {
    const next = new Set(value)
    if (next.has(optionValue)) next.delete(optionValue)
    else next.add(optionValue)
    onChange(next)
  }

  function remove(optionValue: string) {
    const next = new Set(value)
    next.delete(optionValue)
    onChange(next)
  }

  const selected = options.filter((option) => value.has(option.value))

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        nativeButton={false}
        render={<div role="button" tabIndex={0} />}
        className={cn(
          "flex min-h-[44px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-[12px] border border-[rgba(120,128,170,.20)] bg-[rgba(255,255,255,.55)] px-3.5 py-2 text-sm font-medium text-[#2c3150] transition-all outline-none select-none focus-visible:border-[1.5px] focus-visible:border-[#8aa6e8] focus-visible:bg-[rgba(255,255,255,.78)] focus-visible:shadow-[0_0_0_4px_rgba(138,166,232,.13)]",
          className
        )}
      >
        {selected.length === 0 ? (
          <span className="font-normal text-[rgba(70,78,120,.5)]">{placeholder}</span>
        ) : (
          selected.map((option) => (
            <span
              key={option.value}
              className="inline-flex h-6 items-center gap-1 rounded-full pr-1 pl-2.5 text-xs font-semibold text-[#4a5a96]"
              style={{ background: "linear-gradient(135deg, rgba(138,166,232,.22), rgba(171,146,216,.22))" }}
            >
              {option.label}
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  remove(option.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    event.stopPropagation()
                    remove(option.value)
                  }
                }}
                className="rounded-full p-0.5 hover:bg-[#4a5a96]/15"
                aria-label={`移除 ${option.label}`}
              >
                <XIcon className="size-3" />
              </span>
            </span>
          ))
        )}
        <ChevronDownIcon className="ml-auto size-4 shrink-0 text-[rgba(70,78,120,.5)]" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50"
        >
          <PopoverPrimitive.Popup className="w-(--anchor-width) min-w-40 origin-(--transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {options.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              options.map((option) => {
                const checked = value.has(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-input transition-colors",
                        checked && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {checked && <CheckIcon className="size-3" />}
                    </span>
                    {option.label}
                  </button>
                )
              })
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { MultiSelect }
export type { MultiSelectOption }
