// Emoji como DADO (não bloqueia, lista-se em «Permitidos») vs emoji como ÍCONE (bloqueia).
// Dados: valor só de emoji numa lista ou num objeto, ou numa chave de conteúdo.
export const REACOES = ["👍", "😂", "🎉"];
export const OPCOES = [
  { id: "gosto", emoji: "👍", rotulo: "Gosto" },
  { id: "festa", reacao: "🎉" }
];
export const MAIS_REACOES = [
  "❤️",
  "😮"
];
export const MENSAGEM_EXEMPLO = { autor: "Ana", mensagem: "Adorei o concerto 🎉" };
export const Reacao = ({ r }: { r: { emoji: string } }) => <span aria-hidden="true">{r.emoji}</span>;
// Ícones: literal no JSX, num atributo, numa chave de ícone/rótulo ou ao lado de texto.
export const Titulo = () => <h2>✨ Novidades</h2>;
export const BotaoLancar = () => <button type="button">🚀</button>;
export const MENU = [{ icon: "📊", label: "Relatórios" }];
export const Destaque = () => <Etiqueta icone="⭐" />;
export const TEXTOS = { titulo: "👋 Olá" };
export const NOVIDADE = "🔥";
export const CARTAO = `<h3>🎯 Objetivo</h3>`;
