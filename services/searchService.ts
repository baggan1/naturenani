
/**
 * Programmatically fetch high-quality images from Google Custom Search
 * Ensures authentic visuals for Yoga Aid poses and Nutri Heal recipes.
 */
export const fetchImageFromSearch = async (query: string, category: 'yoga' | 'food'): Promise<string> => {
  // Try various possible environment variable mappings (Vite vs standard)
  const apiKey = process.env.GOOGLE_SEARCH_KEY || (import.meta as any).env?.VITE_GOOGLE_SEARCH_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX || (import.meta as any).env?.VITE_GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.error("[SearchService] Google Search credentials missing. Ensure GOOGLE_SEARCH_KEY and GOOGLE_SEARCH_CX are set in your environment.");
    return '';
  }

  // Refine search to reliable domains for 100% accuracy
  const siteRestriction = category === 'yoga' 
    ? 'site:yogajournal.com OR site:shutterstock.com OR site:vogue.com'
    : 'site:epicurious.com OR site:allrecipes.com OR site:healthline.com';

  const fullQuery = `${query} ${siteRestriction}`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(fullQuery)}&searchType=image&num=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("[SearchService] API Error:", data.error.message);
      return '';
    }

    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    } else {
      console.warn(`[SearchService] No images found for: ${query}. Ensure "Image Search" is enabled in your Google Custom Search dashboard.`);
    }
    return '';
  } catch (error) {
    console.error("[SearchService] Network error during image fetch:", error);
    return '';
  }
};
