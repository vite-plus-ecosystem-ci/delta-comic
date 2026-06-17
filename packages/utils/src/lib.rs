use tauri::{
  Manager, Runtime,
  plugin::{Builder as PluginBuilder, TauriPlugin},
};
use tauri_plugin_log::{RotationStrategy, fern::colors::ColoredLevelConfig, log::LevelFilter};

mod commands;
mod local_scheme;
#[cfg(target_os = "android")]
mod mobile;
mod webview_registry;

/// Builds the Delta Comic utility runtime integration.
pub struct Builder {
  local_scheme: Option<String>,
  log_file_name: String,
  max_log_file_size: u128,
}

impl Default for Builder {
  fn default() -> Self {
    Self {
      local_scheme: Some("local".to_string()),
      log_file_name: "logs".to_string(),
      max_log_file_size: 50_000,
    }
  }
}

impl Builder {
  pub fn new() -> Self {
    Self::default()
  }

  pub fn local_scheme(mut self, local_scheme: impl Into<String>) -> Self {
    self.local_scheme = Some(local_scheme.into());
    self
  }

  pub fn disable_local_scheme(mut self) -> Self {
    self.local_scheme = None;
    self
  }

  pub fn log_file_name(mut self, log_file_name: impl Into<String>) -> Self {
    self.log_file_name = log_file_name.into();
    self
  }

  pub fn max_log_file_size(mut self, max_log_file_size: u128) -> Self {
    self.max_log_file_size = max_log_file_size;
    self
  }

  pub fn build<R: Runtime>(self, builder: tauri::Builder<R>) -> tauri::Builder<R> {
    let builder = match &self.local_scheme {
      Some(local_scheme) => local_scheme::init(builder, local_scheme.clone()),
      None => builder,
    };

    builder
      .plugin(self.log_plugin())
      .plugin(self.utils_plugin())
  }

  fn log_plugin<R: Runtime>(&self) -> TauriPlugin<R> {
    tauri_plugin_log::Builder::new()
      .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::LogDir {
          file_name: Some(self.log_file_name.clone()),
        },
      ))
      .max_file_size(self.max_log_file_size)
      .level(LevelFilter::Info)
      .rotation_strategy(RotationStrategy::KeepAll)
      .with_colors(ColoredLevelConfig::default())
      .build()
  }

  fn utils_plugin<R: Runtime>(&self) -> TauriPlugin<R> {
    let registry = webview_registry::WebviewRegistry::default();
    let setup_registry = registry.clone();
    let ready_registry = registry.clone();

    PluginBuilder::<R>::new("utils")
      .invoke_handler(tauri::generate_handler![
        commands::page::webview_close_current_page,
        commands::page::webview_close_page,
        commands::page::webview_inject_code,
        commands::page::webview_open_page,
        commands::storage::webview_auth_data,
        commands::storage::webview_auth_data_all,
        commands::storage::webview_auth_data_current,
        commands::storage::webview_iframe_auth_data,
      ])
      .setup(move |app, api| {
        app.manage(setup_registry);
        #[cfg(target_os = "android")]
        app.manage(mobile::init(app, api)?);
        #[cfg(not(target_os = "android"))]
        let _ = api;
        Ok(())
      })
      .on_webview_ready(move |webview| {
        ready_registry.insert(webview.label().to_string());
      })
      .build()
  }
}

/// Initializes the Delta Comic utility runtime integration.
pub fn init<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
  Builder::new().build(builder)
}
