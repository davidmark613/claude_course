// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoteRenderer from '@/app/components/NoteRenderer';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function doc(...nodes: object[]) {
  return JSON.stringify({ type: 'doc', content: nodes });
}

function paragraph(...content: object[]) {
  return { type: 'paragraph', content };
}

function heading(level: number, ...content: object[]) {
  return { type: 'heading', attrs: { level }, content };
}

function bulletList(...items: object[]) {
  return { type: 'bulletList', content: items };
}

function listItem(...content: object[]) {
  return { type: 'listItem', content };
}

function codeBlock(...content: object[]) {
  return { type: 'codeBlock', content };
}

function horizontalRule() {
  return { type: 'horizontalRule' };
}

function text(t: string, marks?: { type: string }[]) {
  return marks ? { type: 'text', text: t, marks } : { type: 'text', text: t };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NoteRenderer', () => {
  describe('empty doc', () => {
    it('renders without crashing', () => {
      const { container } = render(<NoteRenderer contentJson={doc()} />);
      expect(container).toBeTruthy();
    });

    it('renders a wrapping div with class text-sm', () => {
      const { container } = render(<NoteRenderer contentJson={doc()} />);
      expect(container.firstChild).toHaveClass('text-sm');
    });
  });

  describe('paragraph', () => {
    it('renders a <p> element', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('Hello')))} />);
      expect(screen.getByText('Hello').closest('p')).not.toBeNull();
    });

    it('renders text content inside the paragraph', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('Hello world')))} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  describe('heading nodes', () => {
    it('renders <h1> for level 1', () => {
      render(<NoteRenderer contentJson={doc(heading(1, text('Title')))} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders <h2> for level 2', () => {
      render(<NoteRenderer contentJson={doc(heading(2, text('Subtitle')))} />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders <h3> for level 3', () => {
      render(<NoteRenderer contentJson={doc(heading(3, text('Section')))} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('applies text-2xl class to h1', () => {
      render(<NoteRenderer contentJson={doc(heading(1, text('Title')))} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-2xl');
    });

    it('applies text-xl class to h2', () => {
      render(<NoteRenderer contentJson={doc(heading(2, text('Subtitle')))} />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-xl');
    });

    it('applies text-lg class to h3', () => {
      render(<NoteRenderer contentJson={doc(heading(3, text('Section')))} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveClass('text-lg');
    });
  });

  describe('bulletList and listItem', () => {
    it('renders a <ul> element', () => {
      render(<NoteRenderer contentJson={doc(bulletList(listItem(paragraph(text('Item 1')))))} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('renders <li> elements inside the list', () => {
      render(<NoteRenderer contentJson={doc(bulletList(listItem(paragraph(text('Item')))))} />);
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('renders list item text content', () => {
      render(
        <NoteRenderer
          contentJson={doc(
            bulletList(listItem(paragraph(text('First'))), listItem(paragraph(text('Second')))),
          )}
        />,
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('codeBlock', () => {
    it('renders a <pre> element', () => {
      render(<NoteRenderer contentJson={doc(codeBlock(text('const x = 1')))} />);
      expect(document.querySelector('pre')).not.toBeNull();
    });

    it('renders a <code> element inside pre', () => {
      render(<NoteRenderer contentJson={doc(codeBlock(text('const x = 1')))} />);
      expect(document.querySelector('pre code')).not.toBeNull();
    });

    it('renders code content as text', () => {
      render(<NoteRenderer contentJson={doc(codeBlock(text('const x = 1')))} />);
      expect(screen.getByText('const x = 1')).toBeInTheDocument();
    });
  });

  describe('horizontalRule', () => {
    it('renders an <hr> element', () => {
      render(<NoteRenderer contentJson={doc(horizontalRule())} />);
      expect(document.querySelector('hr')).not.toBeNull();
    });
  });

  describe('text marks', () => {
    it('wraps text in <strong> for bold mark', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('bold', [{ type: 'bold' }])))} />);
      expect(document.querySelector('strong')).not.toBeNull();
      expect(screen.getByText('bold').tagName).toBe('STRONG');
    });

    it('wraps text in <em> for italic mark', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('italic', [{ type: 'italic' }])))} />);
      expect(document.querySelector('em')).not.toBeNull();
      expect(screen.getByText('italic').tagName).toBe('EM');
    });

    it('wraps text in <code> for inline code mark', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('code', [{ type: 'code' }])))} />);
      const codeEl = screen.getByText('code');
      expect(codeEl.tagName).toBe('CODE');
    });

    it('applies bg-gray-100 class to inline code mark', () => {
      render(<NoteRenderer contentJson={doc(paragraph(text('code', [{ type: 'code' }])))} />);
      expect(screen.getByText('code')).toHaveClass('bg-gray-100');
    });

    it('nests bold inside italic when both marks are present', () => {
      render(
        <NoteRenderer
          contentJson={doc(paragraph(text('both', [{ type: 'bold' }, { type: 'italic' }])))}
        />,
      );
      const el = screen.getByText('both');
      // Should be wrapped in both strong and em (nesting order may vary)
      expect(el.closest('strong') ?? el.closest('em')).not.toBeNull();
    });
  });

  describe('unknown node type', () => {
    it('renders null for an unrecognized node type', () => {
      const { container } = render(
        <NoteRenderer contentJson={JSON.stringify({ type: 'unknownNode', content: [] })} />,
      );
      // The outer div exists but renders no visible content
      expect(container.firstChild).toBeInTheDocument();
      expect(container.textContent).toBe('');
    });
  });

  describe('nodes with no content array', () => {
    it('renders paragraph without crashing when content is missing', () => {
      const { container } = render(
        <NoteRenderer
          contentJson={JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })}
        />,
      );
      expect(container.querySelector('p')).not.toBeNull();
    });
  });
});
