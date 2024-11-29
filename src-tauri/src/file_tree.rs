use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct FSNode {
    pub name: String,
    pub size: u64,
    pub node_type: FSNodeType,
    pub children: Option<Vec<FSNode>>,
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
        }
    }

    fn size(&self) -> u64 {
        self.size
    }
}

#[tauri::command(async)]
pub fn read_recursive(path: &str) -> FSNode {
    read_recursive_inner(&PathBuf::from(path), false)
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
                })
            } else {
                None
            }
        })
        .flatten()
        .collect();

    let file_size: u64 = file_nodes.iter().map(|node| node.size).sum();
    node.size += file_size;

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

    let dir_size: u64 = dir_nodes.iter().map(|node| node.size()).sum();
    node.size += dir_size;

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
