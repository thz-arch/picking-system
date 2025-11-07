import React from 'react'

export default function Integrations(){
  return (
    <section className="container section">
      <h2>Integrações</h2>
      <p>Integrações possíveis:</p>
      <ul>
        <li>Sistemas WMS/ERP via API REST</li>
        <li>Banco de dados relacional ou NoSQL</li>
        <li>Mensageria (RabbitMQ, Kafka) para eventos</li>
        <li>Autenticação via OAuth / SSO</li>
        <li>Monitoramento e alertas</li>
      </ul>
    </section>
  )
}
