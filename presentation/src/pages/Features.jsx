import React from 'react'

export default function Features(){
  return (
    <section className="container section">
      <h2>Funcionalidades</h2>
      <ul>
        <li>Leitura robusta de EAN com múltiplos níveis de matching</li>
        <li>Interface de picking com feedback visual e progresso</li>
        <li>Modal de configuração de unidades por caixa</li>
        <li>Persistência via localStorage e histórico</li>
        <li>Suporte a diferentes formatos de bipagem e correções automáticas</li>
      </ul>
    </section>
  )
}
