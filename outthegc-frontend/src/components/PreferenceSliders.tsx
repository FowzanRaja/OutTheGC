import { useState } from "react";

interface PreferenceSlidersProps {
  energy_level?: number;
  social_preference?: number;
  nature_preference?: number;
  urban_preference?: number;
  onChange: (sliders: {
    energy_level: number;
    social_preference: number;
    nature_preference: number;
    urban_preference: number;
  }) => void;
}

export const PreferenceSliders: React.FC<PreferenceSlidersProps> = ({
  energy_level = 2,
  social_preference = 2,
  nature_preference = 2,
  urban_preference = 2,
  onChange,
}) => {
  const [energy, setEnergy] = useState(energy_level);
  const [social, setSocial] = useState(social_preference);
  const [nature, setNature] = useState(nature_preference);
  const [urban, setUrban] = useState(urban_preference);

  const handleChange = (key: string, value: number) => {
    const newState = {
      energy_level: key === "energy" ? value : energy,
      social_preference: key === "social" ? value : social,
      nature_preference: key === "nature" ? value : nature,
      urban_preference: key === "urban" ? value : urban,
    };

    if (key === "energy") setEnergy(value);
    if (key === "social") setSocial(value);
    if (key === "nature") setNature(value);
    if (key === "urban") setUrban(value);

    onChange(newState);
  };

  const sliders = [
    { key: "energy", label: "Energy Level", min: "Chill", max: "High", value: energy },
    { key: "social", label: "Social Preference", min: "Solo", max: "Group", value: social },
    { key: "nature", label: "Nature Preference", min: "Urban", max: "Nature", value: nature },
    { key: "urban", label: "Urban Preference", min: "Remote", max: "City", value: urban },
  ];

  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium">Preferences</label>
      {sliders.map((slider) => (
        <div key={slider.key}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-200">{slider.label}</span>
            <span className="text-xs text-slate-400">{slider.value}/5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-12">{slider.min}</span>
            <input
              type="range"
              min="0"
              max="5"
              value={slider.value}
              onChange={(e) =>
                handleChange(slider.key, parseInt(e.target.value))
              }
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xs text-slate-500 w-12 text-right">{slider.max}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
