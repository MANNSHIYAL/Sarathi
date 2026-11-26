// Single list of feeds used by the app (js/ca.js) and by the server refresh (tools/update_content.mjs).
const gn = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
const TH = p => `https://www.thehindu.com/${p}/feeder/default.rss`, IE = p => `https://indianexpress.com/section/${p}/feed/`;
export const FEEDS = [
  { id: 'ssc', name: 'SSC updates', filter: /\bSSC\b|Staff Selection|\bCGL\b|\bCHSL\b/i, urls: [gn('SSC CGL when:30d'), gn('"Staff Selection Commission" notice when:30d'), TH('education'), IE('education'), 'https://www.hindustantimes.com/feeds/rss/education/rssfeed.xml', 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms'] },
  { id: 'india', name: 'India', urls: [TH('news/national'), IE('india'), 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3'] },
  { id: 'world', name: 'World & MEA', urls: [gn('"Ministry of External Affairs" India when:7d'), TH('news/international'), IE('world')] },
  { id: 'eco', name: 'Economy', urls: [TH('business/Economy'), 'https://www.livemint.com/rss/economy', IE('business')] },
  { id: 'sci', name: 'Sci-Tech', urls: [TH('sci-tech'), TH('sci-tech/science'), IE('technology')] },
  { id: 'misc', name: 'Awards & Sports', urls: [TH('sport'), IE('sports'), gn('India awards appointments when:7d')] }
];
// feeds whose items are Google News redirect pages: headline only, no article to read
export const isGN = link => /^https?:\/\/news\.google\.com\//.test(link || '');
