import { Extension, type Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { SlashCommandList, type SlashCommandListRef } from "./SlashCommandList";

export interface SlashCommandItem {
  id: string;
  label: string;
  icon: string;
  action: (editor: Editor) => void;
}

export function createSlashCommandExtension(getItems: () => SlashCommandItem[]) {
  return Extension.create({
    name: "slashCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion<SlashCommandItem, SlashCommandItem>({
          editor: this.editor,
          char: "/",
          items: ({ query }) =>
            getItems().filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
          command: ({ editor, range, props }) => {
            editor.chain().focus().deleteRange(range).run();
            props.action(editor);
          },
          render: () => {
            let component: ReactRenderer<SlashCommandListRef> | null = null;
            let unmount: (() => void) | undefined;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashCommandList, {
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
        }),
      ];
    },
  });
}
