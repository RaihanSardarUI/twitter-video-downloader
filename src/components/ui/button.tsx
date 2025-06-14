import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'twitter' | 'success' | 'paste' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'xl'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      twitter: "bg-gradient-to-r from-[#1DA1F2] to-[#0C85E8] text-white hover:from-[#0C85E8] hover:to-[#1DA1F2] shadow-md",
      success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transform hover:scale-105 active:scale-95",
      paste: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
      secondary: "bg-gray-500 hover:bg-gray-600 text-white"
    }
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8", 
      xl: "h-12 rounded-lg px-6 py-4 text-lg"
    }
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        className: classes,
        ref
      })
    }
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button } 