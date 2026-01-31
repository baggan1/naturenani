
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const About: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-sage-900 mb-6">About NatureNani: <br /><span className="text-sage-600 text-3xl md:text-4xl">Restoring Your Natural Intelligence (NQ)</span></h1>
            <img
                src="/ancient_wisdom_modern_tech.png"
                alt="Ancient wisdom meets modern technology"
                className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg mb-8 outline outline-4 outline-sage-100"
            />
        </div>

        <div className="prose prose-sage prose-lg max-w-none text-sage-700 space-y-12">

            <section>
                <h2 className="text-3xl font-bold text-sage-900 mb-4">Our Vision</h2>
                <p>
                    NatureNani was born from a simple yet urgent observation: in our modern world, we have become disconnected from the wealth of nature. While conventional medicine is a vital, life-saving resource for emergencies, we have grown accustomed to overloading our bodies with medication for even the smallest ailments. Too often, we mask symptoms rather than addressing the root cause, allowing minor issues to evolve into chronic challenges.
                </p>
                <p className="font-semibold text-sage-800 mt-4">
                    NatureNani is the digital bridge back to balance. <span className="font-normal text-sage-700">Our vision is to provide access to the thousands of years of wisdom found in <span className="font-bold">Ayurveda</span> and <span className="font-bold">Naturopathy</span>—traditions that don’t just treat symptoms, but restore harmony to the human body.</span>
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-sage-900 mb-4">The Power of Grounded AI</h2>
                <p>
                    To bring this ancient wisdom into the 21st century, we utilize <span className="font-bold">Retrieval-Augmented Generation (RAG)</span>. Unlike general AI models that "guess" answers based on a massive, unfiltered internet, NatureNani is strictly grounded in a private, curated library of verified texts.
                </p>
                <h3 className="text-xl font-bold text-sage-900 mt-4 mb-2">How It Works:</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-bold">Authentic Sources:</span> Our library includes verified translations of classical Ayurvedic <em>Samhitas</em> and traditional Naturopathy clinical guides.</li>
                    <li><span className="font-bold">No Hallucinations:</span> Before giving you an answer, NatureNani "searches" these authentic texts to find relevant passages. This ensures every recommendation is deeply rooted in holistic tradition.</li>
                    <li><span className="font-bold">Safety First:</span> By constraining our AI to specific, verified literature, we provide safe, grounded guidance that respects the human body’s intelligence.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-sage-900 mb-4">A Balanced Perspective</h2>
                <p>
                    We believe in a "Both/And" approach to health. We are not against conventional medicine; we are for <span className="font-bold">informed prevention</span>. Our goal is to empower the common person to understand their body's warning signs rather than silencing them.
                </p>
                <p className="mt-4">
                    Whether you are seeking to treat a common cold naturally or looking to supplement a major medical journey with holistic support, NatureNani is your personal wellness guide. We help you treat the disease before it progresses, using the very resources nature has provided for millennia.
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-sage-900 mb-4">Why "Natural Intelligence"?</h2>
                <p>
                    We call this <span className="font-bold">NQ</span>. Just as we use Artificial Intelligence to process data, we must use our Natural Intelligence to process health. NatureNani is here to help you lead a more informed health journey—connected to nature, supported by tech, and focused on you.
                </p>
            </section>

            <section className="bg-sage-50 p-8 rounded-2xl border border-sage-100">
                <h2 className="text-3xl font-bold text-sage-900 mb-6 flex items-center gap-3">
                    <span className="text-3xl">🌿</span> Our Core Values
                </h2>
                <ul className="space-y-4">
                    <li className="flex gap-3">
                        <span className="font-bold text-sage-900 min-w-[160px]">Root-Cause Focus:</span>
                        <span>We believe in looking beyond the surface. Instead of masking symptoms, our guidance is designed to help you identify and address the underlying imbalances in your body.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-sage-900 min-w-[160px]">Radical Authenticity:</span>
                        <span>In an age of digital noise, we prioritize the truth. By grounding our AI in verified Ayurvedic and Naturopathic texts through <span className="font-bold">RAG technology</span>, we ensure every suggestion is an authentic reflection of ancient wisdom—never a guess.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-sage-900 min-w-[160px]">Proactive Prevention:</span>
                        <span>We value the "Nature of the Human Body." Our goal is to shift the health narrative from reactive treatment to proactive prevention, empowering you to listen to your body’s warning signs early.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-sage-900 min-w-[160px]">Empowered Accessibility:</span>
                        <span>Wisdom shouldn’t be hidden in rare manuscripts. We are committed to making the world’s most powerful natural healing resources accessible, understandable, and actionable for everyone, everywhere.</span>
                    </li>
                </ul>
            </section>

            <p className="text-xl text-center italic text-sage-600 font-medium pt-8">
                "Let’s rediscover our NQ, together."
            </p>

            <div className="flex justify-center pt-8 pb-4">
                <Link
                    to="/app"
                    className="bg-sage-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-sage-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    Begin Your Journey – Try a Consultation <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    </div>
);

export const Privacy: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-sage-900 mb-6 flex items-center gap-3"><span className="text-2xl">🔒</span> Privacy & Data Policy</h1>
        <div className="prose prose-sage text-sage-700 max-w-none">
            <h2 className="text-xl font-bold mt-6 mb-2">1. Data Collection</h2>
            <p className="mb-2">NatureNani collects information to provide and improve our wellness services. This includes:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><span className="font-semibold">Authentication Data:</span> When you sign up or log in, we collect basic profile information (such as your email address and name) provided through <span className="font-semibold">Google Auth</span> and <span className="font-semibold">Supabase Auth</span>. This is used to manage your account and save your preferences.</li>
                <li><span className="font-semibold">Wellness Queries:</span> We collect the text queries you input to generate relevant responses.</li>
                <li><span className="font-semibold">Usage Data:</span> Information on how you interact with the app to help us optimize the user experience.</li>
            </ul>
            <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <span className="font-bold">Important:</span> Please do not input highly sensitive personal identifiers (such as Social Security numbers or specific home addresses) into the chat interface.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">2. Third-Party Service Providers</h2>
            <p className="mb-2">To provide a high-quality experience, NatureNani utilizes trusted third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><span className="font-semibold">Authentication:</span> We use <span className="font-bold">Google</span> and <span className="font-bold">Supabase</span> to securely manage user identity and login sessions.</li>
                <li><span className="font-semibold">AI Processing:</span> Your queries are processed through <span className="font-bold">Google AI Studio/Gemini API</span> or <span className="font-bold">OpenAI</span> to generate responses.</li>
                <li><span className="font-semibold">Payments:</span> All premium membership transactions are handled by <span className="font-bold">Stripe</span>, a leading external payment processor.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-2">3. Payment Information & Security</h2>
            <p className="mb-4">NatureNani does not store or have access to your full credit card numbers or bank account details. All payment processing is performed securely by <span className="font-bold">Stripe</span>. When you upgrade to a Premium membership, your payment information is collected and processed directly by Stripe under their own privacy policy.</p>

            <h2 className="text-xl font-bold mt-6 mb-2">4. How Your Data is Used</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><span className="font-semibold">Account Management:</span> To maintain your subscription status and personalized settings.</li>
                <li><span className="font-semibold">Query Synthesis:</span> To provide RAG-based wellness insights grounded in traditional texts.</li>
                <li><span className="font-semibold">No Sale of Data:</span> We do not sell your personal data or health-related queries to third-party advertisers or data brokers.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-2">5. Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures, including encryption and secure authentication protocols via <span className="font-bold">Supabase</span>, to protect your information. However, no method of transmission over the internet is 100% secure. By using NatureNani, you acknowledge that you provide your information at your own risk.</p>
        </div>
    </div>
);

export const Terms: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-sage-900 mb-6 flex items-center gap-3"><span className="text-2xl">📜</span> Terms of Service: NatureNani</h1>
        <div className="prose prose-sage text-sage-700 max-w-none">
            <h2 className="text-xl font-bold mt-6 mb-2">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing or using <span className="font-bold">NatureNani</span> (a product of <span className="font-bold">Gourmet Canopy LLC</span>), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all use of the platform.</p>

            <h2 className="text-xl font-bold mt-6 mb-2">2. User Age Requirement</h2>
            <p className="mb-4"><span className="font-bold">NatureNani</span> is intended solely for users who are <span className="font-bold">18 years of age or older</span>. By using this application, you represent and warrant that you meet this minimum age requirement. The platform is not designed for, or directed at, minors, and we do not knowingly provide wellness information to individuals under 18.</p>

            <h2 className="text-xl font-bold mt-6 mb-2">3. "As-Is" and "As-Available" Software</h2>
            <p className="mb-2"><span className="font-bold">NatureNani</span> is provided on an "<span className="font-bold">AS-IS</span>" and "<span className="font-bold">AS-AVAILABLE</span>" basis without warranties of any kind, whether express or implied.</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><span className="font-semibold">No Warranty of Performance:</span> <span className="font-bold">Gourmet Canopy LLC</span> does not warrant that the platform—including its AI retrieval systems powered by models like <span className="font-bold">OpenAI GPT-4o</span> or <span className="font-bold">Google Gemini</span>—will be uninterrupted, error-free, or completely accurate.</li>
                <li><span className="font-semibold">No Medical Outcome Guarantee:</span> We make no guarantees regarding the effectiveness of any Ayurvedic or Naturopathic suggestions generated by the RAG system.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-2">4. Limitation of Liability</h2>
            <p className="mb-2">To the maximum extent permitted by law, <span className="font-bold">Gourmet Canopy LLC</span> and its founder shall not be liable for any direct, indirect, incidental, or consequential damages arising out of your use of <span className="font-bold">NatureNani</span>. This includes, but is not limited to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Any physical or mental health complications resulting from the application of AI-generated wellness information.</li>
                <li>Data loss or unauthorized access to your query history.</li>
                <li>Technical failures or "hallucinations" inherent in large language model technology.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-2">5. Intellectual Property</h2>
            <p className="mb-4">All software, algorithms, and content—specifically the proprietary <span className="font-bold">Retrieval-Augmented Generation (RAG)</span> architecture—remain the exclusive property of <span className="font-bold">Gourmet Canopy LLC</span>. Users are granted a limited, non-transferable license to use the app for personal, non-commercial purposes only.</p>
        </div>
    </div>
);

export const MedicalDisclaimer: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-sage-900 mb-6 flex items-center gap-3"><span className="text-2xl">⚖️</span> Medical Disclaimer for NatureNani</h1>
        <div className="prose prose-sage text-sage-700 bg-sage-50 p-8 rounded-xl border border-sage-100 max-w-none shadow-sm">

            <h2 className="text-xl font-bold text-sage-900 mt-2 mb-2">1. For Educational and Informational Purposes Only</h2>
            <p className="mb-4"><span className="font-bold">NatureNani</span> is a Retrieval-Augmented Generation (RAG) platform that synthesizes information from traditional Ayurvedic and Naturopathic texts. All outputs—including text, protocols, and suggestions—are for educational purposes only. This tool provides information, not medical advice. It is <span className="font-bold">not</span> a substitute for professional medical consultation, diagnosis, or treatment.</p>

            <h2 className="text-xl font-bold text-sage-900 mt-6 mb-2">2. No Practitioner-Client Relationship</h2>
            <p className="mb-4"><span className="font-bold">NatureNani</span> is an Artificial Intelligence. It is not a doctor, licensed naturopath, or certified Ayurvedic practitioner. Use of this application, including any interaction with the AI, does not create a doctor-patient or professional-client relationship.</p>

            <h2 className="text-xl font-bold text-sage-900 mt-6 mb-2">3. Seek Professional Consultation</h2>
            <p className="mb-4">Always consult with a licensed physician or qualified health provider before making any changes to your healthcare regimen. Never disregard professional medical advice or delay seeking it because of information generated by <span className="font-bold">NatureNani</span>.</p>

            <h2 className="text-xl font-bold text-sage-900 mt-6 mb-2">4. Risk of AI Inaccuracy & Hallucination</h2>
            <p className="mb-4">As an AI-driven tool, <span className="font-bold">NatureNani</span> may occasionally produce "hallucinations" or interpret historical texts in ways that are inaccurate or inapplicable to modern clinical standards. While we use RAG to ground responses in established texts, we do not guarantee the accuracy, completeness, or safety of the generated content. <span className="font-bold">Users assume all risk associated with the use of AI-generated information.</span></p>

            <h2 className="text-xl font-bold text-sage-900 mt-6 mb-2">5. Interaction & Contraindication Warning</h2>
            <p className="mb-4">Naturopathic and Ayurvedic protocols (such as herbs, minerals, and dietary shifts) can have potent biological effects and may interact dangerously with prescription medications or pre-existing conditions. You must clear any new supplement or protocol with your primary care physician first.</p>

            <h2 className="text-xl font-bold text-sage-900 mt-6 mb-2">6. Emergency Situations</h2>
            <p className="mb-4"><span className="font-bold">NatureNani is not an emergency service.</span> If you are experiencing a medical emergency, stop using the app immediately and contact your local emergency services (e.g., 911) or visit the nearest emergency room.</p>
        </div>
    </div>
);

export const Contact: React.FC = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = encodeURIComponent(`Contact from ${formData.name}`);
        const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
        window.location.href = `mailto:hellonaturenani@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-sage-900 mb-8 text-center">Connect with Nature Nani</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-sage-100 mb-12">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 outline-none"
                            placeholder="Your name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 outline-none"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1">Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 outline-none h-32"
                            placeholder="How can we help?"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-sage-600 text-white py-3 rounded-lg font-bold hover:bg-sage-700 transition-colors">Send Message</button>
                </form>
            </div>

            <div className="space-y-10 text-sage-800">
                <section>
                    <h2 className="text-2xl font-bold text-sage-900 mb-4">A Note from the Founder</h2>
                    <div className="bg-sage-50 p-6 rounded-xl border-l-4 border-sage-500 italic text-sage-700">
                        "Nature Nani is a labor of love, built to bridge the gap between our modern lives and ancient healing wisdom. As a solo founder, I personally review every inquiry—from technical questions to partnership ideas. While I can’t always respond instantly, I value your feedback and look forward to hearing how Nature Nani is supporting your health journey."
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-sage-900 mb-2">How Can I Help You Today?</h2>
                    <p className="text-sage-600 italic mb-6">Categorizing inquiries helps you prioritize your inbox.</p>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-3">
                            <span className="text-xl mt-1">🌱</span>
                            <div>
                                <p className="font-bold text-lg">Wellness Community & Support:</p>
                                <p className="text-sage-700">Have a question about how to use the app or a suggestion for a new remedy?</p>
                                <p className="text-sm mt-1 text-sage-600">◦ Check our <a href="/faq" className="underline hover:text-sage-800">FAQ</a> or email: <a href="mailto:hellonaturenani@gmail.com" className="font-semibold text-sage-700 hover:text-sage-900">hellonaturenani@gmail.com</a></p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-xl mt-1">🤝</span>
                            <div>
                                <p className="font-bold text-lg">Partnerships & Institutes:</p>
                                <p className="text-sage-700">Are you a wellness promoter or a health institute looking to integrate Nature Nani?</p>
                                <p className="text-sm mt-1 text-sage-600">◦ Direct access: <a href="mailto:hellonaturenani@gmail.com" className="font-semibold text-sage-700 hover:text-sage-900">hellonaturenani@gmail.com</a></p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-xl mt-1">🐞</span>
                            <div>
                                <p className="font-bold text-lg">Tech Support:</p>
                                <p className="text-sage-700">Found a bug or having trouble with your account?</p>
                                <p className="text-sm mt-1 text-sage-600">◦ Subject line: <span className="font-mono bg-sage-100 px-1 rounded text-sage-800">[Support] - [Your Issue]</span></p>
                            </div>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-sage-900 mb-2">Join the Conversation</h2>
                    <p className="text-sage-600 italic mb-4">Sometimes the best way to get an answer is to ask the community.</p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="font-bold">Reddit:</span>
                            <span>Join our growing family at <a href="https://www.reddit.com/r/thenaturenani/" target="_blank" rel="noopener noreferrer" className="text-sage-600 font-bold hover:underline">r/thenaturenani</a> to share your experiences and tips.</span>
                        </li>
                    </ul>
                </section>

                <section className="border-t border-sage-200 pt-8">
                    <h2 className="text-xl font-bold text-sage-900 mb-2">Company</h2>
                    <p className="font-semibold">Nature Nani | Gourmet Canopy LLC</p>
                    <p className="text-sage-600">Seattle, WA</p>
                </section>
            </div>
        </div>
    );
};
