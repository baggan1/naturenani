
import React from 'react';
import { FAQView } from '../components/FAQView';

const FAQPage: React.FC = () => {
    return (
        <div className="py-8">
            {/* We pass a no-op for onBack since the navbar handles navigation in the web view */}
            <FAQView onBack={() => { }} />
        </div>
    );
};

export default FAQPage;
