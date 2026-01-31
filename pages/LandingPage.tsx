
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-sage-50 pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-sage-200/50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-sage-100 mb-8 animate-fade-in-up">
                        <Sparkles size={16} className="text-yellow-500" />
                        <span className="text-sm font-medium text-sage-800">New: Voice Consultation Available</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-sage-900 mb-6 tracking-tight leading-tight">
                        Heal Naturally with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-teal-600">Nature's Wisdom</span>
                    </h1>

                    <p className="text-xl text-sage-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Your personal AI-powered holistic health companion. Access ancient Ayurvedic knowledge, botanical remedies, and personalized wellness plans instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/app"
                            className="w-full sm:w-auto px-8 py-4 bg-sage-600 text-white rounded-full font-bold text-lg hover:bg-sage-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                            Start Free Consultation <ArrowRight size={20} />
                        </Link>
                        <Link
                            to="/about"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-sage-700 rounded-full font-bold text-lg hover:bg-sage-50 border border-sage-200 transition-all flex items-center justify-center"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-sage-900 mb-4">Holistic Health Features</h2>
                        <p className="text-sage-600 max-w-2xl mx-auto">Everything you need for your natural wellness journey in one place.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Leaf className="w-8 h-8 text-green-500" />,
                                title: "Botanical Rx",
                                description: "Complete database of medicinal plants and their healing properties."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
                                title: "Safe & Verified",
                                description: "Our AI cross-references traditional wisdom with modern safety guidelines."
                            },
                            {
                                icon: <Sparkles className="w-8 h-8 text-purple-500" />,
                                title: "Personalized Care",
                                description: "Tailored recommendations based on your unique constitution and needs."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-2xl bg-sage-50 border border-sage-100 hover:shadow-lg transition-all">
                                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-sage-900 mb-3">{feature.title}</h3>
                                <p className="text-sage-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-20 bg-sage-900 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">🏛️ The NatureNani Intelligence</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="text-4xl font-bold mb-2">200+</div>
                            <div className="text-sage-200 font-medium">📚 Curated Ancient Texts</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="text-4xl font-bold mb-2">37,000+</div>
                            <div className="text-sage-200 font-medium">🧩 Verified Healing Insights</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="text-4xl font-bold mb-2">100%</div>
                            <div className="text-sage-200 font-medium">✅ Citation-Grounded Logic</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
