export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Download & Setup",
      description: "Get Splitlyr from the app store and create your free account in seconds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      step: "2",
      title: "Add Friends & Groups",
      description: "Connect with friends and create groups for different activities like trips, dinners, or shared living expenses.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      step: "3",
      title: "Split Expenses",
      description: "Add shared expenses and let Splitlyr automatically calculate who owes what to whom.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      step: "4",
      title: "Settle Up",
      description: "Track balances and settle debts easily. Mark payments as complete when friends pay you back.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <section id="how-it-works" className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
            How to Split Bills with Splitlyr
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#64748B' }}>
            Split restaurant bills, rent, and group expenses in just a few simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-8">
                <div className="text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" style={{ backgroundColor: '#14B8A6' }}>
                  {step.step}
                </div>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#F0FDFA', color: '#14B8A6' }}>
                  {step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 transform -translate-y-1/2" style={{ backgroundColor: '#CCFBF1' }}></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F172A' }}>{step.title}</h3>
              <p className="leading-relaxed" style={{ color: '#64748B' }}>{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-8">
                Why Choose Splitlyr?
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">Free to use with no hidden fees or subscriptions</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">Smart expense splitting with automatic calculations</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">Group expenses for trips, dinners, and shared living</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">Secure data with privacy-focused design</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">Easy settlement tracking and payment reminders</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl p-8 relative z-10 border-2" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)', borderColor: '#99F6E4' }}>
              <div className="text-center">
                <img src="/adaptive-icon.png" alt="Splitlyr Logo" className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" />
                <h4 className="text-xl font-bold text-gray-900 mb-3">Ready to get started?</h4>
                <p className="text-gray-700 mb-8 font-medium text-lg">Join thousands of users already splitting expenses with Splitlyr</p>
                <a
                  href="#download"
                  className="download-button inline-flex items-center text-white px-10 py-4 rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-lg shadow-lg transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                    boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.4)'
                  }}
                >
                  Download Now
                  <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}