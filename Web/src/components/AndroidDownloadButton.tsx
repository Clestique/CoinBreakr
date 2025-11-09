'use client'

import { useState } from 'react'

interface AndroidDownloadButtonProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export default function AndroidDownloadButton({
  className = "",
  size = 'medium'
}: AndroidDownloadButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_URL || '#'

  const handleClick = () => {
    setShowModal(true)
  }

  const handleDownloadApk = () => {
    window.open(apkDownloadUrl, '_blank', 'noopener,noreferrer')
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
    <>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1"></div>
              <h2 className="text-3xl font-bold text-gray-900 flex-1 text-center">Access Beta Testing</h2>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-center">
              You have 3 options to access the beta app.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Request Tester Access */}
              <div className="border-2 border-blue-200 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  RECOMMENDED
                </div>
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Request Access</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Get approved to test via Play Store</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</span>
                    <p className="text-gray-700 leading-tight">Go to Contact page</p>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</span>
                    <p className="text-gray-700 leading-tight">Enter your Gmail address</p>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</span>
                    <p className="text-gray-700 leading-tight">Select "Request Access" in dropdown</p>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">4</span>
                    <p className="text-gray-700 leading-tight">Submit form</p>
                  </div>
                </div>

                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">Access within 24 hours</span> - You'll receive an email invitation to test via Play Store
                  </p>
                </div>
              </div>

              {/* Direct APK Download */}
              <div className="border-2 border-green-200 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  FASTEST
                </div>
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Direct Download</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Download APK file directly</p>
                
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <p className="text-xs text-green-800 font-semibold">Safe & Secure</p>
                      <p className="text-xs text-green-700 mt-1">Official source, completely safe to install</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-4">
                  <p className="text-xs text-gray-700 font-semibold mb-2">Before installing:</p>
                  <div className="space-y-1">
                    <div className="flex items-start text-xs text-gray-700">
                      <span className="mr-2">•</span>
                      <span>Enable "Unknown Sources"</span>
                    </div>
                    <div className="flex items-start text-xs text-gray-700">
                      <span className="mr-2">•</span>
                      <span>Check storage space</span>
                    </div>
                    <div className="flex items-start text-xs text-gray-700">
                      <span className="mr-2">•</span>
                      <span>Android 5.0+ required</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadApk}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download APK
                </button>
              </div>

              {/* Login to Play Store */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Play Store Login</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Use provided credentials</p>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">Email</div>
                    <div className="font-mono text-sm font-semibold text-gray-900 break-all">chingam.ins@gmail.com</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">Password</div>
                    <div className="font-mono text-sm font-semibold text-gray-900">Chingam#2024</div>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800 font-semibold mb-2">Instructions:</p>
                  <div className="space-y-1">
                    <div className="flex items-start text-xs text-yellow-800">
                      <span className="mr-2">1.</span>
                      <span>Open Play Store on Android</span>
                    </div>
                    <div className="flex items-start text-xs text-yellow-800">
                      <span className="mr-2">2.</span>
                      <span>Sign in with credentials above</span>
                    </div>
                    <div className="flex items-start text-xs text-yellow-800">
                      <span className="mr-2">3.</span>
                      <span>Search for "Splitlyr"</span>
                    </div>
                    <div className="flex items-start text-xs text-yellow-800">
                      <span className="mr-2">4.</span>
                      <span>Download and install</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}