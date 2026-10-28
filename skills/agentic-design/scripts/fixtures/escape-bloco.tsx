// Um seletor em que o dono aprovou emoji ao lado do rótulo: um escape por bloco.
// slop-ok-bloco: seletor de reações com emoji no rótulo, aprovado pelo dono (DESIGN.md)
export const REACOES = [
  { id: "gosto", rotulo: "👍 Gosto" },
  { id: "riso", rotulo: "😂 Riso" },
  { id: "festa", rotulo: "🎉 Festa" }
];
// slop-ok-fim
export const Titulo = () => <h2>✨ Reações</h2>;
// slop-ok-bloco: bloco que nunca fecha
export const Outro = () => <h2>🚀 Lançar</h2>;
