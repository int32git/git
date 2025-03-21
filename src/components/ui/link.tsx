"use client"

import * as React from "react"
import NextLink from "next/link"
import { cn } from "@/lib/utils"

export interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  className?: string
  children?: React.ReactNode
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NextLink
        className={cn("text-primary underline-offset-4 hover:underline", className)}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    )
  }
)
Link.displayName = "Link"

export { Link } 