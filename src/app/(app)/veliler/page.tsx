import { VelilerCrm } from "@/components/pages/veliler/veliler-crm";

export const metadata = { title: "Veliler (CRM)" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <VelilerCrm />
    </div>
  );
}
