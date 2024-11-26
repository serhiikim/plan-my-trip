// src/pages/LoaderTest.jsx
import { useState } from 'react';
import { PlanLoader } from '@/components/common/PlanLoader';
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/common/Layout";

export default function LoaderTest() {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            variant={!isGenerating ? "default" : "outline"}
            onClick={() => setIsGenerating(false)}
          >
            Loading State
          </Button>
          <Button
            variant={isGenerating ? "default" : "outline"}
            onClick={() => setIsGenerating(true)}
          >
            Generating State
          </Button>
        </div>
        
        <PlanLoader isGenerating={isGenerating} />
      </div>
    </Layout>
  );
}