use bon::Builder;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering as AtomicOrdering};
use std::sync::Mutex;
use std::time::Instant;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::AppState;

#[derive(Debug, Serialize, Clone)]
pub struct FSNode {
    pub id: u64,
    pub name: String,
    pub size: u64,
    pub node_type: FSNodeType,
    pub children: Option<Vec<FSNode>>,
    pub num_files: u64,
    pub num_dirs: u64,

    // Store instead of compute for better performance :(
    pub depth: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FSNodeType {
    File,
    Directory,
}

impl FSNode {
    fn directory_node(name: String, id: u64) -> Self {
        FSNode {
            id,
            name,
            children: None,
            size: 0,
            node_type: FSNodeType::Directory,
            num_files: 0,
            num_dirs: 1,
            depth: 0,
        }
    }

    fn size(&self) -> u64 {
        self.size
    }

    pub fn get_node_by_id(&self, id: u64) -> Option<&FSNode> {
        if self.id == id {
            Some(self)
        } else {
            self.children.as_ref().and_then(|children| {
                for child in children {
                    if let Some(node) = child.get_node_by_id(id) {
                        return Some(node);
                    }
                }
                None
            })
        }
    }

    pub fn get_node_by_id_mut(&mut self, id: u64) -> Option<&mut FSNode> {
        if self.id == id {
            Some(self)
        } else {
            self.children.as_mut().and_then(|children| {
                for child in children {
                    if let Some(node) = child.get_node_by_id_mut(id) {
                        return Some(node);
                    }
                }
                None
            })
        }
    }

    pub fn clone_without_children(&self) -> Self {
        FSNode {
            id: self.id.clone(),
            name: self.name.clone(),
            size: self.size.clone(),
            node_type: self.node_type.clone(),
            children: None,
            num_files: self.num_files.clone(),
            num_dirs: self.num_dirs.clone(),
            depth: self.depth,
        }
    }

    pub fn clone_only_direct_children(&self) -> Self {
        let mut node = self.clone_without_children();
        node.children = self.children.as_ref().map(|children| {
            children
                .iter()
                .map(|child| child.clone_without_children())
                .collect()
        });

        node
    }
}

#[derive(Serialize)]
pub struct Response {
    node: FSNode,
    time_took_millis: u128,
}

#[derive(Deserialize, Builder)]
pub struct TraverseOptions {
    follow_system_links: bool,
    max_depth: Option<u32>,
    min_size: Option<u64>,
}

#[tauri::command(async)]
pub fn read_recursive(
    path: &str,
    max_depth: Option<u32>,
    min_size: Option<u64>,
    state: State<'_, Mutex<AppState>>,
) -> Response {
    let options = TraverseOptions::builder()
        .follow_system_links(false)
        .maybe_max_depth(max_depth)
        .maybe_min_size(min_size)
        .build();

    let instant = Instant::now();

    let counter = AtomicU64::new(0);
    let node = match read_recursive_inner(&PathBuf::from(path), &counter, &options, 0) {
        Some(node) => node,
        None => {
            return Response {
                node: FSNode::directory_node("".to_string(), 0),
                time_took_millis: instant.elapsed().as_millis(),
            };
        }
    };

    let time_passed = instant.elapsed().as_millis();

    let direct_children_node = node.clone_only_direct_children();

    if let Ok(mut state) = state.lock() {
        state.node = Some(node);
    }

    Response {
        node: direct_children_node,
        time_took_millis: time_passed,
    }
}

#[tauri::command(async)]
pub fn get_node_by_id(id: u64, state: State<'_, Mutex<AppState>>) -> Option<FSNode> {
    if let Ok(state) = state.lock() {
        if let Some(node) = state.node.as_ref() {
            if let Some(found_node) = node.get_node_by_id(id) {
                return Some(found_node.clone_only_direct_children());
            }
        }
    }

    None
}

#[tauri::command(async)]
pub fn save_as_json(pretty_print: bool, state: State<'_, Mutex<AppState>>, app_handle: AppHandle) {
    if let Ok(state) = state.lock() {
        if let Some(node) = state.node.clone() {
            app_handle
                .dialog()
                .file()
                .add_filter("node.json", &["json"])
                .save_file(move |file| {
                    if let Some(file) = file {
                        let file = File::create(file.to_string()).unwrap();
                        let mut writer = BufWriter::new(file);

                        if pretty_print {
                            serde_json::to_writer_pretty(&mut writer, &node).unwrap();
                        } else {
                            serde_json::to_writer(&mut writer, &node).unwrap();
                        }
                        writer.flush().unwrap();
                    }
                });
        }
    }
}

fn read_recursive_inner(
    path: &Path,
    counter: &AtomicU64,
    options: &TraverseOptions,
    depth: u64,
) -> Option<FSNode> {
    let name = path
        .file_name()
        .unwrap_or(path.as_os_str())
        .to_string_lossy()
        .to_string();

    let id = counter.fetch_add(1, AtomicOrdering::SeqCst);
    let mut node = FSNode::directory_node(name, id);
    node.depth = depth;

    let reached_max_depth = if let Some(max) = options.max_depth {
        depth >= max as u64
    } else {
        false
    };

    let entries: Vec<_> = match fs::read_dir(path) {
        Ok(entries) => entries.collect(),
        Err(err) => {
            eprintln!("Error reading {:?}, caused by I/O error: {}", path, err);
            Vec::new()
        }
    };

    let (files, dirs): (Vec<_>, Vec<_>) = entries.into_iter().partition(|entry| {
        let meta = if options.follow_system_links {
            fs::metadata(entry.as_ref().unwrap().path())
        } else {
            entry.as_ref().unwrap().metadata()
        };
        meta.map(|meta| meta.is_file()).unwrap_or_default()
    });

    let file_nodes: Vec<_> = files
        .par_iter()
        .filter_map(|entry| {
            let entry = entry.as_ref().unwrap();
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let meta = if options.follow_system_links {
                fs::metadata(&path)
            } else {
                entry.metadata()
            };
            let meta = meta.ok()?;
            if !name.is_empty() && meta.len() > 0 {
                if let Some(min_size) = options.min_size {
                    if meta.len() < min_size {
                        return None;
                    }
                }

                Some(FSNode {
                    id: counter.fetch_add(1, AtomicOrdering::SeqCst),
                    name,
                    children: None,
                    size: meta.len(),
                    node_type: FSNodeType::File,
                    num_files: 1,
                    num_dirs: 0,
                    depth: depth + 1,
                })
            } else {
                None
            }
        })
        .collect();

    node.size += file_nodes.iter().map(|node| node.size).sum::<u64>();
    node.num_files += file_nodes.len() as u64;

    // Process directories
    let dir_nodes: Vec<_> = if reached_max_depth {
        Vec::new() // Don't recurse further if max_depth is reached
    } else {
        dirs
            .par_iter()
            .filter_map(|entry| {
                let entry = entry.as_ref().unwrap();
                let path = entry.path();

                let meta = if options.follow_system_links {
                    fs::metadata(&path)
                } else {
                    entry.metadata()
                };
                let meta = meta.ok()?;
                if meta.is_dir() {
                    read_recursive_inner(&path, counter, options, depth + 1)
                } else {
                    None
                }
            })
            .collect()
    };

    node.size += dir_nodes.iter().map(|node| node.size).sum::<u64>();
    node.num_files += dir_nodes.iter().map(|n| n.num_files).sum::<u64>();
    node.num_dirs += dir_nodes.iter().map(|n| n.num_dirs).sum::<u64>();

    let mut children = Vec::new();
    children.extend(file_nodes);
    children.extend(dir_nodes);

    if let Some(min_size) = options.min_size {
        if node.size < min_size {
            return None;
        }
    }

    if !children.is_empty() {
        children.sort_by(biggest_size_first);
        node.children = Some(children);
    }

    Some(node)
}

fn biggest_size_first(lhs: &FSNode, rhs: &FSNode) -> Ordering {
    lhs.size().cmp(&rhs.size()).reverse()
}

#[cfg(test)]
mod test {
    use std::{fs::File, path::PathBuf, sync::atomic::AtomicU64};

    use crate::file_tree::read_recursive;

    use super::{read_recursive_inner, TraverseOptions};

    #[test]
    fn test_shit() {
        let res = read_recursive_inner(
            &PathBuf::from("/home/isaac/pictures"),
            &AtomicU64::new(0),
            &TraverseOptions::builder()
                .follow_system_links(false)
                .build(),
            0,
        );

        let file = File::create("fuck.json").unwrap();
        serde_json::to_writer_pretty(file, &res).unwrap();
    }
}
