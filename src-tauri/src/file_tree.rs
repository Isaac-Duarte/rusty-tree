use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

#[derive(Debug, Serialize, Deserialize)]
pub struct FSNode {
    pub name: String,
    pub size: u64,
    pub node_type: FSNodeType,
    pub children: Option<Vec<FSNode>>,
    pub num_files: u64,
    pub num_dirs: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FSNodeType {
    File,
    Directory,
}

impl FSNode {
    fn directory_node(name: String) -> Self {
        FSNode {
            name,
            children: None,
            size: 0,
            node_type: FSNodeType::Directory,
            num_files: 0,
            num_dirs: 1,
        }
    }

    fn size(&self) -> u64 {
        self.size
    }
}

#[derive(Serialize)]
pub struct Response {
    node: FSNode,
    time_took_millis: u128,
}

#[tauri::command(async)]
pub fn read_recursive(path: &str) -> Response {
    let instant = Instant::now();

    let node = read_recursive_inner(&PathBuf::from(path), false);

    let time_passed = instant.elapsed().as_millis();

    Response {
        node,
        time_took_millis: time_passed,
    }
}

fn read_recursive_inner(path: &Path, follow_symlinks: bool) -> FSNode {
    let name = path
        .file_name()
        .unwrap_or(path.as_os_str())
        .to_string_lossy()
        .to_string();

    let mut node = FSNode::directory_node(name);

    let entries: Vec<_> = match fs::read_dir(path) {
        Ok(entries) => entries.collect(),
        Err(err) => {
            eprintln!("Error reading {:?}, caused by I/O error: {}", path, err);
            Vec::new()
        }
    };

    let (files, dirs): (Vec<_>, Vec<_>) = entries.into_iter().partition(|entry| {
        let meta = if follow_symlinks {
            fs::metadata(entry.as_ref().unwrap().path())
        } else {
            entry.as_ref().unwrap().metadata()
        };
        meta.unwrap().is_file()
    });

    let file_nodes: Vec<_> = files
        .par_iter()
        .map(|entry| {
            let entry = entry.as_ref().unwrap();
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let meta = if follow_symlinks {
                fs::metadata(&path)
            } else {
                entry.metadata()
            };
            let meta = meta.ok()?;
            if !name.is_empty() && meta.len() > 0 {
                Some(FSNode {
                    name,
                    children: None,
                    size: meta.len(),
                    node_type: FSNodeType::File,
                    num_files: 1,
                    num_dirs: 0,
                })
            } else {
                None
            }
        })
        .flatten()
        .collect();

    node.size += file_nodes.iter().map(|node| node.size).sum::<u64>();
    node.num_files += file_nodes.len() as u64;

    let dir_nodes: Vec<_> = dirs
        .par_iter()
        .map(|entry| {
            let entry = entry.as_ref().unwrap();
            let path = entry.path();

            let meta = if follow_symlinks {
                fs::metadata(&path)
            } else {
                entry.metadata()
            };
            let meta = meta.ok()?;
            if meta.is_dir() {
                Some(read_recursive_inner(&path, follow_symlinks))
            } else {
                None
            }
        })
        .flatten()
        .collect();

    node.size += dir_nodes.iter().map(|node| node.size()).sum::<u64>();
    node.num_files += dir_nodes.iter().map(|n| n.num_files).sum::<u64>();
    node.num_dirs += dir_nodes.iter().map(|n| n.num_dirs).sum::<u64>();

    let mut children = Vec::new();
    children.extend(file_nodes);
    children.extend(dir_nodes);

    children.sort_by(biggest_size_first);

    node.children = Some(children);

    node
}

fn biggest_size_first(lhs: &FSNode, rhs: &FSNode) -> Ordering {
    lhs.size().cmp(&rhs.size()).reverse()
}
