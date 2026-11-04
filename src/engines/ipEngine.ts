import { IpIntelligence, ThreatFlag } from '../types/scanner';

export async function queryIpReputation(ip: string): Promise<{
  ipInfo?: IpIntelligence;
  flags: ThreatFlag[];
}> {
  const flags: ThreatFlag[] = [];

  // Check private / loopback IP address ranges (SSRF / internal network attack)
  const isPrivateIp = 
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('127.') ||
    ip.startsWith('169.254.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);

  if (isPrivateIp) {
    flags.push({
      id: 'IP-PRIVATE-SSRF',
      engine: 'ip',
      severity: 'critical',
      title: 'Private / Local Network IP (SSRF Vector)',
      description: `IP address ${ip} belongs to a private/loopback RFC1918 range. Threat actors use this technique for Server-Side Request Forgery (SSRF) to scan internal corporate networks.`,
      evidence: `Target IP: ${ip} (Reserved Local Subnet)`,
      recommendation: 'Block this link from being requested by automated crawlers or internal agents.',
    });

    return {
      ipInfo: {
        ip,
        country: 'Internal / RFC1918',
        countryCode: 'LAN',
        city: 'Local Area Network',
        isp: 'Private Subnet',
        asn: 'AS-PRIVATE',
        org: 'Internal Network',
      },
      flags,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let data: any = null;

    // Try freeipapi.com (public, zero-token, CORS enabled)
    try {
      const res = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(ip)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch {
      // Fallback to ipapi.co
      try {
        const res2 = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
          signal: controller.signal,
        });
        if (res2.ok) {
          const d2 = await res2.json();
          data = {
            countryName: d2.country_name,
            countryCode: d2.country_code,
            cityName: d2.city,
            regionName: d2.region,
            asn: d2.asn,
            ipVersion: 4,
            latitude: d2.latitude,
            longitude: d2.longitude,
            isp: d2.org || d2.asn,
          };
        }
      } catch {
        // network error / timeout
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!data) {
      return {
        ipInfo: {
          ip,
          country: 'Geo Pending',
          isp: 'Global Internet Host',
        },
        flags: [],
      };
    }

    const country = data.countryName || data.country || 'Unknown';
    const countryCode = data.countryCode || data.country_code || 'UN';
    const city = data.cityName || data.city || '';
    const region = data.regionName || data.region || '';
    const asn = data.asn ? String(data.asn) : undefined;
    const org = data.isp || data.org || '';

    // Bulletproof and high-risk hosting heuristics
    const lowerOrg = (org + ' ' + (asn || '')).toLowerCase();
    const isBulletproof = 
      lowerOrg.includes('bulletproof') ||
      lowerOrg.includes('alexhost') ||
      lowerOrg.includes('stark industries') ||
      lowerOrg.includes('chang way') ||
      lowerOrg.includes('vaneck');

    if (isBulletproof) {
      flags.push({
        id: 'IP-BULLETPROOF-HOST',
        engine: 'ip',
        severity: 'high',
        title: 'High-Risk Bulletproof Hosting Provider',
        description: `IP is hosted on infrastructure (${org}) historically linked to bulletproof hosting services that ignore DMCA and law enforcement takedown requests.`,
        evidence: `ISP/Org: ${org} | ASN: ${asn}`,
        recommendation: 'Extreme caution: malicious servers hosted here remain active for prolonged periods.',
      });
    }

    const ipInfo: IpIntelligence = {
      ip,
      country,
      countryCode,
      city,
      region,
      isp: org,
      asn,
      org,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    return { ipInfo, flags };
  } catch {
    return {
      ipInfo: { ip, country: 'Unavailable' },
      flags: [],
    };
  }
}
