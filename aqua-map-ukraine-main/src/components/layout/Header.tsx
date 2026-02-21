'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Waves } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white shadow-lg border-b-2 border-blue-500">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Водні Горизонти України
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8"> {/* Added items-center for alignment */}
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Головна
            </Link>
            <Link 
              to="/objects" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Об'єкти
            </Link>
            <Link 
              to="/stats" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200" // Changed to regular link style
            >
              Статистика
            </Link>
            <Link 
              to="/suggest" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Додати
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                onClick={toggleMenu}
              >
                Головна
              </Link>
              <Link 
                to="/objects" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                onClick={toggleMenu}
              >
                Об'єкти
              </Link>
              <Link 
                to="/stats" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2" // Changed to regular link style
                onClick={toggleMenu}
              >
                Статистика
              </Link>
              <Link 
                to="/suggest" 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                onClick={toggleMenu}
              >
                Додати
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
