'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { formatSize } from "@/types/util";

interface FileSystemNode {
  name: string;
  size: number;
  node_type: 'File' | 'Directory';
  children?: FileSystemNode[];
  num_files: number;
  num_dirs: number;
}

interface FileSystemRowProps {
  node: FileSystemNode;
  depth: number;
  parentSize: number;
}

const FileSystemRow: React.FC<FileSystemRowProps> = ({ node, depth, parentSize }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const sizePercentage = (node.size / parentSize) * 100;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            {node.children && node.children.length > 0 ? (
              <button onClick={toggleExpand} className="mr-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {node.node_type === 'Directory' ? (
              <Folder className="h-4 w-4 mr-2" color="primary"/>
            ) : (
              <File className="h-4 w-4 mr-2" color="secondary"/>
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
        <TableCell>{node.num_files}</TableCell>
        <TableCell>{node.num_dirs}</TableCell>
      </TableRow>
      {isExpanded && node.children && node.children.map((child, index) => (
        <FileSystemRow key={index} node={child} depth={depth + 1} parentSize={node.size} />
      ))}
    </>
  );
};

interface FileSystemTableProps {
  data: FileSystemNode;
}

export const FileSystemTable: React.FC<FileSystemTableProps> = ({ data }) => {
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

