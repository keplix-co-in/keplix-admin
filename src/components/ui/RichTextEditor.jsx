import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

const btn = (active) =>
  `px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
    active
      ? 'bg-brand-red text-white'
      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
  }`;

/**
 * WYSIWYG for blog bodies. Emits HTML, which the backend re-sanitizes with an
 * allowlist before storing — so nothing here is trusted on the way in.
 *
 * Security review 2026-10-28 A-008: the admin never renders blog HTML with
 * dangerouslySetInnerHTML; stored HTML only comes back in through Tiptap,
 * whose ProseMirror schema drops anything it doesn't model (scripts, event
 * handler attributes, iframes). The backend sanitizes on write
 * (keplix-backend util/sanitizeHtml.js) and the website renders with
 * DOMPurify, so no extra sanitizer is added here.
 */
export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // Security review 2026-10-28 (target=_blank sweep, alongside A-008):
      // links open in a new tab (addLink below), so rel is pinned explicitly
      // rather than relying on Tiptap's default — noopener/noreferrer stop the
      // opened page from reaching window.opener. Tiptap's own URI check
      // already refuses javascript: hrefs.
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
      }),
      Image,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-invert min-h-[260px] max-h-[420px] overflow-y-auto px-4 py-3 text-sm text-white focus:outline-none',
      },
    },
  });

  // Re-sync when the parent swaps to a different post (e.g. edit a new row).
  // Guarded against the editor's own updates, which would otherwise reset the
  // cursor to the start on every keystroke.
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (url === null) return;
    if (url === '') return editor.chain().focus().unsetLink().run();
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] overflow-hidden">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))}>Quote</button>
        <button type="button" onClick={addLink} className={btn(editor.isActive('link'))}>Link</button>
        <button type="button" onClick={addImage} className={btn(false)}>Image</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
