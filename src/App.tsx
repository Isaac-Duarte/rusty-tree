import "./App.css";
import FileSystemTree from "@/components/ui/filesystem-tree";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "./components/ui/button";
import { useState } from "react";
import { FileSystemNode } from "./types/filesystem";
import { open } from "@tauri-apps/plugin-dialog";
import { Card, CardContent, CardHeader } from "./components/ui/card";

import { invoke } from "@tauri-apps/api/core";
import { Spinner } from "./components/ui/spinner";
import { formattedDuration } from "./types/util";

function App() {
  const [directory, setDirectory] = useState<string | undefined>();
  const [node, setNode] = useState<FileSystemNode | undefined>();
  const [scanning, setScanning] = useState(false);
  const [duration, setDuration] = useState<string | undefined>();

  const handleSelectDirectory = async () => {
    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (folder) {
      setNode(undefined);
      setDirectory(folder);
      setDuration(undefined);
    }
  };

  const handleScan = async () => {
    if (directory) {
      setScanning(true);
      setNode(undefined);
      setDuration(undefined);

      const value: { node: FileSystemNode; time_took_millis: number } =
        await invoke("read_recursive", {
          path: directory,
        });

      setScanning(false);
      setNode(value.node);
      setDuration(formattedDuration(value.time_took_millis));
    }
  };

  return (
    <main className="m-1 p-2">
      <Menubar className="text border-0 font-semibold">
        <MenubarMenu>
          <MenubarTrigger className="border">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Export To JSON</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <h1 className="text-3xl font-bold text-primary text-left ">Rusty Tree</h1>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button onClick={handleSelectDirectory} variant="outline">
          Select Directory
        </Button>
        <Button onClick={handleScan} disabled={!directory}>
          Scan
        </Button>
      </div>

      {directory && (
        <Card className="my-2">
          <CardHeader className="">
            <p>
              <b>Directory:</b> {directory}
            </p>
            {duration && node && (
              <span>
                <p>
                  <b>Time Took:</b> {duration}
                </p>
                <p>
                  <b> Total Files: </b>
                  {node.num_files.toLocaleString()}
                </p>
                <p>
                  <b> Total Dirs:</b> {node.num_dirs.toLocaleString()}
                </p>
              </span>
            )}
          </CardHeader>

          <CardContent>
            {node && <FileSystemTree data={node} />}
            {scanning && <Spinner size="md" color="primary" />}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default App;
