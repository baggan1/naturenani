import React, { useRef } from 'react';
import { Copy, Download, Layout, ShieldCheck, Palette, Type, HelpCircle, Share2, Printer } from 'lucide-react';

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

  const handleDownload = async (ref: React.RefObject<SVGSVGElement>, fileName: string, format: 'svg' | 'png') => {
    if (!ref.current) return;

    const element = ref.current.cloneNode(true) as SVGSVGElement;
    
    // Set explicit dimensions for rasterization
    const viewBox = ref.current.viewBox.baseVal;
    const width = format === 'png' ? (viewBox.width > 1000 ? viewBox.width : 2048) : viewBox.width;
    const height = format === 'png' ? (viewBox.height > 500 ? viewBox.height : 2048) : viewBox.height;

    // Ensure the SVG has the correct namespace and styles
    element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    element.setAttribute('width', width.toString());
    element.setAttribute('height', height.toString());

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Lato:wght@700&display=swap');
      .font-serif { font-family: 'Merriweather', serif; }
      .font-sans { font-family: 'Lato', sans-serif; }
    `;
    element.prepend(style);

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(element);

    if (format === 'svg') {
      const preface = '<?xml version="1.0" standalone="no"?>\r\n';
      const svgBlob = new Blob([preface, svgData], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(URL.createObjectURL(svgBlob), `${fileName}.svg`);
    } else {
      // PNG Rasterization via Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        triggerDownload(pngUrl, `${fileName}.png`);
      };
      img.src = url;
    }
  };

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${text} to clipboard!`);
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-20">
      <div className="bg-white border-b border-slate-200 p-8 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Palette className="text-sage-600" /> Branding Kit & Social Assets
            </h1>
            <p className="text-slate-500 mt-1">
              Download professional-grade assets for digital and print use.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-sage-50 px-4 py-2 rounded-full border border-sage-100">
            <span className="text-[10px] font-bold text-sage-600 uppercase tracking-widest">Global Brand Identity: v2.5</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-12">
        {/* Usage Guide */}
        <section className="bg-white p-6 rounded-3xl border border-sage-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 flex-shrink-0">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">Social Media & Direct Uploads</h3>
              <p className="text-sm text-slate-500">Use <strong>PNG</strong> format for Instagram, Facebook, and Twitter profile pictures. These are ready-to-use image files.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 flex-shrink-0">
              <Printer size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">Designers & Large Prints</h3>
              <p className="text-sm text-slate-500">Use <strong>SVG</strong> format for Canva, Figma, or professional printing. These can be scaled to any size without losing quality.</p>
            </div>
          </div>
        </section>

        {/* Profile Pictures Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800">1. Social Profile Emblems</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended for Profiles</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Zen Circle */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-64 h-64 relative group mb-6">
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
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                   <button 
                    onClick={() => handleDownload(zenCircleRef, 'NatureNani_Zen_Circle', 'png')}
                    className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors"
                   >
                    <Download size={14} /> Download PNG
                   </button>
                   <button 
                    onClick={() => handleDownload(zenCircleRef, 'NatureNani_Zen_Circle', 'svg')}
                    className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 border border-slate-700 hover:bg-slate-900 transition-colors"
                   >
                    <Download size={14} /> Download SVG
                   </button>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800">The "Zen Circle" Emblem</p>
              <p className="text-xs text-slate-500 mt-1">Optimized for Instagram/Twitter circular crops.</p>
            </div>

            {/* The Wellness Stamp */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-64 h-64 relative group mb-6">
                 <svg ref={signatureStampRef} viewBox="0 0 512 512" className="w-full h-full">
                    <path id="circlePath" d="M 256, 256 m -180, 0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0" fill="none" />
                    <circle cx="256" cy="256" r="256" fill="#FDFBF7" />
                    <circle cx="256" cy="256" r="240" fill="none" stroke="#8B0000" strokeWidth="4" />
                    <g transform="translate(180, 140) scale(6)">
                      <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="#4A7C59" />
                      <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="#4A7C59" fillOpacity="0.4" />
                      <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="#4A7C59" fillOpacity="0.4" />
                    </g>
                    <text x="256" y="340" textAnchor="middle" className="font-serif" fontSize="32" fontWeight="bold" fill="#8B0000">Nature Nani</text>
                    <text className="font-serif" style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em' }} fill="#8B0000">
                      <textPath href="#circlePath">ANCIENT WISDOM • MODERN WELLNESS • </textPath>
                    </text>
                 </svg>
                 <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                   <button 
                    onClick={() => handleDownload(signatureStampRef, 'NatureNani_Signature_Stamp', 'png')}
                    className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors"
                   >
                    <Download size={14} /> Download PNG
                   </button>
                   <button 
                    onClick={() => handleDownload(signatureStampRef, 'NatureNani_Signature_Stamp', 'svg')}
                    className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 border border-slate-700 hover:bg-slate-900 transition-colors"
                   >
                    <Download size={14} /> Download SVG
                   </button>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800">The "Signature Stamp"</p>
              <p className="text-xs text-slate-500 mt-1">Best for Story Highlights & Watermarks.</p>
            </div>
          </div>
        </section>

        {/* Banners Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800">2. Platform Banners</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Header Assets</span>
          </div>

          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-lg overflow-hidden relative group">
             <svg ref={bannerRef} viewBox="0 0 1500 500" className="w-full aspect-[3/1]">
                <defs>
                   <filter id="bannerBlur">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
                   </filter>
                </defs>
                <rect width="1500" height="500" fill="#FDFBF7" />
                <circle cx="1400" cy="50" r="150" fill="#e3ebe3" opacity="0.5" filter="url(#bannerBlur)" />
                <circle cx="100" cy="450" r="150" fill="#f5efe6" opacity="0.5" filter="url(#bannerBlur)" />
                
                <g transform="translate(150, 250)">
                   {/* Fixed Background Decorative Logo with all 3 leaves */}
                   <g transform="translate(-150, -100) scale(15)" opacity="0.05">
                     <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="#4A7C59" />
                     <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="#4A7C59" />
                     <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="#4A7C59" />
                   </g>

                   {/* Main Logo Container */}
                   <rect x="0" y="-70" width="140" height="140" rx="20" fill="#4A7C59" />
                   <g transform="translate(70, 0) scale(4)">
                      {/* Fixed Centered Sprout Vector from Logo.tsx */}
                      <g transform="translate(-12, -12)">
                         <path d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" fill="white" opacity="0.8" />
                         <path d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" fill="white" opacity="0.4" />
                         <path d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" fill="white" opacity="0.4" />
                      </g>
                   </g>

                   {/* Brand Text */}
                   <text x="180" y="5" className="font-serif" fontSize="110" fontWeight="bold" fill="#8B0000">Nature Nani</text>
                   <text x="182" y="55" className="font-sans" fontSize="24" fontWeight="bold" fill="#4A7C59" style={{ letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                      Ancient Wisdom for Modern Holistic Wellness
                   </text>
                </g>
             </svg>
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={() => handleDownload(bannerRef, 'NatureNani_Banner', 'png')}
                  className="bg-white text-slate-800 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                >
                   <Download size={20} /> Download PNG Banner
                </button>
                <button 
                  onClick={() => handleDownload(bannerRef, 'NatureNani_Banner', 'svg')}
                  className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-700 shadow-2xl hover:scale-105 transition-transform"
                >
                   <Download size={20} /> Download SVG Vector
                </button>
             </div>
          </div>
        </section>

        {/* Style Guide */}
        <section className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="text-sage-600" size={24} />
              <h2 className="text-xl font-serif font-bold text-slate-800">3. Brand Style Guide</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Palette size={14} /> Color Hierarchy
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
                         <p className="text-xs text-slate-500 mt-1">Slogan & Sub-headers</p>
                      </div>
                   </div>
                </div>
                
                <div className="p-6 bg-sage-900 rounded-2xl text-white">
                   <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-sage-200">
                     <HelpCircle size={16} /> Branding Advice
                   </h4>
                   <p className="text-xs text-sage-300 leading-relaxed">
                     When placing the stamp over photos, use a "Multiply" or "Screen" blending mode in your editor. For social stories, keep the PNG centered for the best interaction zones.
                   </p>
                </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};