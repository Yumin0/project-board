import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-[12px] border border-[rgba(120,128,170,.20)] bg-[rgba(255,255,255,.55)] px-3.5 py-2.5 text-base font-medium text-[#2c3150] transition-all outline-none placeholder:font-normal placeholder:text-[rgba(70,78,120,.5)] focus-visible:border-[1.5px] focus-visible:border-[#8aa6e8] focus-visible:bg-[rgba(255,255,255,.78)] focus-visible:shadow-[0_0_0_4px_rgba(138,166,232,.13)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_4px_rgba(239,68,68,.13)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
