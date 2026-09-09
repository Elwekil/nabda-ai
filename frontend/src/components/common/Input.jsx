import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ label, type = 'text', name, value, onChange, placeholder, error, required = false, icon = null, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="w-full">
      {label && (
        <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: error ? '#ef4444' : 'var(--border-input)',
          }}
          className={`w-full ${icon ? 'pr-10' : 'pr-4'} pl-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none`}
          {...props}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ color: 'var(--text-faint)' }}
            className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
