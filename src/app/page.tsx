import MultiSender from "~/components/MultiSender";

export default function Home() {
  return (
    <div className="container mx-auto grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <w3m-button />
      <MultiSender />
      </main>
      <footer>

      </footer>
    </div>
  );
}
