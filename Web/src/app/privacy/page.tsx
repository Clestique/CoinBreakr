export default function Privacy() {
  return (
    <div className="min-h-screen py-16" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#0F172A' }}>Privacy Policy</h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-6" style={{ color: '#64748B' }}>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F172A' }}>Information We Collect</h2>
              <p className="mb-4" style={{ color: '#334155' }}>
                Splitlyr collects minimal information necessary to provide our expense splitting services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Expense data you enter (amounts, descriptions, participants)</li>
                <li>Friend and group information for expense sharing</li>
                <li>App usage analytics to improve user experience</li>
                <li>Device information for app optimization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Calculate expense splits and balances between users</li>
                <li>Facilitate expense sharing with friends and groups</li>
                <li>Improve app functionality and user experience</li>
                <li>Send important app updates and notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>No sensitive payment or banking information is stored</li>
                <li>Regular security audits and updates</li>
                <li>Secure user authentication and authorization</li>
              </ul>
            </section>



            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your expense and transaction data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please{' '}
                <a href="/contact" className="text-primary-500 hover:text-primary-600 transition-colors">
                  contact us
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}