// Server-generated HTML in a template string: UI just like an .html file.
export function renderAction(action) {
  return `
    <style>
      .note { font-size: 10px; }
    </style>
    <section class="action">
      <h2>🚀 ${action.title}</h2>
      <p>Unlock your team's full potential</p>
      <small style="font-size: 9px">Updated now</small>
      <button type="submit">Save</button>
    </section>`;
}
