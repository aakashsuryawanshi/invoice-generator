import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  
  private readonly botResponses: string[] = [
    "Thank you for your question! I am processing your invoice now.",
    "I would be happy to help with that invoice query.",
    "Your invoice is being generated. It will be ready shortly.",
    "That is a great question about our invoice system!",
    "I am checking our database for that information.",
    "Would you like to know more about our invoice features?",
    "I have updated your invoice settings as requested.",
    "Your invoice has been saved successfully.",
    "I can help you customize your invoice template.",
    "Is there anything else you need help with regarding your invoice?",
    "Our invoice system supports multiple currencies and tax rates.",
    "You can download your invoice as PDF once it is generated.",
    "Would you like me to explain how line items work in our system?",
    "I have noted your preferences for future invoices.",
    "Our invoice system automatically calculates all taxes and totals."
  ];

  constructor() { }

  public sendMessage(content: string): void {
    if (!content.trim()) return;
    
    const userMessage: ChatMessage = {
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, userMessage]);
    
    setTimeout(() => {
      this.generateBotResponse();
    }, 500);
  }
  
  private generateBotResponse(): void {
    const randomIndex = Math.floor(Math.random() * this.botResponses.length);
    const botResponse = this.botResponses[randomIndex];
    
    const botMessage: ChatMessage = {
      content: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };
    
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, botMessage]);
  }
  
  public clearMessages(): void {
    this.messagesSubject.next([]);
  }
}
