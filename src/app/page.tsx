import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Shield, BarChart3, Tags, Layers, RefreshCw, Activity, Database, FileText, Users } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Extend and Enhance Microsoft Defender & Intune
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Elevate your security posture with our unified platform that enhances Microsoft Defender and Intune capabilities for advanced asset management, tagging, and risk visualization for security and IT support teams.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">Get Started for Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Unified Management Platform</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Our platform seamlessly integrates with Microsoft Defender and Intune, enhancing their native capabilities with advanced management tools designed for modern security teams.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 border-l-4 border-l-primary">
              <Tags className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Intelligent Tagging</h3>
              <p className="text-muted-foreground">
                Create, manage and automate tags across Defender and Azure resources with our advanced tagging engine.
              </p>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-primary">
              <Layers className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Comprehensive Asset Management</h3>
              <p className="text-muted-foreground">
                Track and manage both cloud and on-premises assets in a single, unified dashboard with detailed inventory.
              </p>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-primary">
              <RefreshCw className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Asset Lifecycle</h3>
              <p className="text-muted-foreground">
                Monitor the complete lifecycle of your assets from procurement to retirement with automated workflows.
              </p>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-primary">
              <Database className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Software Inventory</h3>
              <p className="text-muted-foreground">
                Maintain a comprehensive software inventory with automatic discovery and version tracking across your estate.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Advanced Security Management</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Take control of your security posture with proactive monitoring and management tools built on top of Microsoft's security ecosystem.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Defender Agent Health</h3>
              <p className="text-muted-foreground">
                Monitor Defender agent health status and settings across your organization with real-time alerts and automated remediation.
              </p>
            </Card>
            
            <Card className="p-6">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Patch Management</h3>
              <p className="text-muted-foreground">
                Track and manage software updates and patches across your fleet with compliance reporting and automated deployment.
              </p>
            </Card>
            
            <Card className="p-6">
              <Activity className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-muted-foreground">
                Visualize and prioritize security risks across Intune, Defender, and Azure resources with contextualized threat intelligence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Reporting & Support Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Empower IT Support Teams</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Designed specifically with IT support teams in mind, our platform streamlines workflows and provides the insights needed for effective device and security management.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enhanced Support Capabilities</h3>
              <p className="text-muted-foreground mb-4">
                Equip your IT support teams with the tools they need to quickly identify, troubleshoot and resolve device issues.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Centralized device history and configuration information</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>User-friendly ticket integration with existing helpdesk systems</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Remote troubleshooting capabilities directly from the dashboard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Automated remediation workflows for common issues</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <FileText className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Comprehensive Reporting</h3>
              <p className="text-muted-foreground mb-4">
                Generate detailed, customizable reports for any aspect of your security and device management operations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Predefined report templates for compliance and executive summaries</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Custom report builder with drag-and-drop interface</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Scheduled reporting with automated distribution</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Export capabilities in multiple formats (PDF, Excel, CSV)</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Seamless Microsoft Integration</h2>
            <p className="text-lg text-muted-foreground">
              Our platform works directly with your Microsoft tenant, requiring no additional agents or complex setup processes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">For Security Teams</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Centralized visibility across all security solutions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Automated risk assessment and prioritization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Enhanced incident response workflows</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Compliance status tracking and reporting</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-background rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">For IT Administrators</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Simplified asset and software management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Automated tagging and organization of resources</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Streamlined patch management and deployment</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Health monitoring and proactive maintenance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Enhance Your Microsoft Security Suite?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Deploy in minutes with zero configuration – seamlessly connect to your Microsoft tenant and start seeing results immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">Start Your Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard/demo">View Interactive Demo</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
} 