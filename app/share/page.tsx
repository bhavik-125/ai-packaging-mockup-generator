import { Jar3DViewer } from "@/components/Jar3DViewer";

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ top?: string; bottom?: string }>;
}) {
  const { top, bottom } = await searchParams;

  return (
    <main className="h-screen w-screen bg-black relative">
      <Jar3DViewer topLabelUrl={top} bottomLabelUrl={bottom} />
      <div className="absolute top-6 left-0 right-0 text-center pointer-events-none z-10 px-4">
        <p className="text-white/50 text-xs sm:text-sm tracking-wider uppercase font-medium drop-shadow-md">
          This is a computer generated model, real product may vary
        </p>
      </div>
    </main>
  );
}
