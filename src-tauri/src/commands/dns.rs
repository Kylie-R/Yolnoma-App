use reqwest::Client;
use serde_json::Value;
use std::time::Duration;

const CLOUDFLARE_DOH: &str = "https://cloudflare-dns.com/dns-query";
const GOOGLE_DOH: &str = "https://dns.google/resolve";
const QUAD9_DOH: &str = "https://dns.quad9.net/dns-query";
const ADGUARD_DOH: &str = "https://dns.adguard-dns.com/dns-query";
const CRT_SH: &str = "https://crt.sh/";

fn provider_endpoint(provider: &str) -> Result<&'static str, String> {
    match provider {
        "cloudflare" => Ok(CLOUDFLARE_DOH),
        "google" => Ok(GOOGLE_DOH),
        "quad9" => Ok(QUAD9_DOH),
        "adguard" => Ok(ADGUARD_DOH),
        _ => Err(format!("Unsupported DNS provider: {provider}")),
    }
}

fn validate_dns_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name.len() > 253 || name.starts_with('.') || name.ends_with('.') {
        return Err("Enter a valid domain or hostname.".to_string());
    }
    if name.chars().any(|character| {
        !(character.is_ascii_alphanumeric()
            || matches!(character, '-' | '_' | '.'))
    }) {
        return Err("Domain contains unsupported characters.".to_string());
    }
    Ok(())
}

fn validate_record_type(record_type: &str) -> Result<(), String> {
    match record_type {
        "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA" | "CAA" | "SRV"
        | "PTR" => Ok(()),
        _ => Err(format!("Unsupported DNS record type: {record_type}")),
    }
}

fn http_client(user_agent: &'static str) -> Result<Client, String> {
    Client::builder()
        .user_agent(user_agent)
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|error| format!("DNS client initialization failed: {error}"))
}

#[tauri::command]
pub async fn query_dns_records(
    provider: String,
    domain: String,
    record_type: String,
) -> Result<Value, String> {
    let domain = domain.trim().to_lowercase();
    let record_type = record_type.trim().to_uppercase();
    validate_dns_name(&domain)?;
    validate_record_type(&record_type)?;

    let endpoint = provider_endpoint(provider.trim())?;
    let client = http_client("Yolnoma DNS Resolver")?;
    let response = client
        .get(endpoint)
        .query(&[("name", domain.as_str()), ("type", record_type.as_str())])
        .header("Accept", "application/dns-json")
        .send()
        .await
        .map_err(|error| format!("DNS resolver request failed: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("DNS resolver returned HTTP {status}"));
    }

    response
        .json::<Value>()
        .await
        .map_err(|error| format!("DNS resolver returned invalid JSON: {error}"))
}

#[tauri::command]
pub async fn fetch_certificate_subdomains(domain: String) -> Result<Value, String> {
    let domain = domain.trim().trim_end_matches('.').to_lowercase();
    validate_dns_name(&domain)?;

    let client = http_client("Yolnoma Certificate Transparency Search")?;
    let response = client
        .get(CRT_SH)
        .query(&[("q", format!("%.{domain}")), ("output", "json".to_string())])
        .send()
        .await
        .map_err(|error| format!("Certificate transparency request failed: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Certificate transparency returned HTTP {status}"));
    }

    response
        .json::<Value>()
        .await
        .map_err(|error| format!("Certificate transparency returned invalid JSON: {error}"))
}
