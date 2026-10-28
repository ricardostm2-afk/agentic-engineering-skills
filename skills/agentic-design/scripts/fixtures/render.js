// HTML gerado no servidor, num template string: é interface como um .html.
export function renderizarAcao(acao) {
  return `
    <style>
      .nota { font-size: 10px; }
    </style>
    <section class="acao">
      <h2>🚀 ${acao.titulo}</h2>
      <p>Desbloqueie todo o potencial da sua equipa</p>
      <small style="font-size: 9px">Atualizado agora</small>
      <button type="submit">Guardar</button>
    </section>`;
}
