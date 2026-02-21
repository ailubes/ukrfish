import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Водні Горизонти України</h3>
            <p className="text-blue-200 text-sm">
              Комплексна платформа для моніторингу водних ресурсів України, 
              призначених для аквакультури та рибного господарства.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Навігація</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="text-blue-200 hover:text-white transition-colors duration-200"
              >
                Головна
              </Link>
              <Link 
                to="/objects" 
                className="text-blue-200 hover:text-white transition-colors duration-200"
              >
                Об'єкти
              </Link>
              <Link 
                to="/stats" 
                className="text-blue-200 hover:text-white transition-colors duration-200"
              >
                Статистика
              </Link>
              <Link 
                to="/counter" 
                className="text-blue-200 hover:text-white transition-colors duration-200"
              >
                Лічильник
              </Link>
            </nav>
          </div>

          {/* Support and Contact */}
          <div className="space-y-4 flex flex-col items-center md:items-start"> {/* Added flex and items-center for centering */}
            <h4 className="text-lg font-semibold">Підтримка проекту</h4>
            <a 
              href="https://ukrfish.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block mb-2" // block to allow text to go beneath, mb-2 for spacing
            >
              <img 
                src="/img/cropped-Ukrfish_logo-300x60.png" 
                alt="Ukrfish.org Logo" 
                className="h-20 w-auto bg-white p-2 rounded-lg shadow-md" // Increased height, added white background, padding, and rounded corners
              />
            </a>
            <span className="text-blue-200 text-sm">Створено за підтримки Ukrfish.org</span>
          </div>
        </div>

        <div className="border-t border-blue-700 mt-8 pt-6 text-center">
          <p className="text-blue-200 text-sm">
            © {currentYear} Водні Горизонти України. Всі права захищено.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
