import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Database, Layers, TrendingUp, Brain, MapPin, ArrowLeft } from 'lucide-react'

function AdminFeatures() {
  const features = [
    {
      icon: <Layers size={28} />,
      title: 'Segmentation & Masking',
      description: 'Advanced image processing to isolate fruit, skin, and defect regions for accurate scoring.',
      capabilities: ['Fruit boundary detection', 'Defect hotspot localization', 'Region isolation', 'Quality mapping'],
      color: '#3b82f6'
    },
    {
      icon: <TrendingUp size={28} />,
      title: 'Size & Weight Classification',
      description: 'Automatic categorization of fruits into size classes with weight estimation.',
      capabilities: ['S/M/L classification', 'Approximate weight estimation', 'Export-grade consistency', 'Volume calculation'],
      color: '#10b981'
    },
    {
      icon: <Brain size={28} />,
      title: 'Quality Assessment',
      description: 'Color scoring and ripeness detection based on multiple visual indicators.',
      capabilities: ['Color-based ripeness', 'Shape & symmetry analysis', 'Disease detection', 'Blemish classification'],
      color: '#f59e0b'
    },
    {
      icon: <Database size={28} />,
      title: 'Market Value Prediction',
      description: 'Linear regression model for PHP/kg price prediction based on quality.',
      capabilities: ['Quality → price mapping', 'Pricing tier routing', 'Market routing', 'Revenue optimization'],
      color: '#ec4899'
    },
    {
      icon: <Brain size={28} />,
      title: 'Self-Trained AI Model',
      description: 'YOLOv8 & YOLOv11 with continuous learning from user-contributed data.',
      capabilities: ['Real-time inference', 'User data ingestion', 'Model versioning', 'Accuracy tracking'],
      color: '#8b5cf6'
    },
    {
      icon: <MapPin size={28} />,
      title: 'Environmental Integration',
      description: 'Weather data and environmental conditions for ripeness prediction.',
      capabilities: ['Province-level weather', '7-day forecasts', 'Growth recommendations', 'Optimal harvest timing'],
      color: '#14b8a6'
    }
  ]

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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
          System Features
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>
          Overview of core modules and capabilities powering the AI analysis engine.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(-4px)'
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <div style={{ color: f.color, display: 'flex' }}>
                {f.icon}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                {f.title}
              </h2>
            </div>

            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
              {f.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {f.capabilities.map((cap, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <span style={{ color: f.color, fontWeight: 'bold' }}>✓</span>
                  {cap}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Statistics */}
      <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Model Accuracy
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>98.3%</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>YOLOv8/v11 combined</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Processing Speed
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>~200ms</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Per image analysis</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Training Data
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>Multi-source</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Kaggle + Roboflow + User</div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminFeatures
