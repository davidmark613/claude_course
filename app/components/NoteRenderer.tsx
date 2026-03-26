import type { ReactNode } from 'react';

type Mark = { type: string };
type TextNode = { type: 'text'; text: string; marks?: Mark[] };
type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: Mark[];
};

function renderText(node: TextNode): ReactNode {
  let el: ReactNode = node.text;
  if (!node.marks) return el;
  for (const mark of node.marks) {
    if (mark.type === 'bold') el = <strong>{el}</strong>;
    else if (mark.type === 'italic') el = <em>{el}</em>;
    else if (mark.type === 'code')
      el = (
        <code className='rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-gray-800'>
          {el}
        </code>
      );
  }
  return el;
}

function renderChildren(nodes?: TipTapNode[]): ReactNode[] {
  return (nodes ?? []).map((n, i) => <span key={i}>{renderNode(n)}</span>);
}

function renderNode(node: TipTapNode): ReactNode {
  switch (node.type) {
    case 'doc':
      return (
        <div className='flex flex-col gap-3'>
          {node.content?.map((n, i) => (
            <span key={i}>{renderNode(n)}</span>
          ))}
        </div>
      );
    case 'paragraph':
      return <p className='leading-7'>{renderChildren(node.content)}</p>;
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const cls = [
        'font-semibold',
        level === 1 && 'text-2xl mt-2',
        level === 2 && 'text-xl mt-1',
        level === 3 && 'text-lg',
      ]
        .filter(Boolean)
        .join(' ');
      const children = renderChildren(node.content);
      if (level === 1) return <h1 className={cls}>{children}</h1>;
      if (level === 2) return <h2 className={cls}>{children}</h2>;
      return <h3 className={cls}>{children}</h3>;
    }
    case 'bulletList':
      return (
        <ul className='list-disc pl-6 flex flex-col gap-1'>
          {node.content?.map((n, i) => (
            <span key={i}>{renderNode(n)}</span>
          ))}
        </ul>
      );
    case 'listItem':
      return <li className='leading-7'>{renderChildren(node.content)}</li>;
    case 'codeBlock':
      return (
        <pre className='rounded-md bg-gray-100 p-4 font-mono text-sm overflow-x-auto dark:bg-gray-800'>
          <code>{renderChildren(node.content)}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr className='border-gray-200 dark:border-gray-700' />;
    case 'text':
      return renderText(node as TextNode);
    default:
      return null;
  }
}

export default function NoteRenderer({ contentJson }: { contentJson: string }) {
  const doc: TipTapNode = JSON.parse(contentJson);
  return <div className='text-sm text-gray-800 dark:text-gray-200'>{renderNode(doc)}</div>;
}
