import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold">
                U
              </div>
              <span className="text-xl font-bold text-white">Uniboe.com</span>
            </div>
            <p className="text-sm text-gray-400">
              Your all-in-one student life companion. Connecting students across universities for a better campus experience.
            </p>
          </div>

          {/* What We Offer */}
          <div>
            <h3 className="text-white font-semibold mb-4">What We Offer</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/feed" className="hover:text-white transition-colors">
                  Social Feed
                </Link>
              </li>
              <li>
                <Link to="/housing" className="hover:text-white transition-colors">
                  Apartment Finder
                </Link>
              </li>
              <li>
                <Link to="/olive" className="hover:text-white transition-colors">
                  Olive AI
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Join us!
                </Link>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="text-white font-semibold mb-4">Get in Touch</h3>
            <p className="text-sm">
              <a
                href="mailto:contact@uniboe.com"
                className="hover:text-white transition-colors"
              >
                contact@uniboe.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>Uniboe.com</p>
          <p className="mt-1">Built for students, by students.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

