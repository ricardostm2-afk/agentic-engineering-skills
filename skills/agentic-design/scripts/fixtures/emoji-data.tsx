// Emoji as DATA (does not block, listed under "Allowed") vs emoji as ICON (blocks).
// Data: an emoji-only value in a list or object, or in a content key.
export const REACTIONS = ["👍", "😂", "🎉"];
export const OPTIONS = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "party", reaction: "🎉" }
];
export const MORE_REACTIONS = [
  "❤️",
  "😮"
];
export const EXAMPLE_MESSAGE = { author: "Alex", message: "Loved the concert 🎉" };
export const Reaction = ({ r }: { r: { emoji: string } }) => <span aria-hidden="true">{r.emoji}</span>;
// Icons: literal in JSX, in an attribute, in an icon/label key or beside text.
export const Title = () => <h2>✨ What's new</h2>;
export const LaunchButton = () => <button type="button">🚀</button>;
export const MENU = [{ icon: "📊", label: "Reports" }];
export const Highlight = () => <Tag icon="⭐" />;
export const TEXTS = { title: "👋 Hello" };
export const NEWS = "🔥";
export const CARD = `<h3>🎯 Goal</h3>`;
