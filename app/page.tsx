import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg space-y-6">
        {/* Logo / Hero */}
        <div className="text-6xl mb-2">✨</div>
        <h1 className="text-4xl font-bold text-gray-900">
          Lookbook Generator
        </h1>
        <p className="text-lg text-gray-600">
          Создайте профессиональные фото для лукбука за 90 секунд.
          Загрузите одежду — AI оденет модель и снимет её в любой локации.
        </p>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { emoji: "👗", text: "Любая одежда: верх, низ, шляпа, кеды" },
            { emoji: "🧍", text: "Модель под ваши параметры (рост, вес, грудь)" },
            { emoji: "🌲", text: "Любая локация: лес, горы, пляж, студия" },
            { emoji: "📸", text: "Результат как профессиональная фотосессия" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex gap-2 items-start p-3 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <span className="text-xl shrink-0">{f.emoji}</span>
              <span className="text-sm text-gray-600">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/generate"
          className="inline-block w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-2xl text-lg shadow-lg hover:opacity-90 transition-opacity"
        >
          Создать лукбук →
        </Link>

        {/* Pricing hint */}
        <p className="text-xs text-gray-400">
          ~$0.10 за одно фото · Оплата через FAL.ai
        </p>
      </div>
    </div>
  );
}
