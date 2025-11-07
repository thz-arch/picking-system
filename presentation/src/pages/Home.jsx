import React from 'react'
import Hero from '../components/Hero'

export default function Home(){
  return (
    <div>
      <Hero title="Picking - Solução de Separação" subtitle="Demonstração das funcionalidades, escalabilidade e integrações." />

      <section className="container section">
        <h3>Visão Geral</h3>
        <p>Esta aplicação demonstra as capacidades do sistema de picking: gerenciamento de bipagens, unidades por caixa, progresso em tempo real e logs.</p>
      </section>
    </div>
  )
}
