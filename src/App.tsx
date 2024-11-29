import "./App.css";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "./components/ui/button";
import { useState } from "react";
import { FileSystemNode } from "./types/filesystem";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { Spinner } from "./components/ui/spinner";
import { formattedDuration } from "./types/util";
import FileSystemTable from "./components/ui/file-system-table";
import { FileOutput, FileScan, FolderOpen } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";

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
      console.log(value);
      setScanning(false);
      setNode(value.node);
      setDuration(formattedDuration(value.time_took_millis));
    }
  };

  return (
    <div className="m-2">
      <div className="flex flex-row justify-between gap-2">
        <Menubar className="w-full border-primary">
          <MenubarMenu>
            <MenubarTrigger className="px-4 py-2">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleSelectDirectory}>
                <FolderOpen className="mr-2" /> Select Directory
              </MenubarItem>
              <MenubarItem onClick={handleScan} disabled={!directory}>
                <FileScan className="mr-2" /> Scan
              </MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>
                  <FileOutput className="mr-2" /> Export
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem
                    onClick={() => {
                      invoke("save_as_json", { prettyPrint: true });
                    }}
                  >
                    JSON (Pretty)
                  </MenubarItem>
                  <MenubarItem
                    onClick={() => {
                      invoke("save_as_json", { prettyPrint: false });
                    }}
                  >
                    JSON
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <ModeToggle />
      </div>

      <header className="text-center my-8">
        <h1 className="text-4xl font-bold text-primary">Rusty Tree</h1>
        <p className="mt-2">
          Visualize and analyze your directory structure efficiently.
        </p>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {directory ? (
          <Card className="relative">
            {scanning && (
              <div className="absolute inset-0 bg-opacity-75 flex items-center justify-center">
                <Spinner size="lg" color="primary" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Directory Information
              </CardTitle>
              <CardDescription className="mt-2">
                <p>
                  <strong>Directory:</strong> {directory}
                </p>
                {duration && node && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <p>
                      <strong>Time Took:</strong> {duration}
                    </p>
                    <p>
                      <strong>Total Files:</strong>{" "}
                      {node.num_files.toLocaleString()}
                    </p>
                    <p>
                      <strong>Total Directories:</strong>{" "}
                      {node.num_dirs.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>{node && <FileSystemTable data={node} />}</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center mt-8">
            <p className="text-xl mb-6">
              No directory selected. Please select a directory to begin.
            </p>
            <Button
              onClick={handleSelectDirectory}
              variant="outline"
              className="flex items-center px-6 py-3 text-lg"
            >
              <FolderOpen className="mr-2" /> Select Directory
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
