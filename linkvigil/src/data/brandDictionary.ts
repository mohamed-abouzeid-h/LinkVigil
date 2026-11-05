export interface BrandTarget {
  name: string;
  domain: string;
  keywords: string[];
  category: 'banking' | 'crypto' | 'tech' | 'social' | 'ecommerce' | 'logistics';
}

export const TOP_TARGETED_BRANDS: BrandTarget[] = [
  // Financial & Banking
  { name: 'PayPal', domain: 'paypal.com', keywords: ['paypal', 'pay-pal', 'paypa1'], category: 'banking' },
  { name: 'Chase Bank', domain: 'chase.com', keywords: ['chase', 'chasebank', 'jpmorgan'], category: 'banking' },
  { name: 'Bank of America', domain: 'bankofamerica.com', keywords: ['bankofamerica', 'bofa', 'bank-of-america'], category: 'banking' },
  { name: 'Wells Fargo', domain: 'wellsfargo.com', keywords: ['wellsfargo', 'wells-fargo'], category: 'banking' },
  { name: 'Citibank', domain: 'citi.com', keywords: ['citi', 'citibank'], category: 'banking' },
  { name: 'American Express', domain: 'americanexpress.com', keywords: ['americanexpress', 'amex'], category: 'banking' },
  { name: 'Stripe', domain: 'stripe.com', keywords: ['stripe', 'stripe-pay'], category: 'banking' },
  { name: 'HSBC', domain: 'hsbc.com', keywords: ['hsbc', 'hsbcbank'], category: 'banking' },
  { name: 'Santander', domain: 'santander.com', keywords: ['santander'], category: 'banking' },
  { name: 'Barclays', domain: 'barclays.co.uk', keywords: ['barclays'], category: 'banking' },

  // Tech Giants
  { name: 'Google', domain: 'google.com', keywords: ['google', 'goog1e', 'g00gle', 'gmail'], category: 'tech' },
  { name: 'Microsoft', domain: 'microsoft.com', keywords: ['microsoft', 'micros0ft', 'office365', 'outlook', 'onedrive', 'msft'], category: 'tech' },
  { name: 'Apple', domain: 'apple.com', keywords: ['apple', 'icloud', 'appleid', 'itunes'], category: 'tech' },
  { name: 'Amazon', domain: 'amazon.com', keywords: ['amazon', 'arnazon', 'aws', 'amazon-pay'], category: 'ecommerce' },
  { name: 'Netflix', domain: 'netflix.com', keywords: ['netflix', 'netf1ix'], category: 'tech' },
  { name: 'Adobe', domain: 'adobe.com', keywords: ['adobe', 'acrobat'], category: 'tech' },
  { name: 'Dropbox', domain: 'dropbox.com', keywords: ['dropbox'], category: 'tech' },
  { name: 'DocuSign', domain: 'docusign.com', keywords: ['docusign', 'docu-sign'], category: 'tech' },

  // Social & Gaming
  { name: 'Facebook / Meta', domain: 'facebook.com', keywords: ['facebook', 'faceb00k', 'meta'], category: 'social' },
  { name: 'Instagram', domain: 'instagram.com', keywords: ['instagram', 'instagrarn'], category: 'social' },
  { name: 'WhatsApp', domain: 'whatsapp.com', keywords: ['whatsapp', 'what-sapp'], category: 'social' },
  { name: 'Telegram', domain: 'telegram.org', keywords: ['telegram', 'tlgrm'], category: 'social' },
  { name: 'Twitter / X', domain: 'x.com', keywords: ['twitter', 'tw1tter'], category: 'social' },
  { name: 'LinkedIn', domain: 'linkedin.com', keywords: ['linkedin', 'linked-in'], category: 'social' },
  { name: 'Discord', domain: 'discord.com', keywords: ['discord', 'd1scord'], category: 'social' },
  { name: 'Steam', domain: 'steamcommunity.com', keywords: ['steamcommunity', 'steampowered', 'steam-gift'], category: 'social' },
  { name: 'Roblox', domain: 'roblox.com', keywords: ['roblox', 'robux'], category: 'social' },

  // Crypto & Web3
  { name: 'Binance', domain: 'binance.com', keywords: ['binance', 'b1nance'], category: 'crypto' },
  { name: 'Coinbase', domain: 'coinbase.com', keywords: ['coinbase', 'c0inbase'], category: 'crypto' },
  { name: 'MetaMask', domain: 'metamask.io', keywords: ['metamask', 'meta-mask'], category: 'crypto' },
  { name: 'Kraken', domain: 'kraken.com', keywords: ['kraken'], category: 'crypto' },
  { name: 'OpenSea', domain: 'opensea.io', keywords: ['opensea', 'open-sea'], category: 'crypto' },
  { name: 'Trust Wallet', domain: 'trustwallet.com', keywords: ['trustwallet', 'trust-wallet'], category: 'crypto' },
  { name: 'Ledger', domain: 'ledger.com', keywords: ['ledger', 'ledger-live'], category: 'crypto' },

  // Logistics & Shipping
  { name: 'DHL', domain: 'dhl.com', keywords: ['dhl', 'dhl-express', 'dhl-tracking'], category: 'logistics' },
  { name: 'FedEx', domain: 'fedex.com', keywords: ['fedex', 'fed-ex'], category: 'logistics' },
  { name: 'UPS', domain: 'ups.com', keywords: ['ups', 'ups-tracking'], category: 'logistics' },
  { name: 'USPS', domain: 'usps.com', keywords: ['usps', 'usps-tracking', 'postal-service'], category: 'logistics' },
];
