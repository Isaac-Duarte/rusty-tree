import "./App.css";
import { toast } from "@/hooks/use-toast";
import FileSystemTree from '@/components/ui/filesystem-tree';
import { FileSystemNode } from '@/types/filesystem';
import { z } from "zod";
import {  useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"

const sampleData: FileSystemNode = {
  name: 'root',
  type: 'folder',
  size: 1024 * 1024 * 100,
  children: [
    {
      name: 'Documents',
      type: 'folder',
      size: 1024 * 1024 * 50,
      children: [
        { name: 'report.pdf', type: 'file', size: 1024 * 1024 * 2 }, // 2 MB
        { name: 'presentation.pptx', type: 'file', size: 1024 * 1024 * 5 }, // 5 MB
      ],
    },
    {
      name: 'Pictures',
      type: 'folder',
      size: 1024 * 1024 * 30,
      children: [
        { name: 'vacation.jpg', type: 'file', size: 1024 * 1024 * 3 }, // 3 MB
        { name: 'family.png', type: 'file', size: 1024 * 1024 * 2 }, // 2 MB
      ],
    },
    { name: 'notes.txt', type: 'file', size: 1024 * 10 }, // 10 KB
  ],
};

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

function App() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleSelectDirectory = () => {
    toast({
      title: "Not Implemented",
      description: "not Implemented",
    });
  };

  const handleScan = () => {
    toast({
      title: "Not Implemented",
      description: "not Implemented",
    });
  };

  return (
<main className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h1 className="p-3 text-left text-3xl font-bold text-primary dark:text-black">Rusty Tree</h1>
  <Menubar className="p-3 text border-b border-gray-200 dark:border-gray-700 font-semibold">
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>Export To JSON</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>

  <div className="px-4 mt-6 flex flex-wrap gap-4">
    <button onClick={handleSelectDirectory} className="btn btn-primary">Select Directory</button>
    <button onClick={handleScan} className="btn btn-secondary">Scan</button>
  </div>
  
  <div className="px-4 py-10">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Directory: {sampleData.name}</label>
    <FileSystemTree 
      data={sampleData} 
    />
  </div>
</main>
  );
}

export default App;
