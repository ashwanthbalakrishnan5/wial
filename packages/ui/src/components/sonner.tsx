"use client"

import { useTheme } from "next-themes"
import type { ComponentProps } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg relative overflow-hidden",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive group-[.toaster]:border-y-border group-[.toaster]:border-r-border group-[.toaster]:duration-[0]",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-green-500",
          warning: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
