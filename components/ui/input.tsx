import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-auto w-full min-w-0 rounded-[12px] border border-[rgba(120,128,170,.20)] bg-[rgba(255,255,255,.55)] px-3.5 py-2.5 text-base font-medium text-[#2c3150] transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:font-normal placeholder:text-[rgba(70,78,120,.5)] focus-visible:border-[1.5px] focus-visible:border-[#8aa6e8] focus-visible:bg-[rgba(255,255,255,.78)] focus-visible:shadow-[0_0_0_4px_rgba(138,166,232,.13)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_4px_rgba(239,68,68,.13)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
