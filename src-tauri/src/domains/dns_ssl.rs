use serde::{Deserialize, Serialize};
use std::net::{IpAddr, SocketAddr};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::task::JoinSet;
use url::Host;
use x509_parser::parse_x509_certificate;

const DNS_RECORD_TYPES: &[&str] = &["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsRecord {
    pub record_type: String,
    pub name: String,
    pub value: String,
    pub ttl: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CertificateInfo {
    pub subject: String,
    pub issuer: String,
    pub not_before: String,
    pub not_after: String,
    pub valid_now: bool,
    pub days_remaining: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TlsAudit {
    pub verified_connection: bool,
    pub http_status: Option<u16>,
    pub certificate: Option<CertificateInfo>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsSslAudit {
    pub domain: String,
    pub provider_hint: Option<String>,
    pub records: Vec<DnsRecord>,
    pub dns_warnings: Vec<String>,
    pub tls: TlsAudit,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct DohResponse {
    #[serde(default)]
    status: u8,
    #[serde(default)]
    answer: Vec<DohAnswer>,
}

#[derive(Debug, Deserialize)]
struct DohAnswer {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "Type")]
    record_type: u16,
    #[serde(rename = "Data")]
    data: String,
    #[serde(rename = "TTL")]
    ttl: u32,
}

struct DnsQueryResult {
    records: Vec<DnsRecord>,
    warning: Option<String>,
}

fn normalize_domain(input: &str) -> Result<String, String> {
    let input = input.trim().trim_end_matches('.');
    if input.is_empty() || input.len() > 253 {
        return Err("Enter a valid public domain name.".to_string());
    }

    match Host::parse(input).map_err(|_| "Enter a valid public domain name.".to_string())? {
        Host::Domain(domain) if domain.contains('.') => Ok(domain),
        _ => Err("Enter a valid public domain name, not an IP address or local host.".to_string()),
    }
}

fn record_type_name(record_type: u16, requested_type: &str) -> String {
    match record_type {
        1 => "A",
        2 => "NS",
        5 => "CNAME",
        6 => "SOA",
        15 => "MX",
        16 => "TXT",
        28 => "AAAA",
        257 => "CAA",
        _ => requested_type,
    }
    .to_string()
}

async fn query_dns_type(
    client: reqwest::Client,
    domain: String,
    requested_type: &'static str,
) -> Result<DnsQueryResult, String> {
    let response = client
        .get("https://cloudflare-dns.com/dns-query")
        .query(&[("name", domain.as_str()), ("type", requested_type)])
        .header(reqwest::header::ACCEPT, "application/dns-json")
        .send()
        .await
        .map_err(|error| format!("{requested_type} lookup failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("{requested_type} lookup failed: {error}"))?
        .json::<DohResponse>()
        .await
        .map_err(|error| format!("{requested_type} response could not be read: {error}"))?;

    let warning = match response.status {
        0 => None,
        3 => Some(format!("No {requested_type} records found (domain does not exist).")),
        status => Some(format!("{requested_type} resolver returned DNS status {status}.")),
    };
    let records = if response.status == 0 {
        response
            .answer
            .into_iter()
            .map(|answer| DnsRecord {
                record_type: record_type_name(answer.record_type, requested_type),
                name: answer.name.trim_end_matches('.').to_string(),
                value: answer.data,
                ttl: answer.ttl,
            })
            .collect()
    } else {
        Vec::new()
    };

    Ok(DnsQueryResult { records, warning })
}

async fn lookup_dns(domain: &str) -> Result<(Vec<DnsRecord>, Vec<String>), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .build()
        .map_err(|error| format!("Could not create DNS client: {error}"))?;
    let mut tasks = JoinSet::new();

    for &record_type in DNS_RECORD_TYPES {
        let client = client.clone();
        let domain = domain.to_string();
        tasks.spawn(async move { query_dns_type(client, domain, record_type).await });
    }

    let mut records = Vec::new();
    let mut warnings = Vec::new();
    let mut successful_queries = 0;
    while let Some(result) = tasks.join_next().await {
        match result {
            Ok(Ok(query)) => {
                successful_queries += 1;
                records.extend(query.records);
                if let Some(warning) = query.warning {
                    warnings.push(warning);
                }
            }
            Ok(Err(error)) => warnings.push(error),
            Err(error) => warnings.push(format!("DNS lookup task failed: {error}")),
        }
    }

    if successful_queries == 0 {
        return Err(warnings.join(" "));
    }

    records.sort_by(|left, right| {
        left.record_type
            .cmp(&right.record_type)
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.value.cmp(&right.value))
    });
    records.dedup_by(|left, right| {
        left.record_type == right.record_type
            && left.name == right.name
            && left.value == right.value
    });
    Ok((records, warnings))
}

fn is_public_ip(address: IpAddr) -> bool {
    match address {
        IpAddr::V4(ip) => {
            let octets = ip.octets();
            !(ip.is_private()
                || ip.is_loopback()
                || ip.is_link_local()
                || ip.is_broadcast()
                || ip.is_unspecified()
                || ip.is_multicast()
                || octets[0] == 0
                || (octets[0] == 100 && (64..=127).contains(&octets[1]))
                || (octets[0] == 192
                    && (octets[1] == 0 || octets[1] == 88 || octets[1] == 168))
                || (octets[0] == 198 && (octets[1] == 18 || octets[1] == 19 || octets[1] == 51))
                || (octets[0] == 203 && octets[1] == 0)
                || octets[0] >= 224)
        }
        IpAddr::V6(ip) => {
            let segments = ip.segments();
            !ip.is_loopback()
                && !ip.is_unspecified()
                && !ip.is_unique_local()
                && !ip.is_unicast_link_local()
                && !ip.is_multicast()
                && (segments[0] & 0xe000) == 0x2000
                && !(segments[0] == 0x2001 && segments[1] == 0x0db8)
        }
    }
}

fn certificate_info(der: &[u8]) -> Result<CertificateInfo, String> {
    let (_, certificate) = parse_x509_certificate(der)
        .map_err(|error| format!("Certificate could not be parsed: {error}"))?;
    let validity = certificate.validity();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let not_before = validity.not_before.timestamp();
    let not_after = validity.not_after.timestamp();

    Ok(CertificateInfo {
        subject: certificate.subject().to_string(),
        issuer: certificate.issuer().to_string(),
        not_before: validity.not_before.to_datetime().to_string(),
        not_after: validity.not_after.to_datetime().to_string(),
        valid_now: not_before <= now && now <= not_after,
        days_remaining: (not_after - now) / 86_400,
    })
}

fn tls_client(
    domain: &str,
    ip: IpAddr,
    allow_invalid_certificate: bool,
) -> Result<reqwest::Client, String> {
    let mut builder = reqwest::Client::builder()
        .resolve(domain, SocketAddr::new(ip, 443))
        .tls_info(true)
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(4))
        .timeout(Duration::from_secs(6));

    if allow_invalid_certificate {
        builder = builder.danger_accept_invalid_certs(true);
    }

    builder
        .build()
        .map_err(|error| format!("Could not create TLS client: {error}"))
}

async fn tls_audit(domain: &str, records: &[DnsRecord]) -> TlsAudit {
    let public_ips: Vec<IpAddr> = records
        .iter()
        .filter(|record| record.record_type == "A" || record.record_type == "AAAA")
        .filter_map(|record| record.value.parse::<IpAddr>().ok())
        .filter(|address| is_public_ip(*address))
        .collect();

    if public_ips.is_empty() {
        return TlsAudit {
            verified_connection: false,
            http_status: None,
            certificate: None,
            error: Some("No public A or AAAA address was found for this domain.".to_string()),
        };
    }

    let mut last_error = None;
    for ip in public_ips.into_iter().take(4) {
        match tls_client(domain, ip, false) {
            Ok(client) => match client.head(format!("https://{domain}/")).send().await {
                Ok(response) => {
                    let cert = response
                        .extensions()
                        .get::<reqwest::tls::TlsInfo>()
                        .and_then(|info| info.peer_certificate());
                    return TlsAudit {
                        verified_connection: true,
                        http_status: Some(response.status().as_u16()),
                        certificate: cert.and_then(|der| certificate_info(der).ok()),
                        error: None,
                    };
                }
                Err(error) => last_error = Some(error.to_string()),
            },
            Err(error) => last_error = Some(error),
        }

        if let Ok(client) = tls_client(domain, ip, true) {
            if let Ok(response) = client.head(format!("https://{domain}/")).send().await {
                let cert = response
                    .extensions()
                    .get::<reqwest::tls::TlsInfo>()
                    .and_then(|info| info.peer_certificate());
                let certificate = cert.and_then(|der| certificate_info(der).ok());
                return TlsAudit {
                    verified_connection: false,
                    http_status: Some(response.status().as_u16()),
                    certificate,
                    error: last_error,
                };
            }
        }
    }

    TlsAudit {
        verified_connection: false,
        http_status: None,
        certificate: None,
        error: last_error.or_else(|| Some("HTTPS connection failed.".to_string())),
    }
}

fn infer_provider(records: &[DnsRecord]) -> Option<String> {
    let nameservers = records
        .iter()
        .filter(|record| record.record_type == "NS")
        .map(|record| record.value.to_ascii_lowercase())
        .collect::<Vec<_>>();

    [
        ("Cloudflare", "cloudflare"),
        ("Amazon Route 53", "awsdns"),
        ("Google Cloud DNS", "googledomains"),
        ("Namecheap", "registrar-servers"),
        ("DigitalOcean", "digitalocean"),
    ]
    .iter()
    .find(|(_, marker)| nameservers.iter().any(|server| server.contains(marker)))
    .map(|(provider, _)| (*provider).to_string())
}

#[tauri::command]
pub async fn audit_dns_ssl(domain: String) -> Result<DnsSslAudit, String> {
    let domain = normalize_domain(&domain)?;
    let (records, dns_warnings) = lookup_dns(&domain).await?;
    let tls = tls_audit(&domain, &records).await;

    Ok(DnsSslAudit {
        domain,
        provider_hint: infer_provider(&records),
        records,
        dns_warnings,
        tls,
    })
}

#[cfg(test)]
mod tests {
    use super::{is_public_ip, normalize_domain};
    use std::net::IpAddr;

    #[test]
    fn rejects_ip_addresses_and_local_hosts() {
        assert!(normalize_domain("127.0.0.1").is_err());
        assert!(normalize_domain("localhost").is_err());
    }

    #[test]
    fn tls_targets_only_public_addresses() {
        assert!(is_public_ip("1.1.1.1".parse::<IpAddr>().unwrap()));
        assert!(!is_public_ip("192.168.1.1".parse::<IpAddr>().unwrap()));
        assert!(!is_public_ip("169.254.1.1".parse::<IpAddr>().unwrap()));
        assert!(!is_public_ip("2001:db8::1".parse::<IpAddr>().unwrap()));
    }
}