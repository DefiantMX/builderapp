import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Calculator, 
  FileText, 
  Upload, 
  Download, 
  Settings, 
  Ruler,
  Square,
  Circle,
  Type,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function AdvancedTakeoffDashboard() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session?.user?.id;
  
  if (!userId) {
    redirect('/login');
  }

  // Fetch user's projects with takeoff data
  const projects = await prisma.project.findMany({
    where: {
      userId: userId
    },
    include: {
      plans: {
        include: {
          measurements: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 20
  });

  // Calculate takeoff statistics
  const totalProjects = projects.length;
  const totalPlans = projects.reduce((sum, p) => sum + p.plans.length, 0);
  const totalMeasurements = projects.reduce((sum, p) => 
    sum + p.plans.reduce((planSum, plan) => planSum + plan.measurements.length, 0), 0
  );
  
  const recentProjects = projects.slice(0, 5);
  const activeProjects = projects.filter(p => p.plans.length > 0).slice(0, 8);

  const advancedTakeoffFeatures = [
    {
      title: "Professional Measurement Tools",
      description: "Advanced line, area, and count measurement tools with calibration",
      icon: Ruler,
      color: "bg-blue-500",
      features: ["Precise calibration", "Multiple measurement types", "Real-time calculations"]
    },
    {
      title: "Division-Based Organization",
      description: "Organize measurements by CSI MasterFormat divisions",
      icon: Layers,
      color: "bg-green-500",
      features: ["CSI divisions", "Subcategories", "Material tracking"]
    },
    {
      title: "Layer Management",
      description: "Organize measurements by construction layers and systems",
      icon: Layers,
      color: "bg-purple-500",
      features: ["Custom layers", "Layer visibility", "System organization"]
    },
    {
      title: "Export & Reporting",
      description: "Export takeoff data in multiple formats with professional reports",
      icon: Download,
      color: "bg-orange-500",
      features: ["PDF reports", "Excel spreadsheets", "CSV data"]
    },
    {
      title: "Advanced Annotation",
      description: "Add text, notes, and markup to your takeoff drawings",
      icon: Type,
      color: "bg-red-500",
      features: ["Text annotations", "Notes and comments", "Markup tools"]
    },
    {
      title: "Project Management",
      description: "Track progress and manage multiple takeoff projects",
      icon: BarChart3,
      color: "bg-indigo-500",
      features: ["Progress tracking", "Project overview", "Team collaboration"]
    }
  ];

  const quickActions = [
    {
      title: "Start New Takeoff",
      description: "Begin a new takeoff project",
      icon: Plus,
      href: "/projects/new",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Upload Plans",
      description: "Upload new plans and drawings",
      icon: Upload,
      href: "/estimating/takeoff/upload",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "View Reports",
      description: "View and export takeoff reports",
      icon: BarChart3,
      href: "/estimating/takeoff/reports",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Settings",
      description: "Configure takeoff preferences",
      icon: Settings,
      href: "/estimating/takeoff/settings",
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Advanced Takeoff Dashboard
            </h1>
            <p className="text-gray-600">
              Professional takeoff tools for accurate quantity calculations and cost estimates.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Projects
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Takeoff
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Ruler className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Measurements</p>
                <p className="text-2xl font-bold text-gray-900">{totalMeasurements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return p.updatedAt > lastMonth;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600">
                          {project.plans.length} plans • {project.plans.reduce((sum, plan) => sum + plan.measurements.length, 0)} measurements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {project.plans.length > 0 ? "Active" : "No Plans"}
                      </Badge>
                      <Link href={`/projects/${project.id}/advanced-takeoff`}>
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advancedTakeoffFeatures.map((feature) => (
                  <div key={feature.title} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <feature.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{feature.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        {feature.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Projects Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Active Takeoff Projects</h2>
          <Link href="/projects">
            <Button variant="outline" size="sm">
              View All Projects
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeProjects.map((project) => {
            const totalMeasurements = project.plans.reduce((sum, plan) => sum + plan.measurements.length, 0);
            const lastUpdated = new Date(project.updatedAt).toLocaleDateString();
            
            return (
              <Link key={project.id} href={`/projects/${project.id}/advanced-takeoff`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.plans.length} plans
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description || "No description provided"}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Measurements:</span>
                        <span className="font-medium">{totalMeasurements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="font-medium">{lastUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        Open Takeoff
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-12">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Ready to Start Your First Takeoff?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Create a new project, upload your plans, and start measuring with our professional takeoff tools. 
                Get accurate quantities and estimates for your construction projects.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Link href="/projects/new">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Project
                  </Button>
                </Link>
                <Link href="/estimating/takeoff/upload">
                  <Button variant="outline" size="lg">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Plans
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
