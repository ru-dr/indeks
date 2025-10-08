import { Loader } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader
      role="status"
      aria-label="Loading"
      className={cn("size-4 [animation:spin_1s_linear_infinite,colorCycle_4s_linear_infinite]", className)}
      {...props}
    />
  )
}

export { Spinner }
