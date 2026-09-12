import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { SlashCommandItem } from "./slashCommand";

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) props.command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (props.items.length === 0) return false;
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (props.items.length === 0) {
      return (
        <div className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-500 shadow-lg">
          No matching blocks
        </div>
      );
    }

    return (
      <div className="w-56 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg">
        {props.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`flex w-full items-center gap-2 truncate px-3 py-1.5 text-left text-sm ${
              index === selectedIndex ? "bg-neutral-800 text-neutral-100" : "text-neutral-300"
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => selectItem(index)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    );
  },
);
SlashCommandList.displayName = "SlashCommandList";
