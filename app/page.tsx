import Link from "next/link";
import { P1GIcon } from "@/components/P1GIcon";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <P1GIcon size={72} />
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            PROF1GROUP Lookbook Generator
          </h1>
          <p className="text-red-500 text-sm font-medium uppercase tracking-widest">
            мережа військових магазинів
          </p>
        </div>

        <p className="text-gray-400 text-base">
          Створюйте професійні фото для лукбуку за 90 секунд.
          Завантажте одяг — AI одягне модель та зніме її в будь-якій локації.
        </p>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: "▪", text: "Будь-який одяг: верх, низ, головний убір, взуття" },
            { icon: "▪", text: "Модель за вашими параметрами (зріст, вага, стать)" },
            { icon: "▪", text: "Будь-яка локація: ліс, гори, пляж, студія" },
            { icon: "▪", text: "Результат як з професійної фотосесії" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex gap-2 items-start p-3 bg-gray-900 rounded-xl border border-gray-800"
            >
              <span className="text-red-500 shrink-0 mt-0.5 text-lg leading-none">{f.icon}</span>
              <span className="text-sm text-gray-300">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/generate"
          className="inline-block w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg transition-colors uppercase tracking-wide"
        >
          Створити лукбук →
        </Link>

        <p className="text-xs text-gray-600">
          ~$0.10 за одне фото · На основі FAL.ai
        </p>
      </div>
    </div>
  );
}
