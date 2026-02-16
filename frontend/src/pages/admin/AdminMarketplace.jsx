import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Filter, Plus, ArrowLeft } from 'lucide-react'

function AdminMarketplace() {
  const [query, setQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState('')

  const PRODUCTS = useMemo(() => [
    { id: 1, name: 'Premium Dragon Fruit', grade: 'A', price: 3.99, stock: 120, image: '🐲', desc: 'Sweet and vibrant pink flesh', status: 'Active' },
    { id: 2, name: 'Organic White Dragon', grade: 'A', price: 4.49, stock: 85, image: '🥚', desc: 'Classic white flesh with subtle sweetness', status: 'Active' },
    { id: 3, name: 'Yellow Pitaya', grade: 'A+', price: 6.99, stock: 45, image: '🌞', desc: 'The sweetest variety, golden skin', status: 'Active' },
    { id: 4, name: 'Frozen Cubes', grade: 'A', price: 5.99, stock: 320, image: '🧊', desc: 'Perfect for smoothies and bowls', status: 'Active' },
    { id: 5, name: 'Smoothie Pack', grade: 'B', price: 6.99, stock: 150, image: '🥤', desc: 'Ready-to-blend mix', status: 'Active' },
    { id: 6, name: 'Dried Dragon Chips', grade: 'B', price: 7.99, stock: 65, image: '🥨', desc: 'Healthy crunchy snack', status: 'Low Stock' },
    { id: 7, name: 'Grade C Bulk', grade: 'C', price: 1.99, stock: 500, image: '📦', desc: 'Bulk processing grade', status: 'Active' },
  ], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = PRODUCTS
    
    if (q) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.desc.toLowerCase().includes(q)
      )
    }
    
    if (filterGrade) {
      result = result.filter(p => p.grade === filterGrade)
    }
    
    return result
  }, [PRODUCTS, query, filterGrade])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header with Back Button */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>

      <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            Marketplace Management
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>
            Manage product listings, inventory, and batch availability.
          </p>
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991b1b'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={18} style={{ color: '#6b7280' }} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />

        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="">All Grades</option>
          <option value="A">Grade A</option>
          <option value="A+">Grade A+</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>

        {(query || filterGrade) && (
          <button
            onClick={() => {
              setQuery('')
              setFilterGrade('')
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Total Products
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{PRODUCTS.length}</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Total Stock
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {PRODUCTS.reduce((sum, p) => sum + p.stock, 0)}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Active Listings
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {PRODUCTS.filter(p => p.status === 'Active').length}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Low Stock
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
            {PRODUCTS.filter(p => p.stock < 100).length}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <ShoppingCart size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <div style={{ fontSize: '16px', fontWeight: '500' }}>No products found</div>
          </div>
        ) : (
          filtered.map((product) => (
            <div key={product.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }} onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ padding: '20px', backgroundColor: '#f9fafb', textAlign: 'center', fontSize: '48px', borderBottom: '1px solid #e5e7eb' }}>
                {product.image}
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {product.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 8px',
                    backgroundColor: product.grade === 'A' ? '#d1fae5' : product.grade === 'B' ? '#fcd34d' : '#fee2e2',
                    color: product.grade === 'A' ? '#065f46' : product.grade === 'B' ? '#78350f' : '#991b1b',
                    borderRadius: '4px'
                  }}>
                    {product.grade}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0' }}>
                  {product.desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Price</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>${product.price}</div>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Stock</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: product.stock < 100 ? '#f59e0b' : '#1f2937' }}>
                      {product.stock}
                    </div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: product.status === 'Active' ? '#d1fae5' : '#fef3c7',
                  color: product.status === 'Active' ? '#065f46' : '#78350f'
                }}>
                  {product.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}

export default AdminMarketplace
