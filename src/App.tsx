import "./App.css";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import {  useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { invoke } from "@tauri-apps/api/core";

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

  const handleHelloWorldClick = () => {
    toast({
      title: "Hello Pendejo!",
      description: "This is it, ShadCN & Tailwind mother fucka",
    });
  };

  const communicateToRust = async (data: z.infer<typeof FormSchema>) => {
    const value: string = await invoke("greet", { name: data.name });

    toast({
      title: value,
    });
  };

  return (
    <main className="container">
      <h1 className="text-2xl text-center pt-2 text-primary">Hello</h1>

      <div className="flex justify-center flex-col gap-2 m items-center">
        <Button onClick={handleHelloWorldClick} className="">
          Hello World!
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(communicateToRust)}>
            <div className="flex flex-row gap-2 items-center">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Input Name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will send a message to rust
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Communicate to rust!</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

export default App;
