import { parse } from 'mathjs';

export interface ParsedEquation {
  id: string;
  text: string;
  color: string;
  visible: boolean;
  error?: string;
  compiled?: any;
  variables: string[];
  isXFunction?: boolean;
}

const BUILT_IN_SYMBOLS = new Set(['x', 'e', 'pi', 'i', 'phi']);

export function parseEquation(text: string): { compiled?: any, variables: string[], error?: string, isXFunction?: boolean } {
  try {
    let exprStr = text.trim();
    if (!exprStr) {
      return { variables: [] };
    }

    let isXFunction = false;

    // Handle "y = ..." or "f(x) = ..."
    if (exprStr.startsWith('y =') || exprStr.startsWith('y=')) {
      exprStr = exprStr.replace(/^y\s*=/, '');
    } else if (exprStr.startsWith('f(x) =') || exprStr.startsWith('f(x)=')) {
      exprStr = exprStr.replace(/^f\(x\)\s*=/, '');
    } else if (exprStr.startsWith('x =') || exprStr.startsWith('x=')) {
      exprStr = exprStr.replace(/^x\s*=/, '');
      isXFunction = true;
    }

    // 1. Missing parens for functions: sinx -> sin(x), cosx -> cos(x)
    exprStr = exprStr.replace(/\b(sin|cos|tan|log|ln|sqrt|exp|asin|acos|atan)\s*([a-zA-Z])\b/g, '$1($2)');

    // 2. Implicit multiplication for number followed by letter: 2x -> 2*x, 2sin -> 2*sin
    exprStr = exprStr.replace(/(\d)([a-zA-Z])/g, '$1*$2');

    // 3. Implicit multiplication for letter followed by x: mx -> m*x
    exprStr = exprStr.replace(/\b([a-wA-Wy-z])x\b/g, '$1*x');

    const node = parse(exprStr);
    
    // Auto-detect if it's a function of y (contains y but not x, and not already marked as xFunction)
    if (!isXFunction) {
      let hasX = false;
      let hasY = false;
      node.traverse((n) => {
        // @ts-ignore
        if (n.isSymbolNode) {
          // @ts-ignore
          if (n.name === 'x') hasX = true;
          // @ts-ignore
          if (n.name === 'y') hasY = true;
        }
      });
      if (hasY && !hasX) {
        isXFunction = true;
      }
    }

    const compiled = node.compile();

    const variables = new Set<string>();
    
    node.traverse((n, path, parent) => {
      // @ts-ignore
      if (n.isSymbolNode) {
        // @ts-ignore
        if (parent && parent.isFunctionNode && parent.fn === n) {
          return; // It's a function name
        }
        // @ts-ignore
        const name = n.name;
        
        // Skip the independent variable
        if (isXFunction && name === 'y') return;
        if (!isXFunction && name === 'x') return;

        if (!BUILT_IN_SYMBOLS.has(name) && typeof Math[name as keyof Math] === 'undefined') {
          variables.add(name);
        }
      }
    });

    return { compiled, variables: Array.from(variables), error: undefined, isXFunction };
  } catch (err: any) {
    return { variables: [], error: err.message || 'Invalid equation' };
  }
}
