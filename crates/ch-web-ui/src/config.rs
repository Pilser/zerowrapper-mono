use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteSettings {
    pub site: SiteInfo,
    pub footer: FooterConfig,
    #[serde(default)]
    pub business: Option<Business>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteInfo {
    pub title: String,
    #[serde(default)]
    pub brand: Option<String>,
    pub url: String,
    pub local_url: Option<String>,
    pub tagline: String,
    pub description: String,
    pub favicon: Option<String>,
}

impl SiteInfo {
    pub fn brand_or_title(&self) -> &str {
        self.brand.as_deref().unwrap_or(&self.title)
    }

    pub fn host(&self) -> String {
        self.url
            .strip_prefix("https://")
            .or_else(|| self.url.strip_prefix("http://"))
            .unwrap_or(&self.url)
            .split('/')
            .next()
            .unwrap_or(&self.url)
            .to_string()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FooterConfig {
    pub text: String,
    pub links: Vec<FooterLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FooterLink {
    pub label: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Business {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub telephone: Option<String>,
    #[serde(default)]
    pub branches: Vec<BusinessBranch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessBranch {
    pub name: String,
    pub address: String,
    #[serde(default)]
    pub telephone: Option<String>,
    #[serde(default)]
    pub hours: Option<String>,
    #[serde(default)]
    pub latitude: Option<f64>,
    #[serde(default)]
    pub longitude: Option<f64>,
    #[serde(default)]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LandingData {
    pub hero: HeroSection,
    pub examples: Vec<ExampleQuery>,
    pub faq: Vec<FaqItem>,
    pub about: AboutSection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeroSection {
    pub title: String,
    pub subtitle: Option<String>,
    pub description: String,
    pub fallback: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExampleQuery {
    pub query: String,
    pub response: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaqItem {
    pub q: String,
    pub a: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AboutSection {
    pub heading: String,
    pub text: String,
}

impl SiteSettings {
    /// Built-in defaults for bare single-user deploys (no sitesettings.yaml).
    pub fn bare_default() -> Self {
        Self {
            site: SiteInfo {
                title: "Jerboa".into(),
                brand: None,
                url: "http://localhost:9092".into(),
                local_url: None,
                tagline: "AI agents".into(),
                description: "Jerboa AI agents.".into(),
                favicon: None,
            },
            footer: FooterConfig {
                text: "© Jerboa".into(),
                links: vec![],
            },
            business: None,
        }
    }
}

impl LandingData {
    /// Built-in defaults for bare single-user deploys (no landing.yaml).
    pub fn bare_default() -> Self {
        Self {
            hero: HeroSection {
                title: "Jerboa".into(),
                subtitle: Some("AI agents".into()),
                description: "Jerboa AI agents.".into(),
                fallback: "Backend not connected.".into(),
            },
            examples: vec![],
            faq: vec![],
            about: AboutSection {
                heading: "Jerboa".into(),
                text: String::new(),
            },
        }
    }
}

pub fn load_site_settings(path: impl AsRef<Path>) -> Result<SiteSettings, String> {
    let content = std::fs::read_to_string(path.as_ref())
        .map_err(|e| format!("Failed to read {}: {e}", path.as_ref().display()))?;
    serde_yaml::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {e}", path.as_ref().display()))
}

pub fn load_landing(path: impl AsRef<Path>) -> Result<LandingData, String> {
    let content = std::fs::read_to_string(path.as_ref())
        .map_err(|e| format!("Failed to read {}: {e}", path.as_ref().display()))?;
    serde_yaml::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {e}", path.as_ref().display()))
}
