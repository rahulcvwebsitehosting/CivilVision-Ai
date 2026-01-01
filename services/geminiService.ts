import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const getSystemInstruction = () => {
  const savedSettings = JSON.parse(localStorage.getItem('cv-settings') || '{}');
  const tone = savedSettings.ai_voice?.personality || 'Friendly';
  const depth = savedSettings.ai_voice?.depth || 'Intermediate';
  const units = savedSettings.ai_voice?.units || 'SI Units';
  const language = savedSettings.language || 'English';

  let personalityInstruction = "";
  switch (tone) {
    case 'Professional':
      personalityInstruction = "Speak with clinical precision. Use technical codes first.";
      break;
    case 'Academic':
      personalityInstruction = "Speak like a passionate professor. Emphasize the 'why'.";
      break;
    case 'Concise':
      personalityInstruction = "Be extremely brief. No pleasantries.";
      break;
    default:
      personalityInstruction = "Speak with warmth. Be encouraging and conversational.";
      break;
  }

  const langPrompt = language !== 'English' 
    ? `CRITICAL: You MUST respond ONLY in ${language}. Do NOT use English except for specific technical code numbers (e.g., IS 456). Translate all engineering concepts into fluent ${language}. No mixed-language sentences allowed.` 
    : "Respond in clear English.";

  return `
    You are "CivilVision Expert", an advanced AI assistant for civil engineering. 
    ${langPrompt}
    AI PERSONALITY GUIDELINE: ${personalityInstruction}
    EXPLANATION DEPTH: ${depth}
    PREFERRED UNITS: ${units}
    REQUIRED RESPONSE STRUCTURE: TECHNICAL ID, CODE REFERENCE, CRITICAL ANALYSIS, SAFETY NOTE.
  `;
};

export async function generateEngineeringArticle(topicName: string): Promise<string> {
  const savedSettings = JSON.parse(localStorage.getItem('cv-settings') || '{}');
  const language = savedSettings.language || 'English';
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a comprehensive, textbook-quality civil engineering article on: "${topicName}".
    
    LANGUAGE: Respond ONLY in ${language}. 
    
    FORMULA AND VARIABLE FORMATTING RULES:
    1. Display formulas MUST use double dollar signs: $$...$$ (e.g., $$P = \frac{2\pi NT}{60}$$)
    2. Variable definitions and inline math MUST use single dollar signs: $...$ (e.g., $P$, $N$, $L_c$)
    3. VARIABLE DEFINITION LISTS (Notation/Where sections):
       • Format: • $variable$ = Description (unit)
       • CRITICAL: The entire bullet point (bullet, variable, and description) MUST be on a single physical line.
       • NO line breaks between the variable and its description.
       • NO colons after the variable. Use "=".
       • NO extra spacing between items.
    4. NEVER use plain text for mathematical symbols or variables. Always wrap them in LaTeX dollar signs.
    5. All Greek letters (sigma, tau, phi, delta, etc.) MUST be LaTeX: $\sigma$, $\tau$, $\phi$, $\Delta$.
    6. Section Headers for lists should be "### Notation" or "**Where:**" (no colon-asterisk combinations like :**).

    Structure it EXACTLY like this with proper Markdown formatting:
    # [TOPIC NAME]
    [Subtitle describing category]

    ---
    ## 📋 Table of Contents
    1. Introduction
    2. Working Principle
    3. Components and Parts
    4. Types and Classifications
    5. Mathematical Analysis & Formulas
    6. Design Considerations
    7. Applications in Civil Engineering
    8. Advantages and Disadvantages
    9. Installation and Maintenance
    10. Solved Examples
    11. Common Problems and Troubleshooting
    12. Related Topics
    13. References and Standards

    ---
    ## 1. Introduction
    ### What is [TOPIC]?
    [Detailed technical definition and engineering context]
    ### Key Characteristics
    - Feature 1
    - Feature 2

    ---
    ## 2. Working Principle
    ### Basic Theory
    [Fundamental mechanics/physics]
    ### Operating Cycle
    Step 1: [Name] - [Details]

    ---
    ## 5. Mathematical Analysis & Formulas
    ### Fundamental Equations
    $$[LaTeX formula]$$
    **Where:**
    • $Variable$ = Description (Unit)

    ---
    ## 10. Solved Examples
    ### Example 1
    Problem: [Details]
    Given: [Data]
    Solution: [Step-by-step with LaTeX]
    
    ---
    [Include all 13 sections as per the requested comprehensive structure].
    
    MINIMUM QUALITY STANDARDS:
    - Minimum 3000-4000 words.
    - 10+ formulas in LaTeX format ($$...$$).
    - 3+ worked examples with calculations.
    - Use Emojis (✅❌📚📖💡⚠️) for organization.
    - Use blockquotes (> Important) for safety notes.
    - Cite Indian Standards (IS Codes) extensively.
    - Professional, textbook-style tone.`,
  });
  return response.text || "Failed to generate article.";
}

export async function getTeacherAIResponse(query: string, history: { role: 'user' | 'model', parts: string[] }[]) {
  const savedSettings = JSON.parse(localStorage.getItem('cv-settings') || '{}');
  const language = savedSettings.language || 'English';

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.parts[0] }] })), { role: 'user', parts: [{ text: query }] }],
    config: {
      systemInstruction: `You are "Teacher AI", a brief and helpful civil engineering tutor. 
      LANGUAGE: You MUST respond EXCLUSIVELY in ${language}. No mixed languages.
      FORMAT: Respond with clear, direct information. Avoid excessive markdown unless requested.
      Limit: 150 words maximum. Always cite relevant codes in the chosen language.`,
    },
  });
  return response.text;
}

export const createCivilVisionSession = (
  callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: any) => void;
    onClose: (e: any) => void;
  },
  systemInstruction: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const savedSettings = JSON.parse(localStorage.getItem('cv-settings') || '{}');
  const gender = savedSettings.ai_voice?.gender || 'Female';
  
  let voice = gender === 'Male' ? 'Puck' : 'Kore';
  
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
      systemInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
};