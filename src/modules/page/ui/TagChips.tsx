import { useState } from "react";

interface TagChipsProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagChips({ tags, onChange }: TagChipsProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((existing) => existing !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
        >
          {tag}
          <button
            className="text-neutral-500 hover:text-red-400"
            onClick={() => removeTag(tag)}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder="+ tag"
        className="w-16 bg-transparent text-xs text-neutral-400 placeholder-neutral-600 focus:outline-none"
      />
    </div>
  );
}
