"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RecommendationResult } from "@/lib/assistant-types";

type AssistantMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: RecommendationResult[];
};

export default function SmartAssistantWidget() {
  const pathname = usePathname();
  const hideLauncher = pathname?.startsWith("/nous-contacter") || pathname?.startsWith("/checkout") || pathname?.startsWith("/compte");
  
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const saved = localStorage.getItem("eco_assistant_session");
    if (saved) setSessionId(saved);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    
    const newMessages: AssistantMsg[] = [...messages, { id: Date.now().toString(), role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content, recommendations: m.recommendations }))
        })
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("eco_assistant_session", data.sessionId);
      }
      
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: data.message || "",
        recommendations: data.recommendations
      }]);
    } catch (error: any) {
      const isTimeout = error.name === "AbortError";
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-err",
        role: "assistant",
        content: isTimeout ? "Désolé, le réseau est un peu lent. Réessayez." : "Désolé, j'ai rencontré un problème technique."
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (hideLauncher) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-black text-white p-4 rounded-full shadow-lg transition-transform ${open ? "scale-0" : "scale-100"}`}
      >
        <span className="text-xl">✨</span>
      </button>

      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-black text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">✨</div>
              <div>
                <h3 className="font-bold text-sm">L&apos;Ecomax Assistant</h3>
                <p className="text-xs text-white/70">Conseiller Shopping IA</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-2">
              ✕
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 my-8">
                <div className="text-4xl mb-4">👋</div>
                <p>Bonjour ! Que recherchez-vous aujourd&apos;hui ?</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <button onClick={() => setInput("Je cherche des chaussures de running confortables")} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50">🏃 Chaussures running</button>
                  <button onClick={() => setInput("Je veux un cadeau à moins de 500 MAD")} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50">🎁 Cadeau -500 MAD</button>
                </div>
              </div>
            )}
            
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.content && (
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === "user" ? "bg-black text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                    {m.content}
                  </div>
                )}
                
                {/* Recommendation Cards */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto w-full pb-2 snap-x">
                    {m.recommendations.map(rec => (
                      <div key={rec.productSlug} className="snap-start shrink-0 w-[200px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {rec.label && (
                          <div className="bg-[#111] text-white text-[10px] uppercase font-bold px-2 py-1 text-center">
                            {rec.label}
                          </div>
                        )}
                        <Link href={`/produit/${rec.productSlug}`} className="block p-3">
                          <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                            {rec.productImage ? (
                              <img src={rec.productImage} alt={rec.productName || ""} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🛒</span>
                            )}
                          </div>
                          <div className="text-sm font-bold line-clamp-1">{rec.productName || rec.productSlug.replace(/-/g, " ")}</div>
                          {rec.productPrice && <div className="text-sm font-semibold text-gray-900 mt-1">{rec.productPrice} MAD</div>}
                          <div className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">{rec.reason}</div>
                          <div className="mt-3 text-xs font-bold text-black border border-black rounded-lg text-center py-2 hover:bg-black hover:text-white transition-colors">
                            Voir le produit
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-1 items-center bg-white border border-gray-200 text-gray-400 p-3 rounded-2xl rounded-bl-sm w-fit shadow-sm">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ex: Je cherche des baskets noires..."
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-full py-3 pl-4 pr-12 text-sm transition-colors"
              />
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-black text-white rounded-full disabled:bg-gray-300 transition-colors"
              >
                ↑
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-gray-400">
              Assistant IA L&apos;Ecomax - Peut faire des erreurs
            </div>
          </div>
        </div>
      )}
    </>
  );
}
