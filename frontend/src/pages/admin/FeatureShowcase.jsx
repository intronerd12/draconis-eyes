import React, { useState } from 'react'
import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react'

/**
 * Feature Showcase Component
 * Displays comprehensive feature information for admin users
 */
const FeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState('ai-model')

  const features = {
    'ai-model': {
      title: '🤖 Self-Trained AI Model',
      description: 'YOLOv8 & YOLOv11 powered object detection with continuous learning',
      sections: [
        {
          heading: 'Real-Time Detection',
          items: [
            'YOLOv8 & YOLOv11 object detection',
            'Millisecond inference time',
            'Multi-fruit batch processing',
            'Location & confidence scoring'
          ]
        },
        {
          heading: 'Image Processing',
          items: [
            'Advanced masking & segmentation',
            'Fruit region isolation',
            'Defect region localization',
            'Color & texture normalization'
          ]
        },
        {
          heading: 'Self-Training Pipeline',
          items: [
            'User image contribution',
            'Batch annotation tools',
            'Model retraining & versioning',
            'Accuracy tracking & validation'
          ]
        },
        {
          heading: 'Datasets',
          items: [
            'Kaggle public datasets',
            'Roboflow pre-labeled data',
            'User-contributed farm images',
            'Custom annotated datasets'
          ]
        }
      ]
    },
    'quality-grading': {
      title: '🏆 Quality Assessment & Grading',
      description: 'Comprehensive fruit quality evaluation and standardized grading',
      sections: [
        {
          heading: 'Measurement Criteria',
          items: [
            'Shape & symmetry assessment',
            'Size categorization (S/M/L)',
            'Color & ripeness grading',
            'Disease & blemish detection'
          ]
        },
        {
          heading: 'Grade Classification',
          items: [
            'Grade A: Premium export quality',
            'Grade B: Local market standard',
            'Grade C: Processing grade',
            'Reject: Non-commercial'
          ]
        },
        {
          heading: 'Sorting Criteria',
          items: [
            'Shape consistency evaluation',
            'Size-based categorization',
            'Color uniformity scoring',
            'Defect presence detection'
          ]
        },
        {
          heading: 'Market Valuation',
          items: [
            'Linear regression price model',
            'Quality → PHP mapping',
            'Weight estimation accuracy',
            'Per-kilogram price guidance'
          ]
        }
      ]
    },
    'fruit-types': {
      title: '🍎 Dragon Fruit Type Identification',
      description: 'Automatic classification of dragon fruit varieties',
      sections: [
        {
          heading: 'Pink Dragon Fruit',
          items: [
            'Wing color: Red/Deep pink',
            'Flesh: White or pink',
            'Ripeness indicator: Wing intensity',
            'Market: Premium export'
          ]
        },
        {
          heading: 'White Dragon Fruit',
          items: [
            'Wing color: Yellow-green to white',
            'Flesh: White',
            'Ripeness indicator: Wing brightness',
            'Market: Local & regional'
          ]
        },
        {
          heading: 'Yellow Dragon Fruit',
          items: [
            'Wing color: Bright yellow',
            'Flesh: White',
            'Ripeness indicator: Wing saturation',
            'Market: Specialty/niche'
          ]
        },
        {
          heading: 'Wing-Based Ripeness',
          items: [
            'Day 0-14: Green wings (unripe)',
            'Day 14-27: Color emerges (developing)',
            'Day 27-35: Color intensifies (early harvest)',
            'Day 35-40: Full color (optimal harvest) ⭐'
          ]
        }
      ]
    },
    'harvest': {
      title: '📋 Harvest Timeline & Guidance',
      description: '27-40 day post-flowering harvest window optimization',
      sections: [
        {
          heading: 'Growth Phases',
          items: [
            'Day 1: Flowering (harvest window opens)',
            'Day 7-14: Early development (monitor growth)',
            'Day 14-27: Mid growth phase (wing emerges)',
            'Day 27-35: Pre-optimal window (early harvest possible)'
          ]
        },
        {
          heading: 'Optimal Harvest Window',
          items: [
            '⭐ Day 35-40 (peak ripeness)',
            'Full wing color development',
            'Maximum sugar accumulation',
            'Optimal texture & flavor'
          ]
        },
        {
          heading: 'Ripeness Indicators',
          items: [
            'Wing color progression',
            'Skin elasticity',
            'Fruit firmness (slight give)',
            'Fragrance intensity'
          ]
        },
        {
          heading: 'Post-Harvest',
          items: [
            'Day 40+: Over-ripe risk',
            'Quality decline potential',
            'Rot & decay risk increases',
            'Market value diminishes'
          ]
        }
      ]
    },
    'analytics': {
      title: '📊 Analytics & Reporting',
      description: 'Comprehensive data insights and performance tracking',
      sections: [
        {
          heading: 'Real-Time Metrics',
          items: [
            'Daily scan volume tracking',
            'Grade distribution percentage',
            'Quality KPI monitoring',
            'System health status'
          ]
        },
        {
          heading: 'Historical Analysis',
          items: [
            'Weekly trend analysis',
            'Grade distribution trends',
            'Defect rate tracking',
            'Quality improvement trends'
          ]
        },
        {
          heading: 'Batch Reporting',
          items: [
            'Per-batch summary reports',
            'Pass rate calculation',
            'Defect categorization',
            'Grade mix analysis'
          ]
        },
        {
          heading: 'Environmental Correlation',
          items: [
            'Weather data integration',
            'Temperature impact analysis',
            'Humidity correlation',
            'Growth condition optimization'
          ]
        }
      ]
    },
    'environmental': {
      title: '🌍 Environmental Integration',
      description: 'Weather data and growth recommendation system',
      sections: [
        {
          heading: 'Real-Time Data',
          items: [
            'Location-based weather tracking',
            'Current temperature & humidity',
            'Wind speed monitoring',
            'Precipitation tracking'
          ]
        },
        {
          heading: '7-Day Forecasts',
          items: [
            'Provincial-level forecasting',
            'Temperature trends',
            'Rainfall predictions',
            'Harvest window optimization'
          ]
        },
        {
          heading: 'Growth Recommendations',
          items: [
            'Ripeness prediction',
            'Optimal harvest timing',
            'Weather-based disease risk',
            'Irrigation scheduling'
          ]
        },
        {
          heading: 'Data Sources',
          items: [
            'Open-Meteo API',
            'Regional weather stations',
            'Historical climate data',
            'Predictive models'
          ]
        }
      ]
    }
  }

  const tabOrder = ['ai-model', 'quality-grading', 'fruit-types', 'harvest', 'analytics', 'environmental']

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '8px' }}>
          System Features & Capabilities
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: '15px' }}>
          Comprehensive breakdown of Dragon Fruit Intelligence features and technical capabilities
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: '12px'
      }}>
        {tabOrder.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab ? 'var(--dragon-primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--gray-600)',
              border: activeTab === tab ? `2px solid var(--dragon-primary)` : `2px solid transparent`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {features[tab].title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ 
        padding: '32px', 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '8px' }}>
          {features[activeTab].title}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--gray-600)', marginBottom: '32px' }}>
          {features[activeTab].description}
        </p>

        {/* Feature Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {features[activeTab].sections.map((section, idx) => (
            <div 
              key={idx}
              style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid var(--gray-200)'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '12px' }}>
                {section.heading}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.items.map((item, i) => (
                  <li 
                    key={i}
                    style={{
                      padding: '8px 0',
                      fontSize: '14px',
                      color: 'var(--gray-700)',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <CheckCircle size={16} style={{ color: 'var(--dragon-primary)', marginTop: '2px', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Key Highlights */}
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} style={{ color: '#1e40af', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                Key Highlights
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#1e3a8a' }}>
                <li style={{ padding: '3px 0' }}>✓ Real-time analysis & instant results</li>
                <li style={{ padding: '3px 0' }}>✓ Consistent, bias-free grading</li>
                <li style={{ padding: '3px 0' }}>✓ Predictive insights & recommendations</li>
                <li style={{ padding: '3px 0' }}>✓ Mobile-first & scalable architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureShowcase
