
import React, { useRef } from 'react';
import { Copy, Download, Layout, ShieldCheck, Palette, Type } from 'lucide-react';

export const BrandingKit: React.FC = () => {
  const zenCircleRef = useRef<SVGSVGElement>(null);
  const signatureStampRef = useRef<SVGSVGElement>(null);
  const bannerRef = useRef<SVGSVGElement>(null);

  const colors = [
    { name: 'Nature Maroon', hex: '#8B0000', use: 'Primary Brand Identity' },
    { name: 'Sacred Sage', hex: '#4A7C59', use: 'Accent & Secondary' },
    { name: 'Earthy Cream', hex: '#FDFBF7', use: 'Backgrounds & Surfaces' },
    { name: 'Forest Green', hex: '#2D422D', use: 'Text & Deep Accents' },
  ];

  const handleDownload = (ref: React.RefObject<SVGSVGElement>, fileName: string) => {
    if (!ref.current) return;

    try {
      const element = ref.current;
      // Ensure the SVG has the correct namespace
      element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      // Inject font styles into the SVG for standalone viewing
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Lato:wght@700&display=swap');
        .font-serif { font-family: 'Merriweather', serif; }
        .font-sans { font-family: 'Lato', sans-serif; }
      `;
      element.prepend(style);

      const serializer = new XMLSerializer();
      let svgData = serializer.serializeToString(element);
      
      // Remove the injected style from the live DOM after serialization
      element.removeChild(style);

      const preface = '<?xml version="1.0" standalone="no"?>\r\n';
      const svgBlob = new Blob([preface, svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${fileName}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to generate download. Please check console for details.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${text} to clipboard!`);
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Palette className="text-sage-600" /> Branding Kit & Social Assets
        </h1>
        <p className="text-slate-500 mt-2">
          High-fidelity vector assets for social media platforms and marketing materials.
        </p>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-12">
        {/* Profile Pictures Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800">1. Social Profile Emblems</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimized for Instagram/Twitter</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Zen Circle */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-64 h-64 relative group cursor-pointer mb-6">
                <svg ref={zenCircleRef} viewBox="0 0 512 512" className="w-full h-full drop-shadow-2xl">
                  <defs>
                    <linearGradient id="sageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4A7C59" />
                      <stop offset="100%" stopColor="#2D422D" />
                    </linearGradient>
                    <path id="zenTextPath" d="M 126, 256 a 130,130 0 0,0 260,0" />
                  </defs>
                  <circle cx="256" cy="256" r="240" fill="url(#sageGrad)" />
                  <circle cx="256" cy="256" r="210" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.2" />
                  <g transform="translate(156, 120) scale(8)">
                    <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="#FDFBF7" />
                    <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="#FDFBF7" fillOpacity="0.6" />
                    <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="#FDFBF7" fillOpacity="0.6" />
                  </g>
                  <text textAnchor="middle" className="font-serif" fontSize="38" fontWeight="bold" fill="#FDFBF7">
                    <textPath href="#zenTextPath" startOffset="50%">Nature Nani</textPath>
                  </text>
                </svg>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    onClick={() => handleDownload(zenCircleRef, 'NatureNani_Zen_Circle')}
                    className="bg-white p-3 rounded-full text-slate-800 hover:scale-110 transition-transform"
                   >
                    <Download size={24} />
                   </button>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800">The "Zen Circle" Emblem</p>
              <p className="text-xs text-slate-500 mt-1">Best for Circular Profile Pictures</p>
            </div>

            {/* The Wellness Stamp */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-64 h-64 relative group cursor-pointer mb-6">
                 <svg ref={signatureStampRef} viewBox="0 0 512 512" className="w-full h-full">
                    <path id="circlePath" d="M 256, 256 m -180, 0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0" fill="none" />
                    <circle cx="256" cy="256" r="256" fill="#FDFBF7" />
                    <circle cx="256" cy="256" r="240" fill="none" stroke="#8B0000" strokeWidth="4" />
                    <g transform="translate(180, 140) scale(6)">
                      <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="#4A7C59" />
                      <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="#4A7C59" fillOpacity="0.4" />
                      <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="#4A7C59" fillOpacity="0.4" />
                    </g>
                    {/* Small Nature Nani text to avoid overlap */}
                    <text x="256" y="340" textAnchor="middle" className="font-serif" fontSize="32" fontWeight="bold" fill="#8B0000">Nature Nani</text>
                    <text className="font-serif" style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em' }} fill="#8B0000">
                      <textPath href="#circlePath">ANCIENT WISDOM • MODERN WELLNESS • </textPath>
                    </text>
                 </svg>
                 <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    onClick={() => handleDownload(signatureStampRef, 'NatureNani_Signature_Stamp')}
                    className="bg-white p-3 rounded-full text-slate-800 hover:scale-110 transition-transform"
                   >
                    <Download size={24} />
                   </button>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800">The "Signature Stamp"</p>
              <p className="text-xs text-slate-500 mt-1">Best for Story Highlights & Watermarks</p>
            </div>
          </div>
        </section>

        {/* Banners Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800">2. Platform Banners</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">For Facebook/LinkedIn Headers</span>
          </div>

          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-lg overflow-hidden relative group">
             {/* Converted to SVG for full download capability */}
             <svg 
              ref={bannerRef}
              viewBox="0 0 1500 500" 
              className="w-full aspect-[3/1]"
             >
                <defs>
                   <filter id="bannerBlur">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
                   </filter>
                </defs>
                {/* Background */}
                <rect width="1500" height="500" fill="#FDFBF7" />
                {/* Decorative Blurs */}
                <circle cx="1400" cy="50" r="150" fill="#e3ebe3" opacity="0.5" filter="url(#bannerBlur)" />
                <circle cx="100" cy="450" r="150" fill="#f5efe6" opacity="0.5" filter="url(#bannerBlur)" />
                
                {/* Main Content Group */}
                <g transform="translate(150, 250)">
                   {/* Ghost Logo */}
                   <path d="M-80 -100 C-100 -40 -100 10 -80 80 C-60 10 -60 -40 -80 -100 Z" fill="#4A7C59" opacity="0.1" transform="scale(3)" />
                   
                   {/* Logo Box */}
                   <rect x="0" y="-70" width="140" height="140" rx="20" fill="#4A7C59" />
                   <g transform="translate(70, 0) scale(4)">
                      <path d="M0 -12 C-2 -6 -2 -1 0 6 C2 -1 2 -6 0 -12 Z" fill="white" opacity="0.3" />
                      <path d="M0 6 C-4 2 -8 -2 -8 -6 C-8 -9 -5 -9 -2 -6" fill="white" opacity="0.3" />
                      <path d="M0 6 C(4 2 8 -2 8 -6 C8 -9 5 -9 2 -6" fill="white" opacity="0.3" />
                   </g>

                   {/* Text */}
                   <text x="180" y="5" className="font-serif" fontSize="110" fontWeight="bold" fill="#8B0000">Nature Nani</text>
                   <text x="182" y="55" className="font-sans" fontSize="24" fontWeight="bold" fill="#4A7C59" style={{ letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                      Ancient Wisdom for Modern Holistic Wellness
                   </text>
                </g>
             </svg>
             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => handleDownload(bannerRef, 'NatureNani_Banner')}
                  className="bg-white text-slate-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                >
                   <Download size={20} /> Download Banner Asset
                </button>
             </div>
          </div>
        </section>

        {/* Style Guide */}
        <section className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="text-sage-600" size={24} />
              <h2 className="text-xl font-serif font-bold text-slate-800">3. Official Style Guide</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Palette size={14} /> Brand Color Palette
                </h3>
                <div className="space-y-4">
                  {colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl shadow-inner border border-slate-100" style={{ backgroundColor: c.hex }}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                           <p className="font-bold text-slate-800">{c.name}</p>
                           <button 
                            onClick={() => copyToClipboard(c.hex)}
                            className="text-xs font-mono text-slate-400 hover:text-sage-600 flex items-center gap-1"
                           >
                              {c.hex} <Copy size={10} />
                           </button>
                        </div>
                        <p className="text-xs text-slate-500">{c.use}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Type size={14} /> Typography
                   </h3>
                   <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="font-serif text-2xl font-bold text-slate-900">Merriweather Bold</p>
                         <p className="text-xs text-slate-500 mt-1">Primary Display & Logo Font</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="font-sans text-xl font-bold text-slate-700 tracking-[0.2em] uppercase">Lato Bold</p>
                         <p className="text-xs text-slate-500 mt-1">Slogan & Navigation UI</p>
                      </div>
                   </div>
                </div>
                
                <div className="p-6 bg-sage-900 rounded-2xl text-white">
                   <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-sage-200">
                     <Layout size={16} /> Marketing Tip
                   </h4>
                   <p className="text-xs text-sage-300 leading-relaxed">
                     When posting on Instagram, use high-contrast images of nature or tea. Overlay the "Signature Stamp" in the corner at 40% opacity for a professional, clinical look.
                   </p>
                </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};
