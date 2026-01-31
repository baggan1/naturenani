
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Menu, X, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const links = [
        { name: 'About', path: '/about' },
        { name: 'Features', path: '/#features' },
        { name: 'FAQ', path: '/faq' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-sage-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center">
                        <Logo className="h-8 w-8" textClassName="text-xl" />
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-sage-700 hover:text-sage-900 font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            to="/app"
                            className="bg-sage-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-sage-700 transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
                        >
                            Launch App <ArrowRight size={18} />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-sage-700 hover:text-sage-900 p-2"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-sage-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-sage-700 hover:bg-sage-50 hover:text-sage-900"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            to="/app"
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center mt-4 bg-sage-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-sage-700 transition-colors"
                        >
                            Launch App
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
