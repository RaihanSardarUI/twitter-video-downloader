import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  variant?: 'default' | 'twitter' | 'success'
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, variant = 'default', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 11)}`
    
    const variantClasses = {
      default: {
        checkbox: "border-gray-300 text-blue-600 focus:ring-blue-500",
        checkmark: "text-white",
        label: "text-gray-700",
        description: "text-gray-500"
      },
      twitter: {
        checkbox: "border-gray-300 text-[#1DA1F2] focus:ring-[#1DA1F2]",
        checkmark: "text-white",
        label: "text-gray-700",
        description: "text-gray-500"
      },
      success: {
        checkbox: "border-gray-300 text-green-600 focus:ring-green-500",
        checkmark: "text-white",
        label: "text-gray-700",
        description: "text-gray-500"
      }
    }
    
    const styles = variantClasses[variant]
    
    return (
      <div className="flex items-start space-x-3 group">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={`
              peer sr-only
              ${className}
            `}
            {...props}
          />
          <div className={`
            w-5 h-5 rounded-md border-2 transition-all duration-200 cursor-pointer
            flex items-center justify-center
            peer-checked:bg-current peer-checked:border-current
            peer-focus:ring-2 peer-focus:ring-offset-2
            hover:border-current hover:shadow-sm
            group-hover:scale-105
            ${styles.checkbox}
          `}>
            <Check 
              className={`
                w-3 h-3 transition-all duration-200 transform
                peer-checked:scale-100 peer-checked:opacity-100
                scale-0 opacity-0
                ${styles.checkmark}
              `}
              strokeWidth={3}
            />
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label 
                htmlFor={checkboxId}
                className={`
                  block font-medium cursor-pointer select-none
                  transition-colors duration-200
                  group-hover:text-gray-900
                  ${styles.label}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`
                text-sm mt-1 leading-relaxed
                ${styles.description}
              `}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox } 