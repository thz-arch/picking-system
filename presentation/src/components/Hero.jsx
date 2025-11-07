import React from 'react'

export default function Hero({ title, subtitle }) {
  return (
    <section className="hero">
      <div className="container">
        <h2>{title}</h2>
        <p className="lead">{subtitle}</p>
      </div>
    </section>
  )
}
