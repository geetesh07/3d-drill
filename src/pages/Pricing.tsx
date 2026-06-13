
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Basic access to design tools",
      features: [
        "Basic drill design",
        "2D visualization",
        "Limited export options",
        "Single user account",
        "1 design saved at a time",
      ],
      notIncluded: [
        "Advanced tool types",
        "3D visualization",
        "Multiple export formats",
        "Team collaboration",
        "Premium support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Professional",
      price: "$19",
      period: "per month",
      description: "Complete design toolkit for professionals",
      features: [
        "All tool types (Drills, Endmills, etc.)",
        "2D & 3D visualization",
        "All export formats",
        "Unlimited saved designs",
        "Standard support",
        "Custom material definitions",
        "Measurement unit switching",
      ],
      notIncluded: [
        "Team collaboration",
        "Enterprise integrations",
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "per user/month",
      description: "Team solution with advanced features",
      features: [
        "Everything in Professional",
        "Team collaboration",
        "User management",
        "Enterprise integrations",
        "Priority support",
        "Custom templates",
        "White label exports",
        "API access",
      ],
      notIncluded: [],
      cta: "Contact Sales",
      popular: false,
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your needs. All plans include our core design capabilities.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 right-4 bg-primary">Most Popular</Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>}
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Included:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">
                        <Check size={16} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {plan.notIncluded.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 mt-4">Not included:</h4>
                  <ul className="space-y-2">
                    {plan.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <X size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                asChild 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-6">
          <div className="text-left">
            <h3 className="font-medium mb-2">Can I switch plans later?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new features will be available immediately. If you downgrade, the changes will take effect at the end of your current billing cycle.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">Is there a trial period?</h3>
            <p className="text-muted-foreground">Yes, we offer a 14-day free trial for our Professional plan so you can test all features before committing.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">We accept all major credit cards, PayPal, and for Enterprise customers, we can arrange bank transfers or invoicing.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">Can I cancel at any time?</h3>
            <p className="text-muted-foreground">Yes, you can cancel your subscription at any time. You'll continue to have access to your plan's features until the end of your current billing period.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
