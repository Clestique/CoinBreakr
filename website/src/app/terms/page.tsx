export default function Terms() {
  return (
    <div className="min-h-screen py-16" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#0F172A' }}>Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="mb-6" style={{ color: '#64748B' }}>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F172A' }}>1. Acceptance of Terms</h2>
              <p className="mb-4" style={{ color: '#334155' }}>
                By downloading, installing, or using Splitlyr ("the App"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F172A' }}>2. Description of Service</h2>
              <p className="mb-4" style={{ color: '#334155' }}>
                Splitlyr is a mobile application that helps users split expenses with friends, family, and groups. 
                The App allows you to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Track shared expenses and calculate splits</li>
                <li>Manage groups for different activities</li>
                <li>Monitor balances between users</li>
                <li>Send payment reminders and notifications</li>
                <li>Export expense data and transaction history</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                To use Splitlyr, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree not to use Splitlyr to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Upload malicious code or attempt to compromise the App</li>
                <li>Use the App for commercial purposes without authorization</li>
                <li>Create fake accounts or impersonate others</li>
                <li>Share inappropriate or offensive content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Financial Information</h2>
              <p className="text-gray-700 mb-4">
                Splitlyr is a tracking and calculation tool only. We do not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Process actual payments between users</li>
                <li>Store banking or credit card information</li>
                <li>Guarantee that debts will be paid</li>
                <li>Act as a financial institution or payment processor</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Users are responsible for settling debts through their preferred payment methods outside of the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your information. By using Splitlyr, you consent to our data practices as 
                described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                Splitlyr and all related content, features, and functionality are owned by us and are protected 
                by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, 
                or create derivative works based on the App without our written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
              <p className="text-gray-700 mb-4">
                Splitlyr is provided "as is" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy of calculations or data</li>
                <li>Compatibility with all devices or operating systems</li>
                <li>Resolution of disputes between users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account at any time for violation of these Terms. 
                You may delete your account at any time through the App settings. Upon termination, 
                your right to use the App will cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant 
                changes through the App or via email. Continued use of Splitlyr after changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700">
                If you have questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@splitlyr.com" className="text-primary-500 hover:text-primary-600 transition-colors">
                  legal@splitlyr.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}