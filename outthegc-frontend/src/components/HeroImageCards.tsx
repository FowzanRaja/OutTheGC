import SantoriniImg from "../images/Santorini.jpeg";
import ParisImg from "../images/Paris.jpeg";
import HotelNYImg from "../images/Hotel New York.jpeg";
import LakeDImg from "../images/Lake District.jpeg";
import LogCabinImg from "../images/Log Cabin.jpeg";
import ParaglideImg from "../images/Paragliding.jpeg";
import QuadBikeImg from "../images/Quad Biking.jpeg";

type CardSize = "large" | "medium" | "small";
type LayoutMode = "desktop" | "mobile";

interface CardConfig {
  title: string;
  image: string;
  size: CardSize;
  top: string;
  left: string;
}

const sizeClasses: Record<CardSize, string> = {
  large: "w-72 aspect-[4/3]",
  medium: "w-56 aspect-[4/3]",
  small: "w-40 aspect-[4/3]",
};

const cards: CardConfig[] = [
  { title: "Santorini", image: SantoriniImg, size: "large", top: "17%", left: "35%" },
  { title: "Paris", image: ParisImg, size: "medium", top: "78%", left: "48%" },
  { title: "Hotels in New York", image: HotelNYImg, size: "small", top: "64%", left: "81%" },
  { title: "Lake District", image: LakeDImg, size: "small", top: "18%", left: "68%" },
  { title: "Log Cabins", image: LogCabinImg, size: "small", top: "85%", left: "26%" },
  { title: "Paragliding", image: ParaglideImg, size: "medium", top: "33%", left: "87%" },
  { title: "Quad Biking", image: QuadBikeImg, size: "medium", top: "45%", left: "18%" },
];

const baseCardClasses =
  "rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-white/10 transition lg:hover:scale-[1.02] lg:hover:shadow-2xl";

export const HeroImageCards: React.FC<{ layout: LayoutMode }> = ({ layout }) => {
  if (layout === "mobile") {
    return (
      <div className="grid grid-cols-2 gap-3 w-full">
        {cards.map((card) => (
          <div key={card.title} className={`w-full aspect-[4/3] ${baseCardClasses} relative pointer-events-none`}>
            <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
            <div className="absolute left-3 bottom-3">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white/85 text-slate-900">
                {card.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop orbit layout
  return (
    <>
      {cards.map((card) => (
        <div
          key={card.title}
          className={`absolute ${sizeClasses[card.size]} ${baseCardClasses} z-10 pointer-events-none`}
          style={{
            top: card.top,
            left: card.left,
            transform: "translate(-50%, -50%)",
          }}
        >
          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
          <div className="absolute left-3 bottom-3">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white/85 text-slate-900">
              {card.title}
            </span>
          </div>
        </div>
      ))}
    </>
  );
};
