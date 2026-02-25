import Link from "next/link";
import { P1GIcon } from "@/components/P1GIcon";

const STEPS = [
  {
    n: "1",
    title: "Завантажте одяг",
    desc: "Фото футболки, штанів, кепки, взуття, рукавичок або окулярів — будь-яким телефоном. Фон видаляється автоматично. Додайте кілька ракурсів для точнішого результату.",
  },
  {
    n: "2",
    title: "Налаштуйте модель",
    desc: "Стать, зріст, тип фігури, тон шкіри, колір і довжина волосся. AI згенерує модель під ваші параметри.",
  },
  {
    n: "3",
    title: "Оберіть локацію",
    desc: "Ліс, гори, пляж, місто, поле або студія. Час доби, погода (сонячно, дощ, сніг, туман) та реквізит у сцені — авто, мотоцикл, яхта, гелікоптер.",
  },
  {
    n: "4",
    title: "Референси стилю (необов'язково)",
    desc: "Завантажте до 3 фото з описом «що взяти»: позу, освітлення, стиль зйомки. AI врахує їх під час фіналізації.",
  },
];

const FEATURES = [
  "Верх, низ, головний убір, взуття, рукавички, окуляри",
  "Будь-яка поза: стоячи, в русі, сидячи, через плече",
  "6 локацій · 3 часи доби · 6 погод · 7 об'єктів у сцені",
  "Результат — якість Vogue, 8K, готовий до друку",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <P1GIcon size={72} />
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            PROF1GROUP Lookbook Generator
          </h1>
          <p className="text-red-500 text-sm font-medium uppercase tracking-widest">
            мережа військових магазинів
          </p>
          <p className="text-gray-400 text-base max-w-sm">
            Завантажте фото одягу — AI одягне модель і зніме її
            в будь-якій локації. Готово за 90 секунд.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800"
            >
              <span className="shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center">
                {s.n}
              </span>
              <div>
                <p className="text-white text-sm font-semibold">{s.title}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div
              key={f}
              className="flex gap-2 items-start p-3 bg-gray-900 rounded-xl border border-gray-800"
            >
              <span className="text-red-500 shrink-0 mt-0.5 text-base leading-none">▪</span>
              <span className="text-xs text-gray-300 leading-snug">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/generate"
          className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg text-center shadow-lg transition-colors uppercase tracking-wide"
        >
          Створити лукбук →
        </Link>

        <p className="text-xs text-gray-600 text-center">
          ~$0.10 за одне фото · На основі FAL.ai
        </p>
      </div>
    </div>
  );
}
