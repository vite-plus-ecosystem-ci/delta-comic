use tauri::{AppHandle, Runtime, WebviewWindow};

use super::WebviewCookie;

#[cfg(target_os = "android")]
use tauri::Manager;

#[cfg(not(target_os = "android"))]
use tauri::webview::Cookie;

pub(crate) async fn collect_webview_cookies<R: Runtime>(
  app: &AppHandle<R>,
  webview: &WebviewWindow<R>,
) -> Result<Vec<WebviewCookie>, String> {
  #[cfg(target_os = "android")]
  {
    let url = webview
      .url()
      .map_err(|err| format!("failed to read webview url: {err}"))?;
    if !matches!(url.scheme(), "http" | "https") {
      return Ok(Vec::new());
    }

    let Some(bridge) = app.try_state::<crate::mobile::MobileUtils<R>>() else {
      return Err("android utils mobile bridge is not initialized".to_string());
    };
    let header = bridge.cookie_header(url.as_str().to_string())?;
    return Ok(parse_cookie_header(
      &header.cookie_header,
      url.host_str().map(str::to_string),
      Some(url.path().to_string()),
      "android-cookie-manager",
    ));
  }

  #[cfg(not(target_os = "android"))]
  {
    let _ = app;
    let webview = webview.clone();
    let cookies = tauri::async_runtime::spawn_blocking(move || webview.cookies())
      .await
      .map_err(|err| format!("failed to join native cookie read: {err}"))?
      .map_err(|err| format!("failed to read native webview cookies: {err}"))?;
    Ok(cookies.into_iter().map(native_cookie_to_model).collect())
  }
}

#[cfg(not(target_os = "android"))]
fn native_cookie_to_model(cookie: Cookie<'static>) -> WebviewCookie {
  WebviewCookie {
    name: cookie.name().to_string(),
    value: cookie.value().to_string(),
    domain: cookie.domain().map(str::to_string),
    path: cookie.path().map(str::to_string),
    secure: cookie.secure(),
    http_only: cookie.http_only(),
    same_site: cookie.same_site().map(|same_site| format!("{same_site:?}")),
    expires: cookie.expires().map(|expires| format!("{expires:?}")),
    source: "native-webview".to_string(),
  }
}

#[cfg(any(target_os = "android", test))]
fn parse_cookie_header(
  header: &str,
  domain: Option<String>,
  path: Option<String>,
  source: &str,
) -> Vec<WebviewCookie> {
  header
    .split(';')
    .filter_map(|part| {
      let part = part.trim();
      if part.is_empty() {
        return None;
      }
      let (name, value) = part.split_once('=')?;
      let name = name.trim();
      if name.is_empty() {
        return None;
      }
      Some(WebviewCookie {
        name: name.to_string(),
        value: value.trim().to_string(),
        domain: domain.clone(),
        path: path.clone(),
        secure: None,
        http_only: None,
        same_site: None,
        expires: None,
        source: source.to_string(),
      })
    })
    .collect()
}

#[cfg(test)]
mod tests {
  use super::parse_cookie_header;

  #[test]
  fn parse_cookie_header_splits_name_value_pairs() {
    let cookies = parse_cookie_header(
      "session=abc; theme=dark; token=a=b=c",
      Some("example.com".to_string()),
      Some("/login".to_string()),
      "test",
    );

    assert_eq!(cookies.len(), 3);
    assert_eq!(cookies[0].name, "session");
    assert_eq!(cookies[0].value, "abc");
    assert_eq!(cookies[1].name, "theme");
    assert_eq!(cookies[1].value, "dark");
    assert_eq!(cookies[2].name, "token");
    assert_eq!(cookies[2].value, "a=b=c");
    assert_eq!(cookies[2].domain.as_deref(), Some("example.com"));
    assert_eq!(cookies[2].path.as_deref(), Some("/login"));
  }

  #[test]
  fn parse_cookie_header_ignores_invalid_parts() {
    let cookies = parse_cookie_header("=empty; valid=yes; no_value", None, None, "test");

    assert_eq!(cookies.len(), 1);
    assert_eq!(cookies[0].name, "valid");
  }
}
