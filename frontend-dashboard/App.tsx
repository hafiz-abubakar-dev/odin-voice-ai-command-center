import React, { useState, useEffect } from 'react';
import { ExecutiveHeader } from './components/ExecutiveHeader';
import { RuneVisualizer } from './components/RuneVisualizer';
import { QuickActionCards } from './components/QuickActionCards';
import { TranscriptViewer } from './components/TranscriptViewer';
import { SubAgentHUD } from './components/SubAgentHUD';
import { SettingsModal } from './components/SettingsModal';
import {
  CommandStatus,
  CommandLog,
  AppSettings,
  SubAgentType,
  GemstoneLead,
  WorkshopEvent,
  WhatsAppMessage,
  SocialMediaPost
} from './types/odin';
import {
  INITIAL_LEADS,
  INITIAL_EVENTS,
  INITIAL_WHATSAPP,
  INITIAL_SOCIAL,
  INITIAL_COMMAND_LOGS,
  simulateOdinExecution
} from './utils/mockGemstoneEngine';
import {
  playConfirmationChime,
  speakOdinResponse,
  playAudioUrl
} from './utils/audioEffects';

const DEFAULT_SETTINGS: AppSettings = {
  webhookUrl: 'http://localhost:5678/webhook/odininn',
  isSimulationMode: true,
  enableNorseChimes: true,
  autoPlayAudio: true,
  speechPitch: 0.82,
  speechRate: 0.92
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('odin_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [status, setStatus] = useState<CommandStatus>('READY');
  const [latencyMs, setLatencyMs] = useState<number>(310);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'leads' | 'calendar' | 'whatsapp' | 'social'>('cockpit');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Operational State
  const [logs, setLogs] = useState<CommandLog[]>(INITIAL_COMMAND_LOGS);
  const [leads, setLeads] = useState<GemstoneLead[]>(INITIAL_LEADS);
  const [events, setEvents] = useState<WorkshopEvent[]>(INITIAL_EVENTS);
  const [messages, setMessages] = useState<WhatsAppMessage[]>(INITIAL_WHATSAPP);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>(INITIAL_SOCIAL);

  // Persist settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('odin_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Unable to persist settings to localStorage:', e);
    }
  };

  const handleToggleMode = () => {
    const updated = { ...settings, isSimulationMode: !settings.isSimulationMode };
    handleSaveSettings(updated);
  };

  /**
   * Primary voice and command execution handler
   */
  const executeCommand = async (
    transcript: string,
    audioBlob: Blob | null,
    source: 'voice' | 'quick_action' | 'direct',
    subAgentOverride?: SubAgentType
  ) => {
    const startTime = performance.now();
    setStatus('ORCHESTRATING');

    if (!settings.isSimulationMode && audioBlob) {
      // 1. Live n8n Webhook Mode
      try {
        setStatus('EXECUTING');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'odin_voice_command.webm');
        formData.append('transcript', transcript);
        formData.append('client', 'Haider Ali / Haider Gemstone');
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch(settings.webhookUrl, {
          method: 'POST',
          body: formData
        });

        const elapsed = Math.round(performance.now() - startTime);
        setLatencyMs(elapsed);

        if (!response.ok) {
          throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const odinSpeech = data.response || data.transcript || `Command confirmed by n8n workflow for ${transcript}`;
        const returnAudioUrl = data.audio_url;

        setStatus('CONFIRMED');
        if (settings.enableNorseChimes) playConfirmationChime();

        const newLog: CommandLog = {
          id: `cmd-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source,
          transcript,
          odinResponse: odinSpeech,
          audioUrl: returnAudioUrl,
          status: 'CONFIRMED',
          subAgent: (data.subAgent as SubAgentType) || subAgentOverride || 'general',
          latencyMs: elapsed,
          metadata: data
        };

        setLogs((prev) => [newLog, ...prev]);

        // Auto-play audio response
        if (settings.autoPlayAudio) {
          if (returnAudioUrl) {
            playAudioUrl(returnAudioUrl);
          // } else {
          //   speakOdinResponse(odinSpeech, {
          //     pitch: settings.speechPitch,
          //     rate: settings.speechRate
          //   });
          }
        }
      } catch (err: any) {
        console.warn('n8n Webhook unreachable, activating Smart Simulation Fallback:', err);
        // Seamless fallback to simulation
        handleSimulationExecution(transcript, source, subAgentOverride, startTime);
      }
    } else {
      // 2. Smart Simulation Mode
      handleSimulationExecution(transcript, source, subAgentOverride, startTime);
    }
  };

  /**
   * Smart Simulation Handler
   */
  const handleSimulationExecution = async (
    transcript: string,
    source: 'voice' | 'quick_action' | 'direct',
    subAgentOverride?: SubAgentType,
    startTime: number = performance.now()
  ) => {
    // Stage transition: Orchestrating -> Executing
    await new Promise((r) => setTimeout(r, 180));
    setStatus('EXECUTING');

    const result = simulateOdinExecution(transcript);
    const subAgent = subAgentOverride || result.subAgent;

    // Small execution delay to simulate high-frequency sub-agent coordination
    await new Promise((r) => setTimeout(r, 220));

    const totalElapsed = Math.round(performance.now() - startTime);
    setLatencyMs(totalElapsed);
    setStatus('CONFIRMED');

    if (settings.enableNorseChimes) {
      playConfirmationChime();
    }

    const newLog: CommandLog = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source,
      transcript,
      odinResponse: result.odinResponse,
      status: 'CONFIRMED',
      subAgent,
      latencyMs: totalElapsed,
      metadata: result.metadata
    };

    setLogs((prev) => [newLog, ...prev]);

    // Sub-agent side effects for richer immersion
    if (subAgent === 'whatsapp') {
      setMessages((prev) => [
        {
          id: `wa-${Date.now()}`,
          recipientName: 'Tariq Al-Mansoor',
          phoneNumber: '+971 50 849 2011',
          preview: 'Odin dispatched automated gemstone loupe 4K footage and certificate summary.',
          timestamp: 'Just now',
          status: 'Delivered',
          gemstoneReference: 'Kashmir Sapphire Lot #KS-904'
        },
        ...prev
      ]);
    } else if (subAgent === 'calendar') {
      // mark first event as verified
      setEvents((prev) =>
        prev.map((e, idx) => (idx === 0 ? { ...e, status: 'In Progress' } : e))
      );
    }

    // // Auto-play speech synthesis
    // if (settings.autoPlayAudio) {
    //   speakOdinResponse(result.odinResponse, {
    //     pitch: settings.speechPitch,
    //     rate: settings.speechRate
    //   });
    // }

    // Reset status back to READY after 3.5s
    setTimeout(() => {
      setStatus((cur) => (cur === 'CONFIRMED' ? 'READY' : cur));
    }, 3500);
  };

  // Quick Action Trigger
  const handleQuickAction = (promptText: string, subAgent: SubAgentType) => {
    executeCommand(promptText, null, 'quick_action', subAgent);
  };

  // WhatsApp Dispatch from HUD
  const handleDispatchWhatsApp = (recipient: string, phone: string, text: string) => {
    const prompt = `Odin, send WhatsApp dispatch to ${recipient} (${phone}): "${text}"`;
    executeCommand(prompt, null, 'direct', 'whatsapp');
  };

  // Social Post Schedule from HUD
  const handleSchedulePost = (post: Omit<SocialMediaPost, 'id' | 'status'>) => {
    const prompt = `Odin, schedule ${post.platform} gemstone campaign for ${post.gemstone}: "${post.title}"`;
    executeCommand(prompt, null, 'direct', 'social');
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-slate-100 flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      {/* Executive Header (Top Bar Contract) */}
      <ExecutiveHeader
        settings={settings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleMode={handleToggleMode}
      />

      {/* Main War Room Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Central Rune Visualizer & Voice Orb */}
        <section aria-label="Central Voice Visualizer">
          <RuneVisualizer
            status={status}
            latencyMs={latencyMs}
            isSimulated={settings.isSimulationMode}
            onVoiceCommandSubmit={async (audioBlob, transcript) => {
              await executeCommand(transcript, audioBlob, 'voice');
            }}
            enableChimes={settings.enableNorseChimes}
          />
        </section>

        {/* Quick-Action Sub-Agent Shortcuts */}
        <section aria-label="Internal Operations Shortcuts">
          <QuickActionCards
            onTriggerQuickAction={handleQuickAction}
            isProcessing={status === 'LISTENING' || status === 'ORCHESTRATING' || status === 'EXECUTING'}
          />
        </section>

        {/* 2-Column Split: Sub-Agent Operational HUD & Executive Transcript Log */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sub-Agent HUD (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <SubAgentHUD
              activeTab={activeTab}
              leads={leads}
              events={events}
              messages={messages}
              socialPosts={socialPosts}
              onDispatchWhatsApp={handleDispatchWhatsApp}
              onSchedulePost={handleSchedulePost}
            />
          </div>

          {/* Executive Transcript & Confirmation Log (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <TranscriptViewer
              logs={logs}
              onClearLogs={() => setLogs([])}
              speechPitch={settings.speechPitch}
              speechRate={settings.speechRate}
            />
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
