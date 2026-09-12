import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
import Mention from "@tiptap/extension-mention";
import { MentionChip } from "../nodes/MentionChip";
import {
  MentionSuggestionList,
  type MentionSuggestionListRef,
} from "./MentionSuggestionList";

export type MentionTargetType = "page" | "finding" | "asset";

export interface MentionItem {
  id: string;
  label: string;
  targetType: MentionTargetType;
}

export function createMentionExtension(getItems: (query: string) => MentionItem[]) {
  return Mention.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        targetType: {
          default: "page",
          parseHTML: (element: HTMLElement) =>
            element.getAttribute("data-target-type") ?? "page",
          renderHTML: (attributes: { targetType?: string }) => ({
            "data-target-type": attributes.targetType ?? "page",
          }),
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(MentionChip);
    },
  }).configure({
    suggestion: {
      char: "@",
      items: ({ query }) => getItems(query),
      render: () => {
        let component: ReactRenderer<MentionSuggestionListRef> | null = null;
        let unmount: (() => void) | undefined;

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionSuggestionList, {
              props,
              editor: props.editor,
            });
            unmount = props.mount(component.element as HTMLElement);
          },
          onUpdate: (props) => {
            component?.updateProps(props);
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              unmount?.();
              return true;
            }
            return component?.ref?.onKeyDown(props) ?? false;
          },
          onExit: () => {
            unmount?.();
            component?.destroy();
          },
        };
      },
    },
  });
}
