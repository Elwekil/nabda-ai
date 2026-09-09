export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div className={`card ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  )
}