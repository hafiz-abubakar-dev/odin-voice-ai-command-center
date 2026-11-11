# 🎙️ Odin: Enterprise Voice AI Command Center

A full-stack, real-time Voice AI Executive Assistant designed to orchestrate complex business operations through natural voice commands. Odin bridges a custom **React/TypeScript** frontend dashboard with a powerful **n8n Multi-Agent Backend**, utilizing **Alibaba Cloud's Qwen LLM** and high-fidelity Text-to-Speech (TTS) for natural Urdu and Roman Urdu interactions.

---

## 🌟 Executive Summary
Unlike standard text-based chatbots, Odin is a fully autonomous "Digital Employee." It captures user voice input via a custom Push-to-Talk (PTT) React interface, processes the intent through an LLM, and delegates operational tasks to **5 specialized sub-agents**. The system then generates a hyper-realistic voice response and dynamically auto-plays it on the frontend dashboard without requiring manual intervention.

---

## 📂 Repository Structure

The project is modularized into dedicated frontend, backend, and documentation directories:

    odin-voice-ai-command-center/
    ├── frontend-dashboard/                     # Custom React UI
    │   ├── App.tsx                             # Core UI, Webhook integration & audio execution
    │   ├── audioEffects.ts                     # TTS fallback suppression logic
    │   └── package.json                        # Frontend dependencies
    ├── n8n-workflows/                          # Backend Orchestration & Agents
    │   ├── odin-main-orchestrator.json         # Core Qwen LLM Brain & Webhook handler
    │   ├── sub-agent-calendar-manager.json     # Google Calendar operations
    │   ├── sub-agent-crm-contacts.json         # Airtable CRM integration
    │   ├── sub-agent-email-handler.json        # Gmail inbox & drafting operations
    │   ├── sub-agent-social-media.json         # Facebook/Instagram content manager
    │   └── sub-agent-whatsapp.json             # WhatsApp Cloud API integration
    └── screenshots/                            # Visual architecture & execution proofs
        ├── 01-odin-dashboard-ui 1.png.png
        ├── 01-odin-dashboard-ui 2.png.png
        ├── 01-odin-dashboard-ui 3.png.png
        ├── 01-odin-dashboard-ui 4.png.png
        ├── 02-n8n-core-architecture.png.png
        ├── 03-sub-agents-tools-layout.png.png
        ├── 04-vscode-custom-react-code.png.png
        └── 05-live-payload-execution.png.png
---

## 🏗️ Core Architecture & Tech Stack

### 1. Frontend (Command Center UI)
- **Framework:** React 18, Vite, TypeScript
- **Audio Handling:** HTML5 Web Audio API, Auto-play policy bypass, Dynamic Audio URL mapping (configured in `App.tsx`).
- **Features:** Real-time chat log rendering, Custom Norse acoustic chimes, Voice Activity Detection (VAD) / Push-to-Talk (PTT).

### 2. Backend (n8n Orchestration)
- **Engine:** n8n (Self-Hosted Node-Based Automation)
- **Memory:** Simple Memory Buffer for conversational context.
- **Webhooks:** RESTful POST endpoints for bi-directional JSON payload and binary audio transfers.

### 3. AI & Voice Models
- **Brain / LLM:** Alibaba Cloud Qwen Chat Model.
- **Voice Synthesis (TTS):** Alibaba DashScope `qwen-audio-3.1-tts-next` (Configured with `longcheng` voice profile, 0.80 cadence, and 16000 sample rate for authoritative pacing).

---

## 🤖 The 5 Operational Sub-Agents
Odin is equipped with a multi-agent architecture where the core AI delegates tasks to specific micro-agents. *(See `n8n-workflows/` for respective JSON configurations)*:

1. 📅 **Calendar Agent** (`sub-agent-calendar-manager.json`): Audits schedules, checks daily availability, and books real-time meetings.
2. ✉️ **Email Agent** (`sub-agent-email-handler.json`): Drafts, reviews, and dispatches contextual emails directly from voice commands.
3. 👥 **Contact Agent** (`sub-agent-crm-contacts.json`): Syncs with Airtable databases to fetch customer details, inquiry statuses, and lead data.
4. 📱 **Social Media Agent** (`sub-agent-social-media.json`): Manages social platform updates and content scheduling.
5. 💬 **WhatsApp Agent** (`sub-agent-whatsapp.json`): Triggers direct automated messages and handles customer communication flows.

---

## 👨‍💻 Technical Challenges Solved (Engineering Highlights)
Building a bi-directional voice streaming app required overcoming severe browser and framework constraints:

- **React "White Screen of Death" Resolution:** Initially, the React UI crashed when attempting to render nested AI output objects. This was solved by implementing strict payload serialization using `JSON.stringify()` inside the `odin-main-orchestrator.json` webhook response body, ensuring the frontend only received safe, parseable text strings.
- **Bypassing Local Speech Synthesis (TTS Conflict):** The browser's native `window.speechSynthesis` API caused a robotic English fallback voice that conflicted with the Alibaba TTS. The frontend code in `audioEffects.ts` was refactored to inject early `return;` statements and comment out the fallback logic, forcing the dashboard to exclusively play the high-fidelity server-side WAV URL.
- **Binary File to JSON Pipeline Conversion:** n8n initially downloaded the Alibaba TTS response as a 662-byte binary file, which broke the dynamic URL mapping. By reconfiguring the HTTP Request node's response format from 'File' to 'JSON', the exact dynamic URL was successfully extracted and passed to the frontend for seamless auto-play.

---

## 🚀 System Flow
1. **Input:** User holds the Spacebar/Mic button on the React dashboard and speaks a command.
2. **Transfer:** The browser sends the audio payload to the n8n webhook endpoint.
3. **Orchestration:** n8n converts speech to text, routes it to the Qwen LLM, and triggers the relevant Sub-Agent.
4. **Synthesis:** The response text is sent to Alibaba DashScope, returning a live `.wav` audio URL.
5. **Output:** n8n dispatches a serialized JSON payload back to the React UI, which auto-plays the audio and prints the chat log simultaneously.

---
*Architected and Developed by **Abu Bakar Siddique** (@hafiz-abubakar-dev)*
