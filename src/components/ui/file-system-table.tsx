"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface FileSystemNode {
  id: number;
  name: string;
  size: number;
  node_type: "File" | "Directory";
  children?: FileSystemNode[];
  num_files: number;
  num_dirs: number;
}

interface FileSystemRowProps {
  node: FileSystemNode;
  depth: number;
  parentSize: number;
}

const FileSystemTable: React.FC<{ data: FileSystemNode }> = ({ data }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Size of Parent</TableHead>
          <TableHead>Number of Files</TableHead>
          <TableHead>Number of Directories</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <FileSystemRow node={data} depth={0} parentSize={data.size} />
      </TableBody>
    </Table>
  );
};

const FileSystemRow: React.FC<FileSystemRowProps> = ({
  node,
  depth,
  parentSize,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileSystemNode[] | null>(
    node.children || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (isExpanded && !children && node.node_type === "Directory") {
      setIsLoading(true);
      setError(null);
      invoke<FileSystemNode>("get_node_by_id", { id: node.id })
        .then(nodeData => {
          setChildren(nodeData.children || []);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching children:", error);
          setError("Failed to load children");
          setIsLoading(false);
        });
    }
  }, [isExpanded]);

  const sizePercentage = parentSize ? (node.size / parentSize) * 100 : 0;

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div
            className="flex items-center"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {node.node_type === "Directory" ? (
              <button onClick={toggleExpand} className="mr-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {node.node_type === "Directory" ? (
              <Folder className="h-4 w-4 mr-2" />
            ) : (
              <File className="h-4 w-4 mr-2" />
            )}
            {node.name}
          </div>
        </TableCell>
        <TableCell>{formatSize(node.size)}</TableCell>
        <TableCell>
          <div className="w-full max-w-md">
            <Progress value={sizePercentage} className="w-full" />
          </div>
        </TableCell>
        <TableCell>{node.num_files.toLocaleString()}</TableCell>
        <TableCell>{node.num_dirs.toLocaleString()}</TableCell>
      </TableRow>
      {isExpanded &&
        (isLoading ? (
          <TableRow>
            <TableCell
              colSpan={5}
              style={{ paddingLeft: `${(depth + 1) * 20}px` }}
            >
              Loading...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell
              colSpan={5}
              style={{ paddingLeft: `${(depth + 1) * 20}px` }}
            >
              {error}
            </TableCell>
          </TableRow>
        ) : (
          children &&
          children.map(child => (
            <FileSystemRow
              key={child.id}
              node={child}
              depth={depth + 1}
              parentSize={node.size}
            />
          ))
        ))}
    </>
  );
};

export default FileSystemTable;
