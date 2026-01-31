
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieConsent from './CookieConsent';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-grow pt-16">
                <Outlet />
            </main>
            <CookieConsent />
            <Footer />
        </div>
    );
};

export default Layout;
