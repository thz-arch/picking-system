import React from 'react'

export default function Scalability(){
  return (
    <section className="container section">
      <h2>Escalonamento</h2>
      <p>O sistema foi projetado para rodar em ambientes leves e escalar horizontalmente:</p>
      <ul>
        <li>Frontend independente — pode ser servido por CDN ou container</li>
        <li>Backend em Flask — escalonável por múltiplas instâncias por trás de um load balancer</li>
        <li>Métricas e logs podem ser centralizados (ELK/Prometheus)</li>
        <li>Suporte para filas e processamento assíncrono para alto throughput</li>
      </ul>
    </section>
  )
}
