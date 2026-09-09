export default function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, className = '', loading = false, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger'
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${variants[variant]} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} {...props}>
      {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري...</span></div> : children}
    </button>
  )
}