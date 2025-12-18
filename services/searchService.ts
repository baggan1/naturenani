
/**
 * Programmatically fetch high-quality images from Google Custom Search
 * Ensures authentic visuals for Yoga poses and Nutri Heal recipes.
 */
export const fetchImageFromSearch = async (query: string, category: 'yoga' | 'food'): Promise<string> => {
  const apiKey = process.env.GOOGLE_SEARCH_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.warn("[SearchService] Google Search credentials missing.");
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
    
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }
    return '';
  } catch (error) {
    console.error("[SearchService] Failed to fetch image:", error);
    return '';
  }
};
