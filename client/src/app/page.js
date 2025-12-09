export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-24">
      <h1 className="text-4xl font-bold text-emerald-600 mb-4">
        CarbonTrack 🌿
      </h1>
      <p className="text-lg text-gray-600">
        Make Small Changes, Reduce Big Impact.
      </p>
      <button className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition">
        Start Tracking
      </button>
    </main>
  );
}