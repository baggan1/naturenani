
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('naturenani-cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('naturenani-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('naturenani-cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-200 shadow-lg p-4 z-50 animate-fade-in-up">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sage-800 text-sm">
                        We use cookies to improve your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-sage-600 font-medium hover:bg-sage-50 rounded-lg transition-colors text-sm"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 bg-sage-600 text-white font-medium hover:bg-sage-700 rounded-lg transition-colors text-sm shadow-sm"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
