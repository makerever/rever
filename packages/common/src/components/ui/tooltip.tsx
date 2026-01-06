// Shadcn tooltip with arrow

"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@rever/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 rounded-md bg-white px-3 py-1.5 text-sm text-neutral-1100 font-medium tooltip-box-shadow",
      "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "relative",
      className,
    )}
    {...props}
  >
    {props.children}

    {/* Auto-positioned arrow */}
    <TooltipPrimitive.Arrow
      className="fill-white drop-shadow"
      width={10}
      height={6}
    />
  </TooltipPrimitive.Content>
));

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
