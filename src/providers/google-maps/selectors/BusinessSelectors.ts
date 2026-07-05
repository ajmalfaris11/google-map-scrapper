export const BusinessSelectors = {
  businessCardLink: 'a[href*="/maps/place/"]',
  endOfListMarker: 'span:has-text("You\'ve reached the end of the list")',
  
  // Extraction Selectors
  name: 'h1.DUwDvf',
  address: 'button[data-item-id="address"]',
  website: 'a[data-item-id="authority"]',
  phone: 'button[data-item-id^="phone:tel:"]',
  rating: 'div.F7kvS span[aria-hidden="true"]',
  reviews: 'span[aria-label*="reviews"]',
  category: 'button.DkEaL',
  hours: 'div[aria-label^="Hours"]' // or table containing hours
};
