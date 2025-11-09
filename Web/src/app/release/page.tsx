import AndroidDownloadButton from '@/components/AndroidDownloadButton'
import CountdownTimer from '@/components/CountdownTimer'

export default function Release() {
  return (
    <div className="min-h-screen py-16" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>🎉 Splitlyr is live in</h1>
            <CountdownTimer
              targetDate="2024-12-15T10:00:00"
              className="text-3xl font-bold text-teal-500"
            />
          </div>
          <p className="text-xl" style={{ color: '#64748B' }}>
            The easiest way to split expenses with friends and family
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <img src="/adaptive-icon.png" alt="Splitlyr" className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F172A' }}>Version 1.0.0 - Launch Release</h2>
            <p className="mb-6" style={{ color: '#64748B' }}>Released on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F172A' }}>🍕 Bill Splitting Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#334155' }}>Split restaurant bills, groceries, and rent equally or by custom amounts</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#334155' }}>Create groups for roommates, trips, and shared activities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#334155' }}>Track who owes what with real-time balance calculations</span>
                </li>

                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#334155' }}>Mark payments as complete when friends pay you back</span>
                </li>

              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F172A' }}>📱 Perfect for</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#14B8A6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span style={{ color: '#334155' }}>Roommates splitting rent, utilities, and groceries</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#14B8A6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: '#334155' }}>Friends dining out and splitting restaurant bills</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#14B8A6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: '#334155' }}>Group trips with shared hotels, gas, and activities</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F0FDFA' }}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 What Makes Splitlyr Special</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Simple & Intuitive</h4>
                <p className="text-gray-700 text-sm">Designed with simplicity in mind. No complex features or confusing interfaces - just easy expense splitting.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Completely Free</h4>
                <p className="text-gray-700 text-sm">No subscriptions, no premium features, no hidden costs. Splitlyr is free for everyone, forever.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Privacy First</h4>
                <p className="text-gray-700 text-sm">Your financial data stays private. We don't store banking information or share your data with third parties.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Android First</h4>
                <p className="text-gray-700 text-sm">Available on Android with iOS version coming soon. Focus on delivering the best mobile experience.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚧 Coming Soon</h3>
            <p className="text-yellow-700 mb-4">We're working on new features to make bill splitting even easier:</p>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• Scan receipts with your camera to automatically add expenses</li>
              <li>• Integration with Venmo, PayPal, and other payment apps</li>
              <li>• Expense categories (Food, Travel, Utilities, etc.)</li>
              <li>• Multi-currency support for international trips</li>
              <li>• Monthly spending reports and insights</li>

            </ul>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-6">
              Start splitting expenses fairly and keep your friendships money-drama free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AndroidDownloadButton size="medium" />
              <div className="inline-flex items-center bg-black text-white px-6 py-3 rounded-lg font-medium">
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-sm">COMING SOON</div>
                  <div className="text-lg font-semibold">iOS Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📞 Support & Feedback</h3>
          <p className="text-gray-700 mb-4">
            We'd love to hear from you! Whether you have questions, feedback, or feature requests,
            our team is here to help make Splitlyr even better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/contact"
              className="inline-flex items-center text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium text-center"
              style={{ backgroundColor: '#14B8A6' }}
            >
              Contact Support
            </a>
            <a
              href="/faq"
              className="border-hover inline-flex items-center border-2 px-6 py-3 rounded-lg transition-colors font-medium text-center"
              style={{ borderColor: '#CBD5E1', color: '#334155' }}
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}