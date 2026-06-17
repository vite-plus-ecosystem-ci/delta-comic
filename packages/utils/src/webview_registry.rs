use std::{
  collections::BTreeSet,
  sync::{
    Arc, Mutex,
    atomic::{AtomicU64, Ordering},
  },
};

#[derive(Clone, Debug, Default)]
pub(crate) struct WebviewRegistry {
  inner: Arc<WebviewRegistryInner>,
}

#[derive(Debug, Default)]
struct WebviewRegistryInner {
  labels: Mutex<BTreeSet<String>>,
  next_id: AtomicU64,
}

impl WebviewRegistry {
  pub(crate) fn insert(&self, label: impl Into<String>) {
    self.labels().insert(label.into());
  }

  pub(crate) fn remove(&self, label: &str) {
    self.labels().remove(label);
  }

  pub(crate) fn list(&self) -> Vec<String> {
    self.labels().iter().cloned().collect()
  }

  pub(crate) fn next_label(&self) -> String {
    let id = self.inner.next_id.fetch_add(1, Ordering::Relaxed);
    format!("delta-auth-page-{id}")
  }

  fn labels(&self) -> std::sync::MutexGuard<'_, BTreeSet<String>> {
    self
      .inner
      .labels
      .lock()
      .expect("webview registry mutex poisoned")
  }
}

pub(crate) fn validate_page_label(label: &str) -> Result<(), String> {
  if label.trim().is_empty() {
    return Err("page label cannot be empty".to_string());
  }
  if label.chars().any(|ch| ch.is_control()) {
    return Err(format!("page label contains control characters: {label:?}"));
  }
  if label.contains('/') || label.contains('\\') {
    return Err(format!(
      "page label cannot contain path separators: {label}"
    ));
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::{WebviewRegistry, validate_page_label};

  #[test]
  fn registry_keeps_labels_sorted_and_removable() {
    let registry = WebviewRegistry::default();
    registry.insert("zeta");
    registry.insert("alpha");
    registry.insert("zeta");

    assert_eq!(
      registry.list(),
      vec!["alpha".to_string(), "zeta".to_string()]
    );

    registry.remove("alpha");

    assert_eq!(registry.list(), vec!["zeta".to_string()]);
  }

  #[test]
  fn generated_labels_are_stable_and_unique() {
    let registry = WebviewRegistry::default();

    assert_eq!(registry.next_label(), "delta-auth-page-0");
    assert_eq!(registry.next_label(), "delta-auth-page-1");
  }

  #[test]
  fn validate_page_label_rejects_unsafe_labels() {
    assert!(validate_page_label("auth-page").is_ok());
    assert!(validate_page_label("").is_err());
    assert!(validate_page_label(" ").is_err());
    assert!(validate_page_label("auth/page").is_err());
    assert!(validate_page_label("auth\\page").is_err());
    assert!(validate_page_label("auth\npage").is_err());
  }
}
