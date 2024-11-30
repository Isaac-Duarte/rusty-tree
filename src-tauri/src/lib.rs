use std::sync::Mutex;

use file_tree::FSNode;

pub mod file_tree;

#[derive(Default)]
pub struct AppState {
    node: Option<FSNode>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            file_tree::read_recursive,
            file_tree::get_node_by_id,
            file_tree::save_as_json,
            file_tree::open_in_file_explorer
        ])
        .manage(Mutex::new(AppState::default()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
