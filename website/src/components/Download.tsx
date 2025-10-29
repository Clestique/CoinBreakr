import AndroidDownloadButton from './AndroidDownloadButton'
import CountdownTimer from './CountdownTimer'

export default function Download() {
  return (
    <section id="download" className="py-20" style={{ backgroundColor: '#14B8A6' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Download Splitlyr - Free Bill Splitting App
          </h2>
          <p className="text-xl mb-6 max-w-3xl mx-auto" style={{ color: '#CCFBF1' }}>
            Split restaurant bills, rent, groceries, and group expenses with friends.
            Track who owes what and settle up easily. Completely free to use.
          </p>

          <div className="bg-white rounded-lg p-4 mb-8 max-w-md mx-auto shadow-lg">
            <div className="text-center">
              <div className="text-sm mb-2 text-slate-500">Official launch in</div>
              <CountdownTimer 
                targetDate="2024-12-15T10:00:00" 
                className="justify-center text-lg font-bold text-teal-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <AndroidDownloadButton size="large" />

            <div className="inline-flex items-center bg-black text-white px-8 py-4 rounded-lg font-medium text-lg">
              <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-sm">COMING SOON</div>
                <div className="text-xl font-semibold">iOS Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}