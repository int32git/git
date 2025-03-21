'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Have questions about Defender2? Our team is here to help you with any inquiries.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="pb-2">
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Email</CardTitle>
                  <CardDescription>Our friendly team is here to help.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="mailto:support@defender2.com" className="text-primary hover:underline">
                    support@defender2.com
                  </a>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <Phone className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Phone</CardTitle>
                  <CardDescription>Mon-Fri from 8am to 5pm.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="tel:+1-555-123-4567" className="text-primary hover:underline">
                    +1 (555) 123-4567
                  </a>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <MapPin className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Office</CardTitle>
                  <CardDescription>Come say hello at our office.</CardDescription>
                </CardHeader>
                <CardContent>
                  <address className="not-italic">
                    123 Security Avenue<br />
                    Suite 456<br />
                    Cyber City, CS 98765
                  </address>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-12 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-medium mb-2">Thank you for your message!</h3>
                    <p className="text-muted-foreground mb-4">
                      We've received your inquiry and will respond shortly.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>Send another message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={formData.email}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input 
                        id="subject" 
                        name="subject" 
                        value={formData.subject}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 