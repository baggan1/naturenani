
import React, { useRef } from 'react';
import { Copy, Download, Image as ImageIcon, Layout, ShieldCheck, Palette, Type } from 'lucide-react';

export const BrandingKit: React.FC = () => {
  const zenCircleRef = useRef<SVGSVGElement>(null);
  const signatureStampRef = useRef<SVGSVGElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: 'Nature Maroon', hex: '#8B0000', use: 'Primary Brand Identity' },
    { name: 'Sacred Sage', hex: '#4A7C59', use: 'Accent & Secondary' },
    { name: 'Earthy Cream', hex: '#FDFBF7', use: 'Backgrounds & Surfaces' },
    { name: 'Forest Green', hex: '#2D422D', use: 'Text & Deep Accents' },
  ];

  const handleDownload = (ref: React.RefObject<SVGSVGElement | HTMLElement>, fileName: string) => {
    if (!ref.current) return;

    let svgData: string;
    
    // If it's the banner, we need to extract the SVG inside it or handle differently.
    // For simplicity, we target the SVG inside the banner if applicable, 
    // or just serialize the element if it's already an SVG.
    const element = ref.current;
    
    if (element instanceof SVGSVGElement) {
      const serializer = new XMLSerializer();
      svgData = serializer.serializeToString(element);
    } else {
      // For the banner which is a div containing multiple elements, 
      // we'll find the primary SVG or the container.
      const serializer = new XMLSerializer();
      svgData = serializer.serializeToString(element);
    }

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${fileName}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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
          High-fidelity assets for social media platforms and marketing materials.
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
                <svg ref={zenCircleRef} viewBox="0 0 512 512" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
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
                  <text textAnchor="middle" fontFamily="Merriweather" fontSize="38" fontWeight="bold" fill="#FDFBF7">
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
                 <svg ref={signatureStampRef} viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path id="circlePath" d="M 256, 256 m -180, 0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0" fill="none" />
                    <circle cx="256" cy="256" r="256" fill="#FDFBF7" />
                    <circle cx="256" cy="256" r="240" fill="none" stroke="#8B0000" strokeWidth="4" />
                    <g transform="translate(180, 140) scale(6)">
                      <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="#4A7C59" />
                      <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="#4A7C59" fillOpacity="0.4" />
                      <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="#4A7C59" fillOpacity="0.4" />
                    </g>
                    <text x="256" y="340" textAnchor="middle" fontFamily="Merriweather" fontSize="32" fontWeight="bold" fill="#8B0000">Nature Nani</text>
                    <text className="font-serif uppercase tracking-[0.4em] font-bold text-[24px]" fill="#8B0000">
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
             <div ref={bannerRef} className="aspect-[3/1] w-full bg-[#FDFBF7] flex items-center justify-center px-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sage-50 rounded-full blur-3xl opacity-50 translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-earth-50 rounded-full blur-3xl opacity-50 -translate-x-32 translate-y-32"></div>
                
                <div className="flex items-center gap-12 relative z-10">
                   <svg viewBox="0 0 24 24" className="w-48 h-48 text-sage-600 opacity-20 absolute -left-12 -top-12">
                      <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="currentColor" />
                   </svg>
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-sage-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <svg viewBox="0 0 24 24" className="w-16 h-16 text-white" stroke="white" strokeWidth="1.5">
                           <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="white" fillOpacity="0.2" />
                           <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="white" fillOpacity="0.2" />
                           <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="white" fillOpacity="0.2" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-7xl font-serif font-bold text-[#8B0000] tracking-tight">Nature Nani</h1>
                        <p className="text-xl text-sage-600 font-bold uppercase tracking-[0.3em] mt-2">Ancient Wisdom for Modern Holistic Wellness</p>
                      </div>
                   </div>
                </div>
             </div>
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
