/**
 * Core integration for Olive AI chat
 * This will be connected to the backend Olive API
 */

import { base44 } from "../api/backendAdapter";

export async function InvokeLLM(message) {
  try {
    // This would call the backend Olive chat API
    // For now, return a placeholder response
    const response = await fetch("http://localhost:8000/api/olive/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${base44.auth.getToken()}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from Olive");
    }

    const data = await response.json();
    return data.response || "I'm here to help! This feature is being connected to the backend.";
  } catch (error) {
    console.error("Error invoking LLM:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}
