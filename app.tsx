import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Send, 
  RefreshCw, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  Database, 
  Code, 
  Cpu, 
  Settings, 
  TrendingUp, 
  ChevronRight, 
  Download, 
  Copy, 
  Sliders, 
  Zap, 
  ExternalLink,
  Trash2,
  FileText,
  User,
  Sparkles,
  Search
} from 'lucide-react';

// Preset Prompt Templates
const PROMPT_TEMPLATES = {
  distributed: {
    name: "Distributed Systems Agent",
    systemPrompt: "You are a technical support agent specializing in distributed systems.\nAnswer the customer's request concisely and with technical precision. If uncertain, verify against the internal knowledge base via the /search vector tool.\nHighlight necessary scope headers (e.g. storage:write or bearer tokens) when explaining forbidden or CORS-related requests.",
    contextWindow: "128k",
    version: "v2.4-stable"
  },
  ecommerce: {
    name: "E-Commerce Dispute Advisor",
    systemPrompt: "You are an empathetic, polite e-commerce dispute manager.\nPrioritize customer loyalty while adhering to the standard 14-day refund window. Always offer store credit as a prompt alternative if a direct refund is rejected. Answer customer concerns in a reassuring, professional tone. Keep responses under three sentences.",
    contextWindow: "32k",
    version: "v1.2-retail"
  },
  saas: {
    name: "SaaS Billing Co-pilot",
    systemPrompt: "You are a SaaS subscription and billing assistant.\nBe precise with subscription tiers, pricing ($29/mo starter, $99/mo pro), and credit card invoices. If customers ask to cancel, explain the tier retention benefits first and offer a one-time 20% discount code: KEEP20.",
    contextWindow: "64k",
    version: "v3.1-enterprise"
  }
};

// Preset Conversation Datasets
const PRESET_DATASETS = [
  { id: 'ds-1', title: 'AWS & GCP API Scopes', count: 4200, category: 'Technical' },
  { id: 'ds-2', title: 'Customer Billing Disputes', count: 3150, category: 'Billing' },
  { id: 'ds-3', title: 'Product Refund Dialogues', count: 6852, category: 'E-commerce' }
];

export default function App() {
  // Theme & Model Configurations
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROMPT_TEMPLATES>('distributed');
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_TEMPLATES.distributed.systemPrompt);
  const [model, setModel] = useState('gemini-3.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [topP, setTopP] = useState(0.9);

  // Playground Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', text: string, metrics?: any }>>([
    { 
      role: 'assistant', 
      text: "The 403 Forbidden error typically indicates a scope mismatch. Ensure your Bearer token includes the storage:write permission and verify against the internal service.",
      metrics: { ttft: '142ms', apiResponse: '48ms', model: 'GPT-4o', tokens: 28 }
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'workbench' | 'apiSandbox' | 'codeExplorer'>('workbench');

  // Interactive Code Explorer state
  const [selectedCodeFile, setSelectedCodeFile] = useState<'main.py' | 'pipeline.py' | 'dataset.py'>('main.py');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Deployment simulator state
  const [deploymentStep, setDeploymentStep] = useState(0); // 0: idle, 1: ingesting, 2: vectorizing, 3: evaluating, 4: complete
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Datasets state
  const [datasets, setDatasets] = useState(PRESET_DATASETS);
  const [syncedVectors, setSyncedVectors] = useState(14202);
  const [isSyncing, setIsSyncing] = useState(false);

  // Evaluations state
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // API Sandbox State
  const [sandboxEndpoint, setSandboxEndpoint] = useState('/api/v1/chat');
  const [sandboxMethod, setSandboxMethod] = useState('POST');
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxPayload, setSandboxPayload] = useState(
    JSON.stringify({
      message: "How do I resolve a 403 Forbidden on the FastAPI storage endpoint?",
      temperature: 0.7,
      max_tokens: 500
    }, null, 2)
  );
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Latency Metrics
  const [metrics, setMetrics] = useState({
    ttft: '142ms',
    apiResponse: '48ms',
    uptime: '14D 02H 14M',
    sessionsLogged: 124092,
    successRate: '98.4%'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Synchronize custom system prompts on template change
  const handleTemplateChange = (key: keyof typeof PROMPT_TEMPLATES) => {
    setSelectedTemplate(key);
    setSystemPrompt(PROMPT_TEMPLATES[key].systemPrompt);
  };

  // Run the chatbot conversation call
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          message: userMsg,
          temperature,
          maxTokens,
          topP
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          text: data.text, 
          metrics: data.metrics 
        }]);
        // Update live stats from real metrics
        if (data.metrics) {
          setMetrics(prev => ({
            ...prev,
            ttft: data.metrics.ttft,
            apiResponse: data.metrics.apiResponse,
            sessionsLogged: prev.sessionsLogged + 1
          }));
        }
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `Error: ${data.error || 'Failed to generate response'}` 
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Connection failed. Please verify that the Express server is up.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run behavioral evaluation test suite
  const runEvaluation = async () => {
    setIsEvaluating(true);
    setEvalResults([]);
    setAverageScore(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt })
      });

      const data = await response.json();
      if (response.ok) {
        setEvalResults(data.results);
        setAverageScore(data.averageScore);
      } else {
        alert(data.error || 'Evaluation failed');
      }
    } catch (e) {
      alert('Failed to connect to server evaluation suite.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle mock API sandbox request
  const runSandboxRequest = async () => {
    setIsSandboxRunning(true);
    setSandboxResponse(null);
    const startTime = Date.now();

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(sandboxPayload);
      } catch (err) {
        setSandboxResponse({ error: "Malformed JSON payload in request body" });
        setIsSandboxRunning(false);
        return;
      }

      if (sandboxEndpoint === '/api/v1/chat') {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt,
            message: (parsedPayload as any).message || "CORS test payload",
            temperature: (parsedPayload as any).temperature ?? temperature,
            maxTokens: (parsedPayload as any).max_tokens ?? maxTokens
          })
        });

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        setSandboxResponse({
          status: response.status,
          statusText: response.statusText,
          headers: {
            "content-type": "application/json",
            "x-process-time": `${responseTime}ms`,
            "server": "uvicorn / fastapi"
          },
          data: {
            id: `chatcmpl-${Math.random().toString(36).substr(2, 9)}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: data.text || data.error
                },
                finish_reason: "stop"
              }
            ],
            usage: {
              prompt_tokens: Math.round(((parsedPayload as any).message || '').length / 4),
              completion_tokens: Math.round((data.text || '').length / 4),
              total_tokens: Math.round((((parsedPayload as any).message || '').length + (data.text || '').length) / 4)
            },
            metrics: data.metrics
          }
        });
      } else {
        // GET /api/v1/metrics
        setTimeout(() => {
          setSandboxResponse({
            status: 200,
            statusText: "OK",
            headers: {
              "content-type": "application/json",
              "server": "uvicorn / fastapi"
            },
            data: {
              system_uptime: metrics.uptime,
              sessions_logged: metrics.sessionsLogged,
              success_rate: metrics.successRate,
              endpoints: [
                { path: "/api/v1/chat", method: "POST", average_latency: metrics.apiResponse },
                { path: "/api/v1/metrics", method: "GET", average_latency: "2ms" }
              ],
              hardware: {
                platform: "AWS Lambda / us-east-1",
                engine: "FastAPI / Python 3.11",
                total_interaction_vectors: syncedVectors
              }
            }
          });
          setIsSandboxRunning(false);
        }, 300);
        return;
      }
    } catch (err) {
      setSandboxResponse({ error: "API connection failed. Express server might be unresponsive." });
    } finally {
      setIsSandboxRunning(false);
    }
  };

  // Run the full deployment pipeline
  const runCloudDeployment = () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setDeploymentStep(1);
    setDeploymentLogs([
      "[INFO] Initiating Deployment Pipeline v2.4...",
      "[INFO] Connecting to target environment: AWS Lambda (us-east-1)",
      "[PIPELINE-STEP-1] Ingesting Conversation Dataset..."
    ]);

    // Step 1: Ingest
    setTimeout(() => {
      setDeploymentStep(2);
      setDeploymentLogs(prev => [
        ...prev,
        `[SUCCESS] Dataset synced! Processed ${syncedVectors} dialog vectors.`,
        "[PIPELINE-STEP-2] Vectorizing Context..."
      ]);

      // Step 2: Vectorize
      setTimeout(() => {
        setDeploymentStep(3);
        setDeploymentLogs(prev => [
          ...prev,
          "[SUCCESS] Ingested vectors into pinecone-db-01.",
          "[INFO] Running embedding model text-embedding-3-small.",
          "[PIPELINE-STEP-3] Launching Behavioral Validation Suite..."
        ]);

        // Step 3: Evaluate
        setTimeout(() => {
          setDeploymentStep(4);
          setDeploymentLogs(prev => [
            ...prev,
            "[SUCCESS] Behavioral validation PASSED. Consistency score: 0.94.",
            "[INFO] Packaging production build...",
            "[PIPELINE-STEP-4] Initiating AWS Lambda Deploy / Cloud Push...",
            `[INFO] Target Endpoint: https://api.coreai-engine.io/v2/chat`,
            "[SUCCESS] Deployment COMPLETED. Service is online and live!"
          ]);
          setIsDeploying(false);
        }, 1500);

      }, 1500);

    }, 1500);
  };

  // Sync Vectors Animation
  const handleSyncVectors = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSyncedVectors(prev => prev + 1250);
      setIsSyncing(false);
    }, 1200);
  };

  // Code templates for copy / download
  const CODE_TEMPLATES = {
    'main.py': `from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import os

app = FastAPI(title="CORE-AI Engine", version="2.4.0")

# Enable CORS for secure dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    temperature: float = 0.7
    max_tokens: int = 500

class ChatResponse(BaseModel):
    response: str
    latency_ms: float
    ttft_ms: float

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Scope mismatch. Missing valid Bearer token.")
    
    start_time = time.time()
    
    # Simulating LLM generation with custom Prompt Engineering
    # System Instruction: "You are a technical support agent specializing in distributed systems..."
    try:
        response_text = "Standard response resolved from context window."
        ttft = 142.0  # Time to First Token (ms)
        latency = (time.time() - start_time) * 1000.0
        
        return ChatResponse(
            response=response_text,
            latency_ms=round(latency, 2),
            ttft_ms=ttft
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/metrics")
async def get_metrics():
    return {
        "status": "online",
        "engine": "FastAPI",
        "version": "2.4.0-stable",
        "uptime": "14D 02H"
    }
`,
    'pipeline.py': `import openai
import os

class PromptPipeline:
    def __init__(self, system_prompt: str, model: str = "gpt-4o"):
        self.system_prompt = system_prompt
        self.model = model
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def run_eval(self, user_query: str, temperature: float = 0.7) -> str:
        """
        Runs conversation with the engineered system prompt context.
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_query}
            ],
            temperature=temperature
        )
        return response.choices[0].message.content
`,
    'dataset.py': `import json
import numpy as np

def preprocess_conversations(filepath: str):
    """
    Ingest & process raw conversation logs, parsing QA pairs.
    """
    print(f"Loading conversations from {filepath}...")
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    vectors = []
    for item in data:
        # Perform text embedding and format context window boundaries
        text = f"USER: {item['user']} | ASSISTANT: {item['assistant']}"
        vectors.append(text)
        
    print(f"Successfully processed {len(vectors)} interaction context blocks.")
    return vectors
`
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([CODE_TEMPLATES[selectedCodeFile]], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = selectedCodeFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden relative">
      {/* GLOWING AMBIENT GRADIENTS (Frosted Theme aesthetic) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-slate-950 to-emerald-950/20 pointer-events-none z-0"></div>
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none z-0"></div>

      <div className="relative flex flex-col min-h-screen z-10">
        
        {/* HEADER BAR */}
        <header className="flex flex-col md:flex-row items-center justify-between px-6 md:px-8 py-4 md:h-20 border-b border-white/10 backdrop-blur-xl bg-white/5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CORE-AI Engine <span className="text-[10px] bg-white/10 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">FastAPI Suite</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">v2.4.0-stable // OpenAI GPT & FastAPI</p>
            </div>
          </div>

          {/* Core Navigation Tabs */}
          <div className="flex items-center bg-white/5 border border-white/15 rounded-lg p-1 gap-1">
            <button 
              id="tab-workbench"
              onClick={() => setActiveTab('workbench')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'workbench' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1" /> Workbench
            </button>
            <button 
              id="tab-apisandbox"
              onClick={() => setActiveTab('apiSandbox')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'apiSandbox' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Terminal className="w-3.5 h-3.5 inline mr-1" /> REST API Sandbox
            </button>
            <button 
              id="tab-codeexplorer"
              onClick={() => setActiveTab('codeExplorer')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'codeExplorer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Code className="w-3.5 h-3.5 inline mr-1" /> FastAPI Code
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> CLOUD DEPLOYED
              </span>
              <span className="text-xs text-slate-500 font-mono">AWS Lambda • us-east-1</span>
            </div>
            <div className="h-10 w-px bg-white/10 mx-1 hidden sm:block"></div>
            <button 
              id="btn-trigger-deployment"
              onClick={runCloudDeployment}
              disabled={isDeploying}
              className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-md text-sm font-semibold transition-colors border border-indigo-400/20 shadow-lg flex items-center gap-2`}
            >
              {isDeploying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Deploying...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" /> New Deployment
                </>
              )}
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto w-full">
          
          {/* LEFT SIDEBAR: Metrics, datasets and Evaluation triggers (Columns 1-3) */}
          <section className="lg:col-span-3 flex flex-col gap-6" id="left-sidebar">
            
            {/* LATENCY METRICS GAUGES */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg" id="panel-metrics">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Latency Metrics
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1 rounded">Live</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 text-xs">TTFT (Time to First Token)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{metrics.ttft}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_#10b981] transition-all duration-500" 
                      style={{ width: parseInt(metrics.ttft) < 100 ? '90%' : parseInt(metrics.ttft) < 200 ? '75%' : '40%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 text-xs">FastAPI Endpoint Overhead</span>
                    <span className="font-mono text-blue-400 font-semibold">{metrics.apiResponse}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full shadow-[0_0_8px_#3b82f6] transition-all duration-500" 
                      style={{ width: parseInt(metrics.apiResponse) < 50 ? '94%' : parseInt(metrics.apiResponse) < 200 ? '80%' : '50%' }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500 block">UPTIME:</span>
                    <span className="text-slate-200 font-semibold">{metrics.uptime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SESSIONS:</span>
                    <span className="text-slate-200 font-semibold">{metrics.sessionsLogged.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONVERSATION DATASET HANDLER */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg" id="panel-datasets">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-400" /> Ingested Datasets
                </h3>
                <span className="text-xs text-indigo-300 font-mono font-semibold">{syncedVectors.toLocaleString()} vectors</span>
              </div>

              <div className="space-y-2.5 mb-4 max-h-[180px] overflow-y-auto pr-1">
                {datasets.map((ds) => (
                  <div key={ds.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {ds.title}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{ds.category} support</span>
                    </div>
                    <span className="text-xs font-mono text-indigo-300 font-medium">{ds.count} rows</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleSyncVectors}
                  disabled={isSyncing}
                  className="flex-1 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 text-xs font-semibold transition-all border border-indigo-500/20 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Processing...' : 'Vectorize context'}
                </button>
              </div>
            </div>

            {/* QUICK PRESETS & CHAT CONFIGURATION */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg" id="panel-presets">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-400" /> Agent Templates
              </h3>
              <div className="space-y-2">
                {(Object.keys(PROMPT_TEMPLATES) as Array<keyof typeof PROMPT_TEMPLATES>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedTemplate === key ? 'bg-indigo-600/15 border-indigo-500/40 text-white' : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'}`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{PROMPT_TEMPLATES[key].name}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{PROMPT_TEMPLATES[key].version} // {PROMPT_TEMPLATES[key].contextWindow} Context</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedTemplate === key ? 'translate-x-1' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

          </section>

          {/* MIDDLE COLUMN: Tab-based Dynamic Workspaces (Columns 4-9) */}
          <section className="lg:col-span-6 flex flex-col gap-6" id="main-workbench">
            
            {/* WORKBENCH TAB */}
            {activeTab === 'workbench' && (
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg flex-1 flex flex-col shadow-2xl min-h-[500px]" id="workbench-layout">
                
                {/* Workbench Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                      Prompt Engineering Workbench
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
                      {PROMPT_TEMPLATES[selectedTemplate].version}
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-white/5">
                      context: {PROMPT_TEMPLATES[selectedTemplate].contextWindow}
                    </span>
                  </div>
                </div>

                {/* Model Configuration Sliders inside Workbench */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Model Choice</label>
                    <select 
                      value={model} 
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-white/10 rounded-md p-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                      <option value="gpt-4o">GPT-4o (Simulated)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Sim)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Temp ({temperature})</label>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.5" 
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Max Output</label>
                    <input 
                      type="number" 
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value) || 256)}
                      className="w-full bg-slate-950 text-slate-200 border border-white/10 rounded p-0.5 px-1 font-mono text-center text-xs"
                    />
                  </div>
                </div>

                {/* System Prompt TextArea */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5" /> SYSTEM_PROMPT:
                    </label>
                    <button 
                      onClick={() => setSystemPrompt(PROMPT_TEMPLATES[selectedTemplate].systemPrompt)}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Reset Default
                    </button>
                  </div>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={4}
                    placeholder="Describe the model persona and operational boundaries..."
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-colors leading-relaxed"
                  />
                </div>

                {/* Live Sandbox Chat Stream */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex-1 flex flex-col mb-4 overflow-hidden relative min-h-[220px]">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-white/5 pb-2 mb-3 flex justify-between items-center">
                    <span>REACTIVE CONVERSATION TEST BED</span>
                    <span className="text-[9px] text-indigo-300 animate-pulse flex items-center gap-1">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full"></span> active
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-3 text-xs leading-relaxed max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role !== 'user' && (
                          <div className="w-7 h-7 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Cpu className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                        <div className={`p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white font-medium' : 'bg-white/5 border border-white/5 text-slate-300'}`}>
                          {msg.text}
                          {msg.metrics && (
                            <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-slate-400">
                              <span>TTFT: <strong className="text-emerald-400">{msg.metrics.ttft}</strong></span>
                              <span>API: <strong className="text-blue-400">{msg.metrics.apiResponse}</strong></span>
                              <span>Tokens: <strong className="text-indigo-300">{msg.metrics.tokens}</strong></span>
                            </div>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex gap-3 text-xs justify-start items-center text-slate-400 font-mono">
                        <div className="w-7 h-7 rounded-md bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        </div>
                        <span>Invoking FastAPI model pipelines...</span>
                      </div>
                    )}
                    <div ref={chatEndRef}></div>
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-3 mt-auto pt-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Simulate customer input... (e.g. CORS setup, 403 authorization error)" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      id="btn-send-message"
                      className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </form>
                </div>

                {/* Behavioral Eval Trigger Panel */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/5 gap-3">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-200 block">Behavioral Evaluation Suite</span>
                    <span className="text-[10px] text-slate-400">Validate against out-of-scope hacking attempts, tone drift, and CORS safety.</span>
                  </div>
                  <button 
                    id="btn-run-eval"
                    onClick={runEvaluation}
                    disabled={isEvaluating}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Assessing Prompt...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Run Eval Suite
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* REST API SANDBOX TAB */}
            {activeTab === 'apiSandbox' && (
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg flex-1 flex flex-col shadow-2xl min-h-[500px]" id="api-sandbox-layout">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Interactive FastAPI Client</h2>
                      <p className="text-xs text-slate-400">Test routes, verify latency margins, examine response headers.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">HTTPS Live</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Left Column: Router Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">FastAPI REST Endpoints</label>
                      <div className="flex rounded-lg overflow-hidden border border-white/10 font-mono text-xs">
                        <select 
                          value={sandboxMethod} 
                          onChange={(e) => setSandboxMethod(e.target.value)}
                          disabled={true} // Fixed to match route design
                          className="bg-slate-900 text-indigo-300 border-r border-white/10 px-2 py-2 text-center"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                        <select 
                          value={sandboxEndpoint} 
                          onChange={(e) => {
                            setSandboxEndpoint(e.target.value);
                            if (e.target.value === '/api/v1/metrics') {
                              setSandboxMethod('GET');
                            } else {
                              setSandboxMethod('POST');
                            }
                          }}
                          className="bg-slate-950 text-slate-200 flex-1 px-3 py-2 outline-none"
                        >
                          <option value="/api/v1/chat">/api/v1/chat</option>
                          <option value="/api/v1/metrics">/api/v1/metrics</option>
                        </select>
                      </div>
                    </div>

                    {sandboxEndpoint === '/api/v1/chat' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-mono text-slate-400">JSON Request Body</label>
                          <button 
                            onClick={() => setSandboxPayload(JSON.stringify({ message: "Explain CORS issues with FastAPI endpoints.", temperature: 0.5 }, null, 2))}
                            className="text-[10px] text-indigo-400 hover:underline"
                          >
                            Load CORS Preset
                          </button>
                        </div>
                        <textarea
                          value={sandboxPayload}
                          onChange={(e) => setSandboxPayload(e.target.value)}
                          rows={6}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="p-3.5 rounded-lg bg-indigo-500/5 border border-white/5 text-xs text-slate-300 space-y-2">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" /> Key Features Tested:
                      </div>
                      <p>
                        Our backend routes verify CORS configurations, evaluate custom system instruction contexts, and return parsed payloads with response timings under 50ms.
                      </p>
                    </div>

                    <button
                      id="btn-run-sandbox"
                      onClick={runSandboxRequest}
                      disabled={isSandboxRunning}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isSandboxRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching FastAPI request...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" /> Execute Route Handler
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Server Response Viewport */}
                  <div className="flex flex-col h-full min-h-[300px]">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-mono text-slate-400">Response Viewport</label>
                      {sandboxResponse && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
                          HTTP {sandboxResponse.status} {sandboxResponse.statusText}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[380px] text-indigo-200">
                      {sandboxResponse ? (
                        <pre className="text-left leading-relaxed">
                          {JSON.stringify(sandboxResponse, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 p-4">
                          <Terminal className="w-8 h-8 opacity-25" />
                          <span>Ready. Click "Execute Route Handler" to send simulated REST calls.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FASTAPI CODE EXPLORER */}
            {activeTab === 'codeExplorer' && (
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg flex-1 flex flex-col shadow-2xl min-h-[500px]" id="code-explorer-layout">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                      <Code className="w-5 h-5 text-indigo-400" />
                      Production FastAPI codebase
                    </h2>
                    <p className="text-xs text-slate-400">Exportable, cloud-ready Python architecture.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopyCode(CODE_TEMPLATES[selectedCodeFile])}
                      className="px-3 py-1.5 bg-slate-900 border border-white/5 hover:border-white/15 rounded text-xs text-slate-300 font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedNotification ? 'Copied!' : 'Copy'}
                    </button>
                    <button 
                      onClick={handleDownloadCode}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>

                <div className="flex border-b border-white/10 mb-4 font-mono text-xs gap-1">
                  <button 
                    onClick={() => setSelectedCodeFile('main.py')}
                    className={`px-4 py-2 border-b-2 transition-colors ${selectedCodeFile === 'main.py' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    main.py (FastAPI Routes)
                  </button>
                  <button 
                    onClick={() => setSelectedCodeFile('pipeline.py')}
                    className={`px-4 py-2 border-b-2 transition-colors ${selectedCodeFile === 'pipeline.py' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    prompt_pipeline.py
                  </button>
                  <button 
                    onClick={() => setSelectedCodeFile('dataset.py')}
                    className={`px-4 py-2 border-b-2 transition-colors ${selectedCodeFile === 'dataset.py' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    dataset_processor.py
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-xs overflow-auto max-h-[380px]">
                  <pre className="text-left text-indigo-200 leading-relaxed">
                    <code>
                      {CODE_TEMPLATES[selectedCodeFile]}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* EVAL RESULTS DISPLAY SCREEN */}
            {evalResults.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg" id="panel-evaluation-results">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Behavioral Evaluation Results
                    </h3>
                    <p className="text-[11px] text-slate-400">LLM-as-a-Judge feedback based on prompt restrictions</p>
                  </div>
                  {averageScore !== null && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-mono block">Overall Rating</span>
                      <span className="text-lg font-mono font-bold text-emerald-400">{(averageScore * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {evalResults.map((res, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-semibold text-indigo-300">{res.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{res.metric}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${res.passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                            {(res.score * 100).toFixed(0)}% {res.passed ? 'PASSED' : 'DRIFT'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] space-y-1 text-slate-300 font-mono">
                        <p><span className="text-slate-500">Query:</span> "{res.userQuery}"</p>
                        <p><span className="text-slate-500">Criteria:</span> {res.expectedBehavior}</p>
                        <div className="p-2 rounded bg-slate-950/60 border border-white/5 text-slate-200 mt-1.5 leading-relaxed text-xs">
                          {res.actualResponse}
                        </div>
                        <p className="text-[10px] text-indigo-400 italic mt-1 font-sans">Judge Feedback: {res.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

          {/* RIGHT COLUMN: Deployment pipeline & Live stream log logs (Columns 10-12) */}
          <section className="lg:col-span-3 flex flex-col gap-6" id="right-sidebar">
            
            {/* PIPELINE PROGRESS */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg" id="panel-pipeline">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Deployment Pipeline
              </h3>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${deploymentStep >= 1 ? 'bg-emerald-500 text-slate-950' : 'border border-white/20 text-slate-500'}`}>
                      {deploymentStep > 1 ? '✓' : '1'}
                    </div>
                    <div className={`w-px h-10 my-1 transition-colors ${deploymentStep > 1 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${deploymentStep >= 1 ? 'text-slate-200' : 'text-slate-500'}`}>Ingest Dataset</p>
                    <p className="text-[10px] text-slate-400">Pre-processing 14.2k conversations</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${deploymentStep >= 2 ? 'bg-emerald-500 text-slate-950' : 'border border-white/20 text-slate-500'}`}>
                      {deploymentStep > 2 ? '✓' : '2'}
                    </div>
                    <div className={`w-px h-10 my-1 transition-colors ${deploymentStep > 2 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${deploymentStep >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>Vectorize Context</p>
                    <p className="text-[10px] text-slate-400">text-embedding-3-small</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${deploymentStep === 3 ? 'bg-indigo-500 text-slate-950 animate-pulse' : deploymentStep > 3 ? 'bg-emerald-500 text-slate-950' : 'border border-white/20 text-slate-500'}`}>
                      {deploymentStep > 3 ? '✓' : '3'}
                    </div>
                    <div className={`w-px h-10 my-1 transition-colors ${deploymentStep > 3 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${deploymentStep >= 3 ? 'text-slate-200' : 'text-slate-500'}`}>Prompt Evaluation</p>
                    <p className="text-[10px] text-slate-400">Running behavioral tests...</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${deploymentStep === 4 ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]' : 'border border-white/20 text-slate-500'}`}>
                      4
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${deploymentStep === 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>Cloud Push</p>
                    <p className="text-[10px] text-slate-400">{deploymentStep === 4 ? 'Deployed to Lambda' : 'Pending completion'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE CONSOLE LOGS */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg flex-1 flex flex-col" id="panel-console-logs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Pipeline Console
                </h3>
                <button 
                  onClick={() => setDeploymentLogs([])} 
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-emerald-400 flex-1 overflow-y-auto max-h-[180px] space-y-1 leading-normal">
                {deploymentLogs.length > 0 ? (
                  deploymentLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">{log}</div>
                  ))
                ) : (
                  <div className="text-slate-600 italic">No logs generated. Trigger "New Deployment" to run.</div>
                )}
              </div>
            </div>

          </section>

        </main>

        {/* FOOTER BAR */}
        <footer className="px-6 md:px-8 py-4 border-t border-white/5 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>SYSTEM_UPTIME: {metrics.uptime}</span>
          <span>ENDPOINT: https://api.coreai-engine.io/v2/chat</span>
          <span>SESSIONS_LOGGED: {metrics.sessionsLogged.toLocaleString()}</span>
        </footer>

      </div>
    </div>
  );
}
