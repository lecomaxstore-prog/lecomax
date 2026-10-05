/** Lightweight highlighting for short teaching excerpts; React escapes all tokens. */
export default function CodeTokens({ code }: { code: string }) {
  return <>{code.split(/("[^"\n]*"|'[^'\n]*'|\b(?:import|from|export|default|async|await|function|const|return|true|false)\b|\b\d+\b)/g).map((token, index) => {
    const color = /^["']/.test(token) ? '#cbe6a0' : /^(import|from|export|default|async|await|function|const|return|true|false)$/.test(token) ? '#b6d8ff' : /^\d+$/.test(token) ? '#ffd59b' : undefined;
    return <span key={index} style={color ? { color } : undefined}>{token}</span>;
  })}</>;
}
