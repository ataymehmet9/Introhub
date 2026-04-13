import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { HiMenu, HiX } from 'react-icons/hi'
import ModeSwitcher from '../template/ThemeConfigurator/ModeSwitcher'
import Button from '@/components/ui/Button'

export default function PublicHeader() {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">
                IH
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              IntroHub
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/what-is-introhub"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              What is IntroHub
            </Link>
            <Link
              to="/pricing"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/get-demo"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Get a Demo
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ModeSwitcher />
            <Button
              variant="plain"
              onClick={() => navigate({ to: '/login' })}
              size="sm"
            >
              Login
            </Button>
            <Button
              variant="solid"
              onClick={() => navigate({ to: '/signup' })}
              size="sm"
            >
              Sign up for Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ModeSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex flex-col gap-4">
              <Link
                to="/what-is-introhub"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                What is IntroHub
              </Link>
              <Link
                to="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/get-demo"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get a Demo
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="plain"
                  onClick={() => {
                    navigate({ to: '/login' })
                    setIsMobileMenuOpen(false)
                  }}
                  size="sm"
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  variant="solid"
                  onClick={() => {
                    navigate({ to: '/signup' })
                    setIsMobileMenuOpen(false)
                  }}
                  size="sm"
                  className="w-full"
                >
                  Sign up for Free
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
