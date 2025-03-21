'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, SendIcon, RefreshCw } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

const initialSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Device not connecting to network',
    description: 'Troubleshoot common network connectivity issues',
    steps: [
      'Check if WiFi is turned on',
      'Verify the network name and password are correct',
      'Restart the device',
      'Reset network settings',
      'Check if other devices can connect to the same network'
    ]
  },
  {
    id: '2',
    title: 'Application crashes or freezes',
    description: 'Fix issues with unresponsive applications',
    steps: [
      'Force close the application',
      'Restart the device',
      'Check for app updates',
      'Clear app cache and data',
      'Reinstall the application'
    ]
  },
  {
    id: '3',
    title: 'Slow device performance',
    description: 'Improve device speed and responsiveness',
    steps: [
      'Close unused applications',
      'Check available storage space',
      'Restart the device',
      'Check for malware',
      'Update device software'
    ]
  }
];

export default function TroubleshootingAssistantPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<Suggestion | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    
    // Simulate API call to get response
    setTimeout(() => {
      // Find matches in suggestions or generate new response
      const matchingSuggestion = suggestions.find(
        (s) => s.title.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingSuggestion) {
        setResponse(matchingSuggestion);
      } else {
        // Generate a mock response
        const newResponse: Suggestion = {
          id: `generated-${Date.now()}`,
          title: query,
          description: `Troubleshooting help for: ${query}`,
          steps: [
            'Check device settings related to this issue',
            'Restart the affected component or device',
            'Update software to the latest version',
            'If problem persists, contact technical support'
          ]
        };
        setResponse(newResponse);
      }
      
      setIsLoading(false);
    }, 1500);
  };

  const resetAssistant = () => {
    setQuery('');
    setResponse(null);
    setSuggestions(initialSuggestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Troubleshooting Assistant</h1>
        {response && (
          <Button variant="outline" onClick={resetAssistant} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" /> Start New
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="mr-2 h-5 w-5" />
                Ask a Question
              </CardTitle>
              <CardDescription>
                Describe your issue and get troubleshooting steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your issue here... (e.g., 'My device won't connect to WiFi')"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={!query.trim() || isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Finding Solutions...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Get Help
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {!response && !isLoading && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>
                  Browse frequently asked questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {suggestions.map((suggestion) => (
                    <AccordionItem key={suggestion.id} value={suggestion.id}>
                      <AccordionTrigger>{suggestion.title}</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2 text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>
                        <Button 
                          variant="ghost" 
                          className="text-sm"
                          onClick={() => {
                            setQuery(suggestion.title);
                            setResponse(suggestion);
                          }}
                        >
                          Use this topic
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Solution</CardTitle>
                <CardDescription>
                  {response.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 font-semibold">Follow these steps:</h3>
                <ol className="space-y-2 list-decimal list-inside">
                  {response.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  If this doesn't resolve your issue, try providing more details or contact premium support.
                </p>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 