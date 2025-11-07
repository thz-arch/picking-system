import React from 'react'

export default function Architecture(){
  return (
    <section className="container section">
      <h2>Arquitetura</h2>
      <p>Exemplo de arquitetura para produção:</p>
      <ol>
        <li>Load Balancer → Múltiplas instâncias do backend (Flask)</li>
        <li>Banco centralizado e cache (Redis)</li>
        <li>CDN para assets estáticos (frontend)</li>
        <li>Pipeline CI/CD com containers</li>
      </ol>
    </section>
  )
}
