import { describe, expect, it } from 'vitest';
import { findInlineScriptElements } from '../../scripts/inline-script-elements.mjs';

describe('V5 distribution verifier', () => {
  it('recognizes inline scripts whose closing tag contains allowed whitespace', () => {
    const scripts = findInlineScriptElements(
      '<script>first()</script ><script data-runtime="v5">second()</SCRIPT\n>',
    );

    expect(scripts.map((match) => match[1])).toEqual(['first()', 'second()']);
  });

  it('does not treat similarly named elements as scripts', () => {
    expect(findInlineScriptElements('<script-template>notScript()</script-template>')).toEqual([]);
  });
});
