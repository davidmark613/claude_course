'use client';

import type { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}

function ToolbarButton({ onClick, active, disabled, label }: ToolbarButtonProps) {
  return (
    <button
      type='button'
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40
        ${active ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className='w-px self-stretch bg-gray-200 dark:bg-gray-700 mx-0.5' />;
}

export default function EditorToolbar({ editor }: Props) {
  const disabled = !editor;

  return (
    <div className='flex flex-wrap items-center gap-0.5 border-b border-gray-200 dark:border-gray-600 pb-1.5 mb-1.5'>
      {/* Text style */}
      <ToolbarButton
        label='P'
        disabled={disabled}
        active={editor?.isActive('paragraph')}
        onClick={() => editor?.chain().focus().setParagraph().run()}
      />
      <ToolbarButton
        label='H1'
        disabled={disabled}
        active={editor?.isActive('heading', { level: 1 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label='H2'
        disabled={disabled}
        active={editor?.isActive('heading', { level: 2 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label='H3'
        disabled={disabled}
        active={editor?.isActive('heading', { level: 3 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Divider />

      {/* Marks */}
      <ToolbarButton
        label='B'
        disabled={disabled}
        active={editor?.isActive('bold')}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label='I'
        disabled={disabled}
        active={editor?.isActive('italic')}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label='Code'
        disabled={disabled}
        active={editor?.isActive('code')}
        onClick={() => editor?.chain().focus().toggleCode().run()}
      />

      <Divider />

      {/* Blocks */}
      <ToolbarButton
        label='• List'
        disabled={disabled}
        active={editor?.isActive('bulletList')}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label='{ }'
        disabled={disabled}
        active={editor?.isActive('codeBlock')}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        label='—'
        disabled={disabled}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      />
    </div>
  );
}
