import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="w-full h-[90vh] flex justify-center items-center">
      <Spinner className="size-8" />
    </div>
  );
}
