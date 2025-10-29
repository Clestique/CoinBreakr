'use client'

interface AndroidDownloadButtonProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export default function AndroidDownloadButton({
  className = "",
  size = 'medium'
}: AndroidDownloadButtonProps) {
  const testingAppUrl = process.env.NEXT_PUBLIC_TESTING_APP_URL || 'https://play.google.com/apps/testing/com.splitlyr.app'

  const handleClick = () => {
    window.open(testingAppUrl, '_blank', 'noopener,noreferrer')
  }

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  const iconSizes = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div
      className={`inline-flex items-center bg-black text-white rounded-lg font-medium transition-colors cursor-pointer hover:bg-gray-800 ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
    >
      <svg className={`mr-3 ${iconSizes[size]}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
      </svg>
      <div className="text-left">
        <div className="text-sm">TRY BETA</div>
        <div className={size === 'large' ? 'text-xl font-semibold' : size === 'medium' ? 'text-lg font-semibold' : 'text-base font-semibold'}>Test App</div>
      </div>
    </div>
  )
}