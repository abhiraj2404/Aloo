import { Button, buttonVariants } from "@repo/ui/components/button";

const Page = () => {
  return (
    <div className="bg-red-300 text-2xl">
      Storefront Home Page
      <Button variant="default">Hello</Button>
      <Button variant="destructive">Hello</Button>
      <Button variant="outline">Hello</Button>
      <Button variant="secondary">Hello</Button>
    </div>
  );
};
export default Page;
