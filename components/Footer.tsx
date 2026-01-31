
import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Instagram, Heart } from 'lucide-react';

const RedditIcon = ({ size = 20, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M17 13c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.657 1.343 3 3 3s3-1.343 3-3z" />
        <path d="M17 13v.01" />
        <path d="M10 13v.01" />
    </svg>
    // Basic conceptual circle-ish icon, but for Reddit specifically let's stick to a simple known shape or just use the text if icon is hard. 
    // Actually, let's use a real path.
    // Reddit Alien path is complex. I'll use a simple circle with 'r' style text if I can, but standard practice:
    // Just use a generic "MessageCircle" from Lucide identifying as Community if needed, OR just the custom SVG below which is a simplified "face".
);


const Footer: React.FC = () => {
    return (
        <footer className="bg-sage-50 border-t border-sage-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="inline-block mb-4">
                            <Logo className="h-10 w-10" textClassName="text-2xl" />
                        </Link>
                        <p className="text-sage-600 text-sm leading-relaxed mb-6">
                            Your holistic companion for natural healing. NatureNani combines ancient wisdom with modern technology to guide you towards better health.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://instagram.com/thenaturenani"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sage-400 hover:text-sage-600 transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://www.reddit.com/r/thenaturenani/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sage-400 hover:text-sage-600 transition-colors"
                                aria-label="Reddit"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-sage-900 mb-4">Platform</h3>
                        <ul className="space-y-3 text-sm text-sage-600">
                            <li><Link to="/app" className="hover:text-sage-800 transition-colors">Consultation</Link></li>
                            <li><Link to="/app" className="hover:text-sage-800 transition-colors">Botanical Rx</Link></li>
                            <li><Link to="/app" className="hover:text-sage-800 transition-colors">Yoga Aid</Link></li>
                            <li><Link to="/app" className="hover:text-sage-800 transition-colors">Nutri Heal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-sage-900 mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-sage-600">
                            <li><Link to="/about" className="hover:text-sage-800 transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-sage-800 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-sage-900 mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm text-sage-600">
                            <li><Link to="/privacy" className="hover:text-sage-800 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-sage-800 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/medical-disclaimer" className="hover:text-sage-800 transition-colors">Medical Disclaimer</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-sage-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sage-500 text-sm">
                        © 2025 NatureNani. All rights reserved.
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 text-sage-500 text-sm">
                            <span>Made with</span>
                            <Heart size={16} className="text-red-400 fill-current" />
                            <span>for a healthier world</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-white border border-sage-200 rounded-full text-[10px] font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-[#635BFF]"></span> Powered by <span className="text-[#635BFF]">Stripe</span>
                            </div>
                            <div className="px-3 py-1 bg-white border border-sage-200 rounded-full text-[10px] font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-[#3ECF8E]"></span> Powered by <span className="text-[#3ECF8E]">Supabase</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
