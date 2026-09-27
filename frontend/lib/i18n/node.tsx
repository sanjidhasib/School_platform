import * as React from 'react';
import { t } from './index';

/**
 * Like t(), for sentences with an element inside — "<strong>{name}</strong>
 * will be removed". The whole sentence is translated as one piece (word
 * order differs between Bangla and English), then each {placeholder} is
 * swapped for its React node.
 */
export function tNode(text: string, nodes: Record<string, React.ReactNode>): React.ReactNode {
  const marker = (k: string) => `\u0000${k}\u0000`;
  const translated = t(text, Object.fromEntries(Object.keys(nodes).map((k) => [k, marker(k)])));
  return translated.split(/\u0000/).map((part, i) =>
    i % 2 === 1 ? <React.Fragment key={i}>{nodes[part]}</React.Fragment> : part
  );
}
