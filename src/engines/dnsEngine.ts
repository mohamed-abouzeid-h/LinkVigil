import { DnsIntelligence, ThreatFlag } from '../types/scanner';

interface CloudflareDnsResponse {
  Status: number; // 0 = NOERROR, 3 = NXDOMAIN
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean; // DNSSEC authenticated data
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: Array<{ name: string; type: number; TTL: number; data: string }>;
  Comment?: string;
}

const DNS_STATUS_CODES: Record<number, string> = {
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED',
};

export async function queryDns(hostname: string): Promise<{
  dns: DnsIntelligence;
  flags: ThreatFlag[];
}> {
  const flags: ThreatFlag[] = [];

  // Check if hostname is already a raw IP
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    return {
      dns: {
        resolved: true,
        status: 'DIRECT_IP',
        records: {
          A: [hostname],
          AAAA: [],
        },
        primaryIp: hostname,
        ttl: 0,
        dnssec: false,
        provider: 'Direct Host (No DNS Lookup Needed)',
      },
      flags,
    };
  }

  // Timeout controller for resilient zero-token lookups
  const fetchWithTimeout = async (url: string, headers: HeadersInit, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    // 1. Try Cloudflare DNS-over-HTTPS (DoH)
    let provider = 'Cloudflare DoH (1.1.1.1)';
    let data: CloudflareDnsResponse | null = null;

    try {
      const cfRes = await fetchWithTimeout(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
        { 'Accept': 'application/dns-json' },
        3500
      );
      if (cfRes.ok) {
        data = await cfRes.json();
      }
    } catch {
      // Fallback to Google DoH
      try {
        provider = 'Google DoH (8.8.8.8)';
        const googleRes = await fetchWithTimeout(
          `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
          { 'Accept': 'application/json' },
          3500
        );
        if (googleRes.ok) {
          data = await googleRes.json();
        }
      } catch {
        // Both timed out or blocked by network
      }
    }

    if (!data) {
      return {
        dns: {
          resolved: false,
          status: 'LOOKUP_TIMEOUT',
          records: { A: [], AAAA: [] },
          dnssec: false,
          provider: 'Offline / Network Blocked',
        },
        flags: [{
          id: 'DNS-LOOKUP-TIMEOUT',
          engine: 'dns',
          severity: 'low',
          title: 'DNS Resolution Standby',
          description: 'DNS-over-HTTPS endpoint did not respond within timeout limit. Falling back to local heuristic analysis.',
          evidence: hostname,
        }],
      };
    }

    const statusCode = data.Status;
    const statusText = DNS_STATUS_CODES[statusCode] || `CODE_${statusCode}`;

    // Handle NXDOMAIN (Domain does not exist in public DNS)
    if (statusCode === 3) {
      flags.push({
        id: 'DNS-NXDOMAIN',
        engine: 'dns',
        severity: 'high',
        title: 'Non-Existent Domain (NXDOMAIN)',
        description: 'The domain does not exist in authoritative global DNS. It may have been sinkholed, suspended by its registrar for abuse, or was configured as an ephemeral decoy link.',
        evidence: `DNS Status: NXDOMAIN (rcode 3)`,
        recommendation: 'Do not access this link: the target server is unreachable or abandoned.',
      });

      return {
        dns: {
          resolved: false,
          status: 'NXDOMAIN',
          records: { A: [], AAAA: [] },
          dnssec: false,
          provider,
        },
        flags,
      };
    }

    const aRecords: string[] = [];
    let minTtl = 3600;

    if (data.Answer && Array.isArray(data.Answer)) {
      for (const ans of data.Answer) {
        if (ans.type === 1 && ans.data) {
          // Type 1 is A record
          aRecords.push(ans.data);
          if (ans.TTL && ans.TTL < minTtl) {
            minTtl = ans.TTL;
          }
        }
      }
    }

    const primaryIp = aRecords.length > 0 ? aRecords[0] : undefined;

    // Check for ultra-low TTL (Fast-flux DNS evasion technique)
    if (aRecords.length > 0 && minTtl <= 60) {
      flags.push({
        id: 'DNS-FAST-FLUX-TTL',
        engine: 'dns',
        severity: 'medium',
        title: 'Extremely Low DNS TTL (Fast-Flux Indicator)',
        description: `DNS record TTL is only ${minTtl}s. Botnets and malware distributors frequently use fast-flux DNS with rapid TTL rotation to evade IP blocklists.`,
        evidence: `TTL: ${minTtl} seconds`,
        recommendation: 'Monitor whether this domain rapidly shifts IP allocations across different autonomous systems.',
      });
    }

    return {
      dns: {
        resolved: aRecords.length > 0,
        status: statusText,
        records: {
          A: aRecords,
          AAAA: [],
        },
        primaryIp,
        ttl: minTtl,
        dnssec: Boolean(data.AD),
        provider,
      },
      flags,
    };
  } catch (error) {
    return {
      dns: {
        resolved: false,
        status: 'ERROR',
        records: { A: [], AAAA: [] },
        dnssec: false,
        provider: 'DNS Query Failed',
      },
      flags: [],
    };
  }
}
