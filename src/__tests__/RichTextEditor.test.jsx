/**
 * Security review 2026-10-28 (A-008 + target=_blank sweep): HTML loaded into
 * the blog editor goes through Tiptap's schema, so script/event-handler
 * content is dropped, and links keep rel="noopener noreferrer".
 */
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import RichTextEditor from '../components/ui/RichTextEditor.jsx';

describe('RichTextEditor HTML safety', () => {
  it('drops scripts and inline handlers from loaded HTML', async () => {
    window.__xss = undefined;
    const { container } = render(
      <RichTextEditor
        value={'<p>hi<img src="x" onerror="window.__xss=1"></p><script>window.__xss=2</script>'}
        onChange={vi.fn()}
      />
    );
    await waitFor(() => expect(container.querySelector('.ProseMirror')).not.toBeNull());
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(window.__xss).toBeUndefined();
  });

  it('renders links with noopener noreferrer and refuses javascript: hrefs', async () => {
    const { container } = render(
      <RichTextEditor
        value={'<p><a href="https://keplix.co.in" target="_blank">ok</a> <a href="javascript:alert(1)">bad</a></p>'}
        onChange={vi.fn()}
      />
    );
    await waitFor(() => expect(container.querySelector('.ProseMirror a')).not.toBeNull());
    const links = [...container.querySelectorAll('.ProseMirror a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://keplix.co.in');
    expect(links[0].getAttribute('rel')).toMatch(/noopener/);
    expect(links[0].getAttribute('rel')).toMatch(/noreferrer/);
  });
});
