// A selector where the owner approved emoji beside the label: one block escape.
// slop-ok-block: reaction selector with emoji in the label, approved by the owner (DESIGN.md)
export const REACTIONS = [
  { id: "like", label: "👍 Like" },
  { id: "laugh", label: "😂 Laugh" },
  { id: "party", label: "🎉 Party" }
];
// slop-ok-end
export const Title = () => <h2>✨ Reactions</h2>;
// slop-ok-block: a block that never closes
export const Other = () => <h2>🚀 Launch</h2>;
