import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Features from './pages/Features'
import Scalability from './pages/Scalability'
import Integrations from './pages/Integrations'
import Architecture from './pages/Architecture'
import Contact from './pages/Contact'

export default function App() {
  return (
    <div className="app-root">
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/scalability" element={<Scalability />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
