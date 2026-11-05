export interface TldRiskInfo {
  tld: string;
  riskScore: number; // 0 to 100
  category: 'High-Abuse' | 'File-Confusion' | 'Cheap-Registrar' | 'Spam-Heavy' | 'Low-Risk';
  reason: string;
}

export const TLD_RISK_MAP: Record<string, TldRiskInfo> = {
  // File extension confusion TLDs (extremely dangerous for phishing/malware delivery)
  'zip': { tld: 'zip', riskScore: 85, category: 'File-Confusion', reason: 'High file confusion threat: users mistake archive links for documents' },
  'mov': { tld: 'mov', riskScore: 80, category: 'File-Confusion', reason: 'High video container confusion threat often weaponized for drive-by downloads' },

  // Frequently abused free or hyper-cheap TLDs (Spamhaus / SURBL high abuse metrics)
  'top': { tld: 'top', riskScore: 78, category: 'High-Abuse', reason: 'Predominantly associated with spam campaigns, bulletproof hosting and malware droppers' },
  'xyz': { tld: 'xyz', riskScore: 65, category: 'Cheap-Registrar', reason: 'Heavily abused for mass automated disposable phishing campaigns' },
  'click': { tld: 'click', riskScore: 75, category: 'Spam-Heavy', reason: 'High statistical correlation with ad fraud, redirects and credential harvesting' },
  'country': { tld: 'country', riskScore: 75, category: 'High-Abuse', reason: 'Disproportionately used in low-cost automated phishing deployments' },
  'work': { tld: 'work', riskScore: 70, category: 'Spam-Heavy', reason: 'Commonly abused in corporate invoice & salary phishing lures' },
  'loan': { tld: 'loan', riskScore: 76, category: 'High-Abuse', reason: 'High incidence of financial fraud and predatory scam landing pages' },
  'buzz': { tld: 'buzz', riskScore: 72, category: 'Spam-Heavy', reason: 'Frequently reported in botnet-driven traffic generation and survey scams' },
  'monster': { tld: 'monster', riskScore: 68, category: 'High-Abuse', reason: 'Commonly seen in disposable redirectors and fake lottery sites' },
  'sbs': { tld: 'sbs', riskScore: 70, category: 'High-Abuse', reason: 'High ratio of fraudulent domain registrations' },
  'kim': { tld: 'kim', riskScore: 65, category: 'High-Abuse', reason: 'Commonly flagged in automated threat feeds' },
  'rest': { tld: 'rest', riskScore: 65, category: 'Spam-Heavy', reason: 'High frequency of disposable phishing lures' },
  'gq': { tld: 'gq', riskScore: 80, category: 'High-Abuse', reason: 'Historically free ccTLD with elevated malware and phishing distribution' },
  'tk': { tld: 'tk', riskScore: 82, category: 'High-Abuse', reason: 'Extensively abused ccTLD known for zero-cost anonymous hosting' },
  'cf': { tld: 'cf', riskScore: 79, category: 'High-Abuse', reason: 'Frequent vector for botnet C2 servers and phishing' },
  'ml': { tld: 'ml', riskScore: 78, category: 'High-Abuse', reason: 'High abuse ccTLD historically associated with free domain abuse' },
  'ga': { tld: 'ga', riskScore: 77, category: 'High-Abuse', reason: 'High incidence of unregistered malicious campaigns' },
  'cam': { tld: 'cam', riskScore: 68, category: 'High-Abuse', reason: 'High prevalence of credential harvesting and adult deceptive lures' },
  'icu': { tld: 'icu', riskScore: 70, category: 'Spam-Heavy', reason: 'Frequently abused by bulk spammers' },
  'fit': { tld: 'fit', riskScore: 62, category: 'Spam-Heavy', reason: 'Abused for scam products and affiliate redirect rings' },
  'surf': { tld: 'surf', riskScore: 66, category: 'Spam-Heavy', reason: 'Repeatedly detected in phishing kits' },
};

export const COMMON_TRUSTED_TLDS = new Set([
  'gov', 'edu', 'mil', 'int', 'org', 'com', 'net', 'io', 'dev', 'app', 'co.uk', 'de', 'ca', 'au', 'jp', 'fr'
]);
