import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  BarChart3,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BANK_INFO, CONTACT } from '@/lib/constants';
import { SupportWidget } from '@/components/SupportWidget';
import '@/components/LandingPage.css';

const SLIDES = [
  {
    image:
      'https://images.pexels.com/photos/5717993/pexels-photo-5717993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Banking Reimagined',
    subtitle:
      'Experience seamless digital banking with enterprise-grade security and instant transactions.',
  },
  {
    image:
      'https://images.pexels.com/photos/10020082/pexels-photo-10020082.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Smart Financial Management',
    subtitle:
      'Track every transaction, manage accounts, and grow your savings with intelligent insights.',
  },
  {
    image:
      'https://images.pexels.com/photos/10958528/pexels-photo-10958528.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Trusted Digital Banking',
    subtitle:
      'A secure banking platform designed for reliable customer service and enterprise financial operations.',
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: '256-bit encryption, OTP verification, and real-time fraud monitoring protect every transaction.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    desc: 'Executive dashboards with real-time KPIs, transaction trends, and fraud detection analytics.',
  },
  {
    icon: Users,
    title: 'Multi-Portal Access',
    desc: 'Dedicated portals for Customers, Employees, and Admins with role-based access control.',
  },
  {
    icon: Building2,
    title: 'Complete Banking Suite',
    desc: 'Accounts, transfers, cards, loans, deposits, statements, beneficiaries, and more.',
  },
];

export function LandingPage() {
  const { setCurrentPortal } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="landing-page">
      <Navbar onPortalSelect={setCurrentPortal} />

      <Hero
        slides={SLIDES}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        onGetStarted={() => setCurrentPortal('customer')}
      />

      <Portals onPortalSelect={setCurrentPortal} />
      <Features />
      <Stats />
      <Contact />
      <Footer />

      <SupportWidget />
    </div>
  );
}

function Navbar({
  onPortalSelect,
}: {
  onPortalSelect: (
    portal: 'customer' | 'employee' | 'admin'
  ) => void;
}) {
  return (
    <nav className="landing-navbar">
      <div className="landing-container">
        <div className="landing-navbar-inner">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Shield size={24} />
            </div>

            <span className="landing-brand-name">
              {BANK_INFO.name}
            </span>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#portals">Portals</a>
            <a href="#stats">Statistics</a>
            <a href="#contact">Contact</a>

            <button
              onClick={() => onPortalSelect('customer')}
              className="landing-login-button"
            >
              Customer Login
            </button>
          </div>

          <button
            onClick={() => onPortalSelect('customer')}
            className="landing-mobile-login"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero({
  slides,
  currentSlide,
  setCurrentSlide,
  onGetStarted,
}: {
  slides: typeof SLIDES;
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  onGetStarted: () => void;
}) {
  return (
    <section className="landing-hero">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`landing-slide ${
            i === currentSlide
              ? 'landing-slide-active'
              : 'landing-slide-inactive'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="landing-slide-image"
          />

          <div className="landing-slide-overlay" />

          <div className="landing-hero-content">
            <div className="landing-container">
              <div className="landing-hero-text">
                <h1
                  className={
                    i === currentSlide
                      ? 'landing-hero-title landing-content-visible'
                      : 'landing-hero-title landing-content-hidden'
                  }
                >
                  {slide.title}
                </h1>

                <p
                  className={
                    i === currentSlide
                      ? 'landing-hero-subtitle landing-content-visible'
                      : 'landing-hero-subtitle landing-content-hidden'
                  }
                >
                  {slide.subtitle}
                </p>

                <button
                  onClick={onGetStarted}
                  className={
                    i === currentSlide
                      ? 'landing-get-started landing-content-visible'
                      : 'landing-get-started landing-content-hidden'
                  }
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="landing-slide-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={
              i === currentSlide
                ? 'landing-dot landing-dot-active'
                : 'landing-dot'
            }
          />
        ))}
      </div>
    </section>
  );
}

function Portals({
  onPortalSelect,
}: {
  onPortalSelect: (
    portal: 'customer' | 'employee' | 'admin'
  ) => void;
}) {
  const portals = [
    {
      id: 'customer' as const,
      title: 'Customer Portal',
      desc: 'Manage accounts, transfers, cards, loans, statements, beneficiaries, and more. Complete banking at your fingertips.',
      icon: Users,
      gradient: 'customer-gradient',
      features: [
        'Account Dashboard',
        'Fund Transfers',
        'Card Management',
        'Loan Applications',
        'Transaction History',
        'Bank Statements',
      ],
    },
    {
      id: 'employee' as const,
      title: 'Employee Portal',
      desc: 'Handle customer verification, KYC reviews, service requests, loan processing, disputes, and fraud alerts.',
      icon: Shield,
      gradient: 'employee-gradient',
      features: [
        'Customer Verification',
        'KYC Reviews',
        'Service Requests',
        'Loan Processing',
        'Fraud Monitoring',
        'Dispute Resolution',
      ],
    },
    {
      id: 'admin' as const,
      title: 'Admin Portal',
      desc: 'Executive dashboard with analytics, reports, branch management, employee oversight, and fraud monitoring.',
      icon: BarChart3,
      gradient: 'admin-gradient',
      features: [
        'Executive Dashboard',
        'Analytics & Reports',
        'Branch Management',
        'Employee Management',
        'Fraud Operations',
        'Risk Monitoring',
      ],
    },
  ];

  return (
    <section id="portals" className="landing-section landing-section-mint">
      <div className="landing-container">
        <div className="landing-section-heading">
          <h2>Three Powerful Portals</h2>

          <p>
            Choose your portal to access a complete enterprise
            banking experience tailored to your role.
          </p>
        </div>

        <div className="landing-portal-grid">
          {portals.map((portal) => (
            <div
              key={portal.id}
              className="landing-portal-card"
            >
              <div
                className={`landing-portal-header ${portal.gradient}`}
              >
                <portal.icon size={48} />
              </div>

              <div className="landing-portal-body">
                <h3>{portal.title}</h3>

                <p className="landing-portal-description">
                  {portal.desc}
                </p>

                <ul className="landing-portal-features">
                  {portal.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onPortalSelect(portal.id)}
                  className={`landing-portal-button ${portal.gradient}`}
                >
                  Access Portal
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="landing-section landing-section-mint-light">
      <div className="landing-container">
        <div className="landing-section-heading">
          <h2>Why Choose {BANK_INFO.name}?</h2>

          <p>{BANK_INFO.description}</p>
        </div>

        <div className="landing-feature-grid">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="landing-feature-card"
            >
              <div className="landing-feature-icon">
                <feature.icon size={28} />
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: '1M+', label: 'Customers Served' },
    { value: '5M+', label: 'Transactions Processed' },
    { value: '500K+', label: 'Loan Records' },
    { value: '200K+', label: 'Service Requests' },
    { value: '24/7', label: 'Customer Support' },
    { value: '99.9%', label: 'Uptime Guarantee' },
  ];

  return (
    <section id="stats" className="landing-stats">
      <div className="landing-container">
        <div className="landing-stats-heading">
          <h2>Platform at Scale</h2>

          <p>
            Built to handle enterprise-level banking operations
            with ease.
          </p>
        </div>

        <div className="landing-stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="landing-stat">
              <p>{stat.value}</p>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="landing-section landing-section-mint">
      <div className="landing-container">
        <div className="landing-section-heading">
          <h2>Get in Touch</h2>

          <p>
            We are here to help you 24/7. Reach us through any of
            these channels.
          </p>
        </div>

        <div className="landing-contact-grid">
          <ContactCard
            icon={<Phone size={28} />}
            iconClass="landing-icon-salmon"
            title="Emergency Call"
            info={CONTACT.emergencyPhone}
            sub="24/7 Fraud & Card Blocking"
            actionText="Call Now"
            actionHref={`tel:${CONTACT.emergencyPhone}`}
            actionClass="landing-button-salmon"
          />

          <ContactCard
            icon={
              <svg
                viewBox="0 0 24 24"
                className="landing-svg-icon"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            }
            iconClass="landing-icon-mint"
            title="WhatsApp Support"
            info={`+91 ${CONTACT.whatsappNumber}`}
            sub="Quick Chat Assistance"
            actionText="Chat on WhatsApp"
            actionHref={`https://wa.me/91${CONTACT.whatsappNumber}?text=Hello%20NovaBank%20Support%2C%20I%20need%20assistance`}
            actionClass="landing-button-mint"
          />

          <ContactCard
            icon={
              <svg
                viewBox="0 0 24 24"
                className="landing-svg-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            }
            iconClass="landing-icon-aqua"
            title="Email Support"
            info={CONTACT.email}
            sub="Response within 24 hours"
            actionText="Send Email"
            actionHref={`mailto:${CONTACT.email}`}
            actionClass="landing-button-aqua"
          />
        </div>
      </div>
    </section>
  );
}

function ContactCard({
  icon,
  iconClass,
  title,
  info,
  sub,
  actionText,
  actionHref,
  actionClass,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  info: string;
  sub: string;
  actionText: string;
  actionHref: string;
  actionClass: string;
}) {
  return (
    <div className="landing-contact-card">
      <div className={`landing-contact-icon ${iconClass}`}>
        {icon}
      </div>

      <h3>{title}</h3>
      <p className="landing-contact-info">{info}</p>
      <p className="landing-contact-sub">{sub}</p>

      <a
        href={actionHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`landing-contact-button ${actionClass}`}
      >
        {actionText}
      </a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-grid">
          <div>
            <div className="landing-footer-brand">
              <div className="landing-footer-icon">
                <Shield size={24} />
              </div>

              <span>{BANK_INFO.name}</span>
            </div>

            <p className="landing-footer-text">
              {BANK_INFO.tagline}
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>

            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#portals">Portals</a>
              </li>
              <li>
                <a href="#stats">Statistics</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Support</h4>

            <ul>
              <li>Emergency: {CONTACT.emergencyPhone}</li>
              <li>WhatsApp: +91 {CONTACT.whatsappNumber}</li>
              <li>Email: {CONTACT.email}</li>
              <li>{CONTACT.supportHours}</li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>

            <ul>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Security Notice</li>
              <li>RBI Compliance</li>
            </ul>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>
            {BANK_INFO.name} - Training/Sandbox Banking System.
            All data is synthetic. No real banking credentials or
            real-money transactions.
          </p>

          <p>
            © 2026 {BANK_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}