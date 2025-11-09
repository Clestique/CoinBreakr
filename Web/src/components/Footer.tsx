import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/adaptive-icon.png" 
                alt="Splitlyr Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold">Splitlyr</span>
            </div>
            <p className="mb-6 max-w-md text-gray-300 font-medium">
              Split restaurant bills, rent, and group expenses with friends.
              Track who owes what, settle up easily, and keep friendships money-drama free.
            </p>

          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-gray-300 hover:text-white transition-colors font-medium">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors font-medium">How it Works</Link></li>
              <li><a href="/#download" className="text-gray-300 hover:text-white transition-colors font-medium">Download</a></li>
              <li><Link href="/release" className="text-gray-300 hover:text-white transition-colors font-medium">Release Notes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors font-medium">Contact Us</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors font-medium">FAQ</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors font-medium">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 font-medium">
              © 2025 Clestiq. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-sm text-gray-400 font-medium">Made with ❤️ for expense sharing</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}