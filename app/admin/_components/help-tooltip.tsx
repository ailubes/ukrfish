'use client'

import { CircleHelp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function HelpTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#0047AB]/70 hover:bg-[#0047AB]/10 hover:text-[#0047AB]"
          aria-label="Пояснення"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-[260px] bg-[#0f172a] px-3 py-2 text-xs text-white">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
