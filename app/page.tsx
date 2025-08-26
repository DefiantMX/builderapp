import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Square, MousePointer, Type, Layers, Settings, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Advanced Takeoff</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/demo">
                <Button variant="outline">Try Demo</Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Construction Takeoff Software
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced digital takeoff tools with precise measurements, calibration, and real-time collaboration. 
            Perfect for contractors, estimators, and construction professionals.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/demo">
              <Button size="lg" className="px-8">
                Try Free Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Takeoff Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Line Measurements */}
            <Card>
              <CardHeader>
                <Ruler className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Precise Line Measurements</CardTitle>
                <CardDescription>
                  Measure distances with pixel-perfect accuracy using advanced calibration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time distance calculations</li>
                  <li>• Multiple unit support (ft, m, in, cm)</li>
                  <li>• Zoom-independent accuracy</li>
                </ul>
              </CardContent>
            </Card>

            {/* Area Measurements */}
            <Card>
              <CardHeader>
                <Square className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Area Calculations</CardTitle>
                <CardDescription>
                  Calculate square footage and areas with automatic polygon detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic area calculation</li>
                  <li>• Shift key for straight lines</li>
                  <li>• Complex polygon support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Calibration */}
            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Smart Calibration</CardTitle>
                <CardDescription>
                  Set accurate scale using known distances for precise measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• One-click calibration</li>
                  <li>• Multiple scale presets</li>
                  <li>• Custom unit support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Zoom & Pan */}
            <Card>
              <CardHeader>
                <ZoomIn className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Advanced Navigation</CardTitle>
                <CardDescription>
                  Smooth zoom and pan with measurement accuracy at any scale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mouse wheel zoom</li>
                  <li>• Drag to pan</li>
                  <li>• Zoom into cursor</li>
                </ul>
              </CardContent>
            </Card>

            {/* Layers */}
            <Card>
              <CardHeader>
                <Layers className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Layer Management</CardTitle>
                <CardDescription>
                  Organize measurements by construction phases and trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Foundation, Framing, Electrical</li>
                  <li>• Plumbing, HVAC, Finishes</li>
                  <li>• Custom layer creation</li>
                </ul>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <MousePointer className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Export & Share</CardTitle>
                <CardDescription>
                  Export measurements and collaborate with your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JSON export format</li>
                  <li>• Measurement summaries</li>
                  <li>• Team collaboration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Takeoff Process?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join contractors and estimators who are already using our advanced takeoff software 
            to save time and improve accuracy.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/demo">
              <Button size="lg" className="px-8">
                Start Free Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="px-8">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Advanced Takeoff</h3>
            <p className="text-gray-400 mb-6">
              Professional construction takeoff software for modern contractors
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link href="/demo" className="hover:text-white">Demo</Link>
              <Link href="/login" className="hover:text-white">Sign In</Link>
              <Link href="/register" className="hover:text-white">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

