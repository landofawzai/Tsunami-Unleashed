// Badge Component
// Status indicators and labels

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'orange'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  const variants = {
    success: { bg: '#d1fae5', text: '#065f46' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    error: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
    neutral: { bg: '#f3f4f6', text: '#1f2937' },
    purple: { bg: '#ede9fe', text: '#5b21b6' },
    orange: { bg: '#ffedd5', text: '#9a3412' },
  }

  const sizes = {
    sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
    lg: { padding: '0.375rem 1rem', fontSize: '0.875rem' },
  }

  const selectedVariant = variants[variant]
  const selectedSize = sizes[size]

  return (
    <span className="badge">
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          padding: ${selectedSize.padding};
          font-size: ${selectedSize.fontSize};
          font-weight: 600;
          border-radius: 9999px;
          background-color: ${selectedVariant.bg};
          color: ${selectedVariant.text};
          white-space: nowrap;
        }
      `}</style>
    </span>
  )
}
