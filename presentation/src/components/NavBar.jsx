import React from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav-inner container">
        <h1 className="logo">Picking</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/features">Funcionalidades</Link>
          <Link to="/scalability">Escalonamento</Link>
          <Link to="/integrations">Integrações</Link>
          <Link to="/architecture">Arquitetura</Link>
          <Link to="/contact">Contato</Link>
        </nav>
      </div>
    </header>
  )
}
