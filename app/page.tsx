import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4">
      <div className="text-center max-w-lg">
        <h1 className="heading-editorial text-5xl md:text-6xl font-bold text-[#0F0F0F] mb-4">
          Snarky Store
        </h1>
        <p className="text-lg text-[#0F0F0F]/60 mb-8">
          Your Style. Your Price.
        </p>
        <p className="text-sm text-[#0F0F0F]/40 mb-6">
          Store launching soon. Admin panel is ready.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-full bg-[#0F0F0F] px-8 py-3 text-sm font-medium text-white hover:bg-[#0F0F0F]/90 transition-colors"
        >
          Go to Admin Panel →
        </Link>
      </div>
    </div>
  );
}
