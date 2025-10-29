export default function Hero() {
  return (
    <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: '#0F172A' }}>
              Split <span style={{ color: '#14B8A6' }}>Bills</span> with Friends
            </h1>
            <p className="text-xl mb-8" style={{ color: '#64748B' }}>
              Splitlyr helps you split restaurant bills, rent, groceries, and group expenses fairly. 
              Track who owes what, settle up easily, and keep your friendships money-drama free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#download"
                className="inline-flex items-center justify-center text-white px-8 py-4 rounded-lg hover:opacity-90 transition-opacity font-medium"
                style={{ backgroundColor: '#14B8A6' }}
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download App
              </a>
              <a
                href="#how-it-works"
                className="border-hover inline-flex items-center justify-center border-2 px-8 py-4 rounded-lg transition-colors font-medium"
                style={{ borderColor: '#CBD5E1', color: '#334155' }}
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it Works
              </a>
            </div>
          </div>
          
          <div className="relative">
            <div className="rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: '#14B8A6' }}>
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>Group Expenses</h3>
                  <span className="font-medium" style={{ color: '#14B8A6' }}>Weekend Trip</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F1F5F9' }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
                        <span className="text-white text-xs font-bold">🍕</span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#0F172A' }}>Dinner</p>
                        <p className="text-sm" style={{ color: '#64748B' }}>Split 4 ways</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" style={{ color: '#0F172A' }}>$120.00</p>
                      <p className="text-sm" style={{ color: '#10B981' }}>You paid $30.00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F1F5F9' }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
                        <span className="text-white text-xs font-bold">🏨</span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#0F172A' }}>Hotel</p>
                        <p className="text-sm" style={{ color: '#64748B' }}>2 nights</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" style={{ color: '#0F172A' }}>$240.00</p>
                      <p className="text-sm" style={{ color: '#EF4444' }}>You owe $60.00</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F0FDFA' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: '#334155' }}>Your Balance</span>
                    <span className="font-bold text-lg" style={{ color: '#EF4444' }}>-$30.00</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#64748B' }}>You owe money to the group</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}