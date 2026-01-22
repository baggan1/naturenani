/**
 * Programmatically fetch high-quality images from Google Custom Search
 * Ensures authentic visuals for Yoga Aid poses and Nutri Heal recipes.
 */
export const fetchImageFromSearch = async (query: string, category: 'yoga' | 'food'): Promise<string> => {
  const apiKey = process.env.GOOGLE_SEARCH_KEY || (import.meta as any).env?.VITE_GOOGLE_SEARCH_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX || (import.meta as any).env?.VITE_GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.error("[SearchService] Google Search credentials missing.");
    return '';
  }

  // Simplified query to ensure higher hit rate while maintaining quality
  const fullQuery = category === 'yoga' ? `yoga pose ${query}` : `healthy ${query} recipe`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(fullQuery)}&searchType=image&num=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("[SearchService] API Error:", data.error.message);
      return '';
    }

    if (data.items && data.items.length > 0) {
      let imageUrl = data.items[0].link;
      // Force HTTPS to prevent Mixed Content warnings
      if (imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }
      return imageUrl;
    }
    return '';
  } catch (error) {
    console.error("[SearchService] Network error during image fetch:", error);
    return '';
  }
};