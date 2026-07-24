import { Header } from "@/components/Header";
import { MockupStudio } from "@/components/MockupStudio";


export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <MockupStudio />
    </main>
  );
}
