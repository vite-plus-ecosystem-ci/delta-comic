const COMMANDS: &[&str] = &[
  "decode_dev_meta",
  "decode_zip_meta",
  "install_dev",
  "install_zip",
  "prepare_dev_script",
  "read_local_file",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS).build();
}
