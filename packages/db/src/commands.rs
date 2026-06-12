use std::{
  fs, io,
  path::{Path, PathBuf},
};

use percent_encoding::{AsciiSet, CONTROLS, utf8_percent_encode};
use tauri::State;

use crate::NativeStore;

const PATH_SEGMENT_ENCODE_SET: &AsciiSet = &CONTROLS
  .add(b' ')
  .add(b'%')
  .add(b'/')
  .add(b'\\')
  .add(b'.')
  .add(b':')
  .add(b'*')
  .add(b'?')
  .add(b'"')
  .add(b'<')
  .add(b'>')
  .add(b'|');

fn encode_path_segment(value: &str) -> String {
  if value.is_empty() {
    "_".to_string()
  } else {
    utf8_percent_encode(value, PATH_SEGMENT_ENCODE_SET).to_string()
  }
}

fn store_path(root: &Path, namespace: &str, key: &str) -> PathBuf {
  root
    .join(encode_path_segment(namespace))
    .join(format!("{}.json", encode_path_segment(key)))
}

pub(crate) fn native_store_get_value(
  root: &Path,
  namespace: &str,
  key: &str,
) -> Result<Option<String>, String> {
  let path = store_path(root, namespace, key);
  match fs::read_to_string(path) {
    Ok(value) => Ok(Some(value)),
    Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(None),
    Err(err) => Err(format!("failed to read native store value: {err}")),
  }
}

pub(crate) fn native_store_set_value(
  root: &Path,
  namespace: &str,
  key: &str,
  value: &str,
) -> Result<(), String> {
  let path = store_path(root, namespace, key);
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)
      .map_err(|err| format!("failed to create native store namespace: {err}"))?;
  }
  fs::write(path, value).map_err(|err| format!("failed to write native store value: {err}"))
}

pub(crate) fn native_store_remove_value(
  root: &Path,
  namespace: &str,
  key: &str,
) -> Result<(), String> {
  let path = store_path(root, namespace, key);
  match fs::remove_file(path) {
    Ok(()) => Ok(()),
    Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(()),
    Err(err) => Err(format!("failed to remove native store value: {err}")),
  }
}

#[tauri::command]
pub(crate) fn native_store_get(
  store: State<'_, NativeStore>,
  namespace: String,
  key: String,
) -> Result<Option<String>, String> {
  native_store_get_value(&store.root, &namespace, &key)
}

#[tauri::command]
pub(crate) fn native_store_set(
  store: State<'_, NativeStore>,
  namespace: String,
  key: String,
  value: String,
) -> Result<(), String> {
  native_store_set_value(&store.root, &namespace, &key, &value)
}

#[tauri::command]
pub(crate) fn native_store_remove(
  store: State<'_, NativeStore>,
  namespace: String,
  key: String,
) -> Result<(), String> {
  native_store_remove_value(&store.root, &namespace, &key)
}

#[cfg(test)]
mod tests {
  use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
  };

  use super::{
    native_store_get_value, native_store_remove_value, native_store_set_value, store_path,
  };

  struct TestDir {
    path: PathBuf,
  }

  impl TestDir {
    fn new() -> Self {
      let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time should be after unix epoch")
        .as_nanos();
      let path = std::env::temp_dir().join(format!(
        "delta-comic-db-test-{}-{timestamp}",
        std::process::id()
      ));
      fs::create_dir_all(&path).expect("test directory should be created");
      Self { path }
    }

    fn path(&self) -> &Path {
      &self.path
    }
  }

  impl Drop for TestDir {
    fn drop(&mut self) {
      let _ = fs::remove_dir_all(&self.path);
    }
  }

  #[test]
  fn store_path_percent_encodes_path_segments() {
    let root = PathBuf::from("store");

    let path = store_path(&root, "plugin/a.b", "");

    assert_eq!(path, root.join("plugin%2Fa%2Eb").join("_.json"));
  }

  #[test]
  fn native_store_value_round_trips_and_removes_values() {
    let dir = TestDir::new();

    assert_eq!(
      native_store_get_value(dir.path(), "settings", "theme").expect("missing value should read"),
      None,
    );

    native_store_set_value(dir.path(), "settings", "theme", r#"{"mode":"dark"}"#)
      .expect("value should write");

    assert_eq!(
      native_store_get_value(dir.path(), "settings", "theme").expect("value should read"),
      Some(r#"{"mode":"dark"}"#.to_string()),
    );

    native_store_remove_value(dir.path(), "settings", "theme").expect("value should remove");
    native_store_remove_value(dir.path(), "settings", "theme")
      .expect("removing a missing value should be idempotent");

    assert_eq!(
      native_store_get_value(dir.path(), "settings", "theme").expect("removed value should read"),
      None,
    );
  }

  #[test]
  fn native_store_set_value_creates_encoded_namespace_directory() {
    let dir = TestDir::new();

    native_store_set_value(dir.path(), "plugin/a.b", "comic:key", "value")
      .expect("value should write");

    assert_eq!(
      fs::read_to_string(dir.path().join("plugin%2Fa%2Eb").join("comic%3Akey.json"))
        .expect("encoded value path should exist"),
      "value",
    );
  }
}
