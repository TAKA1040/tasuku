'use client'

interface RefreshButtonProps {
  style?: React.CSSProperties
  children: React.ReactNode
}

export function RefreshButton({ style, children }: RefreshButtonProps) {
  const handleClick = () => {
    window.location.reload()
  }

  return (
    <button onClick={handleClick} style={style}>
      {children}
    </button>
  )
}